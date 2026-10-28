#!/usr/bin/env node
'use strict';

/**
 * Zet de post-hire templates om naar de gecombineerde feed (zie build-combined-feeds.js):
 *
 *   trustoo-posthire-<mail>-template.html  ->  trustoo-posthire-<mail>-combined-template.html
 *
 * De hele <body> komt binnen een loop over feed.<alias>.services en wordt alleen getoond voor de
 * dienst waarvan service_name gelijk is aan 'Service name' op het aanvraag-object; {{feed.<feed-alias>.x}} wordt {{s.x}}.
 *
 * OBJECT_DIENST is een placeholder: vervang hem in Brevo door de objectvariabele 'Service name'.
 * Met --test komt bovenaan de mail een gele balk met de waarde van die variabele (om te zien wat
 * het object bevat, ook als er geen dienst matcht).
 *
 * Gebruik: node scripts/build-combined-templates.js [--test]
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OBJECT_VAR = 'OBJECT_DIENST';
const test = process.argv.includes('--test');

const MAILS = [
  { mail: 'chosen', feedAlias: 'posthire_chosen_feed', combinedAlias: 'posthire_chosen_all' },
  { mail: 'done', feedAlias: 'posthire_done_feed', combinedAlias: 'posthire_done_all' },
];

for (const { mail, feedAlias, combinedAlias } of MAILS) {
  const src = path.join(ROOT, `trustoo-posthire-${mail}-template.html`);
  let html = fs.readFileSync(src, 'utf8');

  const open = `{% for s in feed.${combinedAlias}.services %}{% if s.service_name == ${OBJECT_VAR} %}`;
  const close = '{% endif %}{% endfor %}';

  html = html.replace(/feed\.([a-z0-9_]+)\.([a-z0-9_]+)/g, (m, alias, key) => {
    if (alias !== feedAlias) throw new Error(`${src}: onbekende feed-alias in ${m}`);
    return `s.${key}`;
  });
  html = html.replace(/<title>(.*?)<\/title>/, `<title>${open}$1${close}</title>`);

  const banner = test
    ? `\n<div style="background:#FFF3B0; color:#000; font:14px/20px Arial,sans-serif; padding:8px 16px;">TEST · dienst op het object: <strong>{{ ${OBJECT_VAR} }}</strong></div>`
    : '';
  html = html.replace(/(<body[^>]*>)/, `$1${banner}\n${open}`);
  html = html.replace('</body>', `${close}\n</body>`);

  const out = path.join(ROOT, `trustoo-posthire-${mail}-combined-template.html`);
  fs.writeFileSync(out, html);
  console.log(`${path.basename(out)}${test ? ' (test)' : ''}: ${Math.round(Buffer.byteLength(html) / 1024)} KB`);
}
