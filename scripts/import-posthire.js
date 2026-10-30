#!/usr/bin/env node
'use strict';

/**
 * Importeert de post-hire flow (Talitha + Daan, pakket van 23-10-2026) als één mailtype:
 *
 *   posthire-chosen  mail 1 (t=1 na status CHOSEN of DONE) -> feeds/nl/posthire-chosen/<slug>.json,
 *                    alias posthire_chosen_feed; Brevo gebruikt de gecombineerde feed feeds/nl/posthire-chosen.json
 *
 * De opmaak is die van mail 1a (CHOSEN). Bij DONE (niet via Trustoo gekozen) wisselt de tekst: onderwerp,
 * preheader en ondertitel komen uit de done_*-velden (de teksten van mail 1b), de titel wordt "Fijn dat het
 * geregeld is" en de tijdlijn (Aanvraag · Offertes · Gekozen) en de starttips vallen weg. De status komt van
 * het aanvraag-object dat de automation start: feed.request.attributes.status.
 *
 * Het pakket heeft één feed (posthire_<slug>.json, 106 velden, alias posthire_feed) voor alle vijf mails.
 * We nemen alleen de velden die de template gebruikt, plus de drie DONE-teksten.
 * Mail 1c, 2 en 3 zijn nog niet beoordeeld en worden niet geïmporteerd.
 *
 * Gebruik: node scripts/import-posthire.js "<map van het uitgepakte pakket>"
 *   (de map met feed/ en templates/). Daarna: npm run validate
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TYPE = 'posthire-chosen';
const ALIAS = 'posthire_chosen_feed';
const TEMPLATE = 'Mail 1a - t1 - CHOSEN - template.html';
const OUT = 'trustoo-posthire-chosen-template.html';

// Brevo-object dat de automation start en het statusveld daarop.
const DONE = '{% if feed.request.attributes.status == "DONE" %}';

// Uitvaartverzorger houdt Pieter tegen (LEESMIJ); de andere gevoelige diensten krijgen bij DONE deze mail.
// Bij CHOSEN horen de gevoelige diensten mail 1c te krijgen: sluit ze daar uit in de automation.
const SKIP = ['uitvaartverzorger'];

// DONE-teksten uit het pakket (mail 1b) -> veldnamen in deze feed.
const DONE_FIELDS = { done_subject: 'done_subject_line', done_preheader: 'done_preheader', done_subtitle: 'done_hero_subtitle' };

// Veldnamen uit het pakket -> de namen die de andere mails gebruiken (cross-sell reminder, tips).
function rename(key) {
  if (DONE_FIELDS[key]) return DONE_FIELDS[key];
  const k = key.startsWith('chosen_') ? key.slice('chosen_'.length) : key;
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

function must(cond, what) {
  if (!cond) {
    console.error(`FOUT: ${what} niet gevonden in ${TEMPLATE}; de template is veranderd, pas dit script aan.`);
    process.exit(1);
  }
}

/** Zet de statusvoorwaarden in de (al hernoemde) 1a-template. */
function addStatusConditions(html) {
  const f = (k) => `{{feed.${ALIAS}.${k}}}`;
  const either = (done, chosen) => `${DONE}${done}{% else %}${chosen}{% endif %}`;

  // <title> en preheader
  must(html.includes(`<title>${f('title')}</title>`), '<title>');
  html = html.replace(`<title>${f('title')}</title>`, `<title>${either(f('done_subject_line'), f('title'))}</title>`);
  must(html.split(f('preheader')).length === 2, 'preheader');
  html = html.replace(f('preheader'), either(f('done_preheader'), f('preheader')));

  // Tijdlijn (Aanvraag · Offertes · Gekozen): de eerste tabel in de hero, vlak voor de <h1>.
  const heroTd = html.indexOf('<td class="pad-s hero-pad"');
  must(heroTd >= 0, 'hero');
  const tlStart = html.indexOf('<table', heroTd);
  const h1 = html.indexOf('<h1', tlStart);
  must(tlStart > 0 && h1 > tlStart && html.slice(tlStart, h1).includes('Gekozen'), 'tijdlijn');
  html = `${html.slice(0, tlStart)}${DONE}{% else %}${html.slice(tlStart, h1)}{% endif %}${html.slice(h1)}`;

  // Titel
  const title = /(<h1 class="h-display"[^>]*>)Gefeliciteerd &#127881;<br \/>Je hebt een (<em[^>]*>)(\{\{feed\.[a-z_]+\.hero_title_accent\}\})<\/em> gekozen<\/h1>/;
  must(title.test(html), 'titel');
  html = html.replace(title, (_m, h1Open, em, accent) => `${h1Open}${either(`Fijn dat het ${em}geregeld</em> is`, `Gefeliciteerd &#127881;<br />Je hebt een ${em}${accent}</em> gekozen`)}</h1>`);

  // Ondertitel
  must(html.split(f('hero_subtitle')).length === 2, 'ondertitel');
  html = html.replace(f('hero_subtitle'), either(f('done_hero_subtitle'), f('hero_subtitle')));

  // Starttips "Zo gaat het soepel van start": kop-tabel + tips-tabel (twee buitenste tabellen).
  // De buitenste tabel van elk blok staat aan het begin van een regel.
  const outer = '\n<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"';
  const heading = html.indexOf('Zo gaat het');
  must(heading > 0, 'starttips');
  const tipsStart = html.lastIndexOf(outer, heading);
  const afterHeading = html.indexOf(outer, heading);
  const tipsEnd = html.indexOf(outer, afterHeading + outer.length);
  must(tipsStart > 0 && afterHeading > heading && tipsEnd > afterHeading && html.slice(afterHeading, tipsEnd).includes('Leg je afspraken vast'), 'starttips-blok');
  html = `${html.slice(0, tipsStart)}${DONE}{% else %}${html.slice(tipsStart, tipsEnd)}{% endif %}${html.slice(tipsEnd)}`;
  return html;
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

const html = fs.readFileSync(path.join(src, 'templates', TEMPLATE), 'utf8');
const used = new Set([...html.matchAll(/feed\.posthire_feed\.([a-z0-9_]+)/g)].map((m) => m[1]));
for (const k of Object.keys(DONE_FIELDS)) used.add(k);
// Volgorde van de bronfeed, maar onderwerp en preheader vooraan (zoals in de andere feeds), elk gevolgd door
// de DONE-variant.
const first = ['chosen_subject', 'done_subject', 'chosen_preheader', 'done_preheader'];
let fields = [...first, ...Object.keys(sources[0].data).filter((k) => !first.includes(k))].filter((k) => used.has(k));
const subtitle = fields.indexOf('chosen_subtitle');
fields = fields.filter((k) => k !== 'done_subtitle');
fields.splice(subtitle + 1, 0, 'done_subtitle');
const missing = [...used].filter((k) => !fields.includes(k));
if (missing.length) {
  console.error(`FOUT: ${TEMPLATE} gebruikt velden die niet in de feed staan: ${missing.join(', ')}`);
  process.exit(1);
}

// <title> krijgt het veld title (gelijk aan subject_line), zoals in de andere templates.
const renamed = html
  .replace(/<title>\{\{feed\.posthire_feed\.[a-z_]+\}\}<\/title>/, `<title>{{feed.${ALIAS}.title}}</title>`)
  .replace(/feed\.posthire_feed\.([a-z0-9_]+)/g, (_, k) => `feed.${ALIAS}.${rename(k)}`);
fs.writeFileSync(path.join(ROOT, OUT), addStatusConditions(renamed));

const outDir = path.join(ROOT, 'feeds', 'nl', TYPE);
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });
let count = 0;
for (const { slug, data } of sources) {
  if (SKIP.includes(slug)) continue;
  const feed = { title: data.chosen_subject };
  for (const k of fields) feed[rename(k)] = data[k];
  fs.writeFileSync(path.join(outDir, `${slug}.json`), JSON.stringify(feed, null, 2) + '\n');
  count++;
}

// Alle velden verplicht (validator-eis); velden die in een feed leeg mogen zijn krijgen geen minLength.
const canBeEmpty = new Set(fields.filter((k) => sources.some((s) => !SKIP.includes(s.slug) && s.data[k] === '')).map(rename));
fields = ['title', ...fields.map(rename)];
const schema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: `https://ruttekut.github.io/trustoo-brevo-feeds/schemas/${TYPE}-feed.schema.json`,
  title: 'Trustoo Brevo e-mailfeed (post-hire mail 1, CHOSEN en DONE)',
  description: `Plat JSON-object met de ${fields.length} velden die ${OUT} gebruikt (alias ${ALIAS}); done_* zijn de teksten bij status DONE. Kaarten 3-4 en het blok 'Ook populair' worden verborgen via service*_style en tiles_style ('display:none; mso-hide:all;'). Geen arrays of geneste objecten.`,
  type: 'object',
  additionalProperties: false,
  required: fields,
  properties: Object.fromEntries(fields.map((k) => [k, canBeEmpty.has(k) ? { type: 'string' } : { type: 'string', minLength: 1 }])),
};
fs.writeFileSync(path.join(ROOT, 'schemas', `${TYPE}-feed.schema.json`), JSON.stringify(schema, null, 2) + '\n');

console.log(`${TYPE}: ${count} feeds, ${fields.length} velden, template ${OUT}`);
