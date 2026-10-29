# Post-hire flow (mail 1a en 1b)

Bron: pakket "Post-hire flow" van Talitha, aangepast door Daan (23-10-2026). Het pakket heeft vijf mails
(1a, 1b, 1c, 2, 3) met één gedeelde feed `posthire_<dienst>.json` (106 velden, alias `posthire_feed`).
Voor nu staan alleen **1a en 1b** in deze repo; 1c, 2 en 3 volgen na beoordeling.

| Mail | Moment | Map | Alias | Template | Feeds | Velden |
|---|---|---|---|---|---|---|
| 1a | t=1 na status CHOSEN | `feeds/nl/posthire-chosen/` | `posthire_chosen_feed` | `trustoo-posthire-chosen-template.html` | 83 | 36 |
| 1b | t=1 na status DONE | `feeds/nl/posthire-done/` | `posthire_done_feed` | `trustoo-posthire-done-template.html` | 87 | 37 |

- Per mail staan alleen de velden die de template gebruikt in de feed. De alias in de templates is daarom
  hernoemd van `posthire_feed` naar de alias per mail.
- De veldnamen volgen dezelfde conventies als de andere mails: `title`, `subject_line`, `preheader`,
  `hero_subtitle`, `hero_title_accent` (1a), `services_intro`, `service1-4_name/label/price/url/style` en
  `tile1-4_name/url` met `tiles_style` voor "Ook populair op Trustoo". In het pakket heten ze `chosen_subject`,
  `done_preheader`, `r1_name`, `popular1_name` enz.; `scripts/import-posthire.js` zet ze om.
- psycholoog, relatietherapeut, mediator-scheiding en uitvaartverzorger hebben **geen** feed in
  `posthire-chosen`: bij CHOSEN krijgen zij mail 1c. Zonder feed slaat Brevo ze over.
- uitvaartverzorger heeft wel een feed in `posthire-done`; volgens de LEESMIJ houdt Pieter die mail in Brevo tegen.
- Verborgen kaarten en het blok "Ook populair op Trustoo": `service1-4_style` en `tiles_style` zijn leeg of
  `display:none; mso-hide:all;`.
- `campaign_key` (utm_campaign) is `posthire_<dienst>` en is gelijk voor 1a en 1b.

Opnieuw importeren uit een nieuw pakket:

```
node scripts/import-posthire.js "<uitgepakte map met feed/ en templates/>"
npm run validate
```

## Gecombineerde feed (object-based automation)

Een gepersonaliseerde feed-URL in Brevo kan alleen een **contactkenmerk** bevatten, maar een contact kan meerdere
aanvragen (objecten) hebben. Daarom gebruikt de post-hire flow de **gecombineerde feed**: Feed Studio schrijft bij
elke publicatie naast de bestanden per dienst ook één bestand per mailtype, in dezelfde landmap:

```
feeds/nl/posthire-chosen/<slug>.json   per dienst (contactkenmerk)
feeds/nl/posthire-chosen.json          gecombineerd: { "services": [ { "slug", "service_name", ...velden } ] }
```

- Beide komen uit dezelfde gepubliceerde content en gaan in één commit live; de validator controleert dat elk
  item gelijk is aan het losse bestand.
- `service_name` is de naam zoals "Service name" op het aanvraag-object in Brevo ("Dakdekkers"). Die staat per
  dienst in Feed Studio (Services → Brevo service name).
- Brevo: maak een **global** data feed op `https://ruttekut.github.io/trustoo-brevo-feeds/feeds/nl/posthire-chosen.json`
  (alias `post_hire_chosen`). Het object is beschikbaar als `feed.request.attributes.<veld>`.
- Template: Feed Studio → mailtype → tab "Brevo (combined)" → "Download combined template". De hele mail staat
  in `{% for s in feed.post_hire_chosen.services %}{% if s.service_name == feed.request.attributes.service_name %}`
  en elk veld is `{{ s.<veld> }}`.
- Zonder per-dienstfeed slaat Brevo diensten zonder content niet meer vanzelf over: de mail is dan leeg. De 4
  gevoelige diensten (1a) moeten daarom met een voorwaarde in de automation worden uitgesloten.
