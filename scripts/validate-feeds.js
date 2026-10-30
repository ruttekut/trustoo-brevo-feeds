#!/usr/bin/env node
'use strict';

/**
 * Validatie van alle JSON-feeds onder feeds/.
 *
 * Elk mailtype (de map onder feeds/<taal>/) heeft zijn eigen schema, zie SCHEMAS.
 * Controleert per bestand:
 *  1. geldige JSON-syntaxis
 *  2. root is een plat object
 *  3. alle verplichte velden van het schema aanwezig
 *  4. geen onbekende velden
 *  5. alle waarden zijn strings
 *  6. niet-lege URL-velden (naam eindigt op _url) beginnen met https://
 *  7. bestandsnaam is een veilige canonical slug
 *
 * Gecombineerde feeds (feeds/<taal>/<mailtype>.json, geschreven door Feed Studio) bevatten
 * { "services": [ { slug, service_name, ...velden } ] }: elk item moet aan hetzelfde schema voldoen
 * en gelijk zijn aan feeds/<taal>/<mailtype>/<slug>.json als dat bestand bestaat.
 *
 * Exitcode 1 bij fouten, 0 als alles geldig is.
 * Gebruikt uitsluitend ingebouwde Node.js-modules.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const FEEDS_DIR = path.join(ROOT, 'feeds');
const SCHEMA_DIR = path.join(ROOT, 'schemas');

// mailtype (mapnaam onder feeds/<taal>/) -> schemabestand
const SCHEMAS = {
  tips: 'email-feed.schema.json',
  // Trustlocal.be (feeds/be-nl/tips-be/): zelfde 50 velden, Brevo-alias tip_feed_be
  'tips-be': 'email-feed.schema.json',
  reactivation: 'reactivation-feed.schema.json',
  'cross-sell': 'cross-sell-feed.schema.json',
  'cross-sell-reminder': 'cross-sell-reminder-feed.schema.json',
  // Trustlocal.be (feeds/be-nl/cross-sell-be/): zelfde 50 velden, Brevo-alias cross_sell_feed_be
  'cross-sell-be': 'cross-sell-feed.schema.json',
  // Trustlocal.be (feeds/be-nl/cross-sell-reminder-be/): zelfde 58 velden, Brevo-alias cross_sell_reminder_feed_be
  'cross-sell-reminder-be': 'cross-sell-reminder-feed.schema.json',
  // Post-hire flow mail 1 (CHOSEN en DONE, done_*-teksten), alias posthire_chosen_feed
  'posthire-chosen': 'posthire-chosen-feed.schema.json',
};

// Slug: kleine letters, cijfers en losse koppeltekens. Geen hoofdletters,
// spaties, punten, slashes of dubbele koppeltekens.
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_SLUG_LENGTH = 80;

function fail(message) {
  console.error(`FOUT: ${message}`);
  process.exit(1);
}

function rel(p) {
  return path.relative(ROOT, p).split(path.sep).join('/');
}

function loadSchema(file) {
  const schemaPath = path.join(SCHEMA_DIR, file);
  let raw;
  try {
    raw = fs.readFileSync(schemaPath, 'utf8');
  } catch (err) {
    fail(`Schema niet gevonden op ${rel(schemaPath)}: ${err.message}`);
  }
  let schema;
  try {
    schema = JSON.parse(raw);
  } catch (err) {
    fail(`Schema ${rel(schemaPath)} is geen geldige JSON: ${err.message}`);
  }
  const requiredFields = Array.isArray(schema.required) ? schema.required : [];
  const allowedFields = new Set(Object.keys(schema.properties || {}));
  if (requiredFields.length !== allowedFields.size || requiredFields.length === 0) {
    fail(
      `Schema ${rel(schemaPath)} is inconsistent: ${requiredFields.length} verplichte velden tegenover ${allowedFields.size} gedefinieerde velden. Alle velden moeten verplicht zijn.`
    );
  }
  const urlFields = new Set(requiredFields.filter((f) => f.endsWith('_url')));
  return { file, requiredFields, allowedFields, urlFields };
}

function findJsonFiles(dir) {
  const found = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...findJsonFiles(full));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.json')) {
      found.push(full);
    }
  }
  return found.sort();
}

// feeds/<taal>/<mailtype>/<slug>.json -> mailtype
function mailTypeOf(file) {
  const parts = rel(file).split('/');
  return parts.length === 4 ? parts[2] : null;
}

// feeds/<taal>/<mailtype>.json (gecombineerde feed) -> mailtype
function combinedMailTypeOf(file) {
  const parts = rel(file).split('/');
  return parts.length === 3 ? path.basename(parts[2], '.json') : null;
}

function validateFile(file, schemas) {
  if (combinedMailTypeOf(file)) return validateCombinedFile(file, schemas);
  const errors = [];
  const name = rel(file);
  const base = path.basename(file, '.json');

  const mailType = mailTypeOf(file);
  const schema = mailType && schemas[mailType];
  if (!schema) {
    errors.push(
      `${name}: staat niet in een bekend mailtype (feeds/<taal>/<mailtype>/<slug>.json met mailtype ${Object.keys(SCHEMAS).join(', ')}).`
    );
    return errors;
  }
  // 7. Bestandsnaam moet een veilige canonical slug zijn.
  if (path.basename(file) !== `${base}.json`) {
    errors.push(`${name}: bestandsnaam moet exact op '.json' eindigen (kleine letters).`);
  }
  if (!SLUG_RE.test(base)) {
    errors.push(
      `${name}: bestandsnaam '${base}' is geen veilige canonical slug. ` +
        `Toegestaan: kleine letters, cijfers en enkele koppeltekens (bijv. 'laadpalen', 'zonnepanelen-plaatsen').`
    );
  }
  if (base.length > MAX_SLUG_LENGTH) {
    errors.push(`${name}: bestandsnaam is langer dan ${MAX_SLUG_LENGTH} tekens.`);
  }

  // 1. Geldige JSON-syntaxis.
  let data;
  try {
    data = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    errors.push(`${name}: ongeldige JSON: ${err.message}`);
    return errors;
  }

  // 2. Plat object.
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    errors.push(`${name}: root moet een JSON-object zijn (geen array, string of null).`);
    return errors;
  }

  errors.push(...validateObject(name, data, schema, mailType));
  return errors;
}

function validateCombinedFile(file, schemas) {
  const errors = [];
  const name = rel(file);
  const mailType = combinedMailTypeOf(file);
  const schema = schemas[mailType];
  if (!schema) {
    errors.push(`${name}: gecombineerde feed van een onbekend mailtype '${mailType}' (bekend: ${Object.keys(SCHEMAS).join(', ')}).`);
    return errors;
  }
  let data;
  try {
    data = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    errors.push(`${name}: ongeldige JSON: ${err.message}`);
    return errors;
  }
  if (data === null || typeof data !== 'object' || Array.isArray(data) || Object.keys(data).join() !== 'services' || !Array.isArray(data.services)) {
    errors.push(`${name}: een gecombineerde feed is precies { "services": [ ... ] }.`);
    return errors;
  }
  const seen = new Set();
  data.services.forEach((item, idx) => {
    const label = `${name} [${idx}]`;
    if (item === null || typeof item !== 'object' || Array.isArray(item)) {
      errors.push(`${label}: item moet een object zijn.`);
      return;
    }
    const { slug, service_name: serviceName, ...feed } = item;
    if (typeof slug !== 'string' || !SLUG_RE.test(slug)) errors.push(`${label}: 'slug' ontbreekt of is geen canonical slug.`);
    else if (seen.has(slug)) errors.push(`${label}: slug '${slug}' komt dubbel voor.`);
    else seen.add(slug);
    if (typeof serviceName !== 'string') errors.push(`${label}: 'service_name' moet een string zijn.`);
    errors.push(...validateObject(`${label} (${slug})`, feed, schema, mailType));
    // Zelfde inhoud als het losse bestand, zodat de twee nooit uit elkaar lopen.
    const single = path.join(path.dirname(file), mailType, `${slug}.json`);
    if (typeof slug === 'string' && fs.existsSync(single)) {
      const expected = JSON.parse(fs.readFileSync(single, 'utf8'));
      if (JSON.stringify(expected) !== JSON.stringify(feed)) errors.push(`${label}: wijkt af van ${rel(single)}.`);
    }
  });
  return errors;
}

// Controles 3-6 voor één feedobject (los bestand of item uit een gecombineerde feed).
function validateObject(name, data, schema, mailType) {
  const errors = [];
  const { requiredFields, allowedFields, urlFields } = schema;
  const keys = Object.keys(data);

  // 3. Alle verplichte velden aanwezig.
  for (const field of requiredFields) {
    if (!Object.prototype.hasOwnProperty.call(data, field)) {
      errors.push(`${name}: veld '${field}' ontbreekt.`);
    }
  }

  // 4. Geen onbekende velden.
  for (const key of keys) {
    if (!allowedFields.has(key)) {
      errors.push(
        `${name}: onbekend veld '${key}'. Voeg geen metadata toe; alleen de ${requiredFields.length} templatevelden van '${mailType}' zijn toegestaan.`
      );
    }
  }

  for (const key of keys) {
    if (!allowedFields.has(key)) continue;
    const value = data[key];

    // 5. Alle waarden zijn strings.
    if (typeof value !== 'string') {
      errors.push(
        `${name}: veld '${key}' moet een string zijn, maar is ${Array.isArray(value) ? 'array' : typeof value}.`
      );
      continue;
    }

    // 6. Niet-lege URL-velden beginnen met https://
    if (urlFields.has(key) && value !== '') {
      if (!value.startsWith('https://')) {
        errors.push(
          `${name}: URL-veld '${key}' moet leeg zijn of met 'https://' beginnen (nu: '${value}').`
        );
      } else if (value.length <= 'https://'.length) {
        errors.push(`${name}: URL-veld '${key}' bevat geen host na 'https://'.`);
      } else if (/[\s"'<>`]/.test(value)) {
        errors.push(`${name}: URL-veld '${key}' bevat ongeldige tekens (spaties of quotes).`);
      }
    }
  }

  return errors;
}

function main() {
  const schemas = {};
  for (const [mailType, file] of Object.entries(SCHEMAS)) {
    schemas[mailType] = loadSchema(file);
  }

  if (!fs.existsSync(FEEDS_DIR)) {
    fail(`Map ${rel(FEEDS_DIR)} bestaat niet.`);
  }

  const files = findJsonFiles(FEEDS_DIR);
  if (files.length === 0) {
    fail(`Geen JSON-bestanden gevonden onder ${rel(FEEDS_DIR)}.`);
  }

  const allErrors = [];
  for (const file of files) {
    allErrors.push(...validateFile(file, schemas));
  }

  if (allErrors.length > 0) {
    console.error(`\nValidatie mislukt: ${allErrors.length} fout(en) in ${files.length} bestand(en).\n`);
    for (const err of allErrors) {
      console.error(`  - ${err}`);
    }
    console.error('');
    process.exit(1);
  }

  const counts = {};
  let combinedCount = 0;
  for (const file of files) {
    if (combinedMailTypeOf(file)) {
      combinedCount++;
      continue;
    }
    const t = mailTypeOf(file);
    counts[t] = (counts[t] || 0) + 1;
  }
  console.log(`OK: ${files.length} feed(s) gevalideerd.`);
  for (const [t, n] of Object.entries(counts)) {
    console.log(`  - ${t}: ${n} feed(s), ${schemas[t].requiredFields.length} velden per feed (${schemas[t].file})`);
  }
  if (combinedCount > 0) console.log(`  - gecombineerde feeds: ${combinedCount}`);
  process.exit(0);
}

main();
