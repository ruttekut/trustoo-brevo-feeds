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

## Gecombineerde feed (test: trigger op het aanvraag-object)

Een gepersonaliseerde feed-URL in Brevo kan alleen een **contactkenmerk** bevatten. Een contact kan meerdere
aanvragen (objecten) hebben, dus voor de post-hire flow willen we de dienst van het **object** dat de
automation start. Daarvoor staat per mail één globale feed met alle diensten klaar:

| Mail | Bestand | Voorgestelde alias | Diensten | Grootte |
|---|---|---|---|---|
| 1a | `combined/nl/posthire-chosen.json` | `posthire_chosen_all` | 83 | ~194 KB |
| 1b | `combined/nl/posthire-done.json` | `posthire_done_all` | 87 | ~213 KB |

Vorm: `{ "services": [ { "slug": "aannemer", "subject_line": "…", … }, … ] }`, met dezelfde velden als de feeds
per dienst plus `slug`. Opnieuw bouwen na elke wijziging in `feeds/nl/posthire-*`:
`node scripts/build-combined-feeds.js`. Let op: Feed Studio bouwt deze bestanden (nog) niet bij het publiceren.

Test in Brevo (object-based automation, e-mail in de automation zelf):

```
{% for s in feed.posthire_chosen_all.services %}{% if s.slug == OBJECT_DIENST %}
  <h1>{{ s.subject_line }}</h1>
  <p>{{ s.hero_subtitle }}</p>
  <p>{{ s.service1_name }} · {{ s.service1_price }}</p>
{% endif %}{% endfor %}
```

Vervang `OBJECT_DIENST` door de objectvariabele met de dienst van de aanvraag (invoegen via de variabelenknop in
de editor; de exacte syntax hangt af van de objectnaam). Te controleren:

1. Werkt de objectvariabele in een `if`-vergelijking, en bevat het object de kale slug (`schilder`) of een URL?
2. Werkt het in een eigen HTML-template, of alleen in de drag-and-drop-editor?
3. Accepteert Brevo een feed van ~200 KB?
4. Kunnen onderwerp en preview-tekst dezelfde loop gebruiken?
5. Zonder per-dienstfeed slaat Brevo de 4 gevoelige diensten niet meer automatisch over bij 1a: dat moet
   een voorwaarde in de automation worden.

Werkt dit, dan zetten we de twee templates om naar deze vorm (`feed.posthire_chosen_feed.x` -> `s.x` binnen de loop).
