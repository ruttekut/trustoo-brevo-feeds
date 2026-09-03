# trustoo-brevo-feeds

Openbare, statische JSON-datafeeds voor dynamische Brevo-e-mails van Trustoo.

Elke e-mail gebruikt **één template**. De inhoud komt uit een JSON-bestand in deze repository,
dat Brevo op het moment van verzenden ophaalt via een **Personalized Data Feed**. Zo kun je
per service andere content laten zien zonder de template te dupliceren.

## Doel

- Eén e-mailtemplate, per service een eigen set teksten.
- Content aanpassen zonder in Brevo te knutselen: je wijzigt een JSON-bestand en pusht.
- Uitbreidbaar naar meerdere mailtypes en meerdere landen.

## Hoe `LAST_REQUEST_SERVICE_URL` aan een feedbestand wordt gekoppeld

Elk Brevo-contact heeft het contactattribuut `LAST_REQUEST_SERVICE_URL`. De waarde daarvan is
een **canonical slug** die één-op-één de bestandsnaam van de feed bepaalt:

```text
https://ruttekut.github.io/trustoo-brevo-feeds/feeds/nl/tips/{LAST_REQUEST_SERVICE_URL}.json
```

Contacten met dezelfde waarde krijgen dus dezelfde content.

### Concreet voorbeeld: dakdekker

| | |
| --- | --- |
| Attribuutwaarde | `dakdekker` |
| Bestand in deze repo | [`feeds/nl/tips/dakdekker.json`](feeds/nl/tips/dakdekker.json) |
| Publieke URL | <https://ruttekut.github.io/trustoo-brevo-feeds/feeds/nl/tips/dakdekker.json> |
| In de template | `{{ feed.tip_feed.title }}` |

## Welke services staan er nu in

87 feeds: 86 servicetips-feeds plus een neutrale fallback (`default`). Elke feed bevat negen
tips in drie groepen. De veldnamen komen uit de template
[`trustoo-servicetips-template.html`](trustoo-servicetips-template.html) in deze repository.

- De eerste negen services (`catering`, `dakdekker`, `energielabel-adviseur`, `hovenier`,
  `notaris`, `schoonmaakbedrijf`, `stratenmaker`, `thuisbatterij`, `zonwering`) komen uit
  `trustoo-servicetips-content.csv`, aangevuld tot negen tips.
- De overige 77 services komen uit `servicetips_checklist_mail.xlsx` (kolom `variant`
  bijvoorbeeld `schilder_tips_mail1`). De variantnaam uit dat bestand is **niet** de
  bestandsnaam: de bestandsnaam is altijd de canonical Trustoo-slug uit de `cta_url`
  (`https://trustoo.nl/nederland/<slug>/`), bijvoorbeeld `schilder.json`.

Een actuele lijst van alle slugs krijg je met `ls feeds/nl/tips`.

De bestandsnamen zijn afgeleid van de service-slug in de `cta_url` van elke rij
(`https://trustoo.nl/kosten/<slug>/` voor de eerste negen, `https://trustoo.nl/nederland/<slug>/`
voor de rest), omdat dat de canonical Trustoo-slug is.

> **Controleer `energielabel-adviseur`.** De variantnaam in de CSV gebruikt een underscore
> (`energielabel_adviseur`), maar de Trustoo-URL gebruikt een koppelteken
> (`/kosten/energielabel-adviseur/`). Het bestand heet daarom `energielabel-adviseur.json`.
> Staat er in `LAST_REQUEST_SERVICE_URL` een underscore, dan moet het bestand
> `energielabel_adviseur.json` heten — maar dan wijkt het af van de slugregels hieronder.
> Verifieer de werkelijke attribuutwaarde voordat je deze mail verstuurt.

De `hero_image_url`-velden verwijzen naar de Brevo image gallery (`img.mailinblue.com`).
Brevo host de beelden die de mail toont. De bronbestanden staan in `images/nl/tips/`
(`hero-<slug>.jpg`, 4:3, 1200x900) en zijn via de Brevo API vanaf de GitHub Pages-URL naar de
gallery geupload met de naam `trustoo-nl-tips-hero-<slug>.jpg`. `images/nl/tips/manifest.json`
legt per beeld vast: bronbestand, feed-slug, alt-tekst en de Brevo-URL. Veertien beelden hebben
geen eigen feed (bijvoorbeeld `hero-verhuizer.jpg`) of zijn een tweede variant
(bijvoorbeeld `hero-hovenier-terras.jpg`); die staan wel in de gallery en het manifest.
Zeven feeds hebben nog een ouder herobeeld: `coaching`, `default`, `grafisch-ontwerper`,
`incassobureau`, `keukenrenovatie`, `online-marketing` en `seo-specialist`.

## Structuur

```text
feeds/
└── nl/                       # taal/markt
    └── tips/                 # mailtype
        ├── default.json      # neutrale fallbackcontent
        ├── aannemer.json
        ├── catering.json
        ├── dakdekker.json
        ├── ...               # 87 bestanden in totaal, één per service-slug
        └── zonwering.json
```

Later eenvoudig uitbreidbaar naar andere mailtypes:

```text
feeds/nl/cross-sell/dakdekker.json
feeds/nl/seasonal/dakdekker.json
feeds/nl/follow-up/dakdekker.json
```

En naar andere markten (Trustlocal), met een eigen Brevo-feed per taalmap:

```text
feeds/be/tips/dakdekker.json
feeds/de/tips/wallbox.json
```

## Een nieuwe service toevoegen

1. Kies de canonical slug. Die moet **exact** gelijk zijn aan de waarde van
   `LAST_REQUEST_SERVICE_URL` voor die service.
2. Kopieer `feeds/nl/tips/default.json` naar `feeds/nl/tips/<slug>.json`.
3. Vul de teksten. Laat URL- en afbeeldingsvelden leeg als je geen echte, gecontroleerde
   Trustoo-URL hebt. Verzin geen links.
4. Valideer lokaal: `npm run validate`.
5. Commit en push. GitHub Pages publiceert het bestand automatisch.
6. Test de URL in de browser.

In Brevo hoef je hierna **niets** te wijzigen: de feed-URL is dynamisch, dus een nieuw bestand
werkt direct voor contacten met die attribuutwaarde.

## Een nieuw mailtype toevoegen

1. Maak een nieuwe map: `feeds/nl/<mailtype>/`.
2. Zet daar minimaal `default.json` en de eerste servicefeeds in.
3. Maak in Brevo een **nieuwe** data feed aan met een eigen alias, bijvoorbeeld
   `trustoo_cross_sell`, met bron-URL `.../feeds/nl/cross-sell/<attribuut>.json`.
4. Spreek de velden in die template aan via die alias:
   `{{ feed.trustoo_cross_sell.title }}`.

Zie [`BREVO_SETUP.md`](BREVO_SETUP.md) voor het volledige overzicht per mailtype.

## Naamgevingsregels

**Bestandsnamen (slugs)**

- Alleen kleine letters `a-z`, cijfers `0-9` en koppeltekens `-`.
- Geen hoofdletters, spaties, underscores, punten, accenten of slashes.
- Geen koppelteken aan begin of eind, geen dubbele koppeltekens.
- Maximaal 80 tekens.
- Altijd de extensie `.json` in kleine letters.
- Goed: `dakdekker`, `hovenier`, `notaris`, `thuisbatterij`, `energielabel-adviseur`
- Fout: `Dakdekker`, `energielabel_adviseur`, `dakdekker.json.json`, `dak dekker`, `dakdekker/`

**Mappen**

- `feeds/<taal>/<mailtype>/` — taalcode in kleine letters (`nl`, `be`, `de`, `es`),
  mailtype als slug (`tips`, `cross-sell`, `seasonal`, `follow-up`).

**JSON-velden**

- Exact de 50 velden uit [`schemas/email-feed.schema.json`](schemas/email-feed.schema.json).
  Niet meer, niet minder, en de namen niet wijzigen.
- Alle waarden zijn strings. Een veld dat je niet gebruikt, krijgt een lege string `""` —
  je mag het niet weglaten.
- Geen metadata zoals `service`, `mail_type` of `updated_at`. Geen arrays, geen geneste
  objecten.
- URL-velden bevatten een absolute `https://`-URL of een lege string:
  `hero_image_url`, `cta_url` en `tile1_url` tot en met `tile6_url`.

**Brevo-feedalias**

- Kleine letters met underscores, afgeleid van de feednaam: `tip_feed`.

## Lokaal valideren

Vereist Node.js 18 of hoger. Er zijn geen dependencies, dus `npm install` is niet nodig.

```bash
npm run validate
```

Het script [`scripts/validate-feeds.js`](scripts/validate-feeds.js) loopt recursief door
`feeds/` en controleert per bestand: geldige JSON, alle 50 velden aanwezig, geen onbekende
velden, alle waarden strings, niet-lege URL-velden beginnen met `https://`, en een veilige
canonical bestandsnaam. Bij een fout krijg je bestand en veld te zien en stopt het script met
exitcode `1`.

Dezelfde validatie loopt automatisch via GitHub Actions bij iedere push en pull request:
[`.github/workflows/validate-feeds.yml`](.github/workflows/validate-feeds.yml).

## De feed in een browser testen

Open de URL rechtstreeks:

<https://ruttekut.github.io/trustoo-brevo-feeds/feeds/nl/tips/dakdekker.json>

Je moet ruwe JSON zien. Zie je de GitHub 404-pagina, dan is het bestand er niet, staat het op
een ander pad, of wijkt het hoofdlettergebruik af.

Controleren via de terminal:

```bash
curl -i https://ruttekut.github.io/trustoo-brevo-feeds/feeds/nl/tips/dakdekker.json
```

Let op `HTTP/2 200` en `content-type: application/json`. Krijg je `text/html`, dan kijk je naar
een foutpagina en niet naar je feed.

## Wijzigingen committen en publiceren

```bash
npm run validate
git add -A
git commit -m "Update dakdekker feed"
git push origin main
```

GitHub Pages publiceert vanaf `branch: main`, `folder: /` (root). Een push is meestal binnen
één tot twee minuten live. Het bestand `.nojekyll` zorgt ervoor dat GitHub Pages de bestanden
ongewijzigd serveert en geen Jekyll-build uitvoert.

Publiceer nooit een feed die de validatie niet doorstaat: een ongeldige feed gaat direct de
volgende verzending in.

## Voorkomen dat een ontbrekende feed een verzending breekt

**Brevo valt niet automatisch terug op `default.json`.** Er bestaat geen fallback op
bestandsniveau. Ontbreekt `feeds/nl/tips/<slug>.json`, dan geeft GitHub Pages een 404 met een
HTML-foutpagina, kan Brevo de feed niet verwerken en wordt dat contact volgens de
Brevo-documentatie overgeslagen in de campagne. `default.json` is dus een handige basis om van
te kopiëren en een neutrale variant om naartoe te verwijzen, maar het lost een 404 niet op.

Zo dek je dat af:

1. **Segmenteer op bekende services.** Stuur de mail alleen naar contacten waarvan
   `LAST_REQUEST_SERVICE_URL` in je lijst met bestaande feedbestanden zit. Dit is de veiligste
   route.
2. **Zet `LAST_REQUEST_SERVICE_URL` om naar `default`** voor contacten met een onbekende of
   lege waarde, zodat ze `default.json` laden. Dat moet je in de databron of Brevo-sync doen,
   niet in de template.
3. **Maak feeds vooraf aan** voor elke service die daadwerkelijk in het attribuut kan
   voorkomen, en houd die lijst gelijk aan de services in de aanvraagflow.
4. **Test altijd in Preview & test** met een paar echte attribuutwaarden voordat je verzendt.
5. **Vertrouw op de validatie in CI**, zodat een kapot of incompleet bestand nooit op `main`
   landt.

## Geen persoonsgegevens of geheimen

> **Waarschuwing:** dit is een **openbare** repository met een **openbare** GitHub Pages-site.
> Alles wat hier staat, is voor iedereen leesbaar en kan door zoekmachines worden geïndexeerd.

Zet hier daarom **nooit** in:

- persoonsgegevens (namen, e-mailadressen, telefoonnummers, adressen, aanvraag- of contact-ID's);
- API-keys, tokens, wachtwoorden of andere credentials;
- interne data over aanbieders, omzet, marges of leads.

Personaliseren op persoonsniveau doe je met Brevo-contactattributen in de template
(bijvoorbeeld `{{ contact.FIRSTNAME }}`). De feeds bevatten uitsluitend service-generieke
content.

## Persoonlijk account, pilot en verhuizing naar de organisatie

Deze repository staat op het persoonlijke GitHub-account **`ruttekut`**. Voor een pilot is dat
prima: de content is niet vertrouwelijk, de opzet is klein en je kunt snel schakelen zonder
org-rechten of reviews.

**Voor productie is verhuizen naar de Trustoo GitHub-organisatie aan te raden**, omdat de feed
dan niet afhankelijk is van één persoonlijk account. Zo blijven toegang, backup en beheer
geregeld als iemand van rol wisselt of vertrekt.

> **Let op bij zo'n verhuizing:** de GitHub Pages-URL verandert waarschijnlijk mee, want die is
> gebaseerd op de accountnaam:
>
> ```text
> nu:     https://ruttekut.github.io/trustoo-brevo-feeds/...
> straks: https://<trustoo-org>.github.io/trustoo-brevo-feeds/...
> ```
>
> Daarmee verandert ook de **bron-URL van de Brevo-feed**. Werk die na een verhuizing bij in
> Brevo (Settings > Data management > Data feeds) en test opnieuw met een testcontact, anders
> lopen verzendingen op een 404. Een eigen domein of subdomein voor de feed maakt je
> onafhankelijk van de accountnaam en voorkomt dit probleem in de toekomst.

## Documentatie in deze repository

| Bestand | Inhoud |
| --- | --- |
| [`BREVO_SETUP.md`](BREVO_SETUP.md) | Stap voor stap de feed in Brevo instellen. |
| [`TEMPLATE_FIELD_MAPPING.md`](TEMPLATE_FIELD_MAPPING.md) | Alle 50 velden met de bijbehorende `{{ feed.tip_feed.* }}`-variabele. |
| [`schemas/email-feed.schema.json`](schemas/email-feed.schema.json) | JSON Schema met de 50 toegestane velden. |
| [`scripts/validate-feeds.js`](scripts/validate-feeds.js) | Validatiescript, alleen Node.js-standaardfunctionaliteit. |
