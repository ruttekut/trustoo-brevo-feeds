// Importeert een aangeleverde TSV (service_slug, locale, variant, 47 velden)
// naar feeds/nl/reactivation/<slug>.json, in de veldvolgorde van het schema.
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..') + '/';
const OUT = ROOT + 'feeds/nl/reactivation/';
const TSV = process.argv[2];
if (!TSV) { console.error('Gebruik: node scripts/import-reactivation-tsv.js <bestand.tsv>'); process.exit(1); }
const schema = require(ROOT + 'schemas/reactivation-feed.schema.json');
const FIELDS = schema.required;

const lines = fs.readFileSync(TSV, 'utf8').replace(/\r\n/g, '\n').split('\n').filter((l) => l.trim());
const header = lines[0].split('\t');
const rows = lines.slice(1).map((l) => l.split('\t'));
const cols = header.slice(3);
const missingCols = FIELDS.filter((f) => !cols.includes(f));
const extraCols = cols.filter((c) => !FIELDS.includes(c));
if (missingCols.length || extraCols.length) throw new Error(`kolommen: ontbreekt ${missingCols}, extra ${extraCols}`);
for (const r of rows) if (r.length !== header.length) throw new Error(`rij ${r[0]} heeft ${r.length} kolommen, verwacht ${header.length}`);

const notes = [];
const SCHOONMAAK = {
  url: (campaign) => `https://trustoo.nl/nederland/schoonmaakbedrijf/?utm_source=brevo&utm_campaign=${campaign}&utm_medium=email&utm_content=schoonmaakbedrijfcard`,
  link: 'Bekijk schoonmaakbedrijven',
  image: 'https://img.mailinblue.com/9986607/images/rnb/original/6a99ca84d6d15096d2e48ab9.jpg',
  alt: 'Professionele schoonmaker aan het werk: keukenoppervlak grondig reinigen',
};

const feeds = {};
for (const r of rows) {
  let slug = r[0];
  const feed = {};
  for (const f of FIELDS) feed[f] = r[3 + cols.indexOf(f)].trim();

  // Fix 1: kaart heet Schoonmaakbedrijven maar linkt naar kozijnen (alarmsystemen, beveiliging).
  for (const n of [1, 2, 3]) {
    if (feed[`service${n}_name`] === 'Schoonmaakbedrijven' && feed[`service${n}_url`].includes('/nederland/kozijnen/')) {
      feed[`service${n}_url`] = SCHOONMAAK.url(feed.campaign_key);
      feed[`service${n}_link_label`] = SCHOONMAAK.link;
      feed[`service${n}_image_url`] = SCHOONMAAK.image;
      feed[`service${n}_image_alt`] = SCHOONMAAK.alt;
      notes.push(`${slug}: kaart ${n} (Schoonmaakbedrijven) linkte naar kozijnen; URL, link en beeld naar schoonmaakbedrijf gezet`);
    }
  }
  // Fix 2: /nederland/vertaalbureau/ bestaat niet (404); de Trustoo-slug is vertaler.
  for (const k of FIELDS) {
    if (feed[k].includes('trustoo.nl/nederland/vertaalbureau/')) {
      feed[k] = feed[k].replace('trustoo.nl/nederland/vertaalbureau/', 'trustoo.nl/nederland/vertaler/');
      notes.push(`${slug}: ${k} verwees naar /nederland/vertaalbureau/ (404), nu /nederland/vertaler/`);
    }
  }
  // Fix 3: linklabels consequent "Bekijk <kleine letter>", behalve afkortingen.
  for (const n of [1, 2, 3]) {
    const k = `service${n}_link_label`;
    const m = /^Bekijk ([A-Z][a-z].*)$/.exec(feed[k]);
    if (m) { feed[k] = 'Bekijk ' + m[1].charAt(0).toLowerCase() + m[1].slice(1); notes.push(`${slug}: ${k} '${'Bekijk ' + m[1]}' -> '${feed[k]}'`); }
  }
  for (const k of FIELDS) if (k.endsWith('_url') && feed[k] && !feed[k].startsWith('https://')) throw new Error(`${slug}.${k} geen https-URL`);

  if (slug === 'vertaalbureau') {
    feeds['vertaler'] = feed;
    feeds['vertaalbureau'] = feed;
    notes.push('vertaalbureau: geschreven als vertaler.json (Trustoo-slug, campaign_key reactivatie_vertaler_mail1) en als alias vertaalbureau.json');
  } else {
    feeds[slug] = feed;
  }
}

// Aliassen zoals eerder: dezelfde inhoud onder de spelling uit de relevantieanalyse.
for (const [alias, canon] of Object.entries({ 'cv-installateur': 'cv-verwarmings-installateur', 'stoffeerders': 'stoffeerder' })) {
  if (feeds[canon]) feeds[alias] = feeds[canon];
}

// default.json: neutrale variant in dezelfde stijl, kaarten klusjesman / schoonmaakbedrijf / schilder.
function card(fromSlug, n) {
  const f = feeds[fromSlug];
  return ['name', 'text', 'url', 'link_label', 'image_url', 'image_alt'].reduce((o, k) => { o[k] = f[`service${n}_${k}`]; return o; }, {});
}
const c1 = card('boomverzorging', 3), c2 = card('verhuisbedrijf', 1), c3 = card('stukadoor', 1); // klusjesman, schoonmaakbedrijf, schilder
const dc = 'reactivatie_default_mail1';
const def = {
  title: 'Je aanvraag staat nog open',
  subject_line: 'Je aanvraag op Trustoo staat nog open',
  preheader: 'Voeg met één klik extra bedrijven toe aan je aanvraag en ontvang nieuwe offertes. Of rond je aanvraag af als je al iemand hebt gevonden.',
  hero_link_url: `https://trustoo.nl/kosten/?utm_source=brevo&utm_campaign=${dc}&utm_medium=email&utm_content=heroimage`,
  hero_image_url: require(ROOT + 'feeds/nl/tips/default.json').hero_image_url,
  hero_image_alt: require(ROOT + 'feeds/nl/tips/default.json').hero_image_alt,
  hero_title_pre: 'Je aanvraag', hero_title_accent: 'staat nog open', hero_title_post: '',
  hero_subtitle: 'Een paar maanden geleden deed je een aanvraag via Trustoo. Nog niemand gevonden? Voeg extra bedrijven toe en ontvang nieuwe offertes om te vergelijken.',
  hero_cta_label: 'Ontvang nieuwe offertes',
  campaign_key: dc,
  request_label: 'Je openstaande aanvraag', request_service: 'Je aanvraag',
  request_meta: 'Een paar maanden geleden aangevraagd via Trustoo', request_status: 'Nog open',
  cta_label: 'Vergelijk extra bedrijven',
  cta_note: 'Gratis en vrijblijvend. Je bestaande aanvraag blijft staan, je krijgt er alleen meer reacties op.',
  services_heading_pre: 'Nog meer', services_heading_accent: 'vakmensen', services_heading_post: 'nodig?',
  services_intro: 'Via Trustoo vind je ook andere vakmensen die handig kunnen zijn. Vergelijk beoordelingen van anderen en vraag gratis offertes aan.',
  closing_heading_pre: 'Al geregeld of liever', closing_heading_accent: 'opnieuw beginnen?', closing_heading_post: '',
  closing_intro: 'Heb je gevonden wat je zocht? Rond je aanvraag af, zodat bedrijven niet meer hoeven te reageren. Liever opnieuw beginnen? Start een nieuwe aanvraag.',
  done_link_label: 'Aanvraag afronden',
  new_request_url: `https://trustoo.nl/?utm_source=brevo&utm_campaign=${dc}&utm_medium=email&utm_content=nieuweaanvraagcta`,
  new_request_label: 'Nieuwe aanvraag doen',
};
[c1, c2, c3].forEach((c, i) => {
  const n = i + 1;
  for (const k of Object.keys(c)) def[`service${n}_${k}`] = k === 'url' ? c[k].replace(/utm_campaign=[^&]+/, `utm_campaign=${dc}`) : c[k];
});
feeds['default'] = def;

// Schrijven in schemavolgorde; bestaande feeds die niet in de TSV staan melden.
const existing = fs.readdirSync(OUT).map((f) => f.replace('.json', ''));
const written = [];
for (const [slug, feed] of Object.entries(feeds)) {
  const ordered = {};
  for (const f of FIELDS) ordered[f] = feed[f];
  fs.writeFileSync(path.join(OUT, `${slug}.json`), JSON.stringify(ordered, null, 2) + '\n');
  written.push(slug);
}
const notInTsv = existing.filter((s) => !written.includes(s));
const newSlugs = written.filter((s) => !existing.includes(s));
console.log(`${rows.length} rijen in TSV, ${written.length} feeds geschreven`);
console.log('bestaande feeds NIET in TSV (ongewijzigd, nu op oud schema?):', notInTsv.join(', ') || '-');
console.log('nieuwe slugs:', newSlugs.join(', ') || '-');
console.log('aanpassingen:\n  ' + notes.join('\n  '));
const long = written.filter((s) => feeds[s].subject_line.length > 70).map((s) => `${s} (${feeds[s].subject_line.length})`);
console.log('onderwerpregels > 70 tekens:', long.join(', ') || '-');
