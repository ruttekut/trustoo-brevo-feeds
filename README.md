# trustoo-brevo-feeds

Openbare, statische JSON-datafeeds voor dynamische Brevo-e-mails van Trustoo.

Elke e-mail gebruikt **één template**. De inhoud komt uit JSON-bestanden in deze repository, die
Brevo op het moment van verzenden ophaalt. Zo kun je per service andere content laten zien zonder
de template te dupliceren. Er zijn twee manieren:

- **Per dienst** (*personalized data feed*): één bestand per dienst,
  `feeds/<taal>/<mailtype>/<slug>.json`. Brevo kiest het bestand via het contactattribuut
  `LAST_REQUEST_SERVICE_URL`. Dit gebruiken de contact-gebaseerde mails.
- **Gecombineerd** (*global data feed*): één bestand per mailtype met alle diensten,
  `feeds/<taal>/<mailtype>.json`. De template kiest de dienst zelf, op basis van het object
  dat een object-based automation start (bijvoorbeeld de aanvraag). Dit gebruikt de post-hire-mail.
  Zie [Gecombineerde feeds](#gecombineerde-feeds-object-based-automations).

De content wordt beheerd in **Trustoo Feed Studio** (aparte repository `trustoo-feed-studio`), dat
de JSON-bestanden genereert en in één commit naar deze repository publiceert. Deze repository is dus
vooral de *uitvoer*; zie [Wijzigingen publiceren](#wijzigingen-committen-en-publiceren).

## Doel

- Eén e-mailtemplate, per service een eigen set teksten.
- Content aanpassen zonder in Brevo te knutselen: je wijzigt een JSON-bestand en pusht.
- Uitbreidbaar naar meerdere mailtypes en meerdere landen.

## Mailtypes in deze repository

Stand 2026-10-30 (`npm run validate` toont de actuele aantallen). "Alias" is de feedalias die de
template gebruikt: `{{ feed.<alias>.<veld> }}`.

| Mailtype | Map | Alias in template | Template | Schema | Feeds | Velden | Uitleg |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Servicetips | `feeds/nl/tips/` | `tip_feed` | [`trustoo-servicetips-template.html`](trustoo-servicetips-template.html) | [`email-feed`](schemas/email-feed.schema.json) | 87 | 50 | [`TEMPLATE_FIELD_MAPPING.md`](TEMPLATE_FIELD_MAPPING.md) |
| Reactivatie | `feeds/nl/reactivation/` | `reactivation_feed` | [`trustoo-reactivation-template.html`](trustoo-reactivation-template.html) | [`reactivation-feed`](schemas/reactivation-feed.schema.json) | 91 | 47 | [`REACTIVATION.md`](REACTIVATION.md) |
| Cross-sell 1 | `feeds/nl/cross-sell/` | `cross_sell_feed` | [`trustoo-cross-sell-template.html`](trustoo-cross-sell-template.html) | [`cross-sell-feed`](schemas/cross-sell-feed.schema.json) | 91 | 50 | [`CROSS_SELL.md`](CROSS_SELL.md) |
| Cross-sell reminder | `feeds/nl/cross-sell-reminder/` | `cross_sell_reminder_feed` | [`trustoo-cross-sell-reminder-template.html`](trustoo-cross-sell-reminder-template.html) | [`cross-sell-reminder-feed`](schemas/cross-sell-reminder-feed.schema.json) | 87 | 58 | [hieronder](#mailtype-cross-sell-reminder) |
| Post-hire 1 | `feeds/nl/posthire-chosen/` + gecombineerd `feeds/nl/posthire-chosen.json` | `posthire_chosen_feed` (per dienst); in Brevo de global feed `post_hire_chosen` | [`trustoo-posthire-chosen-template.html`](trustoo-posthire-chosen-template.html) | [`posthire-chosen-feed`](schemas/posthire-chosen-feed.schema.json) | 86 | 39 | [`POSTHIRE.md`](POSTHIRE.md) |
| Tips BE (Trustlocal.be) | `feeds/be-nl/tips-be/` | `tip_feed_be` | [`trustlocal-be-servicetips-template.html`](trustlocal-be-servicetips-template.html) | [`email-feed`](schemas/email-feed.schema.json) | 51 | 50 | [Structuur](#structuur) |
| Cross-sell BE | `feeds/be-nl/cross-sell-be/` | `cross_sell_feed_be` | [`trustlocal-be-cross-sell-template.html`](trustlocal-be-cross-sell-template.html) | [`cross-sell-feed`](schemas/cross-sell-feed.schema.json) | 50 | 50 | [`CROSS_SELL.md`](CROSS_SELL.md) |
| Cross-sell reminder BE | `feeds/be-nl/cross-sell-reminder-be/` | `cross_sell_reminder_feed_be` | [`trustlocal-be-cross-sell-reminder-template.html`](trustlocal-be-cross-sell-reminder-template.html) | [`cross-sell-reminder-feed`](schemas/cross-sell-reminder-feed.schema.json) | 50 | 58 | [`CROSS_SELL.md`](CROSS_SELL.md) |

Of en hoe een mail in Brevo is ingericht (feed, automation, filters) wordt niet in deze repository
bijgehouden; kijk daarvoor in Brevo zelf.

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

## Servicetips: welke services staan er in

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

De `hero_image_url`-velden verwijzen naar de Brevo image gallery (`img.mailinblue.com`); Brevo host
alle beelden die de mails tonen. De beelden zelf staan **niet** in deze repository. Wat wel
bewaard blijft is [`images/nl/tips/manifest.json`](images/nl/tips/manifest.json): per beeld het
oorspronkelijke bronbestand, de feed-slug, de alt-tekst, de naam in de gallery
(`trustoo-nl-tips-hero-<slug>.jpg`) en de Brevo-URL. Dat is de enige plek waar staat welke Brevo-URL
bij welk beeld hoort. De 94 JPEG-bronbestanden (4:3, 1200x900) stonden hier tijdelijk omdat de
Brevo-API alleen vanaf een publieke URL uploadt; op 2026-09-08 zijn ze verwijderd, de originele
PNG's staan lokaal bij de beheerder. Veertien beelden hebben geen eigen feed (bijvoorbeeld
`hero-verhuizer.jpg`) of zijn een tweede variant (bijvoorbeeld `hero-hovenier-terras.jpg`); die
staan wel in de gallery en het manifest. Zeven feeds hebben nog een ouder herobeeld: `coaching`,
`default`, `grafisch-ontwerper`, `incassobureau`, `keukenrenovatie`, `online-marketing` en
`seo-specialist`.

## CTA-regel: kostenpagina of blog

De hoofd-CTA (`cta_label` + `cta_url`) van een tipsfeed verwijst **altijd** naar een kostenpagina
of een relevante blog op Trustoo.nl, nooit naar de service-overzichtspagina (`/nederland/<slug>/`).
De keuze per service:

1. Bestaat `https://trustoo.nl/kosten/<slug>-kosten/` (zie de kosten-sitemap
   `apisitemaps/NL_sitemap_costs_0.xml`)? Gebruik die, label `Bekijk wat een <service> kost`,
   `utm_content=kostencta`. Dit geldt voor 60 services.
2. Anders een passende kosten-subpagina of de kostenpagina van de naastgelegen service
   (bijvoorbeeld `aankoopmakelaar` -> `kosten/makelaar-kosten/kosten-aankoopmakelaar/`,
   `hekwerk` -> `kosten/hovenier-kosten/schutting-plaatsen-kosten/`).
3. Anders een relevante blog uit de sitemaps `expert_blogs`, `topic_blogs` (`/opdracht/`),
   `faq_blogs` of `knowledge_base` (`/kennisbank/`), label begint met `Lees`, `utm_content=blogcta`.
   Dit geldt voor 13 services.
4. Is er niets passends, dan het kostenoverzicht `https://trustoo.nl/kosten/` (`default`,
   `koffieautomaat`, `stoffeerder`, `tolk`).

Controleer elke URL op een 200 voordat je hem opneemt. Verzin geen links.

## Mailtype reactivatie

Sinds 2026-09-08 is er een tweede mailtype: de **reactivatiemail** voor mensen die een paar maanden
geleden een aanvraag deden en die niet hebben afgerond (golf 1: laatste aanvraag in 2025). De
feeds staan in
`feeds/nl/reactivation/` (91 bestanden, 47 velden, eigen schema
[`schemas/reactivation-feed.schema.json`](schemas/reactivation-feed.schema.json)), de template is
[`trustoo-reactivation-template.html`](trustoo-reactivation-template.html) met feedalias
`reactivation_feed`. Welke drie diensten per service als dienstkaart worden getoond, staat in
[`scripts/reactivation-mapping.json`](scripts/reactivation-mapping.json). Alles over dit
mailtype, inclusief de open punten voor verzending, staat in [`REACTIVATION.md`](REACTIVATION.md).

## Mailtype cross-sell

Sinds 2026-09-22 is er een derde mailtype: **cross-sellmail 1** voor mensen die kort geleden een
aanvraag deden (timingtest op circa 3, 7 en 14 dagen). De mail toont vier diensten die mensen
rond hetzelfde project (verbouwen, verduurzamen, verhuizen, een feest, ...) vaak ook aanvragen.
Feeds: `feeds/nl/cross-sell/` (91 bestanden, 50 velden, schema
[`schemas/cross-sell-feed.schema.json`](schemas/cross-sell-feed.schema.json)), template
[`trustoo-cross-sell-template.html`](trustoo-cross-sell-template.html), feedalias
`cross_sell_feed`. De kaartkeuze staat in
[`scripts/cross-sell-mapping.json`](scripts/cross-sell-mapping.json), de copy in de generator
[`scripts/build-cross-sell-feeds.js`](scripts/build-cross-sell-feeds.js). Alles over dit
mailtype staat in [`CROSS_SELL.md`](CROSS_SELL.md).

## Mailtype cross-sell reminder

Sinds 2026-10-06 (versie 3 van Daan en Talitha): de **reminder** na cross-sellmail 1. Feeds:
`feeds/nl/cross-sell-reminder/` (87 bestanden, 58 velden, schema
[`schemas/cross-sell-reminder-feed.schema.json`](schemas/cross-sell-reminder-feed.schema.json)), template
[`trustoo-cross-sell-reminder-template.html`](trustoo-cross-sell-reminder-template.html), feedalias
`cross_sell_reminder_feed`. De mail toont 1 tot 4 dienstkaarten met een prijsindicatie; bij minder dan
vier kaarten zijn de velden van kaart 2-4 leeg en zetten `grid_style` / `stack_style` /
`stack2_style` / `stack3_style` de blokken uit (daarom mogen die velden in het schema leeg zijn).
Er is geen `default.json` in deze map. De Belgische variant staat in [`CROSS_SELL.md`](CROSS_SELL.md).

## Mailtype post-hire

Sinds 2026-10-27: **post-hire mail 1**, verstuurd na status CHOSEN (via Trustoo gekozen) of DONE
(niet via Trustoo gekozen) van een aanvraag. Eén mail; de tekst wisselt op de status. Brevo gebruikt
hiervoor de **gecombineerde** feed (zie hieronder). Feeds: `feeds/nl/posthire-chosen/` (86 bestanden,
39 velden) en `feeds/nl/posthire-chosen.json`. Alles over deze mail staat in [`POSTHIRE.md`](POSTHIRE.md).

## Gecombineerde feeds (object-based automations)

Een *personalized* feed-URL in Brevo kan alleen een **contactattribuut** bevatten. Een contact kan
meerdere aanvragen hebben, dus voor mails die een object-based automation verstuurt (de trigger is een
object, bijvoorbeeld de aanvraag) schrijft Feed Studio bij elke publicatie naast de bestanden per dienst
ook één bestand per mailtype, in dezelfde landmap:

```text
feeds/nl/posthire-chosen/<slug>.json   per dienst
feeds/nl/posthire-chosen.json          gecombineerd
```

Vorm van het gecombineerde bestand (compacte JSON, diensten op slug gesorteerd):

```json
{ "services": [ { "slug": "aannemer", "service_name": "Aannemers", "title": "…", "subject_line": "…" } ] }
```

- Elk item is `slug` + `service_name` + precies het feedobject uit het losse bestand. Feed Studio bouwt
  beide uit dezelfde gepubliceerde content in **één commit**; de validator controleert dat elk item
  gelijk is aan `feeds/<taal>/<mailtype>/<slug>.json`.
- `slug` is de bestandsnaam (gelijk aan `LAST_REQUEST_SERVICE_URL`). `service_name` is de
  "Brevo service name" die per dienst in Feed Studio staat (ter informatie).
- Een gecombineerd bestand ontstaat bij de eerstvolgende publicatie van dat mailtype vanuit Feed Studio.
  Op 2026-10-30 bestaat alleen `feeds/nl/posthire-chosen.json`.
- In Brevo wordt dit een **global** data feed (zonder attribuut in de URL). Hoe de template de juiste
  dienst kiest staat in [`BREVO_SETUP.md`](BREVO_SETUP.md#object-based-automations-gecombineerde-feed).

## Structuur

```text
feeds/
├── nl/                           # taal/markt: Trustoo.nl
│   ├── tips/                     # servicetips (50 velden), 87 bestanden incl. default.json
│   ├── reactivation/             # reactivatie (47 velden), 91 bestanden incl. default.json
│   ├── cross-sell/               # cross-sell 1 (50 velden), 91 bestanden incl. default.json
│   ├── cross-sell-reminder/      # cross-sell reminder (58 velden), 87 bestanden, geen default
│   ├── posthire-chosen/          # post-hire 1 (39 velden), 86 bestanden, geen default
│   └── posthire-chosen.json      # gecombineerde feed van post-hire 1
└── be-nl/                        # Trustlocal.be (Nederlandstalig)
    ├── tips-be/                  # 51 bestanden
    ├── cross-sell-be/            # 50 bestanden
    └── cross-sell-reminder-be/   # 50 bestanden
```

Een nieuw mailtype krijgt een eigen map onder de taal (bijvoorbeeld `feeds/nl/<mailtype>/`), zie
[Een nieuw mailtype toevoegen](#een-nieuw-mailtype-toevoegen). Andere markten krijgen een eigen taalmap
met een eigen Brevo-feed en alias per land, zoals Trustlocal.be:

```text
feeds/be-nl/tips-be/dakdekker.json        alias tip_feed_be        template trustlocal-be-servicetips-template.html
feeds/be-nl/cross-sell-be/dakdekker.json  alias cross_sell_feed_be template trustlocal-be-cross-sell-template.html
```

Trustlocal.be (live sinds 2026-10-13, 51 services elk): content uit `Trustlocal_BE_mail_content__7_ (1).xlsx`.
Brevo-feed-URL tips: `https://ruttekut.github.io/trustoo-brevo-feeds/feeds/be-nl/tips-be/{{ contact.LAST_REQUEST_SERVICE_URL }}.json`
(feednaam `Tip feed BE`, zodat Brevo de alias `tip_feed_be` maakt). In de tipstemplate linkt het herobeeld naar `cta_url`
en is het optioneel (reisbureau heeft nog geen beeld); tegels 3-6 zijn optioneel. De CTA's van beveiliging en glashandel
wijzen naar de servicepagina, omdat de blogs uit de sheet (`/opdracht/alarmsystemen/ring-deurbel/`,
`/opdracht/glaszetter/glas-vervangen/`) op trustlocal.be niet bestaan. Cross-sell: zie `CROSS_SELL.md`.

## Een nieuwe service toevoegen

Via Feed Studio (aanbevolen): Services → Add service (slug = de waarde van
`LAST_REQUEST_SERVICE_URL`, voor object-based mails ook de "Brevo service name"), vul per mailtype de
content in de matrix, markeer als ready en publiceer. Feed Studio schrijft het bestand per dienst en
werkt de gecombineerde feed van dat mailtype bij.

Met de hand (daarna importeren in Feed Studio, zie [Wijzigingen publiceren](#wijzigingen-committen-en-publiceren)):

1. Kies de canonical slug. Die moet **exact** gelijk zijn aan de waarde van
   `LAST_REQUEST_SERVICE_URL` voor die service.
2. Kopieer een bestaande feed van hetzelfde mailtype (bijvoorbeeld `feeds/nl/tips/default.json`) naar
   `feeds/<taal>/<mailtype>/<slug>.json`.
3. Vul de teksten. Laat URL- en afbeeldingsvelden leeg als je geen echte, gecontroleerde
   Trustoo-URL hebt. Verzin geen links.
4. Valideer lokaal: `npm run validate`.
5. Commit en push. GitHub Pages publiceert het bestand automatisch.
6. Test de URL in de browser.

Voor een personalized feed hoef je in Brevo hierna **niets** te wijzigen: de feed-URL is dynamisch, dus
een nieuw bestand werkt direct voor contacten met die attribuutwaarde. Een gecombineerde feed krijgt
de nieuwe dienst pas na een publicatie vanuit Feed Studio.

## Een nieuw mailtype toevoegen

1. Zet in deze repository de template (`<merk>-<mailtype>-template.html`) en een schema
   (`schemas/<mailtype>-feed.schema.json`, alle velden in `required`) neer.
2. Voeg het mailtype toe aan `SCHEMAS` in [`scripts/validate-feeds.js`](scripts/validate-feeds.js)
   (map → schema). Zonder die regel faalt de validatie op de nieuwe map.
3. Maak het mailtype aan in Feed Studio (Email types → Create email type, of een seedbestand
   `seed/<slug>-fields.json`; zie de README van Feed Studio). De slug van het mailtype is de mapnaam:
   `feeds/<taal>/<slug>/`.
4. Vul de content en publiceer vanuit Feed Studio (of zet bestaande feeds hier neer en importeer ze met
   `npm run seed:github -- --type=<slug>`).
5. Maak in Brevo een **nieuwe** data feed aan met een eigen alias en gebruik die alias in de template:
   `{{ feed.<alias>.<veld> }}`. Voor een object-based automation: een global feed op de gecombineerde
   feed. Zie [`BREVO_SETUP.md`](BREVO_SETUP.md).

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

- `feeds/<taal>/<mailtype>/` — taalcode in kleine letters, met land als dat nodig is (nu `nl` en
  `be-nl`), mailtype als slug (`tips`, `cross-sell`, `tips-be`, …). De taalcode is gelijk aan de
  locale in Feed Studio.

**JSON-velden**

- Exact de velden uit het schema van het mailtype (zie [Mailtypes](#mailtypes-in-deze-repository);
  welk schema bij welke map hoort staat in `SCHEMAS` in [`scripts/validate-feeds.js`](scripts/validate-feeds.js)).
  Niet meer, niet minder, en de namen niet wijzigen.
- Alle waarden zijn strings. Een veld dat je niet gebruikt, krijgt een lege string `""` —
  je mag het niet weglaten.
- Geen metadata zoals `service`, `mail_type` of `updated_at`. Geen arrays, geen geneste
  objecten.
- URL-velden (elke veldnaam die op `_url` eindigt) bevatten een absolute `https://`-URL of een
  lege string.
- Of een veld leeg mag zijn, staat in het schema: velden met `minLength: 1` moeten gevuld zijn. De
  validator in deze repository controleert dat niet; Feed Studio wel (verplichte velden).

**Brevo-feedalias**

- Kleine letters met underscores, afgeleid van de feednaam: `tip_feed`.

## Lokaal valideren

Vereist Node.js 18 of hoger. Er zijn geen dependencies, dus `npm install` is niet nodig.

```bash
npm run validate
```

Het script [`scripts/validate-feeds.js`](scripts/validate-feeds.js) loopt recursief door
`feeds/` en controleert per bestand tegen het schema van zijn mailtype (map
`feeds/<taal>/<mailtype>/`): geldige JSON, alle velden aanwezig, geen onbekende velden, alle
waarden strings, niet-lege URL-velden beginnen met `https://`, en een veilige canonical
bestandsnaam. Een gecombineerde feed (`feeds/<taal>/<mailtype>.json`) moet precies
`{ "services": [...] }` zijn; elk item heeft een unieke `slug`, een `service_name`, voldoet aan
hetzelfde schema en is gelijk aan het losse bestand van die slug, als dat bestand bestaat (vergelijking
via `JSON.stringify`, dus ook de veldvolgorde telt). Een losse feed die erbij komt of verdwijnt
zonder dat de gecombineerde feed meeveranderde, ziet de validator **niet**. Bij een fout krijg je bestand en
veld te zien en stopt het script met exitcode `1`. Een nieuw mailtype moet aan `SCHEMAS` in het
script worden toegevoegd, anders faalt de validatie.

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

**Normaal publiceer je vanuit Feed Studio** (Publishing → Publish changes): dat valideert, schrijft
de bestanden per dienst én de gecombineerde feeds in één commit en controleert daarna of GitHub Pages
ze serveert. Feed Studio's database is de bron van de content.

Wijzig je bestanden hier rechtstreeks (met de hand of met een generator uit `scripts/`), importeer ze
daarna in Feed Studio, anders loopt de database achter op wat live staat:

```bash
# in trustoo-feed-studio, NA de push en pas als GitHub Pages de nieuwe versie serveert
npm run seed:github -- --type=<mailtype-slug>
```

Een rechtstreekse wijziging werkt een bestaande gecombineerde feed **niet** bij. Bij een gewijzigde
feed faalt de validator; een toegevoegde of verwijderde feed ziet hij niet. Bouw de gecombineerde feed
daarom na elke rechtstreekse wijziging opnieuw, vóór de push:
`node scripts/rebuild-combined.js <taal> <mailtype>` (zelfde formaat als Feed Studio).

Rechtstreeks committen:

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
| [`BREVO_SETUP.md`](BREVO_SETUP.md) | De feeds in Brevo instellen: personalized feed per dienst, global feed voor object-based automations, fouten opsporen. |
| [`TEMPLATE_FIELD_MAPPING.md`](TEMPLATE_FIELD_MAPPING.md) | Servicetips: alle 50 velden met de bijbehorende `{{ feed.tip_feed.* }}`-variabele. |
| [`REACTIVATION.md`](REACTIVATION.md) | Reactivatiemail: velden, mapping van de dienstkaarten, keuzes en open punten. |
| [`CROSS_SELL.md`](CROSS_SELL.md) | Cross-sellmail 1 (NL en BE) en de cross-sell reminder BE. De NL-reminder staat hierboven. |
| [`POSTHIRE.md`](POSTHIRE.md) | Post-hire mail 1 (CHOSEN en DONE in één mail) en de gecombineerde feed. |
| [`schemas/`](schemas/) | JSON Schema per mailtype (welk schema bij welke map hoort: `SCHEMAS` in `scripts/validate-feeds.js`). |
| [`images/nl/tips/manifest.json`](images/nl/tips/manifest.json) | Per herobeeld: bronbestand, feed-slug, alt-tekst, naam en URL in de Brevo-gallery. |

## Scripts

Alle scripts draaien vanuit de root van deze repository. Daarna altijd `npm run validate`.

| Script | Wat het doet |
| --- | --- |
| [`scripts/validate-feeds.js`](scripts/validate-feeds.js) | Valideert alle feeds en gecombineerde feeds (`npm run validate`, ook in CI). Alleen Node.js-standaardfunctionaliteit. |
| [`scripts/build-cross-sell-feeds.js`](scripts/build-cross-sell-feeds.js) | Bouwt `feeds/nl/cross-sell/` uit [`scripts/cross-sell-mapping.json`](scripts/cross-sell-mapping.json) en de copy in het script. |
| [`scripts/build-cross-sell-reminder-be.py`](scripts/build-cross-sell-reminder-be.py) | Bouwt `feeds/be-nl/cross-sell-reminder-be/` (Python; zie CROSS_SELL.md). |
| [`scripts/import-reactivation-tsv.js`](scripts/import-reactivation-tsv.js) | Importeert een aangeleverde TSV naar `feeds/nl/reactivation/`. De kaartkeuze staat in [`scripts/reactivation-mapping.json`](scripts/reactivation-mapping.json). |
| [`scripts/import-posthire.js`](scripts/import-posthire.js) | Importeert het post-hire-pakket (zip van Talitha en Daan) naar `feeds/nl/posthire-chosen/`, de template en het schema, en zet de statusvoorwaarden in de template. Bouwt de gecombineerde feed **niet** (zie POSTHIRE.md). |
| [`scripts/rebuild-combined.js`](scripts/rebuild-combined.js) | Bouwt een gecombineerde feed (`feeds/<taal>/<mailtype>.json`) opnieuw uit de losse feeds, in het formaat van Feed Studio; `service_name` komt uit het bestaande bestand. Na elke rechtstreekse wijziging van een mailtype met een gecombineerde feed. |
| [`scripts/upload-images-to-brevo.py`](scripts/upload-images-to-brevo.py) | Uploadt herobeelden naar de Brevo-gallery en schrijft de URL's in het manifest en de feeds. Leest `BREVO_API_KEY` uit de omgeving of uit `.env` (staat in `.gitignore`; voorbeeld in `.env.example`). Feed Studio heeft hiervoor ook een beeldenbibliotheek. |

Na een generator: commit, push, en importeer in Feed Studio (zie [Wijzigingen publiceren](#wijzigingen-committen-en-publiceren)).
