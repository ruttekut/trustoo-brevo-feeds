# Brevo-instellingen voor de Trustoo-feeds

Deze handleiding beschrijft hoe je in Brevo de JSON-bestanden in deze repository koppelt. Brevo
wordt niet vanuit deze repository aangestuurd: voer deze stappen zelf uit in Brevo.

- Stap 1 t/m 9: een **personalized data feed** per dienst, voor mails die op het contact draaien
  (de dienst komt uit `LAST_REQUEST_SERVICE_URL`). Het voorbeeld is de servicetips-mail.
- [Object-based automations: gecombineerde feed](#object-based-automations-gecombineerde-feed): een
  **global data feed** voor mails die een object-based automation verstuurt (de dienst komt van het
  object, bijvoorbeeld de aanvraag). Zo werkt de post-hire-mail.
- [Fouten opsporen](#fouten-opsporen): waarom een mail niet aankomt of leeg is.

> **Plan-vereiste:** een *personalized feed* is volgens Brevo alleen beschikbaar op de
> **Professional**- en **Enterprise**-plannen. Een *global feed* (dezelfde inhoud voor iedereen)
> kan op meer plannen, maar personalisatie per `LAST_REQUEST_SERVICE_URL` vereist de
> personalized variant.

## Wat je nodig hebt

- Het contactattribuut `LAST_REQUEST_SERVICE_URL` bestaat in Brevo en is gevuld met een
  **canonical slug**, bijvoorbeeld `dakdekker`.
- Minstens één testcontact op je testlijst met `LAST_REQUEST_SERVICE_URL` exact `dakdekker`.
- De feed-URL is publiek bereikbaar (zie `README.md`).

## Stap 1 — Open Data feeds

1. Klik rechtsboven op het **accountmenu** (account dropdown).
2. Ga naar **Settings** > **Data management** > **Data feeds**.

## Stap 2 — Maak een nieuwe feed aan

1. Klik op **Add data feed**. Je komt in de feed-setupflow.
2. Vul bij de naam in: `Tip feed`.
   Brevo genereert hieruit automatisch de alias. Verwacht:

   ```text
   tip_feed
   ```

   **Controleer de werkelijk gegenereerde alias** op de pagina **Data feeds** en gebruik in de
   template exact die spelling en hoofdlettergebruik. Wijkt de alias af, pas dan
   `TEMPLATE_FIELD_MAPPING.md` en de template aan.
3. Klik op **Continue**.

## Stap 3 — Vul de bron-URL in

1. Plak in het veld **Data feed URL** het statische deel van de URL:

   ```text
   https://ruttekut.github.io/trustoo-brevo-feeds/feeds/nl/tips/
   ```

2. Zet de cursor achter die URL en klik op de **`{}`**-knop naast het veld **Data feed URL**.
   Dit is de contactattribuutkiezer van Brevo. Selecteer `LAST_REQUEST_SERVICE_URL`.
3. Typ daarachter `.json`. De volledige URL wordt dan:

   ```text
   https://ruttekut.github.io/trustoo-brevo-feeds/feeds/nl/tips/{{contact.LAST_REQUEST_SERVICE_URL}}.json
   ```

   > **Verzin de syntaxis niet zelf.** Gebruik altijd de `{}`-kiezer, zodat Brevo de placeholder
   > in het formaat plaatst dat de feedengine verwacht. De hierboven getoonde
   > `{{contact.ATTRIBUUT}}`-vorm komt uit de Brevo API-documentatie en dient alleen ter
   > illustratie van het eindresultaat.

4. Kies bij de preview-contactselectie een contact van je **testlijst** waarvan
   `LAST_REQUEST_SERVICE_URL` exact `dakdekker` is.
5. Bij de authenticatiemethode: kies **geen authenticatie**. De feed is een openbaar,
   statisch JSON-bestand op GitHub Pages. Vul hier **geen** API-keys of tokens in.
6. Klik op **Continue**.

## Stap 4 — Controleer de preview en sla op

1. Brevo laat de opgehaalde JSON zien voor je preview-contact. Controleer dat je de
   dakdekker-inhoud ziet (bijvoorbeeld het veld `title`).
2. Optioneel: selecteer andere testcontacten om te controleren of per contact de juiste feed
   wordt opgehaald.
3. Klik op **Save**.

## Stap 5 — Gebruik de feed in je template

De velden zijn beschikbaar als:

```twig
{{ feed.tip_feed.title }}
```

1. Open je e-mailtemplate of campagne en ga naar de **Design**-stap.
2. Vervang de bestaande rootvariabelen door de feedvariabelen. De volledige mapping van alle
   50 velden staat in [`TEMPLATE_FIELD_MAPPING.md`](TEMPLATE_FIELD_MAPPING.md).
3. **Gebruik geen Dynamic content block.** Deze feed is een plat object (single object data,
   non-repeatable). Dynamic content blocks zijn alleen nodig voor arrays.
4. Zet in de campagne-instellingen ook het **onderwerp** en de **preview-tekst** op de feed.
   Zet de cursor in het veld **Subject**, klik op de `{}`-knop, kies **Data feeds** en dan
   `subject_line`; doe hetzelfde in **Preview text** met `preheader`. Het resultaat is:

   ```twig
   {{ feed.tip_feed.subject_line }}
   {{ feed.tip_feed.preheader }}
   ```

   Zie [Personalize your email subject line and preview text with real-time data](https://help.brevo.com/hc/en-us/articles/24630251167250-Personalize-your-email-subject-line-and-preview-text-with-real-time-data-data-feed).
5. Klik op **Preview & test**, blijf op het tabblad **Preview**, en vul bij de vraag als welk
   contact je de e-mail wilt bekijken het e-mailadres van je testcontact in.
   Controleer dat `{{ feed.tip_feed.title }}` de dakdekker-titel toont en niet leeg blijft
   of als ruwe tekst zichtbaar is.

## Stap 6 — Regels voor de attribuutwaarde

**De waarde van `LAST_REQUEST_SERVICE_URL` moet exact overeenkomen met de JSON-bestandsnaam
zonder `.json`.**

`LAST_REQUEST_SERVICE_URL = dakdekker` geeft `feeds/nl/tips/dakdekker.json`

Deze waarden gaan **mis**:

| Waarde | Wat er gebeurt |
| --- | --- |
| `Dakdekker` | Hoofdletter. GitHub Pages is case-sensitive, dus 404. |
| `dakdekker ` (met spatie erachter) | Spatie wordt onderdeel van de URL, dus 404. |
| `dakdekker/` | Trailing slash geeft `.../dakdekker/.json`, dus 404. |
| `/dakdekker/` | Extra slashes, verkeerd pad, dus 404. |
| `https://trustoo.nl/dakdekker` | Volledige URL in het attribuut geeft een onbruikbare URL. |
| `dakdekker?utm_source=x` | Queryparameters, dus 404. |
| `dakdekker-en-thuisbatterijen` | Werkt alleen als dat bestand ook echt bestaat. |

Zorg dus dat het attribuut in de bron (aanvraagflow of database die naar Brevo synct) al als
**canonical slug** wordt geschreven: kleine letters, cijfers en koppeltekens, zonder
protocol, slashes of queryparameters. Kan dat niet aan de bron, normaliseer de waarde dan
vóórdat hij naar Brevo gaat.

## Stap 7 — Meerdere mailtypes: één alias per mailtype

Elke Brevo-mail heeft zijn eigen feedalias en eigen mailtypemap. Brevo maakt de alias uit de
feednaam; de template moet exact die alias gebruiken. De aliassen die de templates in deze repository
verwachten:

| Mailtype | Alias in de template | Bron-URL (attribuut via `{}`-kiezer) |
| --- | --- | --- |
| Servicetips | `tip_feed` | `.../feeds/nl/tips/<attribuut>.json` |
| Reactivatie (zie [`REACTIVATION.md`](REACTIVATION.md)) | `reactivation_feed` | `.../feeds/nl/reactivation/<attribuut>.json` |
| Cross-sell 1 (zie [`CROSS_SELL.md`](CROSS_SELL.md)) | `cross_sell_feed` | `.../feeds/nl/cross-sell/<attribuut>.json` |
| Cross-sell reminder | `cross_sell_reminder_feed` | `.../feeds/nl/cross-sell-reminder/<attribuut>.json` |
| Servicetips BE | `tip_feed_be` | `.../feeds/be-nl/tips-be/<attribuut>.json` |
| Cross-sell BE | `cross_sell_feed_be` | `.../feeds/be-nl/cross-sell-be/<attribuut>.json` |
| Cross-sell reminder BE | `cross_sell_reminder_feed_be` | `.../feeds/be-nl/cross-sell-reminder-be/<attribuut>.json` |
| Post-hire 1 | global feed, zie [hieronder](#object-based-automations-gecombineerde-feed) | `.../feeds/nl/posthire-chosen.json` |

Krijgt de feed in Brevo een andere alias (andere feednaam), pas dan de template aan of maak de feed
opnieuw aan met de juiste naam.

Je kunt ook één feed voor meerdere mails hergebruiken, maar dan delen die mails
onvermijdelijk dezelfde inhoud. Aparte aliassen zijn overzichtelijker.

## Stap 8 — Privacy: geen persoonsgegevens in de feed

De JSON-bestanden in deze repository staan in een **openbare** repository op een **openbare**
GitHub Pages-site. Iedereen met de URL kan ze lezen.

- Persoonlijke contactgegevens (naam, e-mailadres, telefoonnummer, adres, aanvraag-ID) blijven
  **in Brevo-contactattributen** en horen **niet** in deze JSON-bestanden.
- Personaliseer persoonsgegevens in de template met contactattributen
  (bijvoorbeeld `{{ contact.FIRSTNAME }}`), niet via de feed.
- De feed bevat uitsluitend **service-generieke** content die voor elk contact met dezelfde
  `LAST_REQUEST_SERVICE_URL` identiek is.
- Zet nooit API-keys, tokens of wachtwoorden in deze repository.

## Stap 9 — Wat gebeurt er als een feed ontbreekt?

**Brevo schakelt niet automatisch over naar `default.json`.** Er is geen fallback op
bestandsniveau. Als de URL een 404 of een HTML-foutpagina teruggeeft, kan Brevo de feed niet
verwerken; volgens de Brevo API-documentatie wordt zo'n contact overgeslagen in de campagne
("that contact is skipped from the email campaign").

Zie de sectie *Voorkomen dat een ontbrekende feed een verzending breekt* in
[`README.md`](README.md) voor de manieren om dit af te dekken.

## Object-based automations: gecombineerde feed

Een personalized feed-URL kan alleen een **contactattribuut** bevatten. Start een automation op een
**object** (bijvoorbeeld "Request updated" met een filter op `status`), dan moet de mail de dienst van
dát object tonen, niet die uit `LAST_REQUEST_SERVICE_URL` (een contact kan meerdere aanvragen hebben).
Daarvoor gebruik je de gecombineerde feed: één bestand per mailtype met alle diensten. Feed Studio
schrijft die bij elke publicatie (zie de README, *Gecombineerde feeds*). Zo is de post-hire-mail
ingericht en getest (2026-10-30).

### 1. Global data feed

Settings → Data management → Data feeds → Add data feed, **zonder** attribuut in de URL:

```text
https://ruttekut.github.io/trustoo-brevo-feeds/feeds/nl/<mailtype>.json
```

Kies een naam zodat Brevo de gewenste alias maakt. Voor post-hire is de alias `post_hire_chosen`
(bron `.../feeds/nl/posthire-chosen.json`).

### 2. Het object in de mail

Brevo maakt het object dat de automation startte beschikbaar als een feed met de naam van het object;
de velden staan onder `attributes`:

```twig
{{ feed.request.attributes.service_url }}
{{ feed.request.attributes.status }}
```

Zo voegt de editor het zelf in: Text-blok → Add variable `{ }` → Object attributes → het object → het
veld. Daar zie je ook de exacte veldnamen. Getest en **niet** werkend: `{{ params.<veld> }}`,
`{{ request.<veld> }}` en `{{ feed.request.<veld> }}` zonder `attributes` (allemaal leeg).
Objectvariabelen werken volgens Brevo alleen in e-mails van een object-based automation, niet in
campagnes of contact-based automations.

### 3. De template

De hele mail staat in een loop over de gecombineerde feed en toont alleen de dienst waarvan de slug
gelijk is aan het objectveld met de dienst-URL (dezelfde slug als `LAST_REQUEST_SERVICE_URL`):

```twig
{% for s in feed.post_hire_chosen.services %}{% if s.slug == feed.request.attributes.service_url %}
  … {{ s.subject_line }} … {{ s.hero_subtitle }} …
{% endif %}{% endfor %}
```

Maak deze HTML niet met de hand: Feed Studio → mailtype → tab **Brevo (combined)** maakt hem uit de
opgeslagen template (knop "Download combined template" en de kopieerknop "Brevo HTML"; daar vul je ook de
alias van de global feed en de objectnaam in). Plak de HTML in de e-mail **binnen** de automation.

Gebruik **niet** de gewone template van het mailtype (tab "HTML template" in Feed Studio of
`<merk>-<mailtype>-template.html` hier): die verwijst naar de per-dienstfeed
(`{{ feed.posthire_chosen_feed.… }}`) die in Brevo niet bestaat, en dan verstuurt Brevo de mail niet
(zie [Fouten opsporen](#fouten-opsporen)).

### 4. Onderwerp en preview-tekst

Die velden staan buiten de HTML en hebben hun eigen loop. Kopieer ze uit hetzelfde tabblad
("Brevo subject line" en "Brevo preview text"). Voor post-hire, met de wissel op de status:

```twig
{% for s in feed.post_hire_chosen.services %}{% if s.slug == feed.request.attributes.service_url %}{% if feed.request.attributes.status == "DONE" %}{{ s.done_subject_line }}{% else %}{{ s.subject_line }}{% endif %}{% endif %}{% endfor %}
```

Preview-tekst: hetzelfde met `done_preheader` / `preheader`.

### 5. Let op

- Heeft het object een dienst die niet in de gecombineerde feed staat, dan matcht niets en komt er een
  **lege** mail aan (geen fout). Sluit zulke diensten uit met een filter in de automation.
- Een *Dynamic content*-blok met databron `feed.request.associations.…` is voor records die aan het
  object gekoppeld zijn (bijvoorbeeld het contact), niet voor de velden van het object zelf.

## Fouten opsporen

Brevo legt per verzending events vast, ook voor mails uit automations: `requests` (verzendpoging),
`delivered`, `opened`, `clicks` en `error` met een reden. Op te vragen via de Brevo API
`GET /v3/smtp/statistics/events` (filter op e-mailadres), of in Claude via de Brevo-koppeling
(`campaign_analytics_get_email_event_report`).

| Wat je ziet | Oorzaak |
| --- | --- |
| `error` met `feed not found, feed <alias>` | De template verwijst naar een feedalias die in Brevo niet bestaat. Brevo verstuurt de mail dan **niet**. Controleer de alias, of je de juiste (gecombineerde) template gebruikt. |
| Geen `requests`-event na de trigger | Brevo heeft de mail niet geprobeerd te versturen: de automation is niet gestart of de e-mailstap is niet bereikt. Kijk in de automation zelf. |
| `delivered`, maar de mail is leeg | De dienst is niet gevonden: geen bestand voor die slug (personalized feed) of geen item met die slug (gecombineerde feed). |

## Bronnen

- [About data feeds in Brevo](https://help.brevo.com/hc/en-us/articles/24815592958098-About-data-feeds-in-Brevo)
- [Create a data feed](https://help.brevo.com/hc/en-us/articles/24603889506450-Create-a-data-feed)
- [Personalize your email content with real-time data (data feed)](https://help.brevo.com/hc/en-us/articles/9854758414098-Personalize-your-email-content-with-real-time-data-data-feed)
- [Personalize your messages with dynamic content (Brevo Template Language)](https://help.brevo.com/hc/en-us/articles/4402386448530--Manual-Personalize-your-messages-with-dynamic-content-Brevo-Template-Language)
- [Getting started with external feeds (Brevo API docs)](https://developers.brevo.com/docs/getting-started-with-external-feeds)
- [Personalize your emails with object attributes](https://help.brevo.com/hc/en-us/articles/34676182667922)
