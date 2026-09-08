# Reactivatiemail: aanvraag staat nog open

Tweede mailtype in deze repository, naast de servicetips-mail. Doelgroep: consumenten die
ongeveer drie maanden geleden een aanvraag deden via Trustoo en die nooit hebben afgerond.
De mail nodigt uit om extra bedrijven aan de bestaande aanvraag toe te voegen, laat drie
diensten zien die mensen na deze aanvraag vaak ook nodig hebben, en biedt twee uitwegen:
aanvraag afronden of een nieuwe aanvraag doen.

Status: **nog niet gepubliceerd**. De feeds staan lokaal op `main`, er is nog geen Brevo-feed
en geen Brevo-template aangemaakt.

## Bestanden

| Bestand | Inhoud |
| --- | --- |
| [`trustoo-reactivation-template.html`](trustoo-reactivation-template.html) | De template, met feedsyntaxis `{{feed.reactivation_feed.<veld>}}`. Bron van waarheid voor de veldnamen. |
| `feeds/nl/reactivation/<slug>.json` | 89 feeds: 86 services uit de mapping, `default`, en de twee aliassen `cv-installateur` en `stoffeerders`. |
| [`schemas/reactivation-feed.schema.json`](schemas/reactivation-feed.schema.json) | JSON Schema met de 47 velden. `npm run validate` controleert alle feeds hiertegen. |
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

## De 47 velden

| Veld | Waar in de mail |
| --- | --- |
| `title` | HTML `<title>` |
| `subject_line` | Onderwerpregel (campagne-instelling) |
| `preheader` | Preview-tekst (campagne-instelling) en verborgen bovenaan de mail |
| `hero_link_url` | Link op het herobeeld: de kostenpagina of blog van de dienst, zelfde regel als de tips-CTA |
| `hero_image_url`, `hero_image_alt` | Herobeeld 4:3, hetzelfde beeld als de tipsfeed van deze dienst |
| `hero_title_pre`, `hero_title_accent`, `hero_title_post` | Herokop; `accent` staat in oranje |
| `hero_subtitle` | Zin onder de herokop |
| `hero_cta_label` | Witte ghost-pil in de hero, opent de modal "vakmensen toevoegen" |
| `campaign_key` | `utm_campaign` voor de hard-coded dashboard-links, bijvoorbeeld `reactivatie_schilder_mail1` |
| `request_label` | Eyebrow op de aanvraagkaart |
| `request_service` | Dienst op de aanvraagkaart |
| `request_meta` | Regel onder de dienst; service-generiek, zie hieronder |
| `request_status` | Tekst in de oranje statuschip |
| `cta_label` | Groene primaire CTA, opent de modal "vakmensen toevoegen" |
| `cta_note` | Geruststelling onder de CTA |
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
| `done_link_label` | Linker chip: aanvraag afronden (dashboard, token) |
| `new_request_url`, `new_request_label` | Rechter chip: nieuwe aanvraag, dienstpagina van de bron-dienst met UTM's |

Alle URL-velden (naam eindigt op `_url`) bevatten een absolute `https://`-URL. UTM's staan in de
waarde: `utm_source=brevo`, `utm_campaign=<campaign_key>`, `utm_medium=email` en een
`utm_content` per plek (`heroimage`, `<slug>card`, `nieuweaanvraagcta`). De hard-coded
dashboard-links in de template gebruiken `herocta`, `primaircta` en `afrondencta`.

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

`default.json` toont klusjesman, schoonmaakbedrijf en schilder en heeft neutrale teksten
("Je aanvraag staat nog open").

### Slugs die afwijken van de tipsfeeds

- De analyse noemt `cv-installateur` en `stoffeerders`; die URL's bestaan niet op trustoo.nl
  (404), de tipsfeeds heten `cv-verwarmings-installateur` en `stoffeerder` (200). Omdat
  onduidelijk is welke spelling `LAST_REQUEST_SERVICE_URL` bevat, bestaan **beide** bestanden
  met dezelfde inhoud. Verwijder de verkeerde zodra de attribuutwaarde bekend is.
- `verhuisbedrijf` heeft wel een Trustoo-pagina en kostenpagina maar geen tipsfeed. Het beeld
  komt uit het manifest (`hero-verhuizer.jpg`).
- `rijschool` heeft een tipsfeed maar staat niet in de analyse en heeft dus **geen**
  reactivatiefeed. Een contact met die attribuutwaarde wordt door Brevo overgeslagen.

## Keuzes in de inhoud

- **Teksten zijn service-generiek.** De feed is openbaar, dus plaats en datum van de aanvraag
  kunnen er niet in. `request_meta` is daarom "Een paar maanden geleden aangevraagd via Trustoo".
  Wil je plaats en datum tonen, vervang dan in de Brevo-template `request_meta` door
  contactattributen.
- **Herobeeld en kaartbeelden** zijn de bestaande tips-herobeelden uit de Brevo image gallery.
  De kaart toont een 4:3-beeld op 96x96 met `object-fit:cover`. Clients zonder `object-fit`
  (Outlook, Gmail) drukken het beeld dan tot een vierkant. Vierkante uitsnedes uploaden is een
  mogelijke vervolgstap; `scripts/upload-images-to-brevo.py` kan daarvoor worden hergebruikt.
- **Herolink** volgt de CTA-regel van de tipsmail: kostenpagina of relevante blog, nooit de
  service-overzichtspagina. De dienstkaarten en de chip "Nieuwe aanvraag doen" linken wel
  naar `/nederland/<slug>/`, omdat daar de aanvraagflow start.
- **Woordkeuze per dienst** (lidwoord, enkelvoud, meervoud, naam op de aanvraagkaart) staat in
  `SOURCES` in het generatorscript. De kaartteksten staan in `RELATED` en zijn zo geschreven dat
  dezelfde kaart na elke bron klopt.

## Nog af te stemmen voor verzending

1. De queryparameter die de modal "vakmensen toevoegen" opent (`open=vakmensen-toevoegen`)
   is een aanname en staat hard-coded in de template. Afstemmen met development.
2. De werkelijke waarden van `LAST_REQUEST_SERVICE_URL` voor cv-installateur/stoffeerder
   (zie boven) en of `rijschool` een feed nodig heeft.
3. De 96x96-weergave van de kaartbeelden in Outlook en Gmail testen.
4. Feed Studio kent dit mailtype nog niet; daar moet een `email_type` met de 47 velden en deze
   template worden toegevoegd voordat de feeds daar te bewerken zijn.

## Feeds opnieuw genereren

```bash
node scripts/build-reactivation-feeds.js
npm run validate
```

Let op: het script overschrijft alle bestanden in `feeds/nl/reactivation/`. Handmatige
aanpassingen aan een feed gaan daarmee verloren; pas dan liever het script aan.
