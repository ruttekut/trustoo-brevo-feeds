# Post-hire flow (mail 1)

Bron: pakket "Post-hire flow" van Talitha, aangepast door Daan (23-10-2026). Het pakket heeft vijf mails
(1a, 1b, 1c, 2, 3) met één gedeelde feed `posthire_<dienst>.json` (106 velden, alias `posthire_feed`).
Hier staat **één** post-hire-mail (1a en 1b samengevoegd); 1c, 2 en 3 volgen na beoordeling.

| Mail | Moment | Map | Alias | Template | Feeds | Velden |
|---|---|---|---|---|---|---|
| 1 | t=1 na status CHOSEN of DONE | `feeds/nl/posthire-chosen/` | `posthire_chosen_feed` | `trustoo-posthire-chosen-template.html` | 86 | 39 |

- De opmaak is die van mail 1a. De status komt van het aanvraag-object: `feed.request.attributes.status`.
  - **CHOSEN** (via Trustoo gekozen): `subject_line`, `preheader`, `hero_subtitle`, titel "Gefeliciteerd 🎉 Je hebt
    een … gekozen", tijdlijn en starttips "Zo gaat het soepel van start".
  - **DONE** (niet via Trustoo gekozen): `done_subject_line`, `done_preheader`, `done_hero_subtitle` (de teksten van
    mail 1b), titel "Fijn dat het geregeld is"; tijdlijn en starttips vallen weg.
  - Cross-sellkaarten, "Ook populair op Trustoo" en de knoppen zijn bij beide gelijk.
- Onderwerpregel en preview-tekst in Brevo staan buiten de HTML en hebben hun eigen loop met dezelfde statuswissel.
  Kopieer ze uit Feed Studio → Post-hire 1 → tab "Brevo (combined)" ("Brevo subject line" / "Brevo preview text").
- Per mail staan alleen de velden die de template gebruikt in de feed. De veldnamen volgen de conventies van de
  andere mails (`title`, `subject_line`, `preheader`, `hero_subtitle`, `service1-4_*`, `tile1-4_*`, `tiles_style`);
  `scripts/import-posthire.js` zet de pakketnamen om en zet de statusvoorwaarden in de template.
- Uitvaartverzorger heeft geen feed (Pieter houdt die mail tegen). Psycholoog, relatietherapeut en
  mediator-scheiding zitten erin voor DONE; **bij CHOSEN horen zij mail 1c te krijgen: sluit ze daar uit in de
  automation** (de 1a-opmaak zegt "Gefeliciteerd").
- Verborgen kaarten en het blok "Ook populair op Trustoo": `service1-4_style` en `tiles_style` zijn leeg of
  `display:none; mso-hide:all;`.
- `campaign_key` (utm_campaign) is `posthire_<dienst>`.

Content aanpassen: in Feed Studio (Post-hire 1), daarna publiceren. Dat werkt de losse feeds én de
gecombineerde feed in één commit bij.

Opnieuw importeren uit een nieuw pakket (overschrijft de content van alle diensten):

1. In deze repository:
   ```
   node scripts/import-posthire.js "<uitgepakte map met feed/ en templates/>"
   node scripts/rebuild-combined.js nl posthire-chosen
   npm run validate
   ```
   `rebuild-combined.js` zet de gecombineerde feed gelijk aan de nieuwe losse feeds (zelfde formaat als
   Feed Studio); zonder die stap faalt de validatie.
2. Komen er velden bij of gaan er weg: pas `seed/posthire-chosen-fields.json` in Feed Studio aan
   (`required` gelijk aan `minLength` in het schema). Verdwijnen er velden, draai dan eerst
   `npm run prune-fields -- --type=posthire-chosen --go` in Feed Studio.
3. Commit en push; wacht tot GitHub Pages de nieuwe versie serveert. Dan in Feed Studio:
   ```
   npm run seed:github -- --type=posthire-chosen --force-template
   npm run preflight -- --type=posthire-chosen
   ```
   De preflight hoort 0 wijzigingen te tonen. Toont hij een gewijzigde gecombineerde feed (bijvoorbeeld
   een nieuwe dienst met een "Brevo service name"), publiceer dan met
   `npm run publish:cli -- --type=posthire-chosen --note="…" --go`.
4. Download de nieuwe Brevo-HTML in Feed Studio (tab Brevo (combined)) en zet hem in de automation.

## Gecombineerde feed (object-based automation)

Een gepersonaliseerde feed-URL in Brevo kan alleen een **contactkenmerk** bevatten, maar een contact kan meerdere
aanvragen (objecten) hebben. Daarom gebruikt de post-hire flow de **gecombineerde feed**: Feed Studio schrijft bij
elke publicatie naast de bestanden per dienst ook één bestand per mailtype, in dezelfde landmap:

```
feeds/nl/posthire-chosen/<slug>.json   per dienst (contactkenmerk)
feeds/nl/posthire-chosen.json          gecombineerd: { "services": [ { "slug", "service_name", ...velden } ] }
```

- Beide komen uit dezelfde gepubliceerde content en gaan in één commit live; de validator controleert dat elk
  item gelijk is aan het losse bestand (als dat bestaat; een toegevoegde of verwijderde losse feed ziet hij niet).
- Brevo matcht op de slug: `s.slug == feed.request.attributes.service_url` (Service URL op het aanvraag-object, gelijk
  aan LAST_REQUEST_SERVICE_URL). `service_name` staat er alleen ter informatie in.
- Brevo: maak een **global** data feed op `https://ruttekut.github.io/trustoo-brevo-feeds/feeds/nl/posthire-chosen.json`
  (alias `post_hire_chosen`). Het object is beschikbaar als `feed.request.attributes.<veld>`.
- Template: Feed Studio → mailtype → tab "Brevo (combined)" → "Download combined template" of de kopieerknop "Brevo HTML"
  (wordt altijd opnieuw gemaakt uit de opgeslagen HTML-template, dus kan niet kwijtraken). De hele mail staat
  in `{% for s in feed.post_hire_chosen.services %}{% if s.slug == feed.request.attributes.service_url %}`
  en elk veld is `{{ s.<veld> }}`.
- Een dienst zonder content in de feed geeft een lege mail: sluit zulke diensten uit in de automation.
