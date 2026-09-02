# Templateveld-mapping: servicetips-mail

De servicetips-template gebruikt **44 feedvelden** onder één feedalias. De veldnamen in de
JSON-bestanden in deze repository zijn exact de veldnamen die de template aanspreekt.

Volgens de Brevo-documentatie is de syntaxis: `{{ feed.<feedalias>.<veld> }}`.

Feedalias in deze repository:

```text
tip_feed
```

> **Let op:** de alias wordt in Brevo automatisch afgeleid van de feednaam. Noem de feed
> `Tip feed`, dan wordt de alias `tip_feed`. Controleer de werkelijk gegenereerde alias op de
> pagina **Data feeds** in je Brevo-account en gebruik exact die spelling en hoofdlettergebruik.
> Wijkt de alias af, dan moet je alle 44 verwijzingen in de template aanpassen.

De template `trustoo-servicetips-template.html` gebruikt de feedsyntaxis **al**. Er is dus geen
omzetting van losse rootvariabelen nodig; deze tabel is de referentie van welk veld waar hoort.

## Twee variabelen die géén feedveld zijn

Deze twee blijven contactniveau en horen **niet** in de feed:

| Variabele | Waarom niet in de feed |
| --- | --- |
| `{{ contact.DASHBOARD_LINK_TOKEN }}` | Persoonlijke token per contact. Openbare feed is de verkeerde plek. |
| `{{ unsubscribe }}` | Door Brevo gegenereerde afmeldlink. |

## Alle 44 velden

### Meta

| Veld | Templatevariabele | Type |
| --- | --- | --- |
| `title` | `{{ feed.tip_feed.title }}` | tekst |
| `preheader` | `{{ feed.tip_feed.preheader }}` | tekst |

### Header

| Veld | Templatevariabele | Type |
| --- | --- | --- |
| `header_link_label` | `{{ feed.tip_feed.header_link_label }}` | tekst |
| `header_link_url` | `{{ feed.tip_feed.header_link_url }}` | URL |

### Hero

| Veld | Templatevariabele | Type |
| --- | --- | --- |
| `hero_image_url` | `{{ feed.tip_feed.hero_image_url }}` | URL |
| `hero_image_alt` | `{{ feed.tip_feed.hero_image_alt }}` | tekst |
| `hero_title_pre` | `{{ feed.tip_feed.hero_title_pre }}` | tekst |
| `hero_title_accent` | `{{ feed.tip_feed.hero_title_accent }}` | tekst |
| `hero_title_post` | `{{ feed.tip_feed.hero_title_post }}` | tekst |
| `hero_subtitle` | `{{ feed.tip_feed.hero_subtitle }}` | tekst |

### Tips-kop

| Veld | Templatevariabele | Type |
| --- | --- | --- |
| `tips_heading_pre` | `{{ feed.tip_feed.tips_heading_pre }}` | tekst |
| `tips_heading_accent` | `{{ feed.tip_feed.tips_heading_accent }}` | tekst |
| `tips_heading_post` | `{{ feed.tip_feed.tips_heading_post }}` | tekst (leeg in alle huidige feeds) |
| `tips_intro` | `{{ feed.tip_feed.tips_intro }}` | tekst |

### De vijf tips

| Veld | Templatevariabele | Type |
| --- | --- | --- |
| `card1_title` | `{{ feed.tip_feed.card1_title }}` | tekst |
| `card1_text` | `{{ feed.tip_feed.card1_text }}` | tekst |
| `card2_title` | `{{ feed.tip_feed.card2_title }}` | tekst |
| `card2_text` | `{{ feed.tip_feed.card2_text }}` | tekst |
| `card3_title` | `{{ feed.tip_feed.card3_title }}` | tekst |
| `card3_text` | `{{ feed.tip_feed.card3_text }}` | tekst |
| `card4_title` | `{{ feed.tip_feed.card4_title }}` | tekst |
| `card4_text` | `{{ feed.tip_feed.card4_text }}` | tekst |
| `card5_title` | `{{ feed.tip_feed.card5_title }}` | tekst |
| `card5_text` | `{{ feed.tip_feed.card5_text }}` | tekst |

### CTA

| Veld | Templatevariabele | Type |
| --- | --- | --- |
| `cta_label` | `{{ feed.tip_feed.cta_label }}` | tekst |
| `cta_url` | `{{ feed.tip_feed.cta_url }}` | URL |

### Gerelateerde services: kop

| Veld | Templatevariabele | Type |
| --- | --- | --- |
| `related_heading_pre` | `{{ feed.tip_feed.related_heading_pre }}` | tekst |
| `related_heading_accent` | `{{ feed.tip_feed.related_heading_accent }}` | tekst |
| `related_heading_post` | `{{ feed.tip_feed.related_heading_post }}` | tekst (leeg in alle huidige feeds) |

### Gerelateerde services: zes tiles

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

### E-mailvoorkeuren

| Veld | Templatevariabele | Type |
| --- | --- | --- |
| `prefs_title` | `{{ feed.tip_feed.prefs_title }}` | tekst |
| `prefs_text` | `{{ feed.tip_feed.prefs_text }}` | tekst |
| `prefs_link_label` | `{{ feed.tip_feed.prefs_link_label }}` | tekst |

De **URL-velden** zijn er negen: `header_link_url`, `hero_image_url`, `cta_url` en
`tile1_url` tot en met `tile6_url`. Die bevatten een absolute `https://`-URL of een lege string.

## Volledig kopieerbaar Twig-voorbeeld

Alle 44 velden worden hieronder via `feed.tip_feed` aangesproken. Geen arrays, geen loops.

```twig
{# ---------- Meta ---------- #}
<title>{{ feed.tip_feed.title }}</title>
<span style="display:none;font-size:0;line-height:0;">{{ feed.tip_feed.preheader }}</span>

{# ---------- Header ---------- #}
{% if feed.tip_feed.header_link_url != '' %}
  <a href="{{ feed.tip_feed.header_link_url }}">{{ feed.tip_feed.header_link_label }}</a>
{% else %}
  {{ feed.tip_feed.header_link_label }}
{% endif %}

{# ---------- Hero ---------- #}
{% if feed.tip_feed.hero_image_url != '' %}
  <img src="{{ feed.tip_feed.hero_image_url }}" alt="{{ feed.tip_feed.hero_image_alt }}" width="600" style="display:block;border:0;max-width:100%;">
{% endif %}
<h1>
  {{ feed.tip_feed.hero_title_pre }}
  <span style="color:#0057FF;">{{ feed.tip_feed.hero_title_accent }}</span>
  {{ feed.tip_feed.hero_title_post }}
</h1>
<p>{{ feed.tip_feed.hero_subtitle }}</p>

{# ---------- Tips-kop ---------- #}
<h2>
  {{ feed.tip_feed.tips_heading_pre }}
  <span style="color:#0057FF;">{{ feed.tip_feed.tips_heading_accent }}</span>
  {{ feed.tip_feed.tips_heading_post }}
</h2>
<p>{{ feed.tip_feed.tips_intro }}</p>

{# ---------- De vijf tips ---------- #}
<h3>{{ feed.tip_feed.card1_title }}</h3>
<p>{{ feed.tip_feed.card1_text }}</p>

<h3>{{ feed.tip_feed.card2_title }}</h3>
<p>{{ feed.tip_feed.card2_text }}</p>

<h3>{{ feed.tip_feed.card3_title }}</h3>
<p>{{ feed.tip_feed.card3_text }}</p>

<h3>{{ feed.tip_feed.card4_title }}</h3>
<p>{{ feed.tip_feed.card4_text }}</p>

<h3>{{ feed.tip_feed.card5_title }}</h3>
<p>{{ feed.tip_feed.card5_text }}</p>

{# ---------- CTA ---------- #}
{% if feed.tip_feed.cta_url != '' %}
  <a href="{{ feed.tip_feed.cta_url }}"
     style="display:inline-block;padding:14px 24px;background:#0057FF;color:#ffffff;text-decoration:none;border-radius:6px;">
    {{ feed.tip_feed.cta_label }}
  </a>
{% else %}
  <span>{{ feed.tip_feed.cta_label }}</span>
{% endif %}

{# ---------- Gerelateerde services ---------- #}
<h2>
  {{ feed.tip_feed.related_heading_pre }}
  <span style="color:#0057FF;">{{ feed.tip_feed.related_heading_accent }}</span>
  {{ feed.tip_feed.related_heading_post }}
</h2>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td>{% if feed.tip_feed.tile1_url != '' %}<a href="{{ feed.tip_feed.tile1_url }}">{{ feed.tip_feed.tile1_name }}</a>{% else %}{{ feed.tip_feed.tile1_name }}{% endif %}</td>
    <td>{% if feed.tip_feed.tile2_url != '' %}<a href="{{ feed.tip_feed.tile2_url }}">{{ feed.tip_feed.tile2_name }}</a>{% else %}{{ feed.tip_feed.tile2_name }}{% endif %}</td>
    <td>{% if feed.tip_feed.tile3_url != '' %}<a href="{{ feed.tip_feed.tile3_url }}">{{ feed.tip_feed.tile3_name }}</a>{% else %}{{ feed.tip_feed.tile3_name }}{% endif %}</td>
  </tr>
  <tr>
    <td>{% if feed.tip_feed.tile4_url != '' %}<a href="{{ feed.tip_feed.tile4_url }}">{{ feed.tip_feed.tile4_name }}</a>{% else %}{{ feed.tip_feed.tile4_name }}{% endif %}</td>
    <td>{% if feed.tip_feed.tile5_url != '' %}<a href="{{ feed.tip_feed.tile5_url }}">{{ feed.tip_feed.tile5_name }}</a>{% else %}{{ feed.tip_feed.tile5_name }}{% endif %}</td>
    <td>{% if feed.tip_feed.tile6_url != '' %}<a href="{{ feed.tip_feed.tile6_url }}">{{ feed.tip_feed.tile6_name }}</a>{% else %}{{ feed.tip_feed.tile6_name }}{% endif %}</td>
  </tr>
</table>

{# ---------- E-mailvoorkeuren ---------- #}
<h3>{{ feed.tip_feed.prefs_title }}</h3>
<p>{{ feed.tip_feed.prefs_text }}</p>
<a href="https://trustoo.nl/login-portal/demand/?token={{ contact.DASHBOARD_LINK_TOKEN }}">
  {{ feed.tip_feed.prefs_link_label }}
</a>
```

> De voorkeuren-link combineert een feedveld (het label) met een contactattribuut (de token).
> De URL hierboven is overgenomen uit `trustoo-servicetips-template.html`. Het label komt uit
> de feed, de token blijft contactniveau en hoort dus niet in de openbare JSON.

## Belangrijk bij het onderhouden

- **Verander de JSON-veldnamen niet.** De veldnamen zijn het contract tussen repository en
  template. Wil je een veld anders noemen, wijzig dan schema, alle feeds én de template in
  één keer.
- **Alle 44 velden zijn verplicht in elk bestand.** Gebruik je een veld niet, geef het dan een
  lege string `""`. Weglaten laat de validatie falen.
- **URL-velden kunnen leeg zijn.** Gebruik `{% if ... != '' %}` zodat een lege waarde geen
  `href=""` of gebroken `<img>` oplevert.
- **Geen arrays of loops nodig.** Deze feed is een plat object (single object data /
  non-repeatable in Brevo-termen). Een **Dynamic content block** is hier niet nodig; die is
  alleen bedoeld voor arrays.
- **`tips_heading_post` en `related_heading_post` staan nu overal leeg.** De koppen eindigen op
  het accentwoord. De velden blijven bestaan zodat je later een staartwoord kunt toevoegen.

## Bronnen

- [Personalize your messages with dynamic content (Brevo Template Language)](https://help.brevo.com/hc/en-us/articles/4402386448530--Manual-Personalize-your-messages-with-dynamic-content-Brevo-Template-Language)
- [Personalize your email content with real-time data (data feed)](https://help.brevo.com/hc/en-us/articles/9854758414098-Personalize-your-email-content-with-real-time-data-data-feed)
- [Getting started with external feeds (Brevo API docs)](https://developers.brevo.com/docs/getting-started-with-external-feeds)
