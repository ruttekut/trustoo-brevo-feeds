# Templateveld-mapping: huidige variabelen → Brevo-feedvariabelen

De bestaande e-mailtemplate gebruikt losse rootvariabelen zoals `{{title}}` en `{{card1_title}}`.
Een Brevo **Personalized Data Feed** stelt die velden **niet** als losse rootvariabelen beschikbaar.
Alle feedvelden zitten onder het feedobject, aangesproken via de alias van de feed.

Volgens de Brevo-documentatie is de syntaxis: `{{ feed.<feedalias>.<veld> }}`.

In deze repository is de gekozen feedalias:

```text
trustoo_tips
```

> **Let op:** de alias wordt in Brevo automatisch afgeleid van de feednaam. Noem de feed
> `Trustoo tips`, dan wordt de alias `trustoo_tips`. Controleer de werkelijke alias op de
> pagina **Data feeds** in je Brevo-account en gebruik exact die spelling en hoofdlettergebruik.

## Mapping van alle 30 velden

| Huidige templatevariabele | Nieuwe feedvariabele | Type |
| --- | --- | --- |
| `{{title}}` | `{{ feed.trustoo_tips.title }}` | tekst |
| `{{preheader}}` | `{{ feed.trustoo_tips.preheader }}` | tekst |
| `{{white_panel_bg_url}}` | `{{ feed.trustoo_tips.white_panel_bg_url }}` | URL |
| `{{header_link_label}}` | `{{ feed.trustoo_tips.header_link_label }}` | tekst |
| `{{header_link_url}}` | `{{ feed.trustoo_tips.header_link_url }}` | URL |
| `{{hero_title_pre}}` | `{{ feed.trustoo_tips.hero_title_pre }}` | tekst |
| `{{hero_title_accent}}` | `{{ feed.trustoo_tips.hero_title_accent }}` | tekst |
| `{{hero_title_post}}` | `{{ feed.trustoo_tips.hero_title_post }}` | tekst |
| `{{hero_subtitle}}` | `{{ feed.trustoo_tips.hero_subtitle }}` | tekst |
| `{{cards_heading}}` | `{{ feed.trustoo_tips.cards_heading }}` | tekst |
| `{{card1_title}}` | `{{ feed.trustoo_tips.card1_title }}` | tekst |
| `{{card1_text}}` | `{{ feed.trustoo_tips.card1_text }}` | tekst |
| `{{card1_link_label}}` | `{{ feed.trustoo_tips.card1_link_label }}` | tekst |
| `{{card1_url}}` | `{{ feed.trustoo_tips.card1_url }}` | URL |
| `{{card1_image_url}}` | `{{ feed.trustoo_tips.card1_image_url }}` | URL |
| `{{card1_image_alt}}` | `{{ feed.trustoo_tips.card1_image_alt }}` | tekst |
| `{{card2_title}}` | `{{ feed.trustoo_tips.card2_title }}` | tekst |
| `{{card2_text}}` | `{{ feed.trustoo_tips.card2_text }}` | tekst |
| `{{card2_link_label}}` | `{{ feed.trustoo_tips.card2_link_label }}` | tekst |
| `{{card2_url}}` | `{{ feed.trustoo_tips.card2_url }}` | URL |
| `{{card2_image_url}}` | `{{ feed.trustoo_tips.card2_image_url }}` | URL |
| `{{card2_image_alt}}` | `{{ feed.trustoo_tips.card2_image_alt }}` | tekst |
| `{{card3_title}}` | `{{ feed.trustoo_tips.card3_title }}` | tekst |
| `{{card3_text}}` | `{{ feed.trustoo_tips.card3_text }}` | tekst |
| `{{card3_link_label}}` | `{{ feed.trustoo_tips.card3_link_label }}` | tekst |
| `{{card3_url}}` | `{{ feed.trustoo_tips.card3_url }}` | URL |
| `{{card3_image_url}}` | `{{ feed.trustoo_tips.card3_image_url }}` | URL |
| `{{card3_image_alt}}` | `{{ feed.trustoo_tips.card3_image_alt }}` | tekst |
| `{{cta_label}}` | `{{ feed.trustoo_tips.cta_label }}` | tekst |
| `{{cta_url}}` | `{{ feed.trustoo_tips.cta_url }}` | URL |

## Volledig kopieerbaar Twig-voorbeeld

Alle 30 velden worden hieronder rechtstreeks via `feed.trustoo_tips` aangesproken.
Geen arrays, geen loops, geen gewijzigde veldnamen.

```twig
{# ---------- Meta ---------- #}
<title>{{ feed.trustoo_tips.title }}</title>
<span style="display:none;font-size:0;line-height:0;">{{ feed.trustoo_tips.preheader }}</span>

{# ---------- Header ---------- #}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
       {% if feed.trustoo_tips.white_panel_bg_url != '' %}background="{{ feed.trustoo_tips.white_panel_bg_url }}"{% endif %}>
  <tr>
    <td align="right">
      {% if feed.trustoo_tips.header_link_url != '' %}
        <a href="{{ feed.trustoo_tips.header_link_url }}">{{ feed.trustoo_tips.header_link_label }}</a>
      {% else %}
        {{ feed.trustoo_tips.header_link_label }}
      {% endif %}
    </td>
  </tr>
</table>

{# ---------- Hero ---------- #}
<h1>
  {{ feed.trustoo_tips.hero_title_pre }}
  <span style="color:#0057FF;">{{ feed.trustoo_tips.hero_title_accent }}</span>
  {{ feed.trustoo_tips.hero_title_post }}
</h1>
<p>{{ feed.trustoo_tips.hero_subtitle }}</p>

{# ---------- Kaarten ---------- #}
<h2>{{ feed.trustoo_tips.cards_heading }}</h2>

{# Kaart 1 #}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td>
      {% if feed.trustoo_tips.card1_image_url != '' %}
        <img src="{{ feed.trustoo_tips.card1_image_url }}" alt="{{ feed.trustoo_tips.card1_image_alt }}" width="160" style="display:block;border:0;">
      {% endif %}
      <h3>{{ feed.trustoo_tips.card1_title }}</h3>
      <p>{{ feed.trustoo_tips.card1_text }}</p>
      {% if feed.trustoo_tips.card1_url != '' and feed.trustoo_tips.card1_link_label != '' %}
        <a href="{{ feed.trustoo_tips.card1_url }}">{{ feed.trustoo_tips.card1_link_label }}</a>
      {% endif %}
    </td>
  </tr>
</table>

{# Kaart 2 #}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td>
      {% if feed.trustoo_tips.card2_image_url != '' %}
        <img src="{{ feed.trustoo_tips.card2_image_url }}" alt="{{ feed.trustoo_tips.card2_image_alt }}" width="160" style="display:block;border:0;">
      {% endif %}
      <h3>{{ feed.trustoo_tips.card2_title }}</h3>
      <p>{{ feed.trustoo_tips.card2_text }}</p>
      {% if feed.trustoo_tips.card2_url != '' and feed.trustoo_tips.card2_link_label != '' %}
        <a href="{{ feed.trustoo_tips.card2_url }}">{{ feed.trustoo_tips.card2_link_label }}</a>
      {% endif %}
    </td>
  </tr>
</table>

{# Kaart 3 #}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td>
      {% if feed.trustoo_tips.card3_image_url != '' %}
        <img src="{{ feed.trustoo_tips.card3_image_url }}" alt="{{ feed.trustoo_tips.card3_image_alt }}" width="160" style="display:block;border:0;">
      {% endif %}
      <h3>{{ feed.trustoo_tips.card3_title }}</h3>
      <p>{{ feed.trustoo_tips.card3_text }}</p>
      {% if feed.trustoo_tips.card3_url != '' and feed.trustoo_tips.card3_link_label != '' %}
        <a href="{{ feed.trustoo_tips.card3_url }}">{{ feed.trustoo_tips.card3_link_label }}</a>
      {% endif %}
    </td>
  </tr>
</table>

{# ---------- CTA ---------- #}
{% if feed.trustoo_tips.cta_url != '' %}
  <a href="{{ feed.trustoo_tips.cta_url }}"
     style="display:inline-block;padding:14px 24px;background:#0057FF;color:#ffffff;text-decoration:none;border-radius:6px;">
    {{ feed.trustoo_tips.cta_label }}
  </a>
{% else %}
  <span>{{ feed.trustoo_tips.cta_label }}</span>
{% endif %}
```

## Belangrijk bij het overzetten

- **Zoek en vervang per veld.** Vervang `{{title}}` door `{{ feed.trustoo_tips.title }}`, enzovoort.
  Doe dit veld voor veld; een globale vervanging van `{{` gaat mis.
- **Verander de JSON-veldnamen niet.** De veldnamen in de feed zijn de contractnaam tussen
  repository en template. Wil je een veld anders noemen, wijzig dan schema, feeds én template
  in één keer.
- **URL-velden kunnen leeg zijn.** Gebruik `{% if ... != '' %}` zodat een lege waarde geen
  `href=""` of gebroken `<img>` oplevert.
- **De preview-syntaxis kan per editor verschillen.** In de drag-and-drop-editor voeg je een
  feedvariabele in via de variabelekiezer van het contentblok; in de HTML-editor typ je de
  variabele zelf. Controleer altijd in **Preview & test** of de waarde daadwerkelijk wordt
  geladen voordat je verzendt.
- **Geen arrays of loops nodig.** Deze feed is een plat object (single object data /
  non-repeatable in Brevo-termen). Een **Dynamic content block** is hier niet nodig; die is
  alleen bedoeld voor arrays.

## Bronnen

- [Personalize your messages with dynamic content (Brevo Template Language)](https://help.brevo.com/hc/en-us/articles/4402386448530--Manual-Personalize-your-messages-with-dynamic-content-Brevo-Template-Language)
- [Personalize your email content with real-time data (data feed)](https://help.brevo.com/hc/en-us/articles/9854758414098-Personalize-your-email-content-with-real-time-data-data-feed)
- [Getting started with external feeds (Brevo API docs)](https://developers.brevo.com/docs/getting-started-with-external-feeds)
