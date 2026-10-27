#!/usr/bin/env node
'use strict';

/**
 * Importeert de post-hire flow (Talitha + Daan, pakket van 23-10-2026) als twee mailtypes:
 *
 *   posthire-chosen  mail 1a (CHOSEN, t=1)  -> feeds/nl/posthire-chosen/<slug>.json, alias posthire_chosen_feed
 *   posthire-done    mail 1b (DONE, t=1)    -> feeds/nl/posthire-done/<slug>.json,   alias posthire_done_feed
 *
 * Het pakket heeft één feed (posthire_<slug>.json, 106 velden, alias posthire_feed) voor alle vijf mails.
 * Per mailtype nemen we alleen de velden die de template gebruikt, in de volgorde van de bronfeed.
 * Mail 1c, 2 en 3 zijn nog niet beoordeeld en worden niet geïmporteerd.
 *
 * Gebruik: node scripts/import-posthire.js "<map van het uitgepakte pakket>"
 *   (de map met feed/ en templates/). Daarna: npm run validate
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SOURCE_ALIAS = 'posthire_feed';

// Bij CHOSEN krijgen deze diensten mail 1c, niet 1a (LEESMIJ). Zonder feed slaat Brevo ze over.
const SENSITIVE = ['psycholoog', 'relatietherapeut', 'mediator-scheiding', 'uitvaartverzorger'];

const MAILS = [
  {
    type: 'posthire-chosen',
    alias: 'posthire_chosen_feed',
    template: 'Mail 1a - t1 - CHOSEN - template.html',
    out: 'trustoo-posthire-chosen-template.html',
    prefix: 'chosen_',
    skip: SENSITIVE,
  },
  {
    type: 'posthire-done',
    alias: 'posthire_done_feed',
    template: 'Mail 1b - t1 - DONE - template.html',
    out: 'trustoo-posthire-done-template.html',
    prefix: 'done_',
    skip: [],
  },
];

// Veldnamen uit het pakket -> de namen die de andere mails gebruiken (cross-sell reminder, tips).
// chosen_/done_ vallen weg: elke mail heeft zijn eigen feed.
function rename(key, prefix) {
  const k = key.startsWith(prefix) ? key.slice(prefix.length) : key;
  let m;
  if (k === 'subject') return 'subject_line';
  if (k === 'subtitle') return 'hero_subtitle';
  if (k === 'dienst_naam') return 'hero_title_accent';
  if (k === 'related_intro') return 'services_intro';
  if (k === 'popular_style') return 'tiles_style';
  if ((m = k.match(/^r(\d)_(.+)$/))) return `service${m[1]}_${m[2]}`;
  if ((m = k.match(/^popular(\d)_(.+)$/))) return `tile${m[1]}_${m[2]}`;
  return k;
}

const src = process.argv[2];
if (!src) {
  console.error('Gebruik: node scripts/import-posthire.js "<map met feed/ en templates/>"');
  process.exit(1);
}

const feedDir = path.join(src, 'feed');
const sources = fs
  .readdirSync(feedDir)
  .filter((f) => /^posthire_.+\.json$/.test(f))
  .sort()
  .map((f) => ({
    slug: f.replace(/^posthire_/, '').replace(/\.json$/, ''),
    data: JSON.parse(fs.readFileSync(path.join(feedDir, f), 'utf8')),
  }));

for (const mail of MAILS) {
  const html = fs.readFileSync(path.join(src, 'templates', mail.template), 'utf8');
  const used = new Set(
    [...html.matchAll(/feed\.posthire_feed\.([a-z0-9_]+)/g)].map((m) => m[1])
  );
  // Volgorde van de bronfeed, maar onderwerp en preheader vooraan (zoals in de andere feeds).
  const first = [`${mail.prefix}subject`, `${mail.prefix}preheader`];
  let fields = [...first, ...Object.keys(sources[0].data).filter((k) => !first.includes(k))].filter((k) => used.has(k));
  const missing = [...used].filter((k) => !fields.includes(k));
  if (missing.length) {
    console.error(`FOUT: ${mail.template} gebruikt velden die niet in de feed staan: ${missing.join(', ')}`);
    process.exit(1);
  }

  // <title> krijgt het veld title (gelijk aan subject_line), zoals in de andere templates.
  const out = html
    .replace(/<title>\{\{feed\.posthire_feed\.[a-z_]+\}\}<\/title>/, `<title>{{feed.${mail.alias}.title}}</title>`)
    .replace(/feed\.posthire_feed\.([a-z0-9_]+)/g, (_, k) => `feed.${mail.alias}.${rename(k, mail.prefix)}`);
  fs.writeFileSync(path.join(ROOT, mail.out), out);

  const outDir = path.join(ROOT, 'feeds', 'nl', mail.type);
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });
  let count = 0;
  for (const { slug, data } of sources) {
    if (mail.skip.includes(slug)) continue;
    const feed = { title: data[`${mail.prefix}subject`] };
    for (const k of fields) feed[rename(k, mail.prefix)] = data[k];
    fs.writeFileSync(path.join(outDir, `${slug}.json`), JSON.stringify(feed, null, 2) + '\n');
    count++;
  }

  // Alle velden verplicht (validator-eis); velden die in een feed leeg mogen zijn krijgen geen minLength.
  const canBeEmpty = new Set(
    fields
      .filter((k) => sources.some((s) => !mail.skip.includes(s.slug) && s.data[k] === ''))
      .map((k) => rename(k, mail.prefix))
  );
  fields = ['title', ...fields.map((k) => rename(k, mail.prefix))];
  const schema = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    $id: `https://ruttekut.github.io/trustoo-brevo-feeds/schemas/${mail.type}-feed.schema.json`,
    title: `Trustoo Brevo e-mailfeed (post-hire ${mail.type === 'posthire-chosen' ? 'mail 1a, CHOSEN' : 'mail 1b, DONE'})`,
    description: `Plat JSON-object met de ${fields.length} velden die ${mail.out} gebruikt (alias ${mail.alias}). Kaarten 3-4 en het blok 'Ook populair' worden verborgen via r*_style en popular_style ('display:none; mso-hide:all;'). Geen arrays of geneste objecten.`,
    type: 'object',
    additionalProperties: false,
    required: fields,
    properties: Object.fromEntries(
      fields.map((k) => [k, canBeEmpty.has(k) ? { type: 'string' } : { type: 'string', minLength: 1 }])
    ),
  };
  fs.writeFileSync(
    path.join(ROOT, 'schemas', `${mail.type}-feed.schema.json`),
    JSON.stringify(schema, null, 2) + '\n'
  );

  console.log(`${mail.type}: ${count} feeds, ${fields.length} velden, template ${mail.out}`);
}
