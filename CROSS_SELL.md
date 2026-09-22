# Cross-sellmail 1: vaak samen aangevraagd

Derde mailtype in deze repository, naast de servicetips-mail en de reactivatiemail. Doelgroep:
consumenten die **kort geleden** een aanvraag deden (NL). De mail laat vier diensten zien die
mensen rond hetzelfde project (verbouwen, verduurzamen, verhuizen, een feest, een woning kopen,
...) vaak ook aanvragen. De verzendtiming wordt getest op circa 3, 7 en 14 dagen na de aanvraag.

Status (2026-09-22): feeds, schema, template en generator staan lokaal klaar en zijn
gevalideerd, maar zijn **niet gepubliceerd**: niet naar GitHub gepusht (dus niet op GitHub Pages)
en in Feed Studio alleen als concept ingelezen. Er is nog geen Brevo-feed en geen Brevo-template.

## Bestanden

| Bestand | Inhoud |
| --- | --- |
| [`trustoo-cross-sell-template.html`](trustoo-cross-sell-template.html) | De template (hero, kop, 2x2 dienstkaarten, navy afsluitblok met twee chips, footer) met feedsyntaxis `{{feed.cross_sell_feed.<veld>}}`. Bron van waarheid voor de veldnamen. |
| `feeds/nl/cross-sell/<slug>.json` | 91 feeds (50 velden): 86 services uit de cross-sellanalyse, `rijschool` en `default` (met de hand), en de aliassen `cv-verwarmings-installateur`, `stoffeerder` en `vertaalbureau`. |
| [`schemas/cross-sell-feed.schema.json`](schemas/cross-sell-feed.schema.json) | JSON Schema met de 50 velden. `npm run validate` controleert alle feeds hiertegen. |
| [`scripts/cross-sell-mapping.json`](scripts/cross-sell-mapping.json) | Per bron-slug de vier kaarten (alleen slugs), plus welke kaarten met de hand zijn aangevuld. |
| [`scripts/build-cross-sell-feeds.js`](scripts/build-cross-sell-feeds.js) | Generator: bevat alle copy (thema's, hero-teksten per bron, kaartteksten per doel) en bouwt de feeds. Beelden komen uit de tips- en reactivatiefeeds. |

Feeds opnieuw bouwen na een tekstwijziging:

```bash
node scripts/build-cross-sell-feeds.js && npm run validate
```

## Brevo instellen

Zelfde stappen als in [`BREVO_SETUP.md`](BREVO_SETUP.md), met deze waarden:

| | |
| --- | --- |
| Feednaam | `Cross sell feed` |
| Verwachte alias | `cross_sell_feed` (controleer de werkelijk gegenereerde alias en pas anders de template aan) |
| Bron-URL | `https://ruttekut.github.io/trustoo-brevo-feeds/feeds/nl/cross-sell/` + `LAST_REQUEST_SERVICE_URL` via de `{}`-kiezer + `.json` |
| Subject | `{{ feed.cross_sell_feed.subject_line }}` |
| Preview text | `{{ feed.cross_sell_feed.preheader }}` |

De template gebruikt daarnaast twee contactvariabelen die **niet** in de feed staan:
`{{ contact.DASHBOARD_LINK_TOKEN }}` (header "Mijn aanvragen", dashboard-chip, e-mailvoorkeuren)
en `{{ unsubscribe }}`. Voor de timingtest (3 / 7 / 14 dagen) is geen feedwijziging nodig: de
copy is statusneutraal ("Schilder gevonden? Dit regelen mensen erbij") en noemt geen termijn.
Maak per timingvariant een eigen Brevo-campagne of automation en houd `campaign_key` gelijk, of
onderscheid de varianten via de Brevo-campagnenaam.

## De 50 velden

| Veld | Waar in de mail |
| --- | --- |
| `title` | HTML `<title>` |
| `subject_line` | Onderwerpregel (max 80 tekens) |
| `preheader` | Preview-tekst (max 160 tekens) en verborgen bovenaan de mail |
| `campaign_key` | `utm_campaign` voor de hard-coded dashboard-links, `crosssell_<slug>_mail1` (koppeltekens in de slug worden underscores) |
| `hero_image_url`, `hero_image_alt` | Herobeeld: hetzelfde beeld als de tipsfeed van de bron-dienst |
| `hero_eyebrow` | Kleine kop in kapitalen: "Na je aanvraag voor een schilder" |
| `hero_title_pre`, `hero_title_accent`, `hero_title_post` | Herokop, `accent` in oranje. Per bron geschreven, verwijst naar het project |
| `hero_subtitle` | "Je zocht onlangs via Trustoo een schilder." + een brug naar het project |
| `list_heading_pre`, `list_heading_accent`, `list_heading_post` | Kop boven de kaarten, per thema ("Je woning *opfrissen* tot in de details") |
| `list_intro` | Intro per thema, eindigt met "Vergelijk beoordelingen en ontvang gratis een prijsindicatie." (zelfde woordkeuze als de site) |
| `card1_url` .. `card4_url` | `https://trustoo.nl/nederland/<slug>/` met UTM's (`utm_content=<slug>card`, zonder koppeltekens); de dienstpagina waar de offerteaanvraag start |
| `card1_image_url` .. `card4_image_url`, `*_image_alt` | Herobeeld van de doel-dienst uit de tipsfeed, getoond op 263x150 |
| `card1_label` .. `card4_label` | Eyebrow in kapitalen: de categorie van de dienst (Afwerking, Installatie, Energie, Wonen, Financieel, ...) |
| `card1_name` .. `card4_name` | Dienst in meervoud ("Stukadoors") |
| `card1_text` .. `card4_text` | 1-2 zinnen per dienst, gelijk voor elke bron; 85-110 tekens zodat de vier kaarten gelijk uitlijnen (de generator waarschuwt buiten die bandbreedte) |
| `card1_link_label` .. `card4_link_label` | "Ontvang prijsindicatie" (de woordkeuze van trustoo.nl, zachte sturing richting prijsopgave); bij gevoelige diensten "Bekijk mogelijkheden". De pijl staat in de template |
| `closing_heading_pre`, `closing_heading_accent`, `closing_heading_post` | "Iets anders *nodig?*" |
| `closing_intro` | Tekst in het navy blok |
| `all_services_url`, `all_services_label` | Linker chip naar `https://trustoo.nl/alle-diensten/` (200, `utm_content=allediensten`) |
| `dashboard_label` | Rechter chip "Mijn aanvragen"; de link zit hard-coded in de template (token, `utm_content=dashboardchip`) |

Alle URL-velden bevatten een absolute `https://`-URL met `utm_source=brevo`,
`utm_campaign=<campaign_key>`, `utm_medium=email` en een `utm_content` per plek. De hard-coded
dashboard-links in de template gebruiken `headerlink` en `dashboardchip`.

## Hoe de vier kaarten zijn gekozen

De mapping komt uit de interne cross-sellanalyse van 2026-09-22 (NL, verzoeken van de afgelopen
twaalf maanden). Per bron:

- **Kaart 1 en 2**: de twee kandidaten met de hoogste cross-sellscore (relevantie gewogen met
  waarde), alleen onder kandidaten die de relevantie-ondergrens halen.
- **Kaart 3 en 4**: de overige kandidaten, puur op relevantie.

De cijfers (percentages, marges) staan **niet** in deze repository; alleen de slugs in
`scripts/cross-sell-mapping.json`. Ontbrak in de analyse positie 2 terwijl positie 3 en 4 wel
gevuld waren (`mediator`, `schoonmaakbedrijf`, `opslag`), dan staan de kandidaten uit de analyse
op kaart 1-3 en de aanvulling op kaart 4.

### Met de hand aangevulde kaarten

Voor 25 services had de analyse minder dan vier gematchte kandidaten. De ontbrekende kaarten zijn
gekozen op het project waar de aanvraag bij past:

| Bron | Uit de analyse | Aangevuld met |
| --- | --- | --- |
| `accountant` | boekhouder, belastingadviseur, financieel-adviseur | verzekering |
| `alarmsystemen` | beveiliging, elektricien, schoonmaakbedrijf | kozijnen |
| `belastingadviseur` | boekhouder, accountant, financieel-adviseur | hypotheekadviseur |
| `beveiliging` | alarmsystemen, schoonmaakbedrijf | elektricien, kozijnen |
| `catering` | dj, fotograaf, weddingplanner | videograaf |
| `coaching` | psycholoog, personal-trainer, dietist | loopbaancoach |
| `dietist` | personal-trainer, coaching, psycholoog | loopbaancoach |
| `gevelrenovatie` | schilder, isolatie, metselaar | gevelreiniging |
| `incassobureau` | advocaat, accountant | boekhouder, mediator |
| `koffieautomaat` | schoonmaakbedrijf | catering, alarmsystemen, klusjesman |
| `loopbaancoach` | psycholoog | coaching, boekhouder, financieel-adviseur (praktische kant van een switch of eigen bedrijf) |
| `makelaar` | taxateur, notaris | hypotheekadviseur, verhuisbedrijf |
| `mediator` | advocaat, psycholoog, financieel-adviseur | notaris |
| `mediator-scheiding` | advocaat, financieel-adviseur, psycholoog | hypotheekadviseur |
| `opslag` | verhuisbedrijf, schoonmaakbedrijf, klusjesman | schilder |
| `personal-trainer` | dietist, coaching | psycholoog, loopbaancoach |
| `schoonmaakbedrijf` | verhuisbedrijf, ongediertebestrijder, klusjesman | schilder |
| `seo-specialist` | online-marketing, webdesign, tekstschrijver | grafisch-ontwerper |
| `stratenmaker` | hovenier, rioolservice, metselaar | hekwerk |
| `tolk` | vertaler, advocaat | notaris, mediator |
| `uitvaartverzorger` | catering, notaris | financieel-adviseur, schoonmaakbedrijf |
| `verkoopmakelaar` | taxateur, bouwkundige-keuring, notaris | verhuisbedrijf |
| `vertaler` | tekstschrijver, tolk | notaris, advocaat |
| `verzekering` | hypotheekadviseur, financieel-adviseur, accountant | notaris |
| `vochtbestrijding` | loodgieter, isolatie, bouwkundige-keuring | rioolservice |

Zwakste aanvullingen, het eerst te heroverwegen: `loopbaancoach` als vierde kaart bij `dietist`
en `personal-trainer` (het platform heeft geen dichter bij voeding of sport liggende dienst), en
`schilder` als vierde kaart bij `opslag`.

Niet in de analyse en volledig met de hand gekozen: `default` (klusjesman, schoonmaakbedrijf,
schilder, elektricien) en `rijschool`. Voor rijlessen bestaat geen logische cross-sell op het
platform; die feed toont daarom eerlijk "Vaak aangevraagd via Trustoo" met verzekering (de enige
inhoudelijke link), verhuisbedrijf, schoonmaakbedrijf en klusjesman.

Opvallende combinaties die **wel** uit de analyse komen en daarom zijn aangehouden:
`boomverzorging` -> schoorsteenveger (kaart 4), `boekhouder` -> online-marketing (kaart 4),
`ongediertebestrijder` -> bouwkundige-keuring (kaart 3). Wil je die alsnog vervangen, pas dan
`scripts/cross-sell-mapping.json` aan en bouw opnieuw.

### Slugs

- De analyse noemt `cv-installateur` en `stoffeerders`; de Trustoo-pagina's heten
  `cv-verwarmings-installateur` en `stoffeerder`. Zoals bij de reactivatiemail bestaan **beide**
  bestanden (zelfde inhoud, eigen `campaign_key`), omdat onbekend is welke spelling
  `LAST_REQUEST_SERVICE_URL` bevat. Kaartlinks wijzen altijd naar de bestaande pagina.
- `vertaalbureau` is een alias van `vertaler`.
- Alle 79 doel-slugs zijn als `https://trustoo.nl/nederland/<slug>/` gecontroleerd via de
  bestaande tips-/reactivatiefeeds; nieuw gecontroleerd op 200: `opslag`, `hekwerk`,
  `verhuisbedrijf`, `mediator-scheiding`, `cv-verwarmings-installateur`, `alle-diensten`.

## Tone of voice

Dezelfde toon als de reactivatiemail van de beheerder: je-vorm, korte zinnen, statusneutraal
("Schilder gevonden? Dit regelen mensen erbij" werkt voor wie al iemand heeft én voor wie nog
zoekt), geen urgentie, geen kortingstaal. De kaartlink stuurt zacht richting een prijsopgave
("Ontvang prijsindicatie", zoals op de site) en linkt naar de dienstpagina waar de aanvraag start.

**Gevoelige categorieën** (psycholoog, relatietherapeut, coaching, loopbaancoach, mediator,
scheidingsmediator, advocaat, personal trainer, diëtist, tolk, uitvaartverzorger): geen
"gevonden?"-toon, geen "boeken" of "combineren", wel "hulp die kan aansluiten", "alleen als je
daar behoefte aan hebt", "in je eigen tempo". Kaartlink "Bekijk mogelijkheden", thema-intro
eindigt met "neem vrijblijvend contact op" in plaats van "ontvang gratis een prijsindicatie".

**Niet te smal framen**: notaris (woning, testament, samenwonen, erfenis, bedrijf) heeft een
eigen neutraal thema "Wat er vaak bij komt"; hypotheekadviseur, taxateur en bouwkundige keuring
noemen ook oversluiten, verbouwen en onderhoud; advocaat noemt contract, conflict en familiezaken;
vertaler en tolk noemen werk en studie naast officiële zaken. Elke bron hangt aan één van twintig thema's
(verbouwen, opfrissen, verduurzamen, buitenkant, keuken/badkamer, verhuizen, wonen, tuin, feest,
bruiloft, financiën, online, welzijn, juridisch, onderhoud, veilig, afscheid, kantoor, comfort,
op weg) dat de kop en intro boven de kaarten bepaalt; de hero-copy is per bron geschreven.

## Open punten voor verzending

1. Feeds pushen naar `main` zodra de content is goedgekeurd (nu bewust niet gepubliceerd).
2. In Brevo de datafeed en de template aanmaken (zie hierboven) en de gegenereerde alias
   controleren.
3. Bevestigen welke spelling `LAST_REQUEST_SERVICE_URL` gebruikt voor cv-installateur,
   stoffeerder en vertaler en de overbodige aliasbestanden verwijderen.
4. Timingtest inrichten (3 / 7 / 14 dagen) als drie varianten van dezelfde campagne.
