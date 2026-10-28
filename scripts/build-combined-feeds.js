#!/usr/bin/env node
'use strict';

/**
 * Bouwt per mailtype één gecombineerde feed met alle diensten:
 *
 *   combined/nl/<mailtype>.json  ->  { "services": [ { "slug": "aannemer", ...velden }, ... ] }
 *
 * Bedoeld voor object-based automations in Brevo: een gepersonaliseerde feed-URL kan alleen een
 * contactkenmerk bevatten, niet het object (de aanvraag) dat de automation start. De template
 * laadt daarom deze globale feed en toont alleen de dienst waarvan `slug` gelijk is aan de dienst
 * op het object. Zie POSTHIRE.md.
 *
 * De bron blijft feeds/nl/<mailtype>/<slug>.json (en Feed Studio); draai dit script opnieuw na
 * elke wijziging daarin. Gebruik: node scripts/build-combined-feeds.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TYPES = [
  { locale: 'nl', type: 'posthire-chosen' },
  { locale: 'nl', type: 'posthire-done' },
];

for (const { locale, type } of TYPES) {
  const dir = path.join(ROOT, 'feeds', locale, type);
  const services = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => ({
      slug: f.replace(/\.json$/, ''),
      ...JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')),
    }));

  const outDir = path.join(ROOT, 'combined', locale);
  fs.mkdirSync(outDir, { recursive: true });
  const out = path.join(outDir, `${type}.json`);
  const json = JSON.stringify({ services }) + '\n';
  fs.writeFileSync(out, json);
  console.log(`${path.relative(ROOT, out)}: ${services.length} diensten, ${Math.round(Buffer.byteLength(json) / 1024)} KB`);
}
