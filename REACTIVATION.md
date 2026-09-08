# Reactivatiemail: aanvraag staat nog open

Tweede mailtype in deze repository, naast de servicetips-mail. Doelgroep (golf 1): consumenten
wier laatste aanvraag in 2025 was en die nog geen reactivatiemail kregen. Latere golven (2024,
2023, ouder) krijgen later eigen content; de feednaam blijft voorlopig `reactivation`.

**Insteek sinds 2026-09-08: de volgende stap, niet de vorige klus.** Een mail met de vraag
"al een schilder gevonden?" wordt niet geopend door wie het al geregeld heeft. De mail hangt
daarom aan de keten: wat mensen na deze dienst vaak regelen (de drie dienstkaarten). De
onderwerpregel is bijvoorbeeld "Na de schilder: dit regelen mensen daarna" en de preheader
spreekt beide groepen expliciet aan ("Al geregeld? Dan is dit je volgende stap. Nog aan het
kiezen? Dan helpen we je verder.").

**Twee paden op basis van `contact.LAST_REQUEST_STATUS`.** De template kiest met een
Brevo-conditie tussen:

| Pad | Wanneer | Statuschip | Groene CTA en hero-pil |
| --- | --- | --- | --- |
| Open | alle andere statussen (DECIDING, SENT, VALIDATED, ...) | `request_status` ("Nog geen keuze gemaakt") | `cta_label`: extra bedrijven toevoegen (dashboard-modal); hero-pil `hero_cta_label` |
| Afgerond | CHOSEN of DONE (id 13 of 14) | `request_status_done` ("Afgerond") | `cta_label_done`: beoordeling achterlaten (dashboard, `open=beoordeling`); hero-pil linkt naar dienstkaart 1 |

De conditie test op zowel het label (`"CHOSEN"`, `"DONE"`) als het id (`"13"`, `"14"`), omdat
nog niet is gecontroleerd wat Brevo voor een categorie-attribuut teruggeeft.

Status: feeds en template staan op `main` en zijn via GitHub Pages bereikbaar; er is nog geen Brevo-feed
en geen Brevo-template aangemaakt.

## Bestanden

| Bestand | Inhoud |
| --- | --- |
| [`trustoo-reactivation-template.html`](trustoo-reactivation-template.html) | De template, met feedsyntaxis `{{feed.reactivation_feed.<veld>}}`. Bron van waarheid voor de veldnamen. |
| `feeds/nl/reactivation/<slug>.json` | 90 feeds (50 velden): 86 services uit de mapping, `rijschool`, `default`, en de twee aliassen `cv-installateur` en `stoffeerders`. |
| [`schemas/reactivation-feed.schema.json`](schemas/reactivation-feed.schema.json) | JSON Schema met de 50 velden. `npm run validate` controleert alle feeds hiertegen. |
| [`scripts/reactivation-mapping.json`](scripts/reactivation-mapping.json) | Per bron-slug de drie dienstkaarten (alleen slugs). |
| [`scripts/build-reactivation-feeds.js`](scripts/build-reactivation-feeds.js) | Generator: mapping + tipsfeeds + teksten -> feeds. Eenmalig gebruikt; overschrijft alle reactivatiefeeds bij opnieuw draaien. |

## Brevo instellen

Zelfde stappen als in [`BREVO_SETUP.md`](BREVO_SETUP.md), met deze waarden:

| | |
| --- | --- |
| Feednaam | `Reactivation feed` |
| Verwachte alias | `reactivation_feed` (controleer de werkelijk gegenereerde alias) |
| Bron-URL | `https://ruttekut.github.io/trustoo-brevo-feeds/feeds/nl/reactivation/` + `LAST_REQUEST_SERVICE_URL` via de `{}`-kiezer + `.json` |
| Subject | `{{ feed.reactivation_feed.subject_line }}` |
| Preview text | `{{ feed.reactivation_feed.preheader }}` |

De template gebruikt daarnaast twee contactvariabelen die **niet** in de feed staan:
`{{ contact.DASHBOARD_LINK_TOKEN }}` (dashboard, modal, aanvraag afronden, voorkeuren) en
`{{ unsubscribe }}`.

## De 50 velden

| Veld | Waar in de mail |
| --- | --- |
| `title` | HTML `<title>` |
| `subject_line` | Onderwerpregel (campagne-instelling) |
| `preheader` | Preview-tekst (campagne-instelling) en verborgen bovenaan de mail |
| `hero_link_url` | Link op het herobeeld: de kostenpagina of blog van de dienst, zelfde regel als de tips-CTA |
| `hero_image_url`, `hero_image_alt` | Herobeeld 4:3, hetzelfde beeld als de tipsfeed van deze dienst |
| `hero_title_pre`, `hero_title_accent`, `hero_title_post` | Herokop; `accent` staat in oranje |
| `hero_subtitle` | Zin onder de herokop |
| `hero_cta_label` | Witte ghost-pil in de hero, open pad: opent de modal "vakmensen toevoegen". Afgerond pad: de template toont `service1_link_label` met `service1_url` |
| `campaign_key` | `utm_campaign` voor de hard-coded dashboard-links, bijvoorbeeld `reactivatie_schilder_mail1` |
| `request_label` | Eyebrow op de aanvraagkaart |
| `request_service` | Dienst op de aanvraagkaart |
| `request_meta` | Regel onder de dienst; service-generiek, zie hieronder |
| `request_status`, `request_status_done` | Tekst in de oranje statuschip, open respectievelijk afgerond pad |
| `cta_label`, `cta_note` | Groene primaire CTA en de regel eronder, open pad: modal "vakmensen toevoegen" |
| `cta_label_done`, `cta_note_done` | Groene primaire CTA en de regel eronder, afgerond pad: beoordeling achterlaten |
| `services_heading_pre`, `services_heading_accent`, `services_heading_post` | Kop boven de dienstkaarten |
| `services_intro` | Intro onder die kop |
| `service1_name` .. `service3_name` | Kaartkop |
| `service1_text` .. `service3_text` | Kaarttekst |
| `service1_url` .. `service3_url` | `https://trustoo.nl/nederland/<slug>/` met UTM's |
| `service1_link_label` .. `service3_link_label` | Linktekst, bijvoorbeeld `Bekijk stukadoors` |
| `service1_image_url` .. `service3_image_url` | Het herobeeld uit de tipsfeed van die dienst, getoond op 96x96 |
| `service1_image_alt` .. `service3_image_alt` | Alt-tekst van dat beeld |
| `closing_heading_pre`, `closing_heading_accent`, `closing_heading_post` | Kop van het navy blok |
| `closing_intro` | Tekst in het navy blok |
| `done_link_label` | Linker chip: "Mijn aanvragen" (dashboard, token) |
| `new_request_url`, `new_request_label` | Rechter chip: nieuwe aanvraag doen, trustoo.nl met UTM's |

Alle URL-velden (naam eindigt op `_url`) bevatten een absolute `https://`-URL. UTM's staan in de
waarde: `utm_source=brevo`, `utm_campaign=<campaign_key>`, `utm_medium=email` en een
`utm_content` per plek (`heroimage`, `<slug>card`, `nieuweaanvraagcta`). De hard-coded
dashboard-links in de template gebruiken `herocta`, `primaircta`, `reviewcta` en `mijnaanvragencta`.

## Hoe de drie dienstkaarten zijn gekozen

De mapping komt uit een interne relevantieanalyse (september 2026) van welke diensten mensen
na een aanvraag voor dienst X ook aanvragen. Per bron zijn de posities 1, 2 en 3 uit die analyse
overgenomen, in die volgorde. Ontbrak positie 3, dan is positie 4 gebruikt. De cijfers zelf staan
niet in deze repository; alleen de slugs in `scripts/reactivation-mapping.json`.

Acht services hadden minder dan drie kandidaten. De ontbrekende kaart is met de hand gekozen en
kan worden overschreven:

| Bron | Uit de analyse | Aangevuld met |
| --- | --- | --- |
| `uitvaartverzorger` | catering, notaris | schoonmaakbedrijf |
| `beveiliging` | alarmsystemen, schoonmaakbedrijf | elektricien |
| `incassobureau` | advocaat, accountant | boekhouder |
| `vertaler` | tolk, tekstschrijver | notaris |
| `koffieautomaat` | schoonmaakbedrijf | catering, alarmsystemen |
| `loopbaancoach` | coaching, psycholoog | personal-trainer |
| `tolk` | vertaler, advocaat | notaris |
| `personal-trainer` | dietist, coaching | psycholoog |

`default.json` toont klusjesman, schoonmaakbedrijf en schilder en heeft neutrale teksten. Voor
`default`, `rijschool` en `koffieautomaat` (geen echte keten uit de analyse) heet het kaartenblok
"Populair op Trustoo" in plaats van "Wat mensen na X vaak regelen".

### Slugs die afwijken van de tipsfeeds

- De analyse noemt `cv-installateur` en `stoffeerders`; die URL's bestaan niet op trustoo.nl
  (404), de tipsfeeds heten `cv-verwarmings-installateur` en `stoffeerder` (200). Omdat
  onduidelijk is welke spelling `LAST_REQUEST_SERVICE_URL` bevat, bestaan **beide** bestanden
  met dezelfde inhoud. Verwijder de verkeerde zodra de attribuutwaarde bekend is.
- `verhuisbedrijf` heeft wel een Trustoo-pagina en kostenpagina maar geen tipsfeed. Het beeld
  komt uit het manifest (`hero-verhuizer.jpg`).
- `rijschool` heeft een tipsfeed maar staat niet in de analyse. De drie kaarten (verzekering,
  laadpalen, coaching) zijn met de hand gekozen: autoverzekering, eerste elektrische auto en
  coaching bij examenstress.

## Keuzes in de inhoud

- **Teksten zijn service-generiek.** De feed is openbaar, dus plaats en datum van de aanvraag
  kunnen er niet in. `request_meta` is daarom "Aangevraagd via Trustoo".
  Wil je plaats en datum tonen, vervang dan in de Brevo-template `request_meta` door
  contactattributen.
- **Herobeeld en kaartbeelden** zijn de bestaande tips-herobeelden uit de Brevo image gallery.
  De kaart toont een 4:3-beeld op 96x96 met `object-fit:cover`. Clients zonder `object-fit`
  (Outlook, Gmail) drukken het beeld dan tot een vierkant. Vierkante uitsnedes uploaden is een
  mogelijke vervolgstap; `scripts/upload-images-to-brevo.py` kan daarvoor worden hergebruikt.
- **Herolink** volgt de CTA-regel van de tipsmail: kostenpagina of relevante blog, nooit de
  service-overzichtspagina. De dienstkaarten linken naar `/nederland/<slug>/`, omdat daar de
  aanvraagflow start; de chip "Nieuwe aanvraag doen" ("iets anders nodig?") naar trustoo.nl.
- **Woordkeuze per dienst** (lidwoord, enkelvoud, meervoud, naam op de aanvraagkaart) staat in
  `SOURCES` in het generatorscript. De kaartteksten staan in `RELATED` en zijn zo geschreven dat
  dezelfde kaart na elke bron klopt.

## Nog af te stemmen voor verzending

1. De queryparameters die de modal "vakmensen toevoegen" (`open=vakmensen-toevoegen`) en de
   beoordelingsflow (`open=beoordeling`) openen, zijn aannames en staan hard-coded in de
   template. Afstemmen met development.
2. Controleer in Brevo Preview & test met een contact met status CHOSEN of DONE dat het
   afgeronde pad verschijnt (de conditie op `contact.LAST_REQUEST_STATUS`).
3. De werkelijke waarden van `LAST_REQUEST_SERVICE_URL` voor cv-installateur/stoffeerder
   (zie boven).
4. De 96x96-weergave van de kaartbeelden in Outlook en Gmail testen.
5. Feed Studio kent dit mailtype (50 velden); na wijzigingen aan de template daar opnieuw
   seeden met `npm run seed:github -- --type=reactivation --force-template`.

## Feeds opnieuw genereren

```bash
node scripts/build-reactivation-feeds.js
npm run validate
```

Let op: het script overschrijft alle bestanden in `feeds/nl/reactivation/`. Handmatige
aanpassingen aan een feed gaan daarmee verloren; pas dan liever het script aan.
