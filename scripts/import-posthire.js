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
    skip: SENSITIVE,
  },
  {
    type: 'posthire-done',
    alias: 'posthire_done_feed',
    template: 'Mail 1b - t1 - DONE - template.html',
    out: 'trustoo-posthire-done-template.html',
    skip: [],
  },
];

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
  const fields = Object.keys(sources[0].data).filter((k) => used.has(k));
  const missing = [...used].filter((k) => !fields.includes(k));
  if (missing.length) {
    console.error(`FOUT: ${mail.template} gebruikt velden die niet in de feed staan: ${missing.join(', ')}`);
    process.exit(1);
  }

  fs.writeFileSync(path.join(ROOT, mail.out), html.split(`feed.${SOURCE_ALIAS}.`).join(`feed.${mail.alias}.`));

  const outDir = path.join(ROOT, 'feeds', 'nl', mail.type);
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });
  let count = 0;
  for (const { slug, data } of sources) {
    if (mail.skip.includes(slug)) continue;
    const feed = {};
    for (const k of fields) feed[k] = data[k];
    fs.writeFileSync(path.join(outDir, `${slug}.json`), JSON.stringify(feed, null, 2) + '\n');
    count++;
  }

  // Alle velden verplicht (validator-eis); velden die in een feed leeg mogen zijn krijgen geen minLength.
  const canBeEmpty = new Set(fields.filter((k) => sources.some((s) => !mail.skip.includes(s.slug) && s.data[k] === '')));
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
