#!/usr/bin/env node
'use strict';

/**
 * Validatie van alle JSON-feeds onder feeds/.
 *
 * Controleert per bestand:
 *  1. geldige JSON-syntaxis
 *  2. root is een plat object
 *  3. alle 49 verplichte velden aanwezig
 *  4. geen onbekende velden
 *  5. alle waarden zijn strings
 *  6. niet-lege URL-velden beginnen met https://
 *  7. bestandsnaam is een veilige canonical slug
 *
 * Exitcode 1 bij fouten, 0 als alles geldig is.
 * Gebruikt uitsluitend ingebouwde Node.js-modules.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const FEEDS_DIR = path.join(ROOT, 'feeds');
const SCHEMA_PATH = path.join(ROOT, 'schemas', 'email-feed.schema.json');

// Slug: kleine letters, cijfers en losse koppeltekens. Geen hoofdletters,
// spaties, punten, slashes of dubbele koppeltekens.
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_SLUG_LENGTH = 80;

const URL_FIELDS = new Set([
  'hero_image_url',
  'cta_url',
  'tile1_url',
  'tile2_url',
  'tile3_url',
  'tile4_url',
  'tile5_url',
  'tile6_url',
]);

function loadSchema() {
  let raw;
  try {
    raw = fs.readFileSync(SCHEMA_PATH, 'utf8');
  } catch (err) {
    fail(`Schema niet gevonden op ${rel(SCHEMA_PATH)}: ${err.message}`);
  }
  try {
    return JSON.parse(raw);
  } catch (err) {
    fail(`Schema ${rel(SCHEMA_PATH)} is geen geldige JSON: ${err.message}`);
  }
}

function fail(message) {
  console.error(`FOUT: ${message}`);
  process.exit(1);
}

function rel(p) {
  return path.relative(ROOT, p).split(path.sep).join('/');
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

function validateFile(file, allowedFields, requiredFields) {
  const errors = [];
  const name = rel(file);
  const base = path.basename(file, '.json');

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

  // 2. Geldige JSON-syntaxis.
  let data;
  try {
    data = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    errors.push(`${name}: ongeldige JSON: ${err.message}`);
    return errors;
  }

  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    errors.push(`${name}: root moet een JSON-object zijn (geen array, string of null).`);
    return errors;
  }

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
        `${name}: onbekend veld '${key}'. Voeg geen metadata toe; alleen de ${requiredFields.length} templatevelden zijn toegestaan.`
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
    if (URL_FIELDS.has(key) && value !== '') {
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
  const schema = loadSchema();
  const requiredFields = Array.isArray(schema.required) ? schema.required : [];
  const allowedFields = new Set(Object.keys(schema.properties || {}));

  if (requiredFields.length !== allowedFields.size || requiredFields.length === 0) {
    fail(
      `Schema is inconsistent: ${requiredFields.length} verplichte velden tegenover ${allowedFields.size} gedefinieerde velden. Alle velden moeten verplicht zijn.`
    );
  }
  for (const field of URL_FIELDS) {
    if (!allowedFields.has(field)) {
      fail(`Schema mist URL-veld '${field}'. Houd het schema en dit script in sync.`);
    }
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
    allErrors.push(...validateFile(file, allowedFields, requiredFields));
  }

  if (allErrors.length > 0) {
    console.error(`\nValidatie mislukt: ${allErrors.length} fout(en) in ${files.length} bestand(en).\n`);
    for (const err of allErrors) {
      console.error(`  - ${err}`);
    }
    console.error('');
    process.exit(1);
  }

  console.log(`OK: ${files.length} feed(s) gevalideerd, ${requiredFields.length} velden per feed.`);
  for (const file of files) {
    console.log(`  - ${rel(file)}`);
  }
  process.exit(0);
}

main();
