# Post-hire flow (mail 1a en 1b)

Bron: pakket "Post-hire flow" van Talitha, aangepast door Daan (23-10-2026). Het pakket heeft vijf mails
(1a, 1b, 1c, 2, 3) met één gedeelde feed `posthire_<dienst>.json` (106 velden, alias `posthire_feed`).
Voor nu staan alleen **1a en 1b** in deze repo; 1c, 2 en 3 volgen na beoordeling.

| Mail | Moment | Map | Alias | Template | Feeds | Velden |
|---|---|---|---|---|---|---|
| 1a | t=1 na status CHOSEN | `feeds/nl/posthire-chosen/` | `posthire_chosen_feed` | `trustoo-posthire-chosen-template.html` | 83 | 35 |
| 1b | t=1 na status DONE | `feeds/nl/posthire-done/` | `posthire_done_feed` | `trustoo-posthire-done-template.html` | 87 | 36 |

- Per mail staan alleen de velden die de template gebruikt in de feed. De alias in de templates is daarom
  hernoemd van `posthire_feed` naar de alias per mail.
- psycholoog, relatietherapeut, mediator-scheiding en uitvaartverzorger hebben **geen** feed in
  `posthire-chosen`: bij CHOSEN krijgen zij mail 1c. Zonder feed slaat Brevo ze over.
- uitvaartverzorger heeft wel een feed in `posthire-done`; volgens de LEESMIJ houdt Pieter die mail in Brevo tegen.
- Verborgen kaarten en het blok "Ook populair op Trustoo": `r1-4_style` en `popular_style` zijn leeg of
  `display:none; mso-hide:all;`.
- `campaign_key` (utm_campaign) is `posthire_<dienst>` en is gelijk voor 1a en 1b.

Opnieuw importeren uit een nieuw pakket:

```
node scripts/import-posthire.js "<uitgepakte map met feed/ en templates/>"
npm run validate
```
