#!/usr/bin/env node
'use strict';

/**
 * Bouwt een gecombineerde feed (feeds/<taal>/<mailtype>.json) opnieuw uit de losse feeds in
 * feeds/<taal>/<mailtype>/, in exact het formaat dat Feed Studio publiceert:
 *
 *   { "services": [ { "slug", "service_name", ...velden van het losse bestand } ] }
 *   diensten op slug gesorteerd, compacte JSON, één regel + newline.
 *
 * Gebruik na een generator of import die de losse feeds rechtstreeks wijzigt (bijvoorbeeld
 * scripts/import-posthire.js), zodat de repository consistent blijft voordat je pusht.
 * `service_name` komt uit het bestaande gecombineerde bestand (in Feed Studio: "Brevo service name");
 * een nieuwe slug krijgt een lege naam tot de volgende publicatie vanuit Feed Studio.
 *
 * Gebruik: node scripts/rebuild-combined.js <taal> <mailtype>     bijv. nl posthire-chosen
 * Daarna:  npm run validate
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const [locale, type] = process.argv.slice(2);
if (!locale || !type) {
  console.error('Gebruik: node scripts/rebuild-combined.js <taal> <mailtype>');
  process.exit(1);
}

const dir = path.join(ROOT, 'feeds', locale, type);
const out = path.join(ROOT, 'feeds', locale, `${type}.json`);
if (!fs.existsSync(dir)) {
  console.error(`Map ${path.relative(ROOT, dir)} bestaat niet.`);
  process.exit(1);
}

const names = new Map();
if (fs.existsSync(out)) {
  for (const s of JSON.parse(fs.readFileSync(out, 'utf8')).services) names.set(s.slug, s.service_name);
}

const services = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith('.json'))
  .map((f) => f.replace(/\.json$/, ''))
  .sort((a, b) => a.localeCompare(b))
  .map((slug) => ({ slug, service_name: names.get(slug) ?? '', ...JSON.parse(fs.readFileSync(path.join(dir, `${slug}.json`), 'utf8')) }));

fs.writeFileSync(out, `${JSON.stringify({ services })}\n`);
const missing = services.filter((s) => !s.service_name).map((s) => s.slug);
console.log(`${path.relative(ROOT, out)}: ${services.length} diensten${missing.length ? `, zonder service_name: ${missing.join(', ')}` : ''}`);
