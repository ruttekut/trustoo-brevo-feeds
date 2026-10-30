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
- Onderwerpregel in Brevo: `{% if feed.request.attributes.status == "DONE" %}{{ s.done_subject_line }}{% else %}{{ s.subject_line }}{% endif %}`
  (binnen de loop van de gecombineerde template; preheader idem met `done_preheader` / `preheader`).
- Per mail staan alleen de velden die de template gebruikt in de feed. De veldnamen volgen de conventies van de
  andere mails (`title`, `subject_line`, `preheader`, `hero_subtitle`, `service1-4_*`, `tile1-4_*`, `tiles_style`);
  `scripts/import-posthire.js` zet de pakketnamen om en zet de statusvoorwaarden in de template.
- Uitvaartverzorger heeft geen feed (Pieter houdt die mail tegen). Psycholoog, relatietherapeut en
  mediator-scheiding zitten erin voor DONE; **bij CHOSEN horen zij mail 1c te krijgen: sluit ze daar uit in de
  automation** (de 1a-opmaak zegt "Gefeliciteerd").
- Verborgen kaarten en het blok "Ook populair op Trustoo": `service1-4_style` en `tiles_style` zijn leeg of
  `display:none; mso-hide:all;`.
- `campaign_key` (utm_campaign) is `posthire_<dienst>`.

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
- Brevo matcht op de slug: `s.slug == feed.request.attributes.service_url` (Service URL op het aanvraag-object, gelijk
  aan LAST_REQUEST_SERVICE_URL). `service_name` staat er alleen ter informatie in.
- Brevo: maak een **global** data feed op `https://ruttekut.github.io/trustoo-brevo-feeds/feeds/nl/posthire-chosen.json`
  (alias `post_hire_chosen`). Het object is beschikbaar als `feed.request.attributes.<veld>`.
- Template: Feed Studio → mailtype → tab "Brevo (combined)" → "Download combined template". De hele mail staat
  in `{% for s in feed.post_hire_chosen.services %}{% if s.slug == feed.request.attributes.service_url %}`
  en elk veld is `{{ s.<veld> }}`.
- Een dienst zonder content in de feed geeft een lege mail: sluit zulke diensten uit in de automation.
