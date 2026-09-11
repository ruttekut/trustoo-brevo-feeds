# Reactivatiemail: aanvraag staat nog open

Tweede mailtype in deze repository, naast de servicetips-mail. Doelgroep (golf 1): consumenten
wier laatste aanvraag in 2025 was en die nog geen reactivatiemail kregen. De mail nodigt uit om
extra bedrijven aan de bestaande aanvraag toe te voegen, laat drie diensten zien die handig kunnen
zijn naast de aangevraagde dienst, en biedt twee uitwegen: aanvraag afronden of een nieuwe
aanvraag doen. Latere golven (2024, 2023, ouder) krijgen later eigen content; de feednaam blijft
voorlopig `reactivation`.

Status: feeds en template staan op `main` en zijn via GitHub Pages bereikbaar; er is nog geen
Brevo-feed en geen Brevo-template aangemaakt. De content is op 2026-09-09 aangeleverd door de
beheerder (tabel met 86 services) en vervangt de gegenereerde teksten van 2026-09-08.

## Bestanden

| Bestand | Inhoud |
| --- | --- |
| [`trustoo-reactivation-template.html`](trustoo-reactivation-template.html) | De template (v3, 2026-09-11: dienstkaarten met beeld 160x120 links en een knop), met feedsyntaxis `{{feed.reactivation_feed.<veld>}}`. Bron van waarheid voor de veldnamen. Geen Brevo-condities. |
| `feeds/nl/reactivation/<slug>.json` | 91 feeds (47 velden): 86 services uit de aangeleverde tabel, `default`, en de aliassen `cv-installateur`, `stoffeerders` en `vertaalbureau`. |
| [`schemas/reactivation-feed.schema.json`](schemas/reactivation-feed.schema.json) | JSON Schema met de 47 velden. `npm run validate` controleert alle feeds hiertegen. |
| [`scripts/reactivation-mapping.json`](scripts/reactivation-mapping.json) | Per bron-slug de drie dienstkaarten (alleen slugs), uit de relevantieanalyse. Documentatie; de feeds zijn de bron van waarheid. |
| [`scripts/import-reactivation-tsv.js`](scripts/import-reactivation-tsv.js) | Importeert een TSV (`service_slug`, `locale`, `variant` en de 47 velden) naar de feeds. Gebruikt op 2026-09-09. |

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
| `hero_link_url` | Link op het herobeeld en op de hero-pil: de Trustoo-dienstpagina van deze service, `https://trustoo.nl/nederland/<slug>/` met UTM's (`utm_content=heroimage`) |
| `hero_image_url`, `hero_image_alt` | Herobeeld 4:3, hetzelfde beeld als de tipsfeed van deze dienst |
| `hero_title_pre`, `hero_title_accent`, `hero_title_post` | Herokop; `accent` staat in oranje |
| `hero_subtitle` | Zin onder de herokop |
| `hero_cta_label` | Witte ghost-pil in de hero ("Ontvang nieuwe offertes"), linkt naar `hero_link_url` |
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
| `service1_image_url` .. `service3_image_url` | Het herobeeld uit de tipsfeed van die dienst, getoond op 160x120 (desktop) of volle breedte (mobiel) |
| `service1_image_alt` .. `service3_image_alt` | Alt-tekst van dat beeld |
| `closing_heading_pre`, `closing_heading_accent`, `closing_heading_post` | Kop van het navy blok |
| `closing_intro` | Tekst in het navy blok |
| `done_link_label` | Linker chip: aanvraag afronden (dashboard, token) |
| `new_request_url`, `new_request_label` | Rechter chip: nieuwe aanvraag, dienstpagina van de bron-dienst met UTM's |

Alle URL-velden (naam eindigt op `_url`) bevatten een absolute `https://`-URL. UTM's staan in de
waarde: `utm_source=brevo`, `utm_campaign=<campaign_key>`, `utm_medium=email` en een
`utm_content` per plek (`heroimage`, `<slug>card`, `nieuweaanvraagcta`). De hard-coded
dashboard-links in de template gebruiken `primaircta` en `afrondencta`.

## Hoe de drie dienstkaarten zijn gekozen

De mapping komt uit een interne relevantieanalyse (september 2026) van welke diensten mensen
na een aanvraag voor dienst X ook aanvragen. Per bron zijn de posities 1, 2 en 3 uit die analyse
overgenomen, in die volgorde. Ontbrak positie 3, dan is positie 4 gebruikt. De cijfers zelf staan
niet in deze repository; alleen de slugs in `scripts/reactivation-mapping.json`.

Acht services hadden minder dan drie kandidaten. De ontbrekende kaart is met de hand gekozen:

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

`rijschool` staat niet in de analyse; de kaarten (verzekering, laadpalen, coaching) zijn met de
hand gekozen. `default.json` toont klusjesman, schoonmaakbedrijf en schilder met neutrale teksten.

### Slugs die afwijken van de tipsfeeds

- De analyse noemt `cv-installateur` en `stoffeerders`; die URL's bestaan niet op trustoo.nl
  (404), de tipsfeeds heten `cv-verwarmings-installateur` en `stoffeerder` (200). Omdat
  onduidelijk is welke spelling `LAST_REQUEST_SERVICE_URL` bevat, bestaan **beide** bestanden
  met dezelfde inhoud. Verwijder de verkeerde zodra de attribuutwaarde bekend is.
- De aangeleverde tabel noemt de vertaler-dienst `vertaalbureau`; `/nederland/vertaalbureau/`
  geeft 404 en de Trustoo-slug is `vertaler` (200). De feed staat als `vertaler.json` en als alias
  `vertaalbureau.json`; de links in de tekst wijzen naar `/nederland/vertaler/` en de
  `campaign_key` is `reactivatie_vertaler_mail1`.
- `verhuisbedrijf` heeft wel een Trustoo-pagina en kostenpagina maar geen tipsfeed.

### Correcties op de aangeleverde tabel (2026-09-09)

- `alarmsystemen` en `beveiliging`: de derde kaart heette "Schoonmaakbedrijven" maar linkte naar
  kozijnen (URL, linktekst en beeld). URL, linktekst en beeld zijn op schoonmaakbedrijf gezet.
- Linkteksten zijn consequent "Bekijk <kleine letter>" gemaakt (bijvoorbeeld "Bekijk
  warmtepompinstallateurs" in plaats van "Bekijk Warmtepompinstallateurs"); afkortingen zoals
  "Bekijk SEO-specialisten" blijven staan.
- Vijf onderwerpregels zijn langer dan 70 tekens (koffieautomaat 74, thuisbatterij 75,
  zonnepanelen 73, online-marketing 72, warmtepomp-installateur 71). De tekst is ongewijzigd; in
  Feed Studio is de limiet voor dit veld op 80 gezet.
- De preheaders zijn 120 tot 155 tekens (de langste is thuisbatterij). Ook hier is de tekst
  ongewijzigd; de Feed Studio-limiet staat op 160. Houd er rekening mee dat inboxen de preview
  meestal rond 90 tekens afkappen.

## Keuzes in de inhoud

- **Teksten zijn service-generiek.** De feed is openbaar, dus plaats en datum van de aanvraag
  kunnen er niet in. `request_meta` is daarom "Een paar maanden geleden aangevraagd via Trustoo".
  Wil je plaats en datum tonen, vervang dan in de Brevo-template `request_meta` door
  contactattributen (`LAST_REQUEST_CITY`, `LAST_REQUEST_DATE`).
- **Herobeeld en kaartbeelden** zijn de bestaande tips-herobeelden uit de Brevo image gallery.
  De kaart toont het 4:3-beeld op 160x120, dus zonder crop of `object-fit`.
- **Herobeeld en hero-pil** linken sinds 2026-09-11 naar de dienstpagina `/nederland/<slug>/`
  (voor `default` naar trustoo.nl), net als de dienstkaarten en de chip "Nieuwe aanvraag doen".
  Alleen de groene CTA en "Aanvraag afronden" gaan naar het dashboard.

## Nog af te stemmen voor verzending

1. De queryparameter die de modal "vakmensen toevoegen" opent (`open=vakmensen-toevoegen`)
   is een aanname en staat hard-coded in de template (groene CTA). Afstemmen met development.
2. De werkelijke waarden van `LAST_REQUEST_SERVICE_URL` voor cv-installateur, stoffeerder en
   vertaler (zie boven).
3. De kaartbeelden (4:3 op 160x120, op mobiel volle breedte) in Outlook en Gmail testen.
4. Feed Studio kent dit mailtype (47 velden). Na wijzigingen aan de template daar opnieuw seeden
   met `npm run seed:github -- --type=reactivation --force-template`.

## Content bijwerken

De JSON-bestanden zijn de bron van waarheid; bewerk ze in Feed Studio of direct in de repo. Een
nieuwe tabel in hetzelfde formaat importeer je met:

```bash
node scripts/import-reactivation-tsv.js pad/naar/content.tsv
npm run validate
```

Het script schrijft alle rijen weg, maakt de aliassen en `default.json` aan en meldt welke
bestaande feeds niet in de tabel stonden.
