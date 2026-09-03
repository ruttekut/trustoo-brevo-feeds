# Templateveld-mapping: servicetips-mail

De servicetips-template gebruikt **50 feedvelden** onder één feedalias. De veldnamen in de
JSON-bestanden in deze repository zijn exact de veldnamen die de template aanspreekt.

Volgens de Brevo-documentatie is de syntaxis: `{{ feed.<feedalias>.<veld> }}`.

Feedalias in deze repository:

```text
tip_feed
```

> **Let op:** de alias wordt in Brevo automatisch afgeleid van de feednaam. Noem de feed
> `Tip feed`, dan wordt de alias `tip_feed`. Controleer de werkelijk gegenereerde alias op de
> pagina **Data feeds** in je Brevo-account en gebruik exact die spelling en hoofdlettergebruik.
> Wijkt de alias af, dan moet je alle 49 verwijzingen in de template en de twee in de campagne-instellingen aanpassen.

De template [`trustoo-servicetips-template.html`](trustoo-servicetips-template.html) staat in
deze repository en gebruikt de feedsyntaxis **al**. Er is dus geen omzetting van losse
rootvariabelen nodig; deze tabel is de referentie van welk veld waar hoort.

## Opbouw van de mail

De mail bestaat uit **negen tips in drie groepen van drie**. Elke groep heeft een eigen
tussenkop (`group1_title`, `group2_title`, `group3_title`) boven de drie bijbehorende tips:

```text
tips_heading (kop)
  group1_title
    card1, card2, card3
  group2_title
    card4, card5, card6
  group3_title
    card7, card8, card9
cta
related (kop + 6 chips)
```

Alle negen tipslots staan vast in de template. Een leeg veld levert een lege kaart op, dus vul
altijd alle negen tips.

## Wat géén feedveld is

Deze onderdelen staan **hard-coded** in de template of komen van contactniveau. Ze horen **niet**
in de feed:

| Onderdeel | Waarom niet in de feed |
| --- | --- |
| Headerlink "Mijn aanvragen" | Vaste tekst en vaste URL naar het dashboard, met `{{ contact.DASHBOARD_LINK_TOKEN }}`. |
| Trustpilot-strip | Officiële e-mailsignatuur, voor elke mail gelijk. |
| Voorkeurenblok in de footer | Vaste tekst "Liever minder mail?", knop naar `settings/account` met de token. |
| Contactgegevens, socials, adres | Vaste footer. |
| `{{ contact.DASHBOARD_LINK_TOKEN }}` | Persoonlijke token per contact. Openbare feed is de verkeerde plek. |
| `{{ unsubscribe }}` | Door Brevo gegenereerde afmeldlink. |

> In de vorige versie van de template waren `header_link_label`, `header_link_url`,
> `tips_intro`, `prefs_title`, `prefs_text` en `prefs_link_label` nog feedvelden. Die zijn
> vervallen; de validatie weigert ze als onbekend veld.

## Alle 50 velden

### Meta

| Veld | Templatevariabele | Type |
| --- | --- | --- |
| `title` | `{{ feed.tip_feed.title }}` | tekst, alleen de HTML-`<title>` |
| `subject_line` | `{{ feed.tip_feed.subject_line }}` | tekst, onderwerpregel (in Brevo in het veld **Subject**, niet in de HTML) |
| `preheader` | `{{ feed.tip_feed.preheader }}` | tekst, preview-tekst (in Brevo in het veld **Preview text** én verborgen bovenaan de mail) |

> `subject_line` en `preheader` zijn geschreven op open- en klikratio: onderwerp maximaal
> ongeveer 50 tekens met een vraag of concrete belofte, preview maximaal ongeveer 100 tekens
> die het onderwerp aanvult met de onderwerpen uit de tips in plaats van het te herhalen.
> Brevo laat feedvelden toe in onderwerp en preview-tekst; voeg ze daar in via de `{}`-knop.

### Hero

| Veld | Templatevariabele | Type |
| --- | --- | --- |
| `hero_image_url` | `{{ feed.tip_feed.hero_image_url }}` | URL (bij voorkeur 4:3, 600x450 of groter) |
| `hero_image_alt` | `{{ feed.tip_feed.hero_image_alt }}` | tekst |
| `hero_title_pre` | `{{ feed.tip_feed.hero_title_pre }}` | tekst |
| `hero_title_accent` | `{{ feed.tip_feed.hero_title_accent }}` | tekst (oranje accentwoord) |
| `hero_title_post` | `{{ feed.tip_feed.hero_title_post }}` | tekst |
| `hero_subtitle` | `{{ feed.tip_feed.hero_subtitle }}` | tekst |

### Tips-kop

| Veld | Templatevariabele | Type |
| --- | --- | --- |
| `tips_heading_pre` | `{{ feed.tip_feed.tips_heading_pre }}` | tekst |
| `tips_heading_accent` | `{{ feed.tip_feed.tips_heading_accent }}` | tekst (oranje accentwoord) |
| `tips_heading_post` | `{{ feed.tip_feed.tips_heading_post }}` | tekst (leeg in alle huidige feeds) |

### Groep 1: tips 1 t/m 3

| Veld | Templatevariabele | Type |
| --- | --- | --- |
| `group1_title` | `{{ feed.tip_feed.group1_title }}` | tekst (tussenkop) |
| `card1_title` | `{{ feed.tip_feed.card1_title }}` | tekst |
| `card1_text` | `{{ feed.tip_feed.card1_text }}` | tekst |
| `card2_title` | `{{ feed.tip_feed.card2_title }}` | tekst |
| `card2_text` | `{{ feed.tip_feed.card2_text }}` | tekst |
| `card3_title` | `{{ feed.tip_feed.card3_title }}` | tekst |
| `card3_text` | `{{ feed.tip_feed.card3_text }}` | tekst |

### Groep 2: tips 4 t/m 6

| Veld | Templatevariabele | Type |
| --- | --- | --- |
| `group2_title` | `{{ feed.tip_feed.group2_title }}` | tekst (tussenkop) |
| `card4_title` | `{{ feed.tip_feed.card4_title }}` | tekst |
| `card4_text` | `{{ feed.tip_feed.card4_text }}` | tekst |
| `card5_title` | `{{ feed.tip_feed.card5_title }}` | tekst |
| `card5_text` | `{{ feed.tip_feed.card5_text }}` | tekst |
| `card6_title` | `{{ feed.tip_feed.card6_title }}` | tekst |
| `card6_text` | `{{ feed.tip_feed.card6_text }}` | tekst |

### Groep 3: tips 7 t/m 9

| Veld | Templatevariabele | Type |
| --- | --- | --- |
| `group3_title` | `{{ feed.tip_feed.group3_title }}` | tekst (tussenkop) |
| `card7_title` | `{{ feed.tip_feed.card7_title }}` | tekst |
| `card7_text` | `{{ feed.tip_feed.card7_text }}` | tekst |
| `card8_title` | `{{ feed.tip_feed.card8_title }}` | tekst |
| `card8_text` | `{{ feed.tip_feed.card8_text }}` | tekst |
| `card9_title` | `{{ feed.tip_feed.card9_title }}` | tekst |
| `card9_text` | `{{ feed.tip_feed.card9_text }}` | tekst |

### CTA

| Veld | Templatevariabele | Type |
| --- | --- | --- |
| `cta_label` | `{{ feed.tip_feed.cta_label }}` | tekst (de template voegt zelf een pijl toe) |
| `cta_url` | `{{ feed.tip_feed.cta_url }}` | URL |

### Gerelateerde services: kop

| Veld | Templatevariabele | Type |
| --- | --- | --- |
| `related_heading_pre` | `{{ feed.tip_feed.related_heading_pre }}` | tekst |
| `related_heading_accent` | `{{ feed.tip_feed.related_heading_accent }}` | tekst (oranje accentwoord) |
| `related_heading_post` | `{{ feed.tip_feed.related_heading_post }}` | tekst (leeg in alle huidige feeds) |

### Gerelateerde services: zes chips

| Veld | Templatevariabele | Type |
| --- | --- | --- |
| `tile1_name` | `{{ feed.tip_feed.tile1_name }}` | tekst |
| `tile1_url` | `{{ feed.tip_feed.tile1_url }}` | URL |
| `tile2_name` | `{{ feed.tip_feed.tile2_name }}` | tekst |
| `tile2_url` | `{{ feed.tip_feed.tile2_url }}` | URL |
| `tile3_name` | `{{ feed.tip_feed.tile3_name }}` | tekst |
| `tile3_url` | `{{ feed.tip_feed.tile3_url }}` | URL |
| `tile4_name` | `{{ feed.tip_feed.tile4_name }}` | tekst |
| `tile4_url` | `{{ feed.tip_feed.tile4_url }}` | URL |
| `tile5_name` | `{{ feed.tip_feed.tile5_name }}` | tekst |
| `tile5_url` | `{{ feed.tip_feed.tile5_url }}` | URL |
| `tile6_name` | `{{ feed.tip_feed.tile6_name }}` | tekst |
| `tile6_url` | `{{ feed.tip_feed.tile6_url }}` | URL |

De **URL-velden** zijn er acht: `hero_image_url`, `cta_url` en `tile1_url` tot en met
`tile6_url`. Die bevatten een absolute `https://`-URL of een lege string.

## Belangrijk bij het onderhouden

- **Verander de JSON-veldnamen niet.** De veldnamen zijn het contract tussen repository en
  template. Wil je een veld anders noemen, wijzig dan schema, alle feeds én de template in
  één keer.
- **Alle 50 velden zijn verplicht in elk bestand.** Gebruik je een veld niet, geef het dan een
  lege string `""`. Weglaten laat de validatie falen.
- **Vul alle negen tips.** De template heeft negen vaste kaarten; een lege `cardN_title` en
  `cardN_text` geeft een lege witte kaart met alleen een cijfer.
- **URL-velden kunnen leeg zijn.** De huidige template zet de waarde direct in `href` en `src`;
  laat URL-velden in de praktijk dus gevuld, of voeg in Brevo een `{% if ... != '' %}` toe.
- **Geen arrays of loops nodig.** Deze feed is een plat object (single object data /
  non-repeatable in Brevo-termen). Een **Dynamic content block** is hier niet nodig; die is
  alleen bedoeld voor arrays.
- **`tips_heading_post` en `related_heading_post` staan nu overal leeg.** De koppen eindigen op
  het accentwoord. De velden blijven bestaan zodat je later een staartwoord kunt toevoegen.

## Bronnen

- [Personalize your messages with dynamic content (Brevo Template Language)](https://help.brevo.com/hc/en-us/articles/4402386448530--Manual-Personalize-your-messages-with-dynamic-content-Brevo-Template-Language)
- [Personalize your email content with real-time data (data feed)](https://help.brevo.com/hc/en-us/articles/9854758414098-Personalize-your-email-content-with-real-time-data-data-feed)
- [Getting started with external feeds (Brevo API docs)](https://developers.brevo.com/docs/getting-started-with-external-feeds)
