#!/usr/bin/env node
'use strict';
/**
 * Bouwt feeds/nl/cross-sell/<slug>.json (cross-sellmail 1, NL) uit
 *  - scripts/cross-sell-mapping.json  (per bron de vier doel-slugs, alleen slugs)
 *  - de copy in dit bestand (THEMES, SOURCES, TARGETS)
 *  - de herobeelden uit feeds/nl/tips en feeds/nl/reactivation (beeld + alt per slug)
 *
 * Gebruik: node scripts/build-cross-sell-feeds.js
 * Daarna:  npm run validate
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'feeds', 'nl', 'cross-sell');
const mapping = require('./cross-sell-mapping.json');
const schema = require('../schemas/cross-sell-feed.schema.json');
const FIELDS = schema.required;

// ---------------------------------------------------------------------------
// Beelden: per slug het actuele herobeeld (Brevo-URL) en de alt-tekst.
// ---------------------------------------------------------------------------
function loadImages() {
  const images = {};
  for (const type of ['tips', 'reactivation']) {
    const dir = path.join(ROOT, 'feeds', 'nl', type);
    for (const f of fs.readdirSync(dir)) {
      if (!f.endsWith('.json')) continue;
      const slug = f.slice(0, -5);
      if (images[slug]) continue;
      const d = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
      if (d.hero_image_url) images[slug] = { url: d.hero_image_url, alt: d.hero_image_alt };
    }
  }
  return images;
}

// ---------------------------------------------------------------------------
// Thema's: kop en intro boven de vier kaarten (het "overkoepelende project").
// ---------------------------------------------------------------------------
const THEMES = {
  verbouwen: {
    heading: ['Maak je', 'verbouwing', 'compleet'],
    intro: 'Bij een verbouwing komen vaak meerdere vakmensen samen. Deze diensten vroegen anderen via Trustoo vaak aan rond dezelfde klus. Vergelijk beoordelingen en ontvang gratis een prijsindicatie.',
  },
  opfrissen: {
    heading: ['Je woning', 'opfrissen', 'tot in de details'],
    intro: 'Een opfrisbeurt stopt zelden bij één klus. Deze vakmensen schakelen mensen vaak in rond hetzelfde project. Vergelijk beoordelingen en ontvang gratis een prijsindicatie.',
  },
  verduurzamen: {
    heading: ['Verder', 'verduurzamen', 'in één keer'],
    intro: 'Verduurzamen gaat stap voor stap, en veel stappen versterken elkaar. Deze diensten vroegen anderen vaak aan in dezelfde periode. Vergelijk beoordelingen en ontvang gratis een prijsindicatie.',
  },
  buitenkant: {
    heading: ['Je huis', 'buitenom', 'in orde'],
    intro: 'Dak, gevel en goten hangen samen. Wie het ene aanpakt, laat vaak ook het andere nakijken. Vergelijk beoordelingen en ontvang gratis een prijsindicatie.',
  },
  keukenbadkamer: {
    heading: ['Je nieuwe', 'keuken of badkamer', 'helemaal af'],
    intro: 'Een nieuwe keuken of badkamer vraagt om meer dan één vakman: leidingen, stroom, tegels en afwerking. Deze diensten vroegen anderen vaak samen aan. Vergelijk beoordelingen en ontvang gratis een prijsindicatie.',
  },
  verhuizen: {
    heading: ['Alles voor een', 'soepele verhuizing', ''],
    intro: 'Een verhuizing is meer dan dozen sjouwen. Deze diensten regelen anderen vaak in dezelfde weken. Vergelijk beoordelingen en ontvang gratis een prijsindicatie.',
  },
  wonen: {
    heading: ['Je', 'woning', 'goed geregeld'],
    intro: 'Rond een woning komen vaak meerdere adviseurs langs. Deze diensten vroegen anderen via Trustoo vaak aan rond hetzelfde moment. Vergelijk beoordelingen en ontvang gratis een prijsindicatie.',
  },
  tuin: {
    heading: ['Je', 'tuin', 'helemaal af'],
    intro: 'Een mooie tuin is vaak teamwerk: groen, bestrating en afscheiding. Deze vakmensen schakelen anderen vaak samen in. Vergelijk beoordelingen en ontvang gratis een prijsindicatie.',
  },
  feest: {
    heading: ['Maak je', 'feest', 'compleet'],
    intro: 'Een geslaagd feest staat of valt met de juiste mensen. Deze leveranciers boeken anderen vaak samen. Vergelijk beoordelingen en ontvang gratis een prijsindicatie.',
  },
  bruiloft: {
    heading: ['Maak jullie', 'bruiloft', 'compleet'],
    intro: 'Een bruiloft regel je met een klein team van leveranciers. Deze diensten boeken stellen vaak samen. Vergelijk beoordelingen en ontvang gratis een prijsindicatie.',
  },
  financien: {
    heading: ['Je', 'financiën', 'op orde'],
    intro: 'Administratie, belasting en advies hangen samen. Deze specialisten schakelen anderen vaak in dezelfde periode in. Vergelijk beoordelingen en ontvang gratis een prijsindicatie.',
  },
  online: {
    heading: ['Je bedrijf', 'online zichtbaar', 'maken'],
    intro: 'Een sterke online aanwezigheid bouw je met meerdere specialisten. Deze diensten vroegen anderen vaak samen aan. Vergelijk beoordelingen en ontvang gratis een prijsindicatie.',
  },
  welzijn: {
    heading: ['Hulp die bij je', 'past', ''],
    intro: 'Hulp zoeken heeft veel kanten: hoofd, lijf en werk. Deze professionals kiezen anderen soms ernaast, alleen als het past. Vergelijk beoordelingen en neem vrijblijvend contact op.',
  },
  juridisch: {
    heading: ['Goed', 'geregeld', 'in elke situatie'],
    intro: 'Juridische, financiële en persoonlijke vragen lopen vaak in elkaar over. Deze specialisten schakelen anderen soms ernaast in. Vergelijk beoordelingen en neem vrijblijvend contact op.',
  },
  regelen: {
    heading: ['Wat er vaak', 'bij komt', ''],
    intro: 'Afhankelijk van je situatie komen er andere zaken bij. Deze diensten vroegen anderen via Trustoo vaak in dezelfde periode aan. Vergelijk beoordelingen en neem vrijblijvend contact op.',
  },
  onderhoud: {
    heading: ['Je huis', 'gezond en droog', 'houden'],
    intro: 'Vocht, ongedierte en verstoppingen hebben vaak dezelfde oorzaak. Deze vakmensen schakelen anderen vaak samen in. Vergelijk beoordelingen en ontvang gratis een prijsindicatie.',
  },
  veilig: {
    heading: ['Veilig', 'wonen en werken', ''],
    intro: 'Veiligheid regel je in lagen: techniek, toezicht en onderhoud. Deze diensten vroegen anderen vaak samen aan. Vergelijk beoordelingen en ontvang gratis een prijsindicatie.',
  },
  afscheid: {
    heading: ['Alles rond het', 'afscheid', 'geregeld'],
    intro: 'Rond een afscheid moet er veel geregeld worden, vaak in korte tijd. Deze diensten kunnen daarbij helpen, als je daar behoefte aan hebt. Vergelijk beoordelingen en neem vrijblijvend contact op.',
  },
  kantoor: {
    heading: ['Je', 'werkplek', 'goed geregeld'],
    intro: 'Een fijne werkplek is meer dan goede koffie. Deze diensten vragen ondernemers vaak samen aan. Vergelijk beoordelingen en ontvang gratis een prijsindicatie.',
  },
  comfort: {
    heading: ['Meer', 'wooncomfort', 'het hele jaar'],
    intro: 'Licht, warmte en isolatie hangen samen. Deze diensten vroegen anderen vaak samen aan. Vergelijk beoordelingen en ontvang gratis een prijsindicatie.',
  },
  opweg: {
    heading: ['Vaak', 'aangevraagd', 'via Trustoo'],
    intro: 'Voor rijlessen kennen we geen vaste combinaties. Dit zijn diensten die mensen via Trustoo veel aanvragen, van verzekeren tot klussen in huis. Vergelijk beoordelingen en ontvang gratis een prijsindicatie.',
  },
  default: {
    heading: ['Vaak samen', 'aangevraagd', 'via Trustoo'],
    intro: 'Deze vakmensen schakelen mensen vaak in rond dezelfde klus. Vergelijk beoordelingen en ontvang gratis een prijsindicatie.',
  },
};

// ---------------------------------------------------------------------------
// Bronnen: per service de hero-copy en de onderwerpregel.
//  noun     : de dienst zoals in "Je zocht onlangs via Trustoo <noun>."
//  title    : [pre, accent (oranje), post]  (tijdloos, geen aanname dat de vakman al geboekt is)
//  heading  : [pre, accent, post] kop boven de kaarten; ontbreekt hij, dan geldt de themakop
//  bridge   : 1-2 zinnen die de aanvraag aan het grotere project koppelen
//  subject  : onderwerpregel (max 80 tekens), statusneutraal
//  preheader: previewtekst (max 160 tekens)
// ---------------------------------------------------------------------------
const SOURCES = {
  notaris: { noun: 'een notaris', theme: 'regelen', title: ['De akte is één stap, de rest komt', 'erbij', ''], heading: ['Dit regelen mensen vaak rond de', 'notaris', ''], bridge: 'Een notaris komt op veel momenten voorbij: bij een woning, een testament, samenwonen, een erfenis of een bedrijf. Afhankelijk van je situatie regelen mensen daar vaak nog iets bij.', subject: 'Notaris geregeld? Dit regelen mensen er vaak bij', preheader: 'Van makelaar en hypotheek tot advocaat of verhuizing: wat er rond een bezoek aan de notaris vaak bij komt.' },
  dj: { noun: 'een DJ', theme: 'feest', title: ['Een goed feest is meer dan', 'muziek', ''], heading: ['Foto, eten en planning', 'rond', 'de dansvloer'], bridge: 'Met een DJ heb je de sfeer te pakken. Beeld, eten en organisatie maken het feest compleet.', subject: 'DJ gevonden? Zo maak je je feest compleet', preheader: 'Fotograaf, videograaf, catering of weddingplanner: dit regelen anderen vaak naast de DJ.' },
  uitvaartverzorger: { noun: 'een uitvaartverzorger', theme: 'afscheid', title: ['Steun bij alles wat er', 'geregeld', 'moet worden'], bridge: 'Rond een afscheid komt er in korte tijd veel op je af. Voor de dag zelf en voor wat daarna geregeld moet worden, kun je hulp inschakelen. Neem daar de tijd voor die je nodig hebt.', subject: 'Hulp bij wat er rond een afscheid geregeld moet worden', preheader: 'Catering, notaris, financieel adviseur en schoonmaak: diensten die kunnen helpen, wanneer je daar klaar voor bent.' },
  boekhouder: { noun: 'een boekhouder', theme: 'financien', title: ['Administratie op orde? Dan wordt', 'sturen', 'makkelijker'], heading: ['Cijfers, belasting en', 'groei', 'in één lijn'], bridge: 'Een boekhouder is een goede basis. Belasting, jaarcijfers en zichtbaarheid van je bedrijf sluiten daar vaak op aan.', subject: 'Boekhouder gevonden? Dit regelen ondernemers erbij', preheader: 'Accountant, belastingadviseur, financieel adviseur en online marketing: vaak samen aangevraagd.' },
  mediator: { noun: 'een mediator', theme: 'juridisch', title: ['Samen tot een', 'oplossing', 'komen'], bridge: 'Mediation is een stap om er samen uit te komen. Soms helpt het om daarnaast juridisch advies, financieel overzicht of persoonlijke steun te hebben. Alleen als je daar behoefte aan hebt.', subject: 'Na je aanvraag voor een mediator: hulp die kan aansluiten', preheader: 'Advocaat, psycholoog, financieel adviseur of notaris: steun die anderen soms naast mediation kiezen.' },
  makelaar: { noun: 'een makelaar', theme: 'wonen', title: ['Een woning wisselt sneller van', 'eigenaar', 'met het team compleet'], heading: ['Taxatie, notaris en hypotheek', 'op tijd', 'geregeld'], bridge: 'Met een makelaar zet je een grote stap. Taxatie, notaris, hypotheek en verhuizing volgen vaak snel daarna.', subject: 'Makelaar gevonden? Dit komt er vaak nog bij', preheader: 'Taxateur, notaris, hypotheekadviseur en verhuisbedrijf: dit regelen mensen rond een koop of verkoop.' },
  advocaat: { noun: 'een advocaat', theme: 'juridisch', title: ['Je zaak van alle kanten', 'goed', 'geregeld'], bridge: 'Een advocaat schakel je in voor uiteenlopende zaken: van een contract of conflict tot familiezaken. Afhankelijk van je situatie kan aanvullende hulp van pas komen.', subject: 'Na je aanvraag voor een advocaat: wat er soms bij komt', preheader: 'Mediator, scheidingsmediator, notaris of belastingadviseur: hulp die anderen soms naast een advocaat kiezen.' },
  catering: { noun: 'catering', theme: 'feest', title: ['Het eten is de helft van een', 'geslaagd', 'feest'], heading: ['Muziek, beeld en planning', 'rond', 'de tafel'], bridge: 'Het eten is geregeld. Muziek, beeld en organisatie maken het feest compleet.', subject: 'Catering geregeld? Zo maak je je feest compleet', preheader: 'DJ, fotograaf, weddingplanner of videograaf: dit boeken anderen vaak naast de catering.' },
  fotograaf: { noun: 'een fotograaf', theme: 'feest', title: ['Mooie foto\'s vragen om een dag die', 'klopt', ''], heading: ['Video, muziek en eten', 'rond', 'de fotograaf'], bridge: 'Een fotograaf legt het vast. Video, muziek en eten zorgen dat er iets te fotograferen valt.', subject: 'Fotograaf gevonden? Dit boeken anderen erbij', preheader: 'Videograaf, DJ, catering of weddingplanner: vaak samen met een fotograaf aangevraagd.' },
  schilder: { noun: 'een schilder', theme: 'opfrissen', title: ['Verf houdt langer op een', 'strakke', 'ondergrond'], heading: ['Zo wordt schilderwerk', 'echt', 'af'], bridge: 'Schilderwerk is vaak onderdeel van een grotere opfrisbeurt: strakke muren vooraf, een nieuwe vloer, schoonmaak of zelfs een verhuizing.', subject: 'Schilder gevonden? Dit regelen mensen erbij', preheader: 'Stukadoor, schoonmaakbedrijf, verhuizer en vloerlegger: vaak in dezelfde periode aangevraagd.' },
  aannemer: { noun: 'een aannemer', theme: 'verbouwen', title: ['Voorkom', 'stille weken', 'in je verbouwing'], heading: ['Stucwerk, elektra en verf in', 'dezelfde', 'planning'], bridge: 'Een aannemer coördineert veel, maar niet altijd alles. Stucwerk, leidingen, elektra en schilderwerk vragen mensen vaak apart aan.', subject: 'Aannemer gevonden? Dit regelen anderen erbij', preheader: 'Stukadoor, loodgieter, elektricien en schilder: vaak samen met een aannemer aangevraagd.' },
  dakdekker: { noun: 'een dakdekker', theme: 'buitenkant', title: ['Dak aanpakken? Neem goten en gevel', 'meteen', 'mee'], heading: ['Eén keer omhoog, alles', 'boven', 'nagekeken'], bridge: 'Als het dak wordt aangepakt, is het een goed moment voor dakkapel, goten en gevel.', subject: 'Dakdekker gevonden? Dit pakken mensen tegelijk aan', preheader: 'Aannemer, dakkapel, dakgoot en gevelrenovatie: vaak samen met dakwerk aangevraagd.' },
  webdesign: { noun: 'een webdesigner', theme: 'online', title: ['Een website is pas af als hij', 'gevonden', 'wordt'], heading: ['Vindbaarheid, teksten en huisstijl', 'bij', 'je site'], bridge: 'Een mooie website is stap één. Vindbaarheid, teksten en huisstijl zorgen dat hij ook werkt.', subject: 'Webdesigner gevonden? Zo wordt je site ook gevonden', preheader: 'Online marketing, SEO, grafisch ontwerp en teksten: vaak samen met webdesign aangevraagd.' },
  beveiliging: { noun: 'een beveiligingsbedrijf', theme: 'veilig', title: ['Veiligheid werkt in', 'lagen', ''], heading: ['Techniek, toezicht en hang- en sluitwerk', 'samen', ''], bridge: 'Beveiliging werkt het best in combinatie met goede techniek en onderhoud van je pand of woning.', subject: 'Beveiliging geregeld? Dit hoort er vaak bij', preheader: 'Alarmsysteem, schoonmaak, elektricien en kozijnen: diensten die anderen naast beveiliging regelen.' },
  keukenrenovatie: { noun: 'een keukenspecialist', theme: 'keukenbadkamer', title: ['Voorkom dat je keuken', 'twee keer', 'open moet'], heading: ['Leidingen, elektra en tegels in', 'één', 'planning'], bridge: 'Bij een nieuwe keuken komen vaak meer vakmensen langs dan alleen de keukenmonteur.', subject: 'Nieuwe keuken op komst? Dit regelen mensen erbij', preheader: 'Loodgieter, elektricien, tegelzetter en vloerlegger: vaak samen met een keukenrenovatie aangevraagd.' },
  vochtbestrijding: { noun: 'een vochtbestrijder', theme: 'onderhoud', title: ['Vocht komt terug als je alleen de', 'plek', 'aanpakt'], heading: ['Leidingen, isolatie en riool', 'meteen', 'nakijken'], bridge: 'Vochtproblemen hebben vaak meerdere oorzaken. Leidingen, isolatie en riolering worden er vaak bij nagekeken.', subject: 'Vochtprobleem aangepakt? Dit laten anderen nakijken', preheader: 'Loodgieter, isolatie, bouwkundige keuring en riool: vaak samen met vochtbestrijding aangevraagd.' },
  schoonmaakbedrijf: { noun: 'een schoonmaakbedrijf', theme: 'verhuizen', title: ['Schoon is pas het', 'begin', ''], heading: ['Wat mensen rond een grote schoonmaak', 'vaak', 'regelen'], bridge: 'Een grondige schoonmaak hangt vaak samen met een verhuizing, oplevering of opfrisbeurt.', subject: 'Schoonmaak geregeld? Dit regelen mensen erbij', preheader: 'Verhuizer, ongediertebestrijder, klusjesman en schilder: vaak samen met schoonmaak aangevraagd.' },
  verzekering: { noun: 'een verzekeringsadviseur', theme: 'financien', title: ['Goed verzekerd is één', 'stukje', 'van het plaatje'], heading: ['Hypotheek, advies en afspraken', 'op orde', ''], bridge: 'Verzekeringen zijn één onderdeel van je financiële plaatje, privé of zakelijk. Hypotheek, advies en het vastleggen van afspraken sluiten daar vaak op aan.', subject: 'Verzekering geregeld? Dit hoort er vaak nog bij', preheader: 'Hypotheekadviseur, financieel adviseur, accountant en notaris: vaak samen aangevraagd.' },
  'financieel-adviseur': { noun: 'een financieel adviseur', theme: 'financien', title: ['Financieel plan? Dan tellen de', 'details', 'mee'], heading: ['Hypotheek, verzekering en belasting in', 'één', 'overzicht'], bridge: 'Financieel advies raakt vaak aan hypotheek, verzekeringen en belasting. Die regelen mensen vaak in dezelfde periode.', subject: 'Financieel adviseur gevonden? Dit hoort er vaak bij', preheader: 'Hypotheekadviseur, verzekeringsadviseur, accountant en belastingadviseur: vaak samen aangevraagd.' },
  incassobureau: { noun: 'een incassobureau', theme: 'financien', title: ['Openstaande facturen? Voorkom de', 'volgende', ''], heading: ['Administratie, advies en afspraken', 'op orde', ''], bridge: 'Een incasso is vaak het sluitstuk van een lastige situatie. Juridisch advies, een goede administratie of bemiddeling kunnen helpen om herhaling te voorkomen.', subject: 'Incasso uitbesteed? Dit regelen ondernemers erbij', preheader: 'Advocaat, accountant, boekhouder en mediator: vaak samen met een incassobureau aangevraagd.' },
  stukadoor: { noun: 'een stukadoor', theme: 'opfrissen', title: ['Strakke muren verdienen een', 'strakke', 'afwerking'], heading: ['Verf, elektra en vloer', 'na', 'het stucwerk'], bridge: 'Stucwerk is meestal de basis. Daarna volgen verf, elektra en een nieuwe vloer.', subject: 'Stukadoor gevonden? Dit regelen mensen erna', preheader: 'Schilder, aannemer, elektricien en vloerlegger: vaak samen met stucwerk aangevraagd.' },
  hovenier: { noun: 'een hovenier', theme: 'tuin', title: ['Een tuin die', 'af', 'is, niet alleen groen'], heading: ['Bestrating en afscheiding', 'voordat', 'het groen erin gaat'], bridge: 'Een tuin wordt pas echt af met bestrating, gezonde bomen en een goede afscheiding.', subject: 'Hovenier gevonden? Dit maakt je tuin compleet', preheader: 'Stratenmaker, boomverzorger, klusjesman en hekwerk: vaak samen met een hovenier aangevraagd.' },
  'online-marketing': { noun: 'een online marketing bureau', theme: 'online', title: ['Bereik is niks zonder een site die', 'converteert', ''], heading: ['Website, teksten en ontwerp', 'achter', 'je campagnes'], bridge: 'Online marketing werkt het best met een goede website, sterke teksten en een herkenbaar ontwerp.', subject: 'Online marketing geregeld? Dit versterkt het', preheader: 'SEO, webdesign, teksten en grafisch ontwerp: vaak samen met online marketing aangevraagd.' },
  gevelrenovatie: { noun: 'een gevelrenovatiebedrijf', theme: 'buitenkant', title: ['Gevel aanpakken? Isoleer en schilder', 'meteen', 'mee'], heading: ['Isolatie, schilderwerk en metselwerk in', 'één', 'keer'], bridge: 'Een gevelrenovatie is een goed moment om ook schilderwerk, isolatie en metselwerk aan te pakken.', subject: 'Gevel wordt aangepakt? Dit hoort er vaak bij', preheader: 'Schilder, isolatie, metselaar en gevelreiniging: vaak samen met gevelrenovatie aangevraagd.' },
  vloerlegger: { noun: 'een vloerlegger', theme: 'opfrissen', title: ['Een nieuwe vloer verdient', 'strakke', 'muren'], heading: ['Stuc, verf en stoffering', 'rond', 'je vloer'], bridge: 'Een nieuwe vloer gaat vaak samen met strakke muren, fris schilderwerk en nieuwe stoffering.', subject: 'Vloerlegger gevonden? Dit regelen mensen erbij', preheader: 'Stukadoor, schilder, stoffeerder en tegelzetter: vaak in dezelfde periode aangevraagd.' },
  verhuisbedrijf: { noun: 'een verhuisbedrijf', theme: 'verhuizen', title: ['Verhuizen zonder', 'losse eindjes', ''], heading: ['Schoonmaak, opslag en klussen', 'rond', 'de verhuisdag'], bridge: 'Rond een verhuizing moet er veel tegelijk: schoonmaken, tijdelijk opslaan, klussen en papieren regelen.', subject: 'Verhuizing gepland? Dit regelen mensen tegelijk', preheader: 'Schoonmaakbedrijf, opslag, klusjesman en notaris: vaak samen met een verhuizing aangevraagd.' },
  coaching: { noun: 'een coach', theme: 'welzijn', title: ['Werken aan', 'jezelf', 'op meer vlakken'], bridge: 'Coaching is één manier om verder te komen. Hoofd, lijf en werk versterken elkaar; soms kiezen mensen daar aanvullende begeleiding bij.', subject: 'Na je aanvraag voor een coach: begeleiding die kan aansluiten', preheader: 'Psycholoog, personal trainer, diëtist of loopbaancoach: hulp die anderen soms naast coaching kiezen.' },
  elektricien: { noun: 'een elektricien', theme: 'verbouwen', title: ['Groepenkast open? Neem de rest', 'meteen', 'mee'], heading: ['Leidingen, keuken en badkamer in', 'dezelfde', 'planning'], bridge: 'Elektra komt zelden alleen. Leidingwerk, een aannemer of een nieuwe keuken of badkamer horen er vaak bij.', subject: 'Elektricien gevonden? Dit regelen mensen erbij', preheader: 'Loodgieter, aannemer, keuken- en badkamerspecialist: vaak samen met een elektricien aangevraagd.' },
  loodgieter: { noun: 'een loodgieter', theme: 'verbouwen', title: ['Leidingwerk gaat zelden', 'alleen', ''], heading: ['Badkamer, cv en elektra in', 'één', 'keer'], bridge: 'Leidingwerk hangt vaak samen met een badkamer, keuken, cv-installatie of elektra.', subject: 'Loodgieter gevonden? Dit regelen mensen erbij', preheader: 'Badkamerspecialist, elektricien, cv-installateur en keukenspecialist: vaak samen aangevraagd.' },
  'cv-installateur': { noun: 'een cv-installateur', theme: 'verduurzamen', title: ['Nieuwe ketel? Kijk meteen naar wat je', 'bespaart', ''], heading: ['Isolatie en warmtepomp', 'naast', 'je cv'], bridge: 'Een nieuwe ketel of onderhoud is een goed moment om ook naar isolatie en een warmtepomp te kijken.', subject: 'Cv-installateur gevonden? Dit hoort er vaak bij', preheader: 'Loodgieter, warmtepomp, isolatie en elektricien: vaak samen met cv-werk aangevraagd.' },
  'airco-installateur': { noun: 'een airco-installateur', theme: 'verduurzamen', title: ['Koelen in de zomer, zuinig', 'verwarmen', 'in de winter'], heading: ['Warmtepomp, isolatie en elektra', 'rond', 'je airco'], bridge: 'Airco, warmtepomp en isolatie horen bij elkaar: koelen, verwarmen en de warmte binnen of buiten houden.', subject: 'Airco op komst? Dit regelen mensen tegelijk', preheader: 'Warmtepomp, elektricien, cv-installateur en isolatie: vaak samen met een airco aangevraagd.' },
  glaszetter: { noun: 'een glaszetter', theme: 'comfort', title: ['Nieuw glas houdt meer', 'warmte', 'binnen met goede kozijnen'], heading: ['Kozijnen, schilderwerk en zonwering', 'rond', 'het glas'], bridge: 'Nieuw glas is een goed moment om ook kozijnen, schilderwerk en zonwering aan te pakken.', subject: 'Glaszetter gevonden? Dit pakken mensen tegelijk aan', preheader: 'Kozijnen, schilder, zonwering en isolatie: vaak samen met glaswerk aangevraagd.' },
  isolatie: { noun: 'een isolatiebedrijf', theme: 'verduurzamen', title: ['Geïsoleerd huis? Dan', 'loont', 'de volgende stap dubbel'], heading: ['Kozijnen, warmtepomp en label hebben', 'nu', 'het meeste effect'], bridge: 'Isoleren is vaak de eerste stap. Kozijnen, warmtepomp en gevel maken het plaatje compleet.', subject: 'Isolatie geregeld? Dit is vaak de volgende stap', preheader: 'Kozijnen, warmtepomp, gevelrenovatie en energielabel: vaak samen met isolatie aangevraagd.' },
  ongediertebestrijder: { noun: 'een ongediertebestrijder', theme: 'onderhoud', title: ['Ongedierte komt terug als de', 'oorzaak', 'blijft'], heading: ['Riool, kieren en schoonmaak', 'meteen', 'nakijken'], bridge: 'Ongedierte komt zelden alleen. Schoonmaak, riool en bouwkundige controle helpen herhaling voorkomen.', subject: 'Ongedierte aangepakt? Dit laten anderen nakijken', preheader: 'Schoonmaakbedrijf, riool, bouwkundige keuring en klusjesman: vaak samen aangevraagd.' },
  architect: { noun: 'een architect', theme: 'verbouwen', title: ['Een goed ontwerp verdient een goede', 'uitvoering', ''], heading: ['Aannemer, keuring en interieur', 'na', 'de tekening'], bridge: 'Een ontwerp vraagt om uitvoering. Aannemer, keuring, interieur en energieadvies volgen vaak.', subject: 'Architect gevonden? Dit komt er vaak na', preheader: 'Aannemer, bouwkundige keuring, interieurstylist en energielabel: vaak na een architect aangevraagd.' },
  relatietherapeut: { noun: 'een relatietherapeut', theme: 'welzijn', title: ['Werken aan wat', 'belangrijk', 'is'], bridge: 'Relatietherapie is een stap die aandacht en tijd vraagt. Soms helpt het om daarnaast individuele steun of praktisch advies te hebben. Alleen als het bij jullie past.', subject: 'Steun die kan aansluiten bij relatietherapie', preheader: 'Psycholoog, coach, scheidingsmediator of financieel adviseur: hulp die anderen soms ernaast kiezen.' },
  tekstschrijver: { noun: 'een tekstschrijver', theme: 'online', title: ['Sterke teksten verdienen een site die ze', 'gelezen', 'krijgt'], heading: ['Vindbaarheid, ontwerp en site', 'rond', 'je teksten'], bridge: 'Goede teksten werken pas echt op een goede website, met vindbaarheid en een herkenbaar ontwerp.', subject: 'Tekstschrijver gevonden? Dit versterkt je teksten', preheader: 'Online marketing, SEO, grafisch ontwerp en webdesign: vaak samen met teksten aangevraagd.' },
  vertaler: { noun: 'een vertaler', theme: 'juridisch', title: ['Vertaling nodig? Vaak hoort er', 'meer', 'bij'], heading: ['Tolk, notaris en juridisch advies', 'rond', 'je documenten'], bridge: 'Vertalingen zijn vaak nodig voor officiële zaken, werk of studie. Een tolk, notaris of advocaat kan daarbij horen.', subject: 'Vertaler gevonden? Dit hoort er soms bij', preheader: 'Tekstschrijver, tolk, notaris en advocaat: diensten die anderen soms naast een vertaling nodig hebben.' },
  psycholoog: { noun: 'een psycholoog', theme: 'welzijn', title: ['Goed voor', 'jezelf', 'zorgen'], bridge: 'Hulp zoeken bij een psycholoog is een belangrijke stap. Andere vormen van begeleiding kunnen daarop aansluiten, in je eigen tempo en alleen als je daar behoefte aan hebt.', subject: 'Aanvullende hulp, als je daar behoefte aan hebt', preheader: 'Relatietherapeut, coach, mediator of diëtist: begeleiding die anderen soms naast een psycholoog kiezen.' },
  'warmtepomp-installateur': { noun: 'een warmtepompinstallateur', theme: 'verduurzamen', title: ['Een warmtepomp presteert pas in een', 'goed geïsoleerd', 'huis'], heading: ['Isolatie, elektra en zonnepanelen', 'rond', 'je warmtepomp'], bridge: 'Een warmtepomp werkt het best in een goed geïsoleerd huis met voldoende stroom.', subject: 'Warmtepomp op komst? Dit regelen mensen tegelijk', preheader: 'Isolatie, cv-installateur, elektricien en zonnepanelen: vaak samen met een warmtepomp aangevraagd.' },
  'seo-specialist': { noun: 'een SEO-specialist', theme: 'online', title: ['Hoger in Google is niks zonder een site die', 'converteert', ''], heading: ['Website, teksten en ontwerp', 'achter', 'je vindbaarheid'], bridge: 'Vindbaarheid werkt pas echt met een sterke website, goede teksten en een herkenbare uitstraling.', subject: 'SEO-specialist gevonden? Dit versterkt het effect', preheader: 'Online marketing, webdesign, teksten en grafisch ontwerp: vaak samen met SEO aangevraagd.' },
  'grafisch-ontwerper': { noun: 'een grafisch ontwerper', theme: 'online', title: ['Een sterk ontwerp verdient een sterk', 'podium', ''], heading: ['Website, teksten en campagne', 'rond', 'je huisstijl'], bridge: 'Een sterk ontwerp verdient een goede website, vindbaarheid en teksten die erbij passen.', subject: 'Ontwerper gevonden? Dit maakt je merk compleet', preheader: 'Online marketing, webdesign, reclamebureau en teksten: vaak samen met grafisch ontwerp aangevraagd.' },
  zonwering: { noun: 'zonwering', theme: 'comfort', title: ['Zonwering werkt het best met de rest van de', 'gevel', 'erbij'], heading: ['Kozijnen, glas en schilderwerk in', 'één', 'keer'], bridge: 'Zonwering is vaak onderdeel van een grotere aanpak van de buitenkant: kozijnen, glas, tuin en schilderwerk.', subject: 'Zonwering geregeld? Dit pakken mensen tegelijk aan', preheader: 'Kozijnen, glaszetter, hovenier en schilder: vaak samen met zonwering aangevraagd.' },
  belastingadviseur: { noun: 'een belastingadviseur', theme: 'financien', title: ['Belasting besparen begint bij een goede', 'administratie', ''], heading: ['Boekhouding, jaarcijfers en hypotheek', 'op orde', ''], bridge: 'Belastingadvies sluit vaak aan op administratie, jaarcijfers en grotere financiële keuzes.', subject: 'Belastingadviseur gevonden? Dit hoort er vaak bij', preheader: 'Boekhouder, accountant, financieel adviseur en hypotheekadviseur: vaak samen aangevraagd.' },
  reclamebureau: { noun: 'een reclamebureau', theme: 'online', title: ['Een campagne verdient een site die', 'klaarstaat', ''], heading: ['Online bereik, ontwerp en teksten', 'achter', 'je campagne'], bridge: 'Een campagne werkt pas echt met online bereik, sterk ontwerp, goede teksten en een website die klaarstaat.', subject: 'Reclamebureau gevonden? Dit versterkt je campagne', preheader: 'Online marketing, grafisch ontwerp, teksten en webdesign: vaak samen met een reclamebureau aangevraagd.' },
  kozijnen: { noun: 'een kozijnspecialist', theme: 'comfort', title: ['Nieuwe kozijnen? Isoleer en schilder', 'meteen', 'mee'], heading: ['Isolatie, glas en zonwering in', 'één', 'keer'], bridge: 'Nieuwe kozijnen zijn een goed moment om ook isolatie, glas, schilderwerk en zonwering aan te pakken.', subject: 'Kozijnen op komst? Dit regelen mensen tegelijk', preheader: 'Isolatie, glaszetter, schilder en zonwering: vaak samen met kozijnen aangevraagd.' },
  timmerman: { noun: 'een timmerman', theme: 'verbouwen', title: ['Maatwerk komt beter uit in een', 'afgewerkte', 'ruimte'], heading: ['Stuc, verf en elektra', 'rond', 'het timmerwerk'], bridge: 'Timmerwerk is vaak onderdeel van een grotere verbouwing met stucwerk, schilderwerk en elektra.', subject: 'Timmerman gevonden? Dit regelen mensen erbij', preheader: 'Aannemer, stukadoor, schilder en elektricien: vaak samen met timmerwerk aangevraagd.' },
  'badkamer-renovatie': { noun: 'een badkamerspecialist', theme: 'keukenbadkamer', title: ['Voorkom dat je badkamer', 'twee keer', 'open moet'], heading: ['Leidingen, tegels en stuc in', 'één', 'keer'], bridge: 'Een nieuwe badkamer vraagt om leidingwerk, stroom, tegels en strakke wanden.', subject: 'Nieuwe badkamer op komst? Dit regelen mensen erbij', preheader: 'Loodgieter, elektricien, tegelzetter en stukadoor: vaak samen met een badkamerrenovatie aangevraagd.' },
  dakkapellen: { noun: 'een dakkapelspecialist', theme: 'buitenkant', title: ['Dakkapel plaatsen? Plan de afwerking', 'meteen', ''], heading: ['Dak, timmerwerk, stuc en verf in', 'één', 'planning'], bridge: 'Na de dakkapel volgt de afwerking: dak, timmerwerk, stucwerk en verf.', subject: 'Dakkapel op komst? Dit regelen mensen erbij', preheader: 'Dakdekker, timmerman, stukadoor en schilder: vaak samen met een dakkapel aangevraagd.' },
  trouwfotograaf: { noun: 'een trouwfotograaf', theme: 'bruiloft', title: ['Mooie trouwfoto\'s vragen om een dag die', 'klopt', ''], heading: ['Video, muziek, eten en planning', 'rond', 'jullie dag'], bridge: 'De fotograaf is vaak één van de eerste boekingen. Video, muziek, eten en planning volgen.', subject: 'Trouwfotograaf gevonden? Dit boeken stellen erbij', preheader: 'Videograaf, DJ, catering en weddingplanner: vaak samen met een trouwfotograaf aangevraagd.' },
  hypotheekadviseur: { noun: 'een hypotheekadviseur', theme: 'wonen', title: ['Hypotheek regelen? Dan lopen de andere stappen', 'gelijk', 'op'], heading: ['Aankoop, taxatie en notaris', 'op tijd', 'geregeld'], bridge: 'Hypotheekadvies hoort bij een koop, maar ook bij oversluiten of verbouwen. Aankoop, taxatie en notaris horen er vaak bij.', subject: 'Hypotheekadviseur gevonden? Dit komt er vaak bij', preheader: 'Aankoopmakelaar, taxateur, notaris en financieel adviseur: vaak samen met hypotheekadvies aangevraagd.' },
  tegelzetter: { noun: 'een tegelzetter', theme: 'keukenbadkamer', title: ['Tegelwerk is het sluitstuk van een', 'goede', 'renovatie'], heading: ['Leidingen, badkamer en vloer', 'rond', 'het tegelwerk'], bridge: 'Tegelwerk hoort meestal bij een badkamer of keuken, met leidingwerk en vloer erbij.', subject: 'Tegelzetter gevonden? Dit regelen mensen erbij', preheader: 'Badkamerspecialist, loodgieter, keukenspecialist en vloerlegger: vaak samen aangevraagd.' },
  traprenovatie: { noun: 'een traprenovatiespecialist', theme: 'opfrissen', title: ['Een nieuwe trap valt op in een', 'fris', 'interieur'], heading: ['Vloer, verf en stoffering', 'rond', 'de trap'], bridge: 'Een gerenoveerde trap valt het meest op in een fris interieur: vloer, verf en stoffering.', subject: 'Traprenovatie op komst? Dit regelen mensen erbij', preheader: 'Vloerlegger, schilder, stoffeerder en interieurstylist: vaak samen met traprenovatie aangevraagd.' },
  gevelreiniging: { noun: 'een gevelreiniger', theme: 'buitenkant', title: ['Schone gevel? Nu zie je wat', 'herstel', 'nodig heeft'], heading: ['Renovatie, schilderwerk en isolatie', 'na', 'het reinigen'], bridge: 'Een schone gevel laat zien waar herstel nodig is. Renovatie, schilderwerk en isolatie volgen vaak.', subject: 'Gevel wordt gereinigd? Dit hoort er vaak bij', preheader: 'Gevelrenovatie, schilder, isolatie en dakdekker: vaak samen met gevelreiniging aangevraagd.' },
  zonnepanelen: { noun: 'zonnepanelen', theme: 'verduurzamen', title: ['Zonnestroom loont pas echt als je hem', 'zelf', 'gebruikt'], heading: ['Opslaan, laden en', 'slim', 'verdelen'], bridge: 'Met zonnepanelen wek je stroom op. Opslaan, laden en verdelen zijn vaak de volgende stap.', subject: 'Zonnepanelen op komst? Dit is vaak de volgende stap', preheader: 'Thuisbatterij, laadpaal, elektricien en energielabel: vaak samen met zonnepanelen aangevraagd.' },
  schoorsteenveger: { noun: 'een schoorsteenveger', theme: 'buitenkant', title: ['Wie op het dak staat, ziet', 'meer', 'dan de schoorsteen'], heading: ['Dak, goten en cv', 'meteen', 'nakijken'], bridge: 'Een schoorsteenveger ziet vaak als eerste wat er op het dak speelt. Dakwerk en goten volgen dan vaak.', subject: 'Schoorsteenveger gevonden? Dit laten anderen nakijken', preheader: 'Dakdekker, dakgoot, cv-installateur en klusjesman: vaak samen met schoorsteenonderhoud aangevraagd.' },
  hekwerk: { noun: 'een hekwerkspecialist', theme: 'tuin', title: ['Een hek maakt de tuin af, niet', 'andersom', ''], heading: ['Groen, bestrating en metselwerk', 'rond', 'het hek'], bridge: 'Een nieuwe afscheiding is vaak onderdeel van een grotere tuinklus: groen, bestrating en metselwerk.', subject: 'Hekwerk op komst? Dit regelen mensen tegelijk', preheader: 'Hovenier, stratenmaker, metselaar en schilder: vaak samen met hekwerk aangevraagd.' },
  'energielabel-adviseur': { noun: 'een energielabeladviseur', theme: 'verduurzamen', title: ['Een energielabel laat zien waar de', 'winst', 'zit'], heading: ['Isolatie, warmtepomp en zonnepanelen', 'na', 'het label'], bridge: 'Een energielabel laat zien waar winst zit. Isolatie, warmtepomp en zonnepanelen zijn vaak de volgende stap.', subject: 'Energielabel geregeld? Dit is vaak de volgende stap', preheader: 'Isolatie, bouwkundige keuring, warmtepomp en zonnepanelen: vaak na een energielabel aangevraagd.' },
  koffieautomaat: { noun: 'een koffieautomaat', theme: 'kantoor', title: ['Goede koffie is het begin van een', 'fijne', 'werkplek'], heading: ['Schoonmaak, catering en veiligheid', 'op', 'kantoor'], bridge: 'Goede koffie is een begin. Een schone, veilige en goed onderhouden werkplek maakt het af.', subject: 'Koffieautomaat geregeld? Dit hoort er vaak bij', preheader: 'Schoonmaakbedrijf, catering, alarmsysteem en klusjesman: diensten die ondernemers ernaast regelen.' },
  weddingplanner: { noun: 'een weddingplanner', theme: 'bruiloft', title: ['Een planner werkt beter met de juiste', 'leveranciers', ''], heading: ['Fotograaf, DJ, catering en video', 'rond', 'jullie dag'], bridge: 'Een weddingplanner regelt veel, maar de leveranciers kies je meestal zelf.', subject: 'Weddingplanner gevonden? Dit boeken stellen erbij', preheader: 'Trouwfotograaf, DJ, catering en videograaf: vaak samen met een weddingplanner aangevraagd.' },
  stratenmaker: { noun: 'een stratenmaker', theme: 'tuin', title: ['Bestrating ligt beter met de rest van de tuin', 'meegepland', ''], heading: ['Groen, afwatering en hek', 'rond', 'de bestrating'], bridge: 'Nieuwe bestrating is een goed moment voor groen, afwatering, metselwerk en een afscheiding.', subject: 'Stratenmaker gevonden? Dit regelen mensen erbij', preheader: 'Hovenier, riool, metselaar en hekwerk: vaak samen met bestrating aangevraagd.' },
  boomverzorging: { noun: 'een boomverzorger', theme: 'tuin', title: ['Gezonde bomen verdienen een tuin die', 'meekomt', ''], heading: ['Groen, bestrating en klussen', 'rond', 'de bomen'], bridge: 'Boomonderhoud is vaak het startpunt van een bredere tuinaanpak.', subject: 'Boomverzorger gevonden? Dit regelen mensen erbij', preheader: 'Hovenier, stratenmaker, klusjesman en schoorsteenveger: vaak in dezelfde periode aangevraagd.' },
  aankoopmakelaar: { noun: 'een aankoopmakelaar', theme: 'wonen', title: ['Een huis kopen gaat sneller met het team', 'compleet', ''], heading: ['Hypotheek, taxatie, keuring en notaris', 'op tijd', 'geregeld'], bridge: 'Met een aankoopmakelaar aan je zijde volgen hypotheek, taxatie, keuring en notaris meestal snel.', subject: 'Aankoopmakelaar gevonden? Dit komt er vaak bij', preheader: 'Hypotheekadviseur, taxateur, bouwkundige keuring en notaris: vaak samen aangevraagd bij een koop.' },
  verkoopmakelaar: { noun: 'een verkoopmakelaar', theme: 'wonen', title: ['Verkopen zonder', 'vertraging', 'bij de overdracht'], heading: ['Taxatie, keuring, notaris en verhuizing', 'op tijd', 'geregeld'], bridge: 'Bij een verkoop komen taxatie, keuring, notaris en de verhuizing zelf al snel om de hoek.', subject: 'Verkoopmakelaar gevonden? Dit komt er vaak bij', preheader: 'Taxateur, bouwkundige keuring, notaris en verhuisbedrijf: vaak samen aangevraagd bij een verkoop.' },
  taxateur: { noun: 'een taxateur', theme: 'wonen', title: ['Een taxatie is één stap, de rest volgt', 'snel', ''], heading: ['Hypotheek, aankoop en notaris', 'op tijd', 'geregeld'], bridge: 'Een taxatie hoort vaak bij een koop, verkoop, hypotheek of een verandering in je situatie. De andere stappen volgen dan vaak snel.', subject: 'Taxateur gevonden? Dit komt er vaak bij', preheader: 'Hypotheekadviseur, aankoopmakelaar, notaris en bouwkundige keuring: vaak samen aangevraagd.' },
  alarmsystemen: { noun: 'een alarmsysteem', theme: 'veilig', title: ['Een alarm werkt beter met goed', 'hang- en sluitwerk', ''], heading: ['Techniek, toezicht en kozijnen', 'samen', ''], bridge: 'Een alarmsysteem werkt het best met goede techniek, toezicht en degelijk hang- en sluitwerk.', subject: 'Alarmsysteem geregeld? Dit hoort er vaak bij', preheader: 'Beveiligingsbedrijf, elektricien, schoonmaak en kozijnen: vaak samen met een alarmsysteem aangevraagd.' },
  laadpalen: { noun: 'een laadpaal', theme: 'verduurzamen', title: ['Thuis laden wordt goedkoper met', 'eigen', 'stroom'], heading: ['Zonnepanelen, thuisbatterij en elektra', 'rond', 'je laadpaal'], bridge: 'Een laadpaal vraagt om een goede aansluiting. Zonnepanelen en een thuisbatterij maken het rondje compleet.', subject: 'Laadpaal op komst? Dit regelen mensen tegelijk', preheader: 'Elektricien, zonnepanelen, thuisbatterij en energielabel: vaak samen met een laadpaal aangevraagd.' },
  videograaf: { noun: 'een videograaf', theme: 'feest', title: ['Een goede video vraagt om een dag die', 'klopt', ''], heading: ['Foto, muziek en eten', 'rond', 'de camera'], bridge: 'Video legt de sfeer vast. Foto, muziek, eten en organisatie maken het feest af.', subject: 'Videograaf gevonden? Dit boeken anderen erbij', preheader: 'Fotograaf, DJ, catering of weddingplanner: vaak samen met een videograaf aangevraagd.' },
  interieurstylist: { noun: 'een interieurstylist', theme: 'opfrissen', title: ['Een interieurplan is pas af als het', 'uitgevoerd', 'is'], heading: ['Stoffering, meubels, verf en vloer', 'na', 'het plan'], bridge: 'Een interieurplan komt tot leven met stoffering, maatwerk meubels, verf en een nieuwe vloer.', subject: 'Interieurstylist gevonden? Dit regelen mensen erna', preheader: 'Stoffeerder, meubelmaker, schilder en vloerlegger: vaak na een interieurstylist aangevraagd.' },
  sloopbedrijf: { noun: 'een sloopbedrijf', theme: 'verbouwen', title: ['Slopen is stap één, plan stap twee', 'meteen', ''], heading: ['Asbestcheck, aannemer en afwerking', 'na', 'het slopen'], bridge: 'Slopen is de eerste stap van een verbouwing. Asbestcontrole, aannemer en afwerking volgen.', subject: 'Sloopbedrijf gevonden? Dit komt er vaak na', preheader: 'Aannemer, asbestverwijderaar, timmerman en elektricien: vaak samen met sloopwerk aangevraagd.' },
  accountant: { noun: 'een accountant', theme: 'financien', title: ['Cijfers op orde? Dan wordt', 'sturen', 'makkelijker'], heading: ['Boekhouding, belasting en verzekering in', 'één', 'lijn'], bridge: 'Een accountant is een goede basis. Administratie, belasting, advies en verzekeringen sluiten daarop aan.', subject: 'Accountant gevonden? Dit regelen ondernemers erbij', preheader: 'Boekhouder, belastingadviseur, financieel adviseur en verzekeringsadviseur: vaak samen aangevraagd.' },
  dakgoot: { noun: 'een dakgootspecialist', theme: 'buitenkant', title: ['Goten aanpakken? Kijk meteen naar dak en', 'gevel', ''], heading: ['Dak, gevel en schoorsteen in', 'één', 'keer nagekeken'], bridge: 'Werk aan de goten laat vaak zien wat er verder met dak en gevel speelt.', subject: 'Dakgoot aangepakt? Dit laten anderen nakijken', preheader: 'Dakdekker, gevelreiniging, schoorsteenveger en klusjesman: vaak samen met dakgootwerk aangevraagd.' },
  loopbaancoach: { noun: 'een loopbaancoach', theme: 'welzijn', title: ['Een nieuwe stap in je', 'werk', 'en leven'], bridge: 'Een loopbaanvraag raakt vaak aan meer: hoe je je voelt, en soms ook aan de praktische kant van een switch of een eigen bedrijf. Aanvullende hulp kan aansluiten, als je daar behoefte aan hebt.', subject: 'Na je aanvraag voor een loopbaancoach: wat kan aansluiten', preheader: 'Psycholoog, coach, boekhouder of financieel adviseur: hulp die anderen soms bij een loopbaanstap kiezen.' },
  'mediator-scheiding': { noun: 'een scheidingsmediator', theme: 'juridisch', title: ['Rust en', 'overzicht', 'in een moeilijke periode'], bridge: 'Bij een scheiding komen juridische, financiële en persoonlijke vragen samen, en vaak ook de woning. Je hoeft niet alles tegelijk te regelen; deze hulp kan aansluiten wanneer jij eraan toe bent.', subject: 'Na je aanvraag voor een scheidingsmediator: hulp die kan aansluiten', preheader: 'Advocaat, financieel adviseur, psycholoog of hypotheekadviseur: steun die anderen soms ernaast kiezen.' },
  asbest: { noun: 'een asbestverwijderaar', theme: 'verbouwen', title: ['Asbest weg? Dan kan de verbouwing', 'veilig', 'starten'], heading: ['Slopen, bouwen en keuren', 'na', 'de sanering'], bridge: 'Na een asbestsanering kan de verbouwing beginnen: slopen, bouwen en keuren.', subject: 'Asbest gesaneerd? Dit komt er vaak na', preheader: 'Sloopbedrijf, aannemer, bouwkundige keuring en timmerman: vaak samen met asbestwerk aangevraagd.' },
  'bouwkundige-keuring': { noun: 'een bouwkundige keuring', theme: 'wonen', title: ['Weten waar je staat maakt de volgende stap', 'makkelijker', ''], heading: ['Aankoop, taxatie en hypotheek', 'na', 'de keuring'], bridge: 'Een keuring hoort vaak bij een koop, maar ook bij onderhoud of verduurzamen. Aankoopmakelaar, taxatie en hypotheek lopen daar vaak gelijk mee op.', subject: 'Bouwkundige keuring geregeld? Dit komt er vaak bij', preheader: 'Aankoopmakelaar, taxateur, hypotheekadviseur en energielabel: vaak samen met een keuring aangevraagd.' },
  thuisbatterij: { noun: 'een thuisbatterij', theme: 'verduurzamen', title: ['Een thuisbatterij loont het meest met', 'eigen', 'opwek'], heading: ['Zonnepanelen, laadpaal en elektra', 'rond', 'je batterij'], bridge: 'Een thuisbatterij komt het best tot zijn recht met eigen opwek, een laadpaal en een goede installatie.', subject: 'Thuisbatterij op komst? Dit regelen mensen tegelijk', preheader: 'Zonnepanelen, laadpaal, elektricien en energielabel: vaak samen met een thuisbatterij aangevraagd.' },
  stoffeerders: { noun: 'een stoffeerder', theme: 'opfrissen', title: ['Stoffering is de laatste laag van een', 'afgewerkt', 'interieur'], heading: ['Vloer, styling en meubels', 'rond', 'de stoffering'], bridge: 'Stoffering is vaak de laatste laag van een interieur. Vloer, styling, schoonmaak en meubels horen erbij.', subject: 'Stoffeerder gevonden? Dit regelen mensen erbij', preheader: 'Vloerlegger, interieurstylist, schoonmaakbedrijf en meubelmaker: vaak in dezelfde periode aangevraagd.' },
  rioolservice: { noun: 'een rioolspecialist', theme: 'onderhoud', title: ['Een verstopping komt terug als de', 'oorzaak', 'blijft'], heading: ['Leidingen, vocht en bestrating', 'meteen', 'nakijken'], bridge: 'Rioolproblemen hangen vaak samen met leidingwerk, vocht en de bestrating erboven.', subject: 'Riool aangepakt? Dit laten anderen nakijken', preheader: 'Loodgieter, vochtbestrijder, stratenmaker en hovenier: vaak samen met rioolwerk aangevraagd.' },
  tolk: { noun: 'een tolk', theme: 'juridisch', title: ['Elkaar', 'begrijpen', 'in elke situatie'], bridge: 'Een tolk is vaak nodig bij officiële afspraken of belangrijke gesprekken. Vertaling, juridisch advies en vastlegging kunnen daarbij horen.', subject: 'Tolk gevonden? Dit hoort er soms bij', preheader: 'Vertaler, advocaat, notaris en mediator: diensten die anderen soms naast een tolk nodig hebben.' },
  opslag: { noun: 'opslagruimte', theme: 'verhuizen', title: ['Spullen veilig weg? Dan is de weg vrij voor de', 'rest', ''], heading: ['Verhuizen, schoonmaken en klussen', 'rond', 'je opslag'], bridge: 'Opslag hoort meestal bij een verhuizing of verbouwing. Verhuizen, schoonmaken en klussen volgen vaak.', subject: 'Opslag geregeld? Dit regelen mensen tegelijk', preheader: 'Verhuisbedrijf, schoonmaakbedrijf, klusjesman en schilder: vaak samen met opslag aangevraagd.' },
  meubelmaker: { noun: 'een meubelmaker', theme: 'opfrissen', title: ['Maatwerk komt beter uit in een', 'doordacht', 'interieur'], heading: ['Styling, stoffering en klussen', 'rond', 'je meubel'], bridge: 'Een maatwerk meubel komt het mooist uit in een doordacht interieur, met styling en stoffering.', subject: 'Meubelmaker gevonden? Dit regelen mensen erbij', preheader: 'Interieurstylist, stoffeerder, klusjesman en verhuizer: vaak in dezelfde periode aangevraagd.' },
  metselaar: { noun: 'een metselaar', theme: 'verbouwen', title: ['Metselwerk staat zelden', 'alleen', ''], heading: ['Timmerwerk, stuc en dak', 'rond', 'het metselwerk'], bridge: 'Metselwerk is vaak onderdeel van een aanbouw of verbouwing met timmerwerk, stucwerk en dak.', subject: 'Metselaar gevonden? Dit regelen mensen erbij', preheader: 'Aannemer, timmerman, stukadoor en dakdekker: vaak samen met metselwerk aangevraagd.' },
  'personal-trainer': { noun: 'een personal trainer', theme: 'welzijn', title: ['Fit worden,', 'lekker', 'in je vel'], bridge: 'Trainen werkt het best samen met goede voeding en aandacht voor hoe je je voelt. Sommige mensen kiezen daar begeleiding bij.', subject: 'Personal trainer gevonden? Dit combineren anderen ermee', preheader: 'Diëtist, coach, psycholoog of loopbaancoach: begeleiding die anderen soms naast trainen kiezen.' },
  dietist: { noun: 'een diëtist', theme: 'welzijn', title: ['Gezond leven,', 'stap', 'voor stap'], bridge: 'Voeding is één kant. Beweging en mentale balans maken het plaatje compleet, in je eigen tempo.', subject: 'Diëtist gevonden? Dit combineren anderen ermee', preheader: 'Personal trainer, coach, psycholoog of loopbaancoach: begeleiding die anderen soms ernaast kiezen.' },
  klusjesman: { noun: 'een klusjesman', theme: 'opfrissen', title: ['Kleine klussen lossen, grote klussen', 'plannen', ''], heading: ['Schilder, loodgieter en elektricien', 'voor', 'het grotere werk'], bridge: 'Kleine klussen zijn vaak het begin. Voor schilderwerk, leidingen, elektra en maatwerk zoek je een specialist.', subject: 'Klusjesman gevonden? Dit regelen mensen erbij', preheader: 'Schilder, loodgieter, elektricien en meubelmaker: vaak samen met een klusjesman aangevraagd.' },
  rijschool: { noun: 'een rijschool', theme: 'opweg', title: ['Rijbewijs op komst? Kijk wat je verder wilt', 'regelen', ''], heading: ['Vaak', 'aangevraagd', 'via Trustoo'], bridge: 'Rijlessen staan meestal op zichzelf. Toch is dit een goed moment om te kijken wat je verder wilt regelen, van een verzekering tot hulp in en om het huis.', subject: 'Rijschool gevonden? Dit regelen mensen ook via Trustoo', preheader: 'Verzekeringsadviseur, verhuisbedrijf, schoonmaakbedrijf en klusjesman: veel aangevraagd via Trustoo.' },
  default: { noun: 'een vakman', theme: 'default', title: ['Eén klus brengt vaak een', 'volgende', 'mee'], heading: ['Vaak samen', 'aangevraagd', 'via Trustoo'], bridge: 'Eén klus brengt vaak een volgende met zich mee. Deze vakmensen schakelen mensen vaak in dezelfde periode in.', subject: 'Wat is de volgende stap voor je huis?', preheader: 'Klusjesman, schoonmaakbedrijf, schilder en elektricien: vaak samen aangevraagd via Trustoo.' },
};

// ---------------------------------------------------------------------------
// Doelen: de kaartcopy per dienst (naam, eyebrow-label, tekst, linktekst).
// ---------------------------------------------------------------------------
const TARGETS = {
  makelaar: { name: 'Makelaars', label: 'Wonen', text: 'Koop of verkoop je een woning? Een makelaar kent de lokale markt en regelt bezichtiging en onderhandeling.' },
  hypotheekadviseur: { name: 'Hypotheekadviseurs', label: 'Financieel', text: 'Laat berekenen wat je kunt lenen en vergelijk hypotheken met onafhankelijk advies op maat.' },
  advocaat: { name: 'Advocaten', label: 'Juridisch', text: 'Juridisch advies of bijstand die past bij jouw situatie, van contract of conflict tot familiezaken.' },
  verhuisbedrijf: { name: 'Verhuisbedrijven', label: 'Verhuizen', text: 'Laat inpakken, vervoeren en sjouwen uit handen nemen, zodat de verhuisdag rustig verloopt.' },
  videograaf: { name: 'Videografen', label: 'Feest & event', text: 'Leg de sfeer van je dag vast in beeld en geluid, van de eerste toost tot de laatste dans op de vloer.' },
  fotograaf: { name: 'Fotografen', label: 'Feest & event', text: 'Een fotograaf legt de mooiste momenten vast, zodat je er later nog vaak en met plezier naar terugkijkt.' },
  catering: { name: 'Cateraars', label: 'Feest & event', text: 'Van hapjes tot buffet: een cateraar regelt eten en drinken, zodat jij alle aandacht hebt voor je gasten.' },
  weddingplanner: { name: 'Weddingplanners', label: 'Feest & event', text: 'Een weddingplanner bewaakt planning, leveranciers en budget, zodat jij van de dag kunt genieten.' },
  notaris: { name: 'Notarissen', label: 'Juridisch', text: 'Voor een akte, testament of samenlevingscontract: een notaris legt afspraken officieel en bindend vast.' },
  accountant: { name: 'Accountants', label: 'Financieel', text: 'Laat je jaarrekening opstellen en controleren en krijg advies over je bedrijfsvoering en cijfers.' },
  belastingadviseur: { name: 'Belastingadviseurs', label: 'Financieel', text: 'Haal het maximale uit je aangifte en voorkom verrassingen achteraf met belastingadvies op maat.' },
  'financieel-adviseur': { name: 'Financieel adviseurs', label: 'Financieel', text: 'Krijg overzicht over inkomen, vermogen en toekomstplannen met onafhankelijk en persoonlijk advies.' },
  'online-marketing': { name: 'Online marketing bureaus', label: 'Marketing', text: 'Word gevonden door nieuwe klanten via zoekmachines, social media en gerichte online advertenties.' },
  psycholoog: { name: 'Psychologen', label: 'Welzijn', text: 'Praat met een professional als je vastloopt of meer grip wilt op hoe je je voelt. In je eigen tempo.' },
  taxateur: { name: 'Taxateurs', label: 'Wonen', text: 'Een taxatierapport heb je nodig voor je hypotheek en geeft zekerheid over de waarde van de woning.' },
  mediator: { name: 'Mediators', label: 'Juridisch', text: 'Los een conflict samen op met een onafhankelijke bemiddelaar, zonder meteen naar de rechter te gaan.' },
  'mediator-scheiding': { name: 'Scheidingsmediators', label: 'Juridisch', text: 'Maak de afspraken rond je scheiding in goed overleg, met begeleiding van een specialist die het proces kent.' },
  dj: { name: "DJ's", label: 'Feest & event', text: 'Een DJ leest de zaal en houdt de dansvloer vol, met muziek die past bij jouw gasten en jouw feest.' },
  stukadoor: { name: 'Stukadoors', label: 'Afwerking', text: 'Strakke muren en plafonds zijn de basis voor verf of behang. Laat het stucwerk vooraf goed doen.' },
  schoonmaakbedrijf: { name: 'Schoonmaakbedrijven', label: 'Schoon & onderhoud', text: 'Laat je woning grondig schoonmaken na de klus of voor de oplevering. Ook voor periodiek onderhoud.' },
  vloerlegger: { name: 'Vloerleggers', label: 'Afwerking', text: 'Een nieuwe vloer maakt de ruimte af. Laat hem strak leggen door een vakman, van laminaat tot pvc.' },
  loodgieter: { name: 'Loodgieters', label: 'Installatie', text: 'Voor leidingen, afvoer en sanitair. Handig bij een verbouwing of als er iets lekt of verstopt zit.' },
  elektricien: { name: 'Elektriciens', label: 'Installatie', text: 'Extra groepen, stopcontacten of verlichting: laat het veilig aanleggen en keuren door een vakman.' },
  schilder: { name: 'Schilders', label: 'Afwerking', text: 'Een frisse laag verf binnen of buiten. Een schilder zorgt voor strak werk en een duurzame afwerking.' },
  aannemer: { name: 'Aannemers', label: 'Verbouwen', text: 'Voor grotere klussen met meerdere vakmensen. Een aannemer plant, regelt en houdt het overzicht.' },
  dakkapellen: { name: 'Dakkapelspecialisten', label: 'Buitenkant', text: 'Meer ruimte en licht op zolder? Een dakkapel wordt vaak in één dag geplaatst en daarna afgewerkt.' },
  dakgoot: { name: 'Dakgootspecialisten', label: 'Buitenkant', text: 'Laat je dakgoten reinigen, repareren of vervangen en voorkom lekkage en vochtproblemen in de muren.' },
  gevelrenovatie: { name: 'Gevelrenovatiebedrijven', label: 'Buitenkant', text: 'Voegwerk herstellen, scheuren repareren of impregneren: houd je gevel sterk, droog en netjes.' },
  'seo-specialist': { name: 'SEO-specialisten', label: 'Marketing', text: 'Sta hoger in Google met een website die technisch en inhoudelijk goed in elkaar zit en blijft groeien.' },
  'grafisch-ontwerper': { name: 'Grafisch ontwerpers', label: 'Marketing', text: 'Een herkenbaar logo en huisstijl maken je bedrijf professioneel, online en op papier. Van idee tot ontwerp.' },
  tekstschrijver: { name: 'Tekstschrijvers', label: 'Marketing', text: 'Sterke teksten voor je website, brochure of nieuwsbrief, die je verhaal helder en overtuigend vertellen.' },
  alarmsystemen: { name: 'Alarmsysteemspecialisten', label: 'Veiligheid', text: 'Een alarmsysteem of camera geeft rust, thuis en op de zaak. Laat het vakkundig installeren en instellen.' },
  tegelzetter: { name: 'Tegelzetters', label: 'Afwerking', text: 'Voor wand en vloer in badkamer, keuken of toilet. Strak tegelwerk maakt de ruimte helemaal af.' },
  isolatie: { name: 'Isolatiebedrijven', label: 'Energie', text: 'Isoleer dak, muren of vloer en bespaar direct op je energierekening. Vaak met subsidie mogelijk.' },
  'bouwkundige-keuring': { name: 'Bouwkundig keurders', label: 'Wonen', text: 'Weet wat je koopt of waar je aan toe bent: een keuring brengt gebreken en kosten vooraf in beeld.' },
  ongediertebestrijder: { name: 'Ongediertebestrijders', label: 'Schoon & onderhoud', text: 'Muizen, wespen of andere ongewenste gasten? Laat het vakkundig en veilig aanpakken en voorkom herhaling.' },
  klusjesman: { name: 'Klusjesmannen', label: 'Klussen', text: 'Voor de kleine klussen die blijven liggen: ophangen, monteren, repareren en netjes afwerken.' },
  verzekering: { name: 'Verzekeringsadviseurs', label: 'Financieel', text: 'Controleer of je goed verzekerd bent, van inboedel en opstal tot aansprakelijkheid. Privé of zakelijk.' },
  stratenmaker: { name: 'Stratenmakers', label: 'Tuin', text: 'Een nieuw terras, pad of oprit? Een stratenmaker legt sierbestrating strak, waterpas en duurzaam.' },
  boomverzorging: { name: 'Boomverzorgers', label: 'Tuin', text: 'Snoeien, kappen of controleren: een boomverzorger houdt je bomen gezond, veilig en in goede vorm.' },
  hekwerk: { name: 'Hekwerkspecialisten', label: 'Tuin', text: 'Een schutting of hek geeft privacy en maakt je tuin af. Laat het stevig en recht plaatsen door een vakman.' },
  webdesign: { name: 'Webdesigners', label: 'Marketing', text: 'Een website die er goed uitziet en werkt op elk scherm. Het online visitekaartje van je bedrijf.' },
  metselaar: { name: 'Metselaars', label: 'Verbouwen', text: 'Voor een aanbouw, tuinmuur of herstel van metselwerk. Vakwerk dat jaren meegaat en er strak uitziet.' },
  stoffeerder: { name: 'Stoffeerders', label: 'Interieur', text: 'Trapbekleding, vloerbedekking of meubels opnieuw bekleden. Maatwerk dat je interieur helemaal afmaakt.' },
  opslag: { name: 'Opslagruimtes', label: 'Verhuizen', text: 'Tijdelijk spullen kwijt tijdens een verhuizing of verbouwing? Huur een veilige, droge opslagruimte.' },
  'personal-trainer': { name: 'Personal trainers', label: 'Welzijn', text: 'Werk gericht aan je conditie en kracht, met een schema en begeleiding die passen bij jouw doelen.' },
  dietist: { name: 'Diëtisten', label: 'Welzijn', text: 'Eet beter met advies dat past bij jouw lijf en leven, zonder ingewikkelde regels of strenge diëten.' },
  keukenrenovatie: { name: 'Keukenspecialisten', label: 'Verbouwen', text: 'Nieuwe keuken of je huidige keuken opknappen? Van ontwerp tot montage geregeld door een specialist.' },
  'badkamer-renovatie': { name: 'Badkamerspecialisten', label: 'Verbouwen', text: 'Een nieuwe badkamer van ontwerp tot oplevering, inclusief leidingwerk, tegels en de afwerking.' },
  'cv-verwarmings-installateur': { name: 'Cv-installateurs', label: 'Installatie', text: 'Ketel vervangen, onderhoud of radiatoren erbij: houd je verwarming betrouwbaar, veilig en zuinig.' },
  'warmtepomp-installateur': { name: 'Warmtepompinstallateurs', label: 'Energie', text: 'Verwarm je huis zonder gas. Laat berekenen welke warmtepomp bij je woning past en wat het oplevert.' },
  kozijnen: { name: 'Kozijnspecialisten', label: 'Buitenkant', text: 'Nieuwe kozijnen met isolatieglas houden de warmte binnen en geven je gevel een frisse uitstraling.' },
  zonwering: { name: 'Zonweringspecialisten', label: 'Comfort', text: 'Houd de warmte buiten met screens, een markies of rolluiken. Op maat gemaakt en vakkundig gemonteerd.' },
  rioolservice: { name: 'Rioolspecialisten', label: 'Schoon & onderhoud', text: 'Verstopping, stank of lekkage? Een rioolspecialist inspecteert met een camera en lost het op.' },
  interieurstylist: { name: 'Interieurstylisten', label: 'Interieur', text: 'Krijg een plan voor kleuren, materialen en indeling dat alles in je huis samenbrengt tot één geheel.' },
  'energielabel-adviseur': { name: 'Energielabeladviseurs', label: 'Energie', text: 'Verplicht bij verkoop en verhuur, en een handig startpunt om te zien waar je kunt verduurzamen.' },
  relatietherapeut: { name: 'Relatietherapeuten', label: 'Welzijn', text: 'Werk samen aan je relatie met een therapeut die het gesprek weer op gang brengt, in jullie tempo.' },
  coaching: { name: 'Coaches', label: 'Welzijn', text: 'Een coach helpt je doelen scherp te krijgen en stappen te zetten, privé of in je werk. Op jouw manier.' },
  zonnepanelen: { name: 'Zonnepaneleninstallateurs', label: 'Energie', text: 'Wek je eigen stroom op en verlaag je energierekening. Laat berekenen wat jouw dak kan opleveren.' },
  tolk: { name: 'Tolken', label: 'Juridisch', text: 'Een tolk zorgt dat iedereen elkaar begrijpt bij een afspraak, zitting of ander belangrijk gesprek.' },
  reclamebureau: { name: 'Reclamebureaus', label: 'Marketing', text: 'Een campagne of concept dat opvalt, van idee tot uitvoering. Voor merken die gezien willen worden.' },
  glaszetter: { name: 'Glaszetters', label: 'Buitenkant', text: 'Ruit gebroken of over op isolatieglas? Een glaszetter plaatst het snel, netjes en vakkundig.' },
  boekhouder: { name: 'Boekhouders', label: 'Financieel', text: 'Houd je administratie op orde en laat je aangiftes op tijd en correct doen door een boekhouder.' },
  timmerman: { name: 'Timmermannen', label: 'Verbouwen', text: 'Voor maatwerk in hout: kasten, kozijnen, vloeren en constructiewerk, netjes op maat gemaakt.' },
  dakdekker: { name: 'Dakdekkers', label: 'Buitenkant', text: 'Lekkage, onderhoud of een nieuw dak? Laat het dak inspecteren voordat kleine gebreken groot worden.' },
  trouwfotograaf: { name: 'Trouwfotografen', label: 'Feest & event', text: 'Een trouwfotograaf legt jullie dag vast, van de voorbereidingen in de ochtend tot het feest.' },
  aankoopmakelaar: { name: 'Aankoopmakelaars', label: 'Wonen', text: 'Een aankoopmakelaar zoekt mee, beoordeelt de woning kritisch en onderhandelt namens jou.' },
  beveiliging: { name: 'Beveiligingsbedrijven', label: 'Veiligheid', text: 'Van alarmopvolging tot toezicht op je pand: beveiliging die past bij je situatie en je budget.' },
  thuisbatterij: { name: 'Thuisbatterij-experts', label: 'Energie', text: 'Sla je eigen zonnestroom op en gebruik hem wanneer je hem nodig hebt, ook als de zon niet schijnt.' },
  laadpalen: { name: 'Laadpaalinstallateurs', label: 'Energie', text: 'Laad je elektrische auto thuis. Laat een laadpaal plaatsen die past bij je aansluiting en je auto.' },
  meubelmaker: { name: 'Meubelmakers', label: 'Interieur', text: 'Een kast, tafel of inbouwmeubel op maat, precies passend in jouw ruimte en jouw interieur.' },
  asbest: { name: 'Asbestverwijderaars', label: 'Verbouwen', text: 'Woning van voor 1994? Laat asbest veilig inventariseren en verwijderen voordat je gaat slopen.' },
  sloopbedrijf: { name: 'Sloopbedrijven', label: 'Verbouwen', text: 'Muur eruit of oude keuken weg? Een sloopbedrijf werkt veilig en voert het sloopafval netjes af.' },
  schoorsteenveger: { name: 'Schoorsteenvegers', label: 'Buitenkant', text: 'Laat je schoorsteen jaarlijks vegen voor een veilige haard, een goede trek en minder roetvorming.' },
  vochtbestrijding: { name: 'Vochtbestrijders', label: 'Schoon & onderhoud', text: 'Vochtplekken, schimmel of een natte kelder? Laat de oorzaak opsporen en duurzaam oplossen.' },
  vertaler: { name: 'Vertalers', label: 'Juridisch', text: 'Officiële documenten of teksten laten vertalen, ook beëdigd als dat nodig is voor de instantie.' },
  hovenier: { name: 'Hoveniers', label: 'Tuin', text: 'Van ontwerp tot aanleg en onderhoud: een hovenier maakt van je tuin een plek waar je graag bent.' },
  gevelreiniging: { name: 'Gevelreinigers', label: 'Buitenkant', text: 'Laat je gevel reinigen en impregneren tegen vuil, groene aanslag en vocht. Direct zichtbaar resultaat.' },
  loopbaancoach: { name: 'Loopbaancoaches', label: 'Welzijn', text: 'Twijfel over je werk? Een loopbaancoach helpt je ontdekken wat bij je past en welke stap je zet.' },
};

// ---------------------------------------------------------------------------
// Linktekst op de kaart: zelfde woordkeuze als op trustoo.nl ('Ontvang prijsindicatie'). Gevoelige
// categorieën krijgen een neutralere linktekst.
// ---------------------------------------------------------------------------
const CTA_DEFAULT = 'Ontvang prijsindicatie';
const CTA_SOFT = new Set(['psycholoog', 'relatietherapeut', 'coaching', 'loopbaancoach', 'mediator', 'mediator-scheiding', 'advocaat', 'personal-trainer', 'dietist', 'tolk']);
const CTA_SOFT_LABEL = 'Bekijk mogelijkheden';
// Kaartteksten houden dezelfde lengte, zodat de 2x2-kaarten gelijk uitlijnen.
const CARD_TEXT_MIN = 85;
const CARD_TEXT_MAX = 110;

// ---------------------------------------------------------------------------
// Onderwerpregel en preheader worden per feed opgebouwd (sinds 2026-09-22):
//  - subject: sociale bewijskracht, statusneutraal: "Wat mensen naast een schilder vaak ook regelen"
//  - preheader: de vier kaartnamen + een zachte prijsindicatie-hint per thema
//  Gevoelige categorieën krijgen een eigen, voorzichtige onderwerpregel en preheader-staart.
//  De velden subject/preheader in SOURCES zijn daarmee alleen nog fallback.
// ---------------------------------------------------------------------------
const SUBJECT_OVERRIDE = {
  mediator: 'Hulp die kan aansluiten bij mediation',
  'mediator-scheiding': 'Wat er rond een scheiding soms nog bij komt',
  psycholoog: 'Steun in verschillende vormen, als je daar behoefte aan hebt',
  relatietherapeut: 'Steun die kan aansluiten bij relatietherapie',
  coaching: 'Begeleiding die kan aansluiten bij coaching',
  loopbaancoach: 'Wat er bij een loopbaanstap soms nog bij komt',
  advocaat: 'Wat er naast een advocaat soms nog nodig is',
  tolk: 'Wat mensen naast een tolk soms ook regelen',
  'personal-trainer': 'Wat mensen naast een personal trainer vaak ook kiezen',
  dietist: 'Wat mensen naast een diëtist vaak ook kiezen',
  uitvaartverzorger: 'Hulp bij wat er rond een afscheid geregeld moet worden',
  incassobureau: 'Wat ondernemers naast een incassobureau vaak ook regelen',
  rijschool: 'Wat mensen via Trustoo verder vaak regelen',
  default: 'Wat mensen vaak ook regelen via Trustoo',
};
// Project-woord per thema voor de preheader ("... voor je verbouwing").
const THEME_PROJECT = {
  verbouwen: 'verbouwing', opfrissen: 'opfrisbeurt', verduurzamen: 'verduurzaming', buitenkant: 'huis',
  keukenbadkamer: 'renovatie', verhuizen: 'verhuizing', wonen: 'woning', tuin: 'tuin', feest: 'feest',
  bruiloft: 'bruiloft', financien: 'financiën', online: 'bedrijf', veilig: 'veiligheid', kantoor: 'werkplek',
  comfort: 'wooncomfort', onderhoud: 'huis',
};
const PREHEADER_SOFT_THEMES = new Set(['welzijn', 'juridisch']);
const PREHEADER_TAIL_SOFT = 'hulp die anderen soms ernaast kiezen, alleen als het bij je past.';
const PREHEADER_TAIL_AFSCHEID = 'hulp die kan aansluiten, wanneer je daar klaar voor bent.';
const PREHEADER_TAIL_GENERIC = 'vraag alvast een gratis prijsindicatie op.';

function joinNames(names) {
  const lower = names.map((n) => (/^[A-Z]{2,}/.test(n) ? n : n.charAt(0).toLowerCase() + n.slice(1)));
  return lower.slice(0, -1).join(', ') + ' en ' + lower[lower.length - 1];
}
function buildSubject(slug, src) {
  if (SUBJECT_OVERRIDE[slug]) return SUBJECT_OVERRIDE[slug];
  return `Wat mensen naast ${src.noun} vaak ook regelen`;
}
function buildPreheader(slug, src, cardNames) {
  const names = joinNames(cardNames);
  const head = names.charAt(0).toUpperCase() + names.slice(1);
  let tail;
  if (src.theme === 'afscheid') tail = PREHEADER_TAIL_AFSCHEID;
  else if (PREHEADER_SOFT_THEMES.has(src.theme)) tail = PREHEADER_TAIL_SOFT;
  else if (THEME_PROJECT[src.theme]) tail = `vraag alvast een gratis prijsindicatie op voor je ${THEME_PROJECT[src.theme]}.`;
  else tail = PREHEADER_TAIL_GENERIC;
  let out = `${head}: ${tail}`;
  if (out.length > 160 && tail !== PREHEADER_TAIL_GENERIC && tail !== PREHEADER_TAIL_SOFT && tail !== PREHEADER_TAIL_AFSCHEID) out = `${head}: ${PREHEADER_TAIL_GENERIC}`;
  return out;
}

// ---------------------------------------------------------------------------
// Vaste teksten (gelijk voor alle services).
// ---------------------------------------------------------------------------
const HERO_EYEBROW = (noun) => `Na je aanvraag voor ${noun}`;
const CLOSING = {
  heading: ['Iets anders', 'nodig?', ''],
  intro: 'Op Trustoo vind je vakmensen voor bijna elke klus in en om het huis, en voor zakelijke en persoonlijke hulp. Vergelijk beoordelingen en ontvang gratis een prijsindicatie.',
  all_services_label: 'Alle diensten bekijken',
  dashboard_label: 'Mijn aanvragen',
};

function utm(url, campaign, content) {
  return `${url}?utm_source=brevo&utm_campaign=${campaign}&utm_medium=email&utm_content=${content}`;
}
function linkLabel(target) {
  return CTA_SOFT.has(target) ? CTA_SOFT_LABEL : CTA_DEFAULT;
}
function campaignKey(slug) {
  return `crosssell_${slug.replace(/-/g, '_')}_mail1`;
}

function buildFeed(slug, cards, images) {
  const src = SOURCES[slug];
  if (!src) throw new Error(`geen SOURCES-copy voor ${slug}`);
  const theme = THEMES[src.theme];
  if (!theme) throw new Error(`${slug}: onbekend thema ${src.theme}`);
  const campaign = campaignKey(slug);
  const hero = images[slug];
  if (!hero) throw new Error(`${slug}: geen herobeeld gevonden`);

  const cardNames = cards.map((target) => {
    const t = TARGETS[target];
    if (!t) throw new Error(`${slug}: geen TARGETS-copy voor ${target}`);
    return t.name;
  });
  const feed = {
    title: `Vaak samen met ${src.noun} aangevraagd`,
    subject_line: buildSubject(slug, src),
    preheader: buildPreheader(slug, src, cardNames),
    campaign_key: campaign,
    hero_image_url: hero.url,
    hero_image_alt: hero.alt,
    hero_eyebrow: HERO_EYEBROW(src.noun),
    hero_title_pre: src.title[0],
    hero_title_accent: src.title[1],
    hero_title_post: src.title[2],
    hero_subtitle: `Je zocht onlangs via Trustoo ${src.noun}. ${src.bridge}`,
    list_heading_pre: (src.heading || theme.heading)[0],
    list_heading_accent: (src.heading || theme.heading)[1],
    list_heading_post: (src.heading || theme.heading)[2],
    list_intro: theme.intro,
  };
  cards.forEach((target, i) => {
    const n = i + 1;
    const t = TARGETS[target];
    if (!t) throw new Error(`${slug}: geen TARGETS-copy voor ${target}`);
    const img = images[target];
    if (!img) throw new Error(`${slug}: geen beeld voor doel ${target}`);
    feed[`card${n}_url`] = utm(`https://trustoo.nl/nederland/${target}/`, campaign, `${target.replace(/-/g, '')}card`);
    feed[`card${n}_image_url`] = img.url;
    feed[`card${n}_image_alt`] = img.alt;
    feed[`card${n}_label`] = t.label;
    feed[`card${n}_name`] = t.name;
    feed[`card${n}_text`] = t.text;
    feed[`card${n}_link_label`] = linkLabel(target);
  });
  feed.closing_heading_pre = CLOSING.heading[0];
  feed.closing_heading_accent = CLOSING.heading[1];
  feed.closing_heading_post = CLOSING.heading[2];
  feed.closing_intro = CLOSING.intro;
  feed.all_services_url = utm('https://trustoo.nl/alle-diensten/', campaign, 'allediensten');
  feed.all_services_label = CLOSING.all_services_label;
  feed.dashboard_label = CLOSING.dashboard_label;

  const ordered = {};
  for (const f of FIELDS) {
    if (!(f in feed)) throw new Error(`${slug}: veld ${f} niet gevuld`);
    ordered[f] = feed[f];
  }
  for (const k of Object.keys(feed)) if (!FIELDS.includes(k)) throw new Error(`${slug}: onbekend veld ${k}`);
  return ordered;
}

function main() {
  const images = loadImages();
  fs.mkdirSync(OUT, { recursive: true });
  const written = [];
  const warnings = [];
  for (const [slug, t] of Object.entries(TARGETS)) {
    if (t.text.length < CARD_TEXT_MIN || t.text.length > CARD_TEXT_MAX) warnings.push(`kaarttekst ${slug}: ${t.text.length} tekens (gewenst ${CARD_TEXT_MIN}-${CARD_TEXT_MAX})`);
    if (t.name.length > 26) warnings.push(`kaartnaam ${slug}: '${t.name}' is lang (${t.name.length}); kan op twee regels breken`);
  }
  for (const [slug, cards] of Object.entries(mapping.sources)) {
    if (cards.length !== 4) throw new Error(`${slug}: ${cards.length} kaarten, verwacht 4`);
    const feed = buildFeed(slug, cards, images);
    if (feed.subject_line.length > 80) warnings.push(`${slug}: onderwerpregel ${feed.subject_line.length} tekens`);
    if (feed.preheader.length > 160) warnings.push(`${slug}: preheader ${feed.preheader.length} tekens`);
    fs.writeFileSync(path.join(OUT, `${slug}.json`), JSON.stringify(feed, null, 2) + '\n');
    written.push(slug);
  }
  // Aliassen: zelfde inhoud als het doel, maar met de eigen slug in campaign_key en UTM's.
  for (const [alias, target] of Object.entries(mapping.aliases)) {
    const feed = buildFeed(target, mapping.sources[target], images);
    const from = campaignKey(target);
    const to = campaignKey(alias);
    for (const k of Object.keys(feed)) feed[k] = feed[k].split(from).join(to);
    fs.writeFileSync(path.join(OUT, `${alias}.json`), JSON.stringify(feed, null, 2) + '\n');
    written.push(alias);
  }
  console.log(`OK: ${written.length} feeds geschreven naar feeds/nl/cross-sell/ (${FIELDS.length} velden).`);
  for (const w of warnings) console.warn(`  ! ${w}`);
}

main();
