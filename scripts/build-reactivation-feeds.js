#!/usr/bin/env node
'use strict';

/**
 * Genereert de feeds voor de reactivatiemail (feeds/nl/reactivation/<slug>.json).
 *
 * Bronnen:
 *  - scripts/reactivation-mapping.json  : per bron-slug de drie dienstkaarten (slugs)
 *  - feeds/nl/tips/<slug>.json          : herobeeld + alt van de bron, herobeeld van elke
 *                                         dienstkaart, en de kostenpagina/blog uit cta_url
 *  - images/nl/tips/manifest.json       : Brevo-URL voor beelden zonder tipsfeed (verhuisbedrijf)
 *
 * Alle teksten staan in dit script (SOURCES en RELATED). Na het genereren zijn de
 * JSON-bestanden de bron van waarheid: pas je een feed met de hand of via Feed Studio aan,
 * draai dit script dan niet zomaar opnieuw, want het overschrijft alle reactivatiefeeds.
 *
 * Gebruik:  node scripts/build-reactivation-feeds.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TIPS_DIR = path.join(ROOT, 'feeds', 'nl', 'tips');
const OUT_DIR = path.join(ROOT, 'feeds', 'nl', 'reactivation');
const MAPPING = require('./reactivation-mapping.json');
const MANIFEST = require(path.join(ROOT, 'images', 'nl', 'tips', 'manifest.json'));

// Per bron-slug: hoe we de dienst in de tekst noemen.
//   art    : lidwoord in "je aanvraag voor <art> <noun>" ("" als er geen lidwoord past)
//   noun   : enkelvoud, staat in oranje in de herokop
//   plural : meervoud voor "extra <plural> toevoegen"
//   label  : naam van de dienst op de aanvraagkaart
const SOURCES = {
  'aankoopmakelaar': { art: 'een', noun: 'aankoopmakelaar', plural: 'aankoopmakelaars', label: 'Aankoopmakelaar' },
  'aannemer': { art: 'een', noun: 'aannemer', plural: 'aannemers', label: 'Aannemer' },
  'accountant': { art: 'een', noun: 'accountant', plural: 'accountants', label: 'Accountant' },
  'advocaat': { art: 'een', noun: 'advocaat', plural: 'advocaten', label: 'Advocaat' },
  'airco-installateur': { art: 'een', noun: 'airco-installateur', plural: 'airco-installateurs', label: 'Airco-installateur' },
  'alarmsystemen': { art: 'een', noun: 'alarmsysteem', plural: 'alarminstallateurs', label: 'Alarmsysteem' },
  'architect': { art: 'een', noun: 'architect', plural: 'architecten', label: 'Architect' },
  'asbest': { art: '', noun: 'asbestverwijdering', plural: 'asbestverwijderaars', label: 'Asbestverwijdering' },
  'badkamer-renovatie': { art: 'een', noun: 'badkamerrenovatie', plural: 'badkamerspecialisten', label: 'Badkamerrenovatie' },
  'belastingadviseur': { art: 'een', noun: 'belastingadviseur', plural: 'belastingadviseurs', label: 'Belastingadviseur' },
  'beveiliging': { art: 'een', noun: 'beveiligingsbedrijf', plural: 'beveiligingsbedrijven', label: 'Beveiliging' },
  'boekhouder': { art: 'een', noun: 'boekhouder', plural: 'boekhouders', label: 'Boekhouder' },
  'boomverzorging': { art: '', noun: 'boomverzorging', plural: 'boomverzorgers', label: 'Boomverzorging' },
  'bouwkundige-keuring': { art: 'een', noun: 'bouwkundige keuring', plural: 'bouwkundig keurders', label: 'Bouwkundige keuring' },
  'catering': { art: '', noun: 'catering', plural: 'cateraars', label: 'Catering' },
  'coaching': { art: 'een', noun: 'coach', plural: 'coaches', label: 'Coaching' },
  'cv-verwarmings-installateur': { art: 'een', noun: 'cv-installateur', plural: 'cv-installateurs', label: 'Cv-installateur' },
  'dakdekker': { art: 'een', noun: 'dakdekker', plural: 'dakdekkers', label: 'Dakdekker' },
  'dakgoot': { art: 'een', noun: 'dakgootspecialist', plural: 'dakgootspecialisten', label: 'Dakgoot' },
  'dakkapellen': { art: 'een', noun: 'dakkapel', plural: 'dakkapelspecialisten', label: 'Dakkapel' },
  'dietist': { art: 'een', noun: 'diëtist', plural: 'diëtisten', label: 'Diëtist' },
  'dj': { art: 'een', noun: 'DJ', plural: "DJ's", label: 'DJ' },
  'elektricien': { art: 'een', noun: 'elektricien', plural: 'elektriciens', label: 'Elektricien' },
  'energielabel-adviseur': { art: 'een', noun: 'energielabel', plural: 'energielabel-adviseurs', label: 'Energielabel' },
  'financieel-adviseur': { art: 'een', noun: 'financieel adviseur', plural: 'financieel adviseurs', label: 'Financieel adviseur' },
  'fotograaf': { art: 'een', noun: 'fotograaf', plural: 'fotografen', label: 'Fotograaf' },
  'gevelreiniging': { art: '', noun: 'gevelreiniging', plural: 'gevelreinigers', label: 'Gevelreiniging' },
  'gevelrenovatie': { art: '', noun: 'gevelrenovatie', plural: 'gevelspecialisten', label: 'Gevelrenovatie' },
  'glaszetter': { art: 'een', noun: 'glaszetter', plural: 'glaszetters', label: 'Glaszetter' },
  'grafisch-ontwerper': { art: 'een', noun: 'grafisch ontwerper', plural: 'grafisch ontwerpers', label: 'Grafisch ontwerper' },
  'hekwerk': { art: 'een', noun: 'hekwerk', plural: 'hekwerkspecialisten', label: 'Hekwerk' },
  'hovenier': { art: 'een', noun: 'hovenier', plural: 'hoveniers', label: 'Hovenier' },
  'hypotheekadviseur': { art: 'een', noun: 'hypotheekadviseur', plural: 'hypotheekadviseurs', label: 'Hypotheekadviseur' },
  'incassobureau': { art: 'een', noun: 'incassobureau', plural: 'incassobureaus', label: 'Incassobureau' },
  'interieurstylist': { art: 'een', noun: 'interieurstylist', plural: 'interieurstylisten', label: 'Interieurstylist' },
  'isolatie': { art: '', noun: 'isolatie', plural: 'isolatiebedrijven', label: 'Isolatie' },
  'keukenrenovatie': { art: 'een', noun: 'keukenspecialist', plural: 'keukenspecialisten', label: 'Keukenrenovatie' },
  'klusjesman': { art: 'een', noun: 'klusjesman', plural: 'klusjesmannen', label: 'Klusjesman' },
  'koffieautomaat': { art: 'een', noun: 'koffieautomaat', plural: 'koffieautomaatleveranciers', label: 'Koffieautomaat' },
  'kozijnen': { art: '', noun: 'nieuwe kozijnen', plural: 'kozijnspecialisten', label: 'Kozijnen' },
  'laadpalen': { art: 'een', noun: 'laadpaal', plural: 'laadpaalinstallateurs', label: 'Laadpaal' },
  'loodgieter': { art: 'een', noun: 'loodgieter', plural: 'loodgieters', label: 'Loodgieter' },
  'loopbaancoach': { art: 'een', noun: 'loopbaancoach', plural: 'loopbaancoaches', label: 'Loopbaancoach' },
  'makelaar': { art: 'een', noun: 'makelaar', plural: 'makelaars', label: 'Makelaar' },
  'mediator': { art: 'een', noun: 'mediator', plural: 'mediators', label: 'Mediator' },
  'mediator-scheiding': { art: 'een', noun: 'scheidingsmediator', plural: 'scheidingsmediators', label: 'Scheidingsmediator' },
  'metselaar': { art: 'een', noun: 'metselaar', plural: 'metselaars', label: 'Metselaar' },
  'meubelmaker': { art: 'een', noun: 'meubelmaker', plural: 'meubelmakers', label: 'Meubelmaker' },
  'notaris': { art: 'een', noun: 'notaris', plural: 'notarissen', label: 'Notaris' },
  'ongediertebestrijder': { art: 'een', noun: 'ongediertebestrijder', plural: 'ongediertebestrijders', label: 'Ongediertebestrijding' },
  'online-marketing': { art: 'een', noun: 'online marketing bureau', plural: 'online marketing bureaus', label: 'Online marketing' },
  'opslag': { art: '', noun: 'opslagruimte', plural: 'opslagaanbieders', label: 'Opslag' },
  'personal-trainer': { art: 'een', noun: 'personal trainer', plural: 'personal trainers', label: 'Personal trainer' },
  'psycholoog': { art: 'een', noun: 'psycholoog', plural: 'psychologen', label: 'Psycholoog' },
  'reclamebureau': { art: 'een', noun: 'reclamebureau', plural: 'reclamebureaus', label: 'Reclamebureau' },
  'relatietherapeut': { art: 'een', noun: 'relatietherapeut', plural: 'relatietherapeuten', label: 'Relatietherapie' },
  'rijschool': { art: 'een', noun: 'rijschool', plural: 'rijscholen', label: 'Rijschool' },
  'rioolservice': { art: 'een', noun: 'rioolspecialist', plural: 'rioolspecialisten', label: 'Rioolservice' },
  'schilder': { art: 'een', noun: 'schilder', plural: 'schilders', label: 'Schilder' },
  'schoonmaakbedrijf': { art: 'een', noun: 'schoonmaakbedrijf', plural: 'schoonmaakbedrijven', label: 'Schoonmaakbedrijf' },
  'schoorsteenveger': { art: 'een', noun: 'schoorsteenveger', plural: 'schoorsteenvegers', label: 'Schoorsteenveger' },
  'seo-specialist': { art: 'een', noun: 'SEO-specialist', plural: 'SEO-specialisten', label: 'SEO-specialist' },
  'sloopbedrijf': { art: 'een', noun: 'sloopbedrijf', plural: 'sloopbedrijven', label: 'Sloopbedrijf' },
  'stoffeerder': { art: 'een', noun: 'stoffeerder', plural: 'stoffeerders', label: 'Stoffeerder' },
  'stratenmaker': { art: 'een', noun: 'stratenmaker', plural: 'stratenmakers', label: 'Stratenmaker' },
  'stukadoor': { art: 'een', noun: 'stukadoor', plural: 'stukadoors', label: 'Stukadoor' },
  'taxateur': { art: 'een', noun: 'taxateur', plural: 'taxateurs', label: 'Taxateur' },
  'tegelzetter': { art: 'een', noun: 'tegelzetter', plural: 'tegelzetters', label: 'Tegelzetter' },
  'tekstschrijver': { art: 'een', noun: 'tekstschrijver', plural: 'tekstschrijvers', label: 'Tekstschrijver' },
  'thuisbatterij': { art: 'een', noun: 'thuisbatterij', plural: 'thuisbatterij-installateurs', label: 'Thuisbatterij' },
  'timmerman': { art: 'een', noun: 'timmerman', plural: 'timmermannen', label: 'Timmerman' },
  'tolk': { art: 'een', noun: 'tolk', plural: 'tolken', label: 'Tolk' },
  'traprenovatie': { art: 'een', noun: 'traprenovatie', plural: 'traprenovatiebedrijven', label: 'Traprenovatie' },
  'trouwfotograaf': { art: 'een', noun: 'trouwfotograaf', plural: 'trouwfotografen', label: 'Trouwfotograaf' },
  'uitvaartverzorger': { art: 'een', noun: 'uitvaartverzorger', plural: 'uitvaartverzorgers', label: 'Uitvaartverzorger' },
  'verhuisbedrijf': { art: 'een', noun: 'verhuisbedrijf', plural: 'verhuisbedrijven', label: 'Verhuisbedrijf' },
  'verkoopmakelaar': { art: 'een', noun: 'verkoopmakelaar', plural: 'verkoopmakelaars', label: 'Verkoopmakelaar' },
  'vertaler': { art: 'een', noun: 'vertaler', plural: 'vertalers', label: 'Vertaler' },
  'verzekering': { art: 'een', noun: 'verzekeringsadviseur', plural: 'verzekeringsadviseurs', label: 'Verzekering' },
  'videograaf': { art: 'een', noun: 'videograaf', plural: 'videografen', label: 'Videograaf' },
  'vloerlegger': { art: 'een', noun: 'vloerlegger', plural: 'vloerleggers', label: 'Vloerlegger' },
  'vochtbestrijding': { art: 'een', noun: 'vochtbestrijder', plural: 'vochtbestrijders', label: 'Vochtbestrijding' },
  'warmtepomp-installateur': { art: 'een', noun: 'warmtepomp', plural: 'warmtepomp-installateurs', label: 'Warmtepomp' },
  'webdesign': { art: 'een', noun: 'webdesigner', plural: 'webdesigners', label: 'Webdesign' },
  'weddingplanner': { art: 'een', noun: 'weddingplanner', plural: 'weddingplanners', label: 'Weddingplanner' },
  'zonnepanelen': { art: '', noun: 'zonnepanelen', plural: 'zonnepanelen-installateurs', label: 'Zonnepanelen' },
  'zonwering': { art: '', noun: 'zonwering', plural: 'zonweringspecialisten', label: 'Zonwering' },
};

// Per dienstkaart-slug: naam (kaartkop), tekst en linklabel. De tekst is bewust
// bron-onafhankelijk geschreven: dezelfde kaart kan na elke bron verschijnen.
const RELATED = {
  'aankoopmakelaar': { name: 'Aankoopmakelaars', text: 'Een aankoopmakelaar onderhandelt voor jou en controleert de woning en de papieren, zodat je niet te veel betaalt.' },
  'aannemer': { name: 'Aannemers', text: 'Voor een verbouwing of grotere klus waar meerdere vakmensen aan werken. Een aannemer regelt planning en uitvoering.' },
  'accountant': { name: 'Accountants', text: 'Voor je jaarrekening, belastingaangifte en advies over je financiën, zakelijk of privé.' },
  'advocaat': { name: 'Advocaten', text: 'Juridisch advies of bijstand nodig? Vergelijk advocaten op specialisme, ervaring en beoordelingen.' },
  'alarmsystemen': { name: 'Alarmsystemen', text: 'Een alarmsysteem met sensoren en camera\'s, aangelegd door een erkende installateur.' },
  'asbest': { name: 'Asbestverwijderaars', text: 'Asbest in dak, vloer of leidingen? Laat het veilig en gecertificeerd verwijderen.' },
  'badkamer-renovatie': { name: 'Badkamerspecialisten', text: 'Van tegelwerk tot sanitair: een badkamerspecialist pakt de hele badkamer in één keer aan.' },
  'belastingadviseur': { name: 'Belastingadviseurs', text: 'Voor je aangifte, toeslagen of fiscaal advies bij grote stappen zoals een huis of een eigen bedrijf.' },
  'beveiliging': { name: 'Beveiligingsbedrijven', text: 'Camera\'s, toegangscontrole of alarmopvolging voor je woning of bedrijfspand.' },
  'boekhouder': { name: 'Boekhouders', text: 'Een boekhouder houdt je administratie bij en doet je aangiftes, zodat jij je op je werk kunt richten.' },
  'boomverzorging': { name: 'Boomverzorgers', text: 'Snoeien, kappen of een zieke boom laten beoordelen. Een boomverzorger doet het veilig en vakkundig.' },
  'bouwkundige-keuring': { name: 'Bouwkundige keuringen', text: 'Laat de staat van een woning onafhankelijk beoordelen voordat je koopt of gaat verbouwen.', link: 'Bekijk bouwkundig keurders' },
  'catering': { name: 'Cateraars', text: 'Hapjes, buffet of diner voor je feest of bijeenkomst. Vergelijk cateraars op menu en prijs.' },
  'coaching': { name: 'Coaches', text: 'Een coach helpt je bij persoonlijke doelen, meer balans of een volgende stap in je leven.' },
  'cv-verwarmings-installateur': { name: 'Cv-installateurs', text: 'Voor onderhoud, reparatie of vervanging van je cv-ketel en verwarming.' },
  'dakdekker': { name: 'Dakdekkers', text: 'Lekkage, onderhoud of een nieuw dak? Een dakdekker beoordeelt en herstelt je dak.' },
  'dakgoot': { name: 'Dakgootspecialisten', text: 'Dakgoten reinigen, repareren of vervangen, zodat regenwater goed wordt afgevoerd.' },
  'dakkapellen': { name: 'Dakkapelspecialisten', text: 'Meer ruimte en licht op zolder met een dakkapel, van ontwerp tot plaatsing.' },
  'dietist': { name: 'Diëtisten', text: 'Persoonlijk voedingsadvies voor gezonder eten, afvallen of een medische aandoening.', link: 'Bekijk diëtisten' },
  'dj': { name: "DJ's", text: 'Een DJ die de sfeer op je feest of bruiloft aanvoelt en de dansvloer vol houdt.', link: "Bekijk DJ's" },
  'elektricien': { name: 'Elektriciens', text: 'Voor een nieuwe groepenkast, extra stopcontacten, verlichting of een storing.' },
  'energielabel-adviseur': { name: 'Energielabel-adviseurs', text: 'Een erkend adviseur stelt het energielabel van je woning op, verplicht bij verkoop of verhuur.' },
  'financieel-adviseur': { name: 'Financieel adviseurs', text: 'Onafhankelijk advies over je hypotheek, pensioen, vermogen of een grote uitgave.' },
  'fotograaf': { name: 'Fotografen', text: 'Voor een bruiloft, feest, portret of zakelijke shoot. Vergelijk stijl en portfolio.' },
  'gevelreiniging': { name: 'Gevelreinigers', text: 'Groene aanslag, vervuiling of graffiti? Een gevelreiniger maakt je gevel weer schoon.' },
  'gevelrenovatie': { name: 'Gevelrenovatiebedrijven', text: 'Voegwerk herstellen, impregneren of isoleren voor een gevel die weer jaren meegaat.' },
  'glaszetter': { name: 'Glaszetters', text: 'Een gebroken ruit, isolatieglas of nieuw glas in je kozijnen, snel geregeld.' },
  'grafisch-ontwerper': { name: 'Grafisch ontwerpers', text: 'Een logo, huisstijl of drukwerk dat past bij jouw bedrijf of project.' },
  'hekwerk': { name: 'Hekwerkspecialisten', text: 'Een schutting, hek of poort voor privacy en veiligheid rond je tuin.' },
  'hovenier': { name: 'Hoveniers', text: 'Tuinontwerp, aanleg of onderhoud. Een hovenier maakt van je tuin een plek waar je graag bent.' },
  'hypotheekadviseur': { name: 'Hypotheekadviseurs', text: 'Bereken wat je kunt lenen en vergelijk hypotheken met een onafhankelijk adviseur.' },
  'interieurstylist': { name: 'Interieurstylisten', text: 'Een stylist helpt met kleuren, indeling en materialen voor een interieur dat klopt.' },
  'isolatie': { name: 'Isolatiebedrijven', text: 'Dak, muren of vloer isoleren voor meer comfort en een lagere energierekening.' },
  'keukenrenovatie': { name: 'Keukenspecialisten', text: 'Een nieuwe keuken of je huidige keuken opknappen, van ontwerp tot montage.' },
  'klusjesman': { name: 'Klusjesmannen', text: 'Voor kleine klussen in en om het huis die je liever niet zelf doet.' },
  'kozijnen': { name: 'Kozijnspecialisten', text: 'Nieuwe kozijnen van hout, kunststof of aluminium, inclusief plaatsing.' },
  'laadpalen': { name: 'Laadpaalinstallateurs', text: 'Een laadpaal bij huis, veilig aangesloten door een erkende installateur.' },
  'loodgieter': { name: 'Loodgieters', text: 'Lekkage, verstopping of nieuw sanitair. Een loodgieter lost het snel en netjes op.' },
  'loopbaancoach': { name: 'Loopbaancoaches', text: 'Twijfel je over je werk of wil je een volgende stap? Een loopbaancoach helpt je kiezen.' },
  'makelaar': { name: 'Makelaars', text: 'Voor de verkoop of aankoop van een woning, met kennis van de lokale markt.' },
  'mediator': { name: 'Mediators', text: 'Een mediator helpt om samen tot een oplossing te komen, zonder rechtszaak.' },
  'mediator-scheiding': { name: 'Scheidingsmediators', text: 'Samen afspraken maken over kinderen, woning en financiën bij een scheiding.' },
  'metselaar': { name: 'Metselaars', text: 'Voor nieuw metselwerk, een aanbouw of het herstellen van muren en voegen.' },
  'meubelmaker': { name: 'Meubelmakers', text: 'Een kast, tafel of inbouwmeubel op maat, precies passend in jouw ruimte.' },
  'notaris': { name: 'Notarissen', text: 'Voor de akte bij een woning, een testament of een samenlevingscontract.' },
  'ongediertebestrijder': { name: 'Ongediertebestrijders', text: 'Muizen, wespen of ander ongedierte? Een bestrijder pakt het probleem bij de bron aan.' },
  'online-marketing': { name: 'Online marketing bureaus', text: 'Meer klanten via Google, social media of e-mail, met een bureau dat resultaat meet.' },
  'opslag': { name: 'Opslagruimte', text: 'Tijdelijk spullen kwijt tijdens een verhuizing of verbouwing? Vergelijk opslagaanbieders.', link: 'Bekijk opslagruimte' },
  'personal-trainer': { name: 'Personal trainers', text: 'Een trainer die met je meedenkt en je motiveert om fitter te worden.' },
  'psycholoog': { name: 'Psychologen', text: 'Professionele hulp bij stress, angst, somberheid of andere klachten.' },
  'reclamebureau': { name: 'Reclamebureaus', text: 'Een campagne of merkverhaal dat opvalt, van concept tot uitvoering.' },
  'relatietherapeut': { name: 'Relatietherapeuten', text: 'Samen werken aan je relatie, met begeleiding van een ervaren therapeut.' },
  'rioolservice': { name: 'Rioolspecialisten', text: 'Verstopping, stank of een lek riool? Een rioolspecialist inspecteert en herstelt.' },
  'schilder': { name: 'Schilders', text: 'Binnen of buiten schilderen, netjes afgewerkt en met verf die lang meegaat.' },
  'schoonmaakbedrijf': { name: 'Schoonmaakbedrijven', text: 'Een grondige schoonmaak van je woning, bijvoorbeeld na een verbouwing of verhuizing.' },
  'schoorsteenveger': { name: 'Schoorsteenvegers', text: 'Laat je schoorsteen jaarlijks vegen voor een veilige en goed trekkende kachel.' },
  'seo-specialist': { name: 'SEO-specialisten', text: 'Hoger in Google met een specialist die je website en content verbetert.', link: 'Bekijk SEO-specialisten' },
  'sloopbedrijf': { name: 'Sloopbedrijven', text: 'Een muur, aanbouw of complete woning slopen, inclusief afvoer van het puin.' },
  'stoffeerder': { name: 'Stoffeerders', text: 'Vloerbedekking, trapbekleding of meubels opnieuw laten bekleden door een stoffeerder.' },
  'stratenmaker': { name: 'Stratenmakers', text: 'Een nieuwe oprit, terras of tuinpad, strak gelegd door een stratenmaker.' },
  'stukadoor': { name: 'Stukadoors', text: 'Strakke muren en plafonds als basis voor verf of behang.' },
  'taxateur': { name: 'Taxateurs', text: 'Een gevalideerd taxatierapport voor je hypotheek, verkoop of aankoop.' },
  'tegelzetter': { name: 'Tegelzetters', text: 'Tegels in badkamer, keuken of hal, strak gelegd en netjes gevoegd.' },
  'tekstschrijver': { name: 'Tekstschrijvers', text: 'Teksten voor je website, blog of brochure die lezers overtuigen.' },
  'thuisbatterij': { name: 'Thuisbatterij-installateurs', text: 'Sla je eigen zonnestroom op en gebruik hem op het moment dat je hem nodig hebt.' },
  'timmerman': { name: 'Timmermannen', text: 'Voor een dakkapel, aanbouw, kozijnen of ander houtwerk in en om het huis.' },
  'tolk': { name: 'Tolken', text: 'Een tolk voor een gesprek, afspraak of zitting waar taal een drempel is.' },
  'trouwfotograaf': { name: 'Trouwfotografen', text: 'Een fotograaf die de mooiste momenten van je bruiloft vastlegt.' },
  'verhuisbedrijf': { name: 'Verhuisbedrijven', text: 'Zorgeloos verhuizen met een bedrijf dat inpakt, sjouwt en vervoert.' },
  'verkoopmakelaar': { name: 'Verkoopmakelaars', text: 'Je woning goed in de markt zetten en verkopen voor de beste prijs.' },
  'vertaler': { name: 'Vertalers', text: 'Een beëdigde of gewone vertaling van documenten, teksten of je website.' },
  'verzekering': { name: 'Verzekeringsadviseurs', text: 'Advies over de verzekeringen die bij jouw situatie passen, zonder dubbele dekking.' },
  'videograaf': { name: 'Videografen', text: 'Een film van je bruiloft, evenement of bedrijf, professioneel gefilmd en gemonteerd.' },
  'vloerlegger': { name: 'Vloerleggers', text: 'Laminaat, pvc, parket of een gietvloer, vakkundig gelegd door een vloerlegger.' },
  'vochtbestrijding': { name: 'Vochtbestrijders', text: 'Vochtplekken, schimmel of een natte kruipruimte? Een specialist pakt de oorzaak aan.' },
  'warmtepomp-installateur': { name: 'Warmtepomp-installateurs', text: 'Duurzaam verwarmen met een warmtepomp, inclusief advies over wat past bij je woning.' },
  'webdesign': { name: 'Webdesigners', text: 'Een website die er goed uitziet, snel laadt en klanten oplevert.' },
  'weddingplanner': { name: 'Weddingplanners', text: 'Een planner die je bruiloft van begin tot eind organiseert, zodat jij kunt genieten.' },
  'zonnepanelen': { name: 'Zonnepanelen-installateurs', text: 'Zelf stroom opwekken met zonnepanelen, geplaatst door een erkende installateur.' },
  'zonwering': { name: 'Zonweringspecialisten', text: 'Screens, rolluiken of een knikarmscherm tegen zon en warmte.' },
};

// Beelden voor bronnen/dienstkaarten zonder tipsfeed komen uit het manifest (extra's).
const MANIFEST_IMAGE = { 'verhuisbedrijf': 'hero-verhuizer.jpg' };
// Kostenpagina voor bronnen zonder tipsfeed (gecontroleerd op 200 op 2026-09-08).
const EXTRA_HERO_LINK = { 'verhuisbedrijf': 'https://trustoo.nl/kosten/verhuisbedrijf-kosten/' };

function readTips(slug) {
  const file = path.join(TIPS_DIR, `${slug}.json`);
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
}

function imageFor(slug) {
  const tips = readTips(slug);
  if (tips && tips.hero_image_url) return { url: tips.hero_image_url, alt: tips.hero_image_alt };
  const file = MANIFEST_IMAGE[slug];
  const entry = file && MANIFEST.find((e) => e.file === file);
  if (entry && entry.brevo_url) return { url: entry.brevo_url, alt: entry.alt };
  throw new Error(`Geen beeld voor '${slug}'`);
}

function utm(url, campaign, content) {
  const base = url.split('?')[0];
  return `${base}?utm_source=brevo&utm_campaign=${campaign}&utm_medium=email&utm_content=${content}`;
}

function heroLinkFor(slug, campaign) {
  const tips = readTips(slug);
  const url = (tips && tips.cta_url) || EXTRA_HERO_LINK[slug];
  if (!url) throw new Error(`Geen kostenpagina/blog voor '${slug}'`);
  return utm(url, campaign, 'heroimage');
}

function cap(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function buildFeed(slug, related) {
  const campaign = `reactivatie_${slug.replace(/-/g, '_')}_mail1`;
  const isDefault = slug === 'default';
  const src = isDefault
    ? { art: 'een', noun: 'bedrijf', plural: 'bedrijven', label: 'Je aanvraag' }
    : SOURCES[slug];
  if (!src) throw new Error(`Geen SOURCES-entry voor '${slug}'`);
  const topic = src.art ? `${src.art} ${src.noun}` : src.noun;
  const hero = isDefault ? readTips('default') : imageFor(slug);
  const heroUrl = isDefault ? hero.hero_image_url : hero.url;
  const heroAlt = isDefault ? hero.hero_image_alt : hero.alt;
  const serviceUrl = `https://trustoo.nl/nederland/${slug}/`;

  const feed = {
    title: isDefault ? 'Je aanvraag staat nog open' : `Je aanvraag voor ${topic} staat nog open`,
    // Onderwerpregel: de vraagvorm als die binnen 70 tekens past, anders de kortere vorm.
    subject_line: isDefault
      ? 'Je aanvraag op Trustoo staat nog open'
      : `Nog op zoek naar ${topic}? Je aanvraag staat nog open`.length <= 70
        ? `Nog op zoek naar ${topic}? Je aanvraag staat nog open`
        : `Je aanvraag voor ${topic} staat nog open`,
    preheader: `Voeg met één klik extra ${src.plural} toe aan je aanvraag en ontvang alsnog offertes. Of bekijk wat nu voor jou handig is.`,
    hero_link_url: isDefault
      ? utm('https://trustoo.nl/kosten/', campaign, 'heroimage')
      : heroLinkFor(slug, campaign),
    hero_image_url: heroUrl,
    hero_image_alt: heroAlt,
    hero_title_pre: isDefault ? 'Je aanvraag' : src.art ? `Je aanvraag voor ${src.art}` : 'Je aanvraag voor',
    hero_title_accent: isDefault ? 'staat nog open' : src.noun,
    hero_title_post: isDefault ? '' : 'staat nog open',
    hero_subtitle: isDefault
      ? 'Een paar maanden geleden deed je een aanvraag via Trustoo, maar die is nog niet afgerond. Voeg extra bedrijven toe en ontvang alsnog offertes om te vergelijken.'
      : `Een paar maanden geleden zocht je via Trustoo ${topic}, maar je aanvraag is nog niet afgerond. Voeg extra ${src.plural} toe en ontvang alsnog offertes om te vergelijken.`,
    hero_cta_label: `Extra ${src.plural} toevoegen`,
    campaign_key: campaign,
    request_label: 'Je openstaande aanvraag',
    request_service: src.label,
    request_meta: 'Een paar maanden geleden aangevraagd via Trustoo',
    request_status: 'Nog open',
    cta_label: `Voeg extra ${src.plural} toe aan je aanvraag`,
    cta_note: 'Gratis en vrijblijvend. Je bestaande aanvraag blijft staan, je krijgt er alleen meer reacties op.',
    services_heading_pre: 'Ook',
    services_heading_accent: 'handig',
    services_heading_post: isDefault ? 'voor jou' : `als je ${topic} zoekt`,
    services_intro: isDefault
      ? 'Deze diensten worden het vaakst aangevraagd op Trustoo. Je vindt ze met beoordelingen van anderen en vraagt gratis offertes aan.'
      : `Mensen die ${topic} zoeken, hebben vaak ook een van deze diensten nodig. Op Trustoo vind je ze met beoordelingen van anderen en vraag je gratis offertes aan.`,
  };

  related.forEach((rel, i) => {
    const n = i + 1;
    const r = RELATED[rel];
    if (!r) throw new Error(`Geen RELATED-entry voor '${rel}' (bron ${slug})`);
    const img = imageFor(rel);
    feed[`service${n}_name`] = r.name;
    feed[`service${n}_text`] = r.text;
    feed[`service${n}_url`] = utm(`https://trustoo.nl/nederland/${rel}/`, campaign, `${rel.replace(/-/g, '')}card`);
    feed[`service${n}_link_label`] = r.link || `Bekijk ${r.name.charAt(0).toLowerCase()}${r.name.slice(1)}`;
    feed[`service${n}_image_url`] = img.url;
    feed[`service${n}_image_alt`] = img.alt;
  });

  Object.assign(feed, {
    closing_heading_pre: 'Al geregeld of liever',
    closing_heading_accent: 'opnieuw beginnen?',
    closing_heading_post: '',
    closing_intro: isDefault
      ? 'Heb je inmiddels een bedrijf gevonden? Rond je aanvraag dan af, zodat bedrijven weten dat ze niet meer hoeven te reageren. Liever met een schone lei starten? Doe dan een nieuwe aanvraag.'
      : `Heb je inmiddels ${topic} gevonden? Rond je aanvraag dan af, zodat bedrijven weten dat ze niet meer hoeven te reageren. Liever met een schone lei starten? Doe dan een nieuwe aanvraag.`,
    done_link_label: 'Aanvraag afronden',
    new_request_url: utm(isDefault ? 'https://trustoo.nl/' : serviceUrl, campaign, 'nieuweaanvraagcta'),
    new_request_label: 'Nieuwe aanvraag doen',
  });

  return feed;
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const written = [];
  for (const [slug, related] of Object.entries(MAPPING.sources)) {
    const feed = buildFeed(slug, related);
    fs.writeFileSync(path.join(OUT_DIR, `${slug}.json`), JSON.stringify(feed, null, 2) + '\n');
    written.push(slug);
  }
  // Aliassen: identieke inhoud onder een tweede bestandsnaam, alleen de campaign_key en
  // de nieuwe-aanvraag-link blijven die van de canonieke slug.
  for (const [alias, canon] of Object.entries(MAPPING.aliases || {})) {
    fs.copyFileSync(path.join(OUT_DIR, `${canon}.json`), path.join(OUT_DIR, `${alias}.json`));
    written.push(`${alias} (alias van ${canon})`);
  }
  console.log(`${written.length} reactivatiefeeds geschreven naar ${path.relative(ROOT, OUT_DIR)}/`);
}

main();
