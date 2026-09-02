# Brevo-instellingen: personalized data feed voor Trustoo-tipsmails

Deze handleiding beschrijft hoe je in Brevo een **Personalized Data Feed** koppelt aan de
JSON-bestanden in deze repository. Er is nog **niets** in Brevo gewijzigd — voer deze stappen
zelf uit.

> **Plan-vereiste:** een *personalized feed* is volgens Brevo alleen beschikbaar op de
> **Professional**- en **Enterprise**-plannen. Een *global feed* (dezelfde inhoud voor iedereen)
> kan op meer plannen, maar personalisatie per `LAST_REQUEST_SERVICE_URL` vereist de
> personalized variant.

## Wat je nodig hebt

- Het contactattribuut `LAST_REQUEST_SERVICE_URL` bestaat in Brevo en is gevuld met een
  **canonical slug**, bijvoorbeeld `laadpalen`.
- Minstens één testcontact op je testlijst met `LAST_REQUEST_SERVICE_URL` exact `laadpalen`.
- De feed-URL is publiek bereikbaar (zie `README.md`).

## Stap 1 — Open Data feeds

1. Klik rechtsboven op het **accountmenu** (account dropdown).
2. Ga naar **Settings** > **Data management** > **Data feeds**.

## Stap 2 — Maak een nieuwe feed aan

1. Klik op **Add data feed**. Je komt in de feed-setupflow.
2. Vul bij de naam in: `Trustoo tips`.
   Brevo genereert hieruit automatisch de alias. Verwacht:

   ```text
   trustoo_tips
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
   `LAST_REQUEST_SERVICE_URL` exact `laadpalen` is.
5. Bij de authenticatiemethode: kies **geen authenticatie**. De feed is een openbaar,
   statisch JSON-bestand op GitHub Pages. Vul hier **geen** API-keys of tokens in.
6. Klik op **Continue**.

## Stap 4 — Controleer de preview en sla op

1. Brevo laat de opgehaalde JSON zien voor je preview-contact. Controleer dat je de
   laadpaal-inhoud ziet (bijvoorbeeld het veld `title`).
2. Optioneel: selecteer andere testcontacten om te controleren of per contact de juiste feed
   wordt opgehaald.
3. Klik op **Save**.

## Stap 5 — Gebruik de feed in je template

De velden zijn beschikbaar als:

```twig
{{ feed.trustoo_tips.title }}
```

1. Open je e-mailtemplate of campagne en ga naar de **Design**-stap.
2. Vervang de bestaande rootvariabelen door de feedvariabelen. De volledige mapping van alle
   30 velden staat in [`TEMPLATE_FIELD_MAPPING.md`](TEMPLATE_FIELD_MAPPING.md).
3. **Gebruik geen Dynamic content block.** Deze feed is een plat object (single object data,
   non-repeatable). Dynamic content blocks zijn alleen nodig voor arrays.
4. Klik op **Preview & test**, blijf op het tabblad **Preview**, en vul bij de vraag als welk
   contact je de e-mail wilt bekijken het e-mailadres van je testcontact in.
   Controleer dat `{{ feed.trustoo_tips.title }}` de laadpaal-titel toont en niet leeg blijft
   of als ruwe tekst zichtbaar is.

## Stap 6 — Regels voor de attribuutwaarde

**De waarde van `LAST_REQUEST_SERVICE_URL` moet exact overeenkomen met de JSON-bestandsnaam
zonder `.json`.**

`LAST_REQUEST_SERVICE_URL = laadpalen` geeft `feeds/nl/tips/laadpalen.json`

Deze waarden gaan **mis**:

| Waarde | Wat er gebeurt |
| --- | --- |
| `Laadpalen` | Hoofdletter. GitHub Pages is case-sensitive, dus 404. |
| `laadpalen ` (met spatie erachter) | Spatie wordt onderdeel van de URL, dus 404. |
| `laadpalen/` | Trailing slash geeft `.../laadpalen/.json`, dus 404. |
| `/laadpalen/` | Extra slashes, verkeerd pad, dus 404. |
| `https://trustoo.nl/laadpalen` | Volledige URL in het attribuut geeft een onbruikbare URL. |
| `laadpalen?utm_source=x` | Queryparameters, dus 404. |
| `laadpalen-en-thuisbatterijen` | Werkt alleen als dat bestand ook echt bestaat. |

Zorg dus dat het attribuut in de bron (aanvraagflow of database die naar Brevo synct) al als
**canonical slug** wordt geschreven: kleine letters, cijfers en koppeltekens, zonder
protocol, slashes of queryparameters. Kan dat niet aan de bron, normaliseer de waarde dan
vóórdat hij naar Brevo gaat.

## Stap 7 — Meerdere mailtypes: één alias per mailtype

Elke Brevo-mail kan zijn eigen feedalias en eigen mailtypemap krijgen. Zo blijft de inhoud per
mailtype los van elkaar te beheren:

| Mailtype | Feednaam in Brevo | Alias | Bron-URL (attribuut via `{}`-kiezer) |
| --- | --- | --- | --- |
| Tips | `Trustoo tips` | `trustoo_tips` | `.../feeds/nl/tips/<attribuut>.json` |
| Cross-sell | `Trustoo cross sell` | `trustoo_cross_sell` | `.../feeds/nl/cross-sell/<attribuut>.json` |
| Seasonal | `Trustoo seasonal` | `trustoo_seasonal` | `.../feeds/nl/seasonal/<attribuut>.json` |
| Follow-up | `Trustoo follow up` | `trustoo_follow_up` | `.../feeds/nl/follow-up/<attribuut>.json` |

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

## Bronnen

- [About data feeds in Brevo](https://help.brevo.com/hc/en-us/articles/24815592958098-About-data-feeds-in-Brevo)
- [Create a data feed](https://help.brevo.com/hc/en-us/articles/24603889506450-Create-a-data-feed)
- [Personalize your email content with real-time data (data feed)](https://help.brevo.com/hc/en-us/articles/9854758414098-Personalize-your-email-content-with-real-time-data-data-feed)
- [Personalize your messages with dynamic content (Brevo Template Language)](https://help.brevo.com/hc/en-us/articles/4402386448530--Manual-Personalize-your-messages-with-dynamic-content-Brevo-Template-Language)
- [Getting started with external feeds (Brevo API docs)](https://developers.brevo.com/docs/getting-started-with-external-feeds)
