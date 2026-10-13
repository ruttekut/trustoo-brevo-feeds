#!/usr/bin/env python3
"""
Cross-sell reminder voor Trustlocal.be (feeds/be-nl/cross-sell-reminder-be/).

Volgt de NL-reminder (feeds/nl/cross-sell-reminder/, v3 van Daan en Talitha) maar dan voor België:
- de vier kaarten per dienst zijn dezelfde als in de BE cross-sellmail (feeds/be-nl/cross-sell-be/),
  met dezelfde beelden; links naar trustlocal.be/belgie/<slug>/ met eigen UTM's;
- u-vorm en Vlaamse termen (elektriciteit, zekeringkast, EPC, pleisteren, chauffagist, traiteur);
- kaartteksten: waar dezelfde combinatie in NL bestaat de herschreven NL-tekst, anders nieuw;
- prijzen komen uit het prijsblok "Wat kost een ...?" op trustlocal.be/belgie/<slug>/.
  Geef met --pages=<map> een map met de opgeslagen pagina's (<slug>.html), anders worden ze opgehaald.

Gebruik: python scripts/build-cross-sell-reminder-be.py [--pages=<map>] && npm run validate
"""
import json, os, re, sys, urllib.request, html as htmlmod

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'feeds', 'be-nl', 'cross-sell-be')
OUT = os.path.join(ROOT, 'feeds', 'be-nl', 'cross-sell-reminder-be')
SCHEMA = os.path.join(ROOT, 'schemas', 'cross-sell-reminder-feed.schema.json')
PAGES = next((a.split('=', 1)[1] for a in sys.argv[1:] if a.startswith('--pages=')), None)
HIDE = 'display:none; mso-hide:all;'
# Diensten waarvoor we bewust geen cross-sell mailen (gevoelig). De copy blijft staan; er wordt geen feed
# geschreven, dus Brevo slaat deze contacten over. Weer aanzetten = uit deze set halen en opnieuw bouwen.
INACTIVE = {'begrafenisondernemer'}

# Doeldienst -> (naam op de kaart, woord in de preheader)
TARGETS = {
    'aannemer': ('Aannemer', 'een aannemer'),
    'advocaat': ('Advocaat', 'een advocaat'),
    'badkamer-renovatie': ('Badkamerinstallateur', 'een nieuwe badkamer'),
    'belastingadviseur': ('Belastingadviseur', 'belastingadvies'),
    'bemiddelaar': ('Bemiddelaar', 'bemiddeling'),
    'beveiliging': ('Beveiligingsbedrijf', 'beveiliging'),
    'boekhouder': ('Boekhouder', 'een boekhouder'),
    'chauffagist': ('Chauffagist', 'een chauffagist'),
    'coaching': ('Coach', 'coaching'),
    'dakdekker': ('Dakwerker', 'een dakwerker'),
    'dj': ('Dj', 'een dj'),
    'elektricien': ('Elektricien', 'een elektricien'),
    'epc-keuring': ('EPC-keurder', 'een EPC'),
    'financieel-adviseur': ('Financieel adviseur', 'financieel advies'),
    'fotograaf': ('Fotograaf', 'een fotograaf'),
    'gevelrenovatie': ('Gevelspecialist', 'gevelwerk'),
    'glashandel': ('Glashandel', 'nieuw glas'),
    'glazenwasser': ('Glazenwasser', 'een glazenwasser'),
    'hypotheekadvies': ('Hypotheekadviseur', 'hypotheekadvies'),
    'isolatie': ('Isolatiebedrijf', 'isolatie'),
    'keukenbouwer': ('Keukenbouwer', 'een nieuwe keuken'),
    'klusjesman': ('Klusjesman', 'een klusjesman'),
    'laadpalen': ('Laadpaalinstallateur', 'een laadpaal'),
    'loodgieter': ('Loodgieter', 'een loodgieter'),
    'personal-trainer': ('Personal trainer', 'een personal trainer'),
    'psycholoog': ('Psycholoog', 'een psycholoog'),
    'ramen-en-deuren': ('Raam- en deurspecialist', 'nieuwe ramen'),
    'relatietherapeut': ('Relatietherapeut', 'relatietherapie'),
    'schilder': ('Schilder', 'een schilder'),
    'schoonmaakbedrijf': ('Schoonmaakbedrijf', 'een schoonmaak'),
    'schrijnwerker': ('Schrijnwerker', 'een schrijnwerker'),
    'stukadoor': ('Stukadoor', 'een stukadoor'),
    'thuisbatterij': ('Thuisbatterij', 'een thuisbatterij'),
    'traiteur': ('Traiteur', 'een traiteur'),
    'trouwfotograaf': ('Huwelijksfotograaf', 'een huwelijksfotograaf'),
    'tuinaanleg-en-tuinonderhoud': ('Tuinonderhoudbedrijf', 'tuinonderhoud'),
    'vastgoedmakelaar': ('Vastgoedmakelaar', 'een vastgoedmakelaar'),
    'verhuisfirma': ('Verhuisfirma', 'een verhuisfirma'),
    'videograaf': ('Videograaf', 'een videograaf'),
    'vloerder': ('Vloerder', 'een nieuwe vloer'),
    'vloerverwarming': ('Vloerverwarming', 'vloerverwarming'),
    'vochtbestrijding': ('Vochtbestrijder', 'vochtbestrijding'),
    'warmtepomp-installateur': ('Warmtepompinstallateur', 'een warmtepomp'),
    'webdesign': ('Webdesigner', 'een website'),
    'zonnepanelen': ('Zonnepanelen', 'zonnepanelen'),
    'zonwering': ('Zonweringspecialist', 'zonwering'),
}

# Groepen: kop boven de kaarten, slot van de ondertitel en de prijsnoot
HOME = ('Wat staat er nog op uw', 'lijstje?', '', 'uw woning')
HELP = ('Waar kunt u nog meer', 'hulp', 'bij krijgen?', 'uw situatie')
ARRANGE = ('Wat moet u nog meer', 'regelen?', '', 'uw situatie')
PARTY = ('Wat hebt u nog meer', 'nodig?', '', 'uw feest')
GARDEN = ('Wat staat er nog op uw', 'lijstje?', '', 'uw tuin')

HUIS = 'dit is wat u nog meer voor uw huis kunt laten doen.'
UIT = 'dit is wat u nog meer kunt uitbesteden.'
REGEL = 'dit is wat u nog meer kunt regelen.'
IETS = 'misschien hebt u hier ook iets aan.'
FEEST = 'Organiseert u een feest of huwelijk? Dit is wat u daarvoor nog meer kunt regelen.'

# Bron -> (onderwerp "Naast ... nog hulp nodig?", wie in de ondertitel, "Van A tot B: ..." of vaste zin,
#          groep, slotkop "Hebt u al ...", vier kaarten (label, tekst) in de volgorde van cross-sell-be)
SOURCES = {
    'aannemer': ('een aannemer', 'een aannemer', 'Van strakke muren tot schilderwerk: ' + HUIS, HOME, 'een aannemer', [
        ('Voor strakke muren', 'Strakke muren en plafonds als afwerking van uw verbouwing.'),
        ('Voor een goed dak', 'Een dak dat in orde is voordat de verbouwing klaar is.'),
        ('Voor veilige elektriciteit', 'Stopcontacten en verlichting voor uw verbouwde ruimte.'),
        ('Voor binnen en buiten', 'Schilderwerk dat past bij de afwerking van uw verbouwing.')]),
    'advocaat': ('een advocaat', 'een advocaat', 'Van bemiddeling tot uw belastingaangifte: ' + IETS, HELP, 'een advocaat', [
        ('Voor een gezamenlijke oplossing', 'Begeleiding als u een juridisch conflict samen wilt oplossen.'),
        ('Voor financieel advies', 'Financieel advies als geldzaken meespelen in uw zaak.'),
        ('Voor uw boekhouding', 'Een boekhouder als uw zaak ook uw onderneming raakt.'),
        ('Voor uw aangifte', 'Belastingadvies als uw juridische vraag ook fiscale gevolgen heeft.')]),
    'airco-installateur': ('een airco', 'een airco-installateur', 'Van een warmtepomp tot isolatie: ' + HUIS, HOME, 'een airco-installateur', [
        ('Voor duurzaam verwarmen', 'Een warmtepomp als u naast koelen ook anders wilt verwarmen.'),
        ('Voor veilige elektriciteit', 'Een passende elektrische aansluiting voor uw nieuwe airco.'),
        ('Voor eigen stroom', 'Zonnepanelen als u de stroom voor uw airco zelf wilt opwekken.'),
        ('Voor warmte binnen', 'Isolatie die helpt om de warmte buiten uw woning te houden.')]),
    'architect': ('een architect', 'een architect', 'Van bouwwerk tot uw EPC: ' + HUIS, HOME, 'een architect', [
        ('Voor bouwen en verbouwen', 'Een aannemer voor de uitvoering van uw nieuwe bouwplannen.'),
        ('Voor maatwerk in hout', 'Ramen, trappen of kasten op maat die passen bij uw plannen.'),
        ('Voor uw keuken', 'Een keuken die past bij de indeling van uw nieuwe ruimte.'),
        ('Voor uw EPC', 'Een EPC dat laat zien hoe zuinig uw woning is als het werk klaar is.')]),
    'badkamer-renovatie': ('badkamerrenovatie', 'een badkamerinstallateur', 'Van leidingwerk tot strakke muren: dit is wat u nog meer voor uw badkamer kunt laten doen.', HOME, 'een badkamerinstallateur', [
        ('Voor water en afvoer', 'Nieuwe leidingen, kranen en afvoer voor uw vernieuwde badkamer.'),
        ('Voor veilige elektriciteit', 'Veilige elektriciteit voor verlichting en stopcontacten in uw badkamer.'),
        ('Voor bouwen en verbouwen', 'Een aannemer als de badkamer deel is van een grotere verbouwing.'),
        ('Voor strakke muren', 'Netjes afgewerkte muren en plafonds voor uw nieuwe badkamer.')]),
    'begrafenisondernemer': ('een uitvaart', 'een begrafenisondernemer', 'Van de koffietafel tot juridische vragen: ' + IETS, HELP, 'een begrafenisondernemer', [
        ('Voor eten en drinken', 'Eten en drinken voor de mensen die na het afscheid samenkomen.'),
        ('Voor juridische vragen', 'Uitleg over de nalatenschap en afspraken, in uw eigen tempo.'),
        ('Voor financieel overzicht', 'Overzicht in de financiële zaken die na een overlijden spelen.'),
        ('Voor een opgeruimde woning', 'Hulp bij het schoonmaken van een woning die leeg moet.')]),
    'belastingadviseur': ('belastingadvies', 'een belastingadviseur', 'Van uw boekhouding tot financieel advies: ' + UIT, ARRANGE, 'een belastingadviseur', [
        ('Voor uw boekhouding', 'Een overzichtelijke administratie voor uw belastingaangifte.'),
        ('Voor juridisch advies', 'Juridisch advies als uw fiscale vraag ook juridische gevolgen heeft.'),
        ('Voor financieel advies', 'Advies over pensioen en vermogen bij uw financiële plannen.'),
        ('Voor uw financiering', 'Hypotheekadvies als u een woning wilt kopen of herfinancieren.')]),
    'bemiddelaar': ('een bemiddelaar', 'een bemiddelaar', 'Van juridisch advies tot financieel advies: ' + IETS, HELP, 'een bemiddelaar', [
        ('Voor juridisch advies', 'Juridisch advies over uw rechten en de afspraken die u wilt maken.'),
        ('Voor een luisterend oor', 'Begeleiding als u ook persoonlijke zorgen rond het conflict hebt.'),
        ('Voor financieel advies', 'Financieel advies als geldzaken meespelen in uw afspraken.'),
        ('Voor uw woning', 'Hypotheekadvies als de afspraken ook over uw woning gaan.')]),
    'beveiliging': ('beveiliging', 'een beveiligingsbedrijf', 'Van stevige deuren tot veilig glas: ' + HUIS, HOME, 'een beveiligingsbedrijf', [
        ('Voor stevig houtwerk', 'Deuren en raamkaders die goed sluiten en stevig vastzitten.'),
        ('Voor veilige elektriciteit', 'Voeding en bekabeling voor uw alarm of camera’s.'),
        ('Voor veilig glas', 'Veiligheidsglas dat inbreken moeilijker maakt.'),
        ('Voor nieuwe ramen en deuren', 'Ramen en deuren met betere sloten als vervanging nodig is.')]),
    'boekhouder': ('een boekhouder', 'een boekhouder', 'Van uw aangifte tot een nieuwe website: ' + UIT, ARRANGE, 'een boekhouder', [
        ('Voor uw aangifte', 'Belastingadvies over fiscale vragen naast uw boekhouding.'),
        ('Voor financieel advies', 'Financieel advies over uw plannen, naast uw boekhouding.'),
        ('Voor juridisch advies', 'Juridisch advies over contracten of de vorm van uw onderneming.'),
        ('Voor uw website', 'Een website waarop klanten uw diensten makkelijk vinden.')]),
    'chauffagist': ('een chauffagist', 'een chauffagist', 'Van leidingwerk tot elektriciteit: dit is wat u nog meer voor een warm huis kunt laten doen.', HOME, 'een chauffagist', [
        ('Voor water en afvoer', 'Nieuwe of herstelde leidingen voor uw verwarming.'),
        ('Voor duurzaam verwarmen', 'Een warmtepomp als u minder gas of mazout wilt gebruiken.'),
        ('Voor warmte binnen', 'Isolatie die warmteverlies beperkt en past bij uw verwarming.'),
        ('Voor veilige elektriciteit', 'Een passende elektrische aansluiting voor uw nieuwe verwarming.')]),
    'coaching': ('een coach', 'een coach', 'Van psychologische hulp tot financieel advies: ' + IETS, HELP, 'een coach', [
        ('Voor een luisterend oor', 'Ruimte voor persoonlijke zorgen als u die naast coaching hebt.'),
        ('Voor uw relatie', 'Begeleiding voor u samen als u ook aan uw relatie wilt werken.'),
        ('Voor een betere conditie', 'Een persoonlijk trainingsplan als u ook aan uw conditie werkt.'),
        ('Voor financiële rust', 'Financieel advies als u ook meer overzicht in geldzaken wilt.')]),
    'dakdekker': ('een dakwerker', 'een dakwerker', 'Van isolatie tot uw gevel: ' + HUIS, HOME, 'een dakwerker', [
        ('Voor bouwen en verbouwen', 'Een aannemer als uw dakwerk deel is van een grotere verbouwing.'),
        ('Voor warmte binnen', 'Dakisolatie die u kunt laten meenemen bij het dakwerk.'),
        ('Voor strakke muren', 'Strakke muren en plafonds als u ook de zolder afwerkt.'),
        ('Voor uw gevel', 'Herstel van beschadigd voegwerk aan de buitenkant van uw huis.')]),
    'dj': ('een dj', 'een dj', 'Van een film tot het eten: dit is wat u nog meer voor uw feest kunt regelen.', PARTY, 'een dj', [
        ('Voor een film', 'Een film van de sfeer en bijzondere momenten van uw feest.'),
        ("Voor mooie foto's", "Foto's om de bijzondere momenten van uw feest te bewaren."),
        ('Voor eten en drinken', 'Eten en drinken voor uw feest, van hapjes tot een buffet.'),
        ('Voor uw huwelijk', 'Een fotograaf die uw huwelijksdag van begin tot eind vastlegt.')]),
    'elektricien': ('een elektricien', 'een elektricien', 'Van leidingwerk tot uw badkamer: ' + HUIS, HOME, 'een elektricien', [
        ('Voor water en afvoer', 'Nieuwe waterleidingen als u naast de elektriciteit verbouwt.'),
        ('Voor bouwen en verbouwen', 'Een aannemer als het elektriciteitswerk deel is van een verbouwing.'),
        ('Voor uw keuken', 'Toevallig ook uw keuken opknappen of vervangen?'),
        ('Voor uw badkamer', 'Toevallig ook uw badkamer verbouwen? Van sanitair tot tegels.')]),
    'epc-keuring': ('een EPC', 'een EPC-keurder', 'Van isolatie tot zonnepanelen: ' + HUIS, HOME, 'een EPC-keurder', [
        ('Voor warmte binnen', 'Isolatie als u na het EPC warmteverlies wilt beperken.'),
        ('Voor kopen of verkopen', 'Een vastgoedmakelaar als u uw woning wilt verkopen of verhuren.'),
        ('Voor duurzaam verwarmen', 'Een warmtepomp als u na het EPC anders wilt verwarmen.'),
        ('Voor eigen stroom', 'Zonnepanelen als u na het EPC zelf stroom wilt opwekken.')]),
    'financieel-adviseur': ('financieel advies', 'een financieel adviseur', 'Van uw hypotheek tot uw belastingaangifte: ' + UIT, ARRANGE, 'een financieel adviseur', [
        ('Voor uw financiering', 'Onafhankelijk hypotheekadvies als u een woning wilt kopen.'),
        ('Voor juridisch advies', 'Contracten en afspraken die een advocaat voor u nakijkt.'),
        ('Voor uw boekhouding', 'Een boekhouder voor uw jaarrekening en cijfers.'),
        ('Voor uw aangifte', 'Belastingadvies bij keuzes rond uw inkomen, vermogen of zaak.')]),
    'fotograaf': ('een fotograaf', 'een fotograaf', FEEST, PARTY, 'een fotograaf', [
        ('Voor een film', 'Een video als u de beelden ook in beweging wilt vastleggen.'),
        ('Voor de muziek', 'Een feest op de planning? Muziek die past bij uw gasten.'),
        ('Voor eten en drinken', 'Een traiteur als u voor een feest eten en drinken zoekt.'),
        ('Voor uw huwelijk', 'Een fotograaf die uw huwelijksdag van begin tot eind vastlegt.')]),
    'gevelrenovatie': ('gevelwerk', 'een gevelspecialist', 'Van schilderwerk tot uw dak: ' + HUIS, HOME, 'een gevelspecialist', [
        ('Voor binnen en buiten', 'Schilderwerk aan uw huis als aanvulling op uw gevelwerk.'),
        ('Voor warmte binnen', 'Isolatie die u kunt combineren met uw gevelrenovatie.'),
        ('Voor een goed dak', 'Een dak dat in orde is nu de buitenkant aangepakt wordt.'),
        ('Voor bouwen en verbouwen', 'Een aannemer als de gevel deel is van een grotere verbouwing.')]),
    'glashandel': ('nieuw glas', 'een glashandel', 'Van nieuwe ramen tot isolatie: dit is wat er nog meer bij nieuw glas komt kijken.', HOME, 'een glashandel', [
        ('Voor nieuwe ramen', 'Nieuwe raamkaders als u ook de omlijsting van uw glas vervangt.'),
        ('Voor binnen en buiten', 'Schilderwerk voor een nette afwerking rond uw nieuwe ramen.'),
        ('Voor koelte en privacy', 'Zonwering die aansluit op uw ramen en de zon buiten houdt.'),
        ('Voor warmte binnen', 'Advies over andere plekken in uw woning waar isolatie helpt.')]),
    'glazenwasser': ('een glazenwasser', 'een glazenwasser', 'Van een grote schoonmaak tot uw tuin: ' + HUIS, HOME, 'een glazenwasser', [
        ('Voor een schoon huis', 'Een grondige schoonmaak van de ruimtes achter uw schone ramen.'),
        ('Voor een schone gevel', 'Een reiniging die past bij het materiaal van uw gevel.'),
        ('Voor uw tuin', 'Hagen en borders bijwerken, zodat ook het zicht naar buiten klopt.'),
        ('Voor koelte en privacy', 'Zonwering nakijken of vervangen als doek of bediening versleten is.')]),
    'hypotheekadvies': ('hypotheekadvies', 'een hypotheekadviseur', 'Van een vastgoedmakelaar tot uw EPC: ' + REGEL, ARRANGE, 'een hypotheekadviseur', [
        ('Voor kopen of verkopen', 'Een vastgoedmakelaar die meezoekt en voor u onderhandelt.'),
        ('Voor uw EPC', 'Een EPC als u de woning verkoopt of energiezuiniger wilt maken.'),
        ('Voor juridisch advies', 'Juridisch advies bij contracten en afspraken rond uw aankoop.'),
        ('Voor financieel advies', 'Financieel advies over uw woonlasten en plannen voor uw woning.')]),
    'isolatie': ('isolatie', 'een isolatiebedrijf', 'Van nieuwe ramen tot zonnepanelen: ' + HUIS, HOME, 'een isolatiebedrijf', [
        ('Voor nieuwe ramen', 'Isolerende ramen als u ook warmteverlies via ramen wilt beperken.'),
        ('Voor duurzaam verwarmen', 'Een warmtepomp als u na de isolatie anders wilt verwarmen.'),
        ('Voor droge muren', 'Vocht aanpakken, zodat uw isolatie droog blijft en goed werkt.'),
        ('Voor eigen stroom', 'Zonnepanelen als u na de isolatie zelf stroom wilt opwekken.')]),
    'keukenbouwer': ('een keuken', 'een keukenbouwer', 'Van leidingwerk tot een nieuwe vloer: ' + HUIS, HOME, 'een keukenbouwer', [
        ('Voor water en afvoer', 'Nieuwe leidingen en afvoer voor de indeling van uw nieuwe keuken.'),
        ('Voor veilige elektriciteit', 'Stopcontacten en aansluitingen voor uw nieuwe keukentoestellen.'),
        ('Voor maatwerk in hout', 'Kasten en afwerking op maat die aansluiten op uw keuken.'),
        ('Voor een nieuwe vloer', 'Een nieuwe keukenvloer die aansluit op uw vernieuwde inrichting.')]),
    'klusjesman': ('een klusjesman', 'een klusjesman', 'Van schilderwerk tot maatwerk in hout: ' + HUIS, HOME, 'een klusjesman', [
        ('Voor binnen en buiten', 'Schilderwerk als u ook muren of houtwerk wilt laten afwerken.'),
        ('Voor water en afvoer', 'Hulp bij het verleggen of vervangen van leidingen en kranen.'),
        ('Voor veilige elektriciteit', 'Stopcontacten of verlichting die u wilt laten aanpassen.'),
        ('Voor maatwerk in hout', 'Een kast of inbouwmeubel op maat, passend in uw ruimte.')]),
    'laadpalen': ('een laadpaal', 'een laadpaalinstallateur', 'Van elektriciteit tot uw EPC: ' + HUIS, HOME, 'een laadpaalinstallateur', [
        ('Voor veilige elektriciteit', 'Een zekeringkast en aansluiting die passen bij uw nieuwe laadpaal.'),
        ('Voor eigen stroom', 'Zonnepanelen om stroom op te wekken voor uw nieuwe laadpaal.'),
        ('Voor opslag van stroom', 'Een thuisbatterij om zelf opgewekte stroom later te gebruiken.'),
        ('Voor uw EPC', 'Een EPC als u ook de energiezuinigheid van uw woning wilt kennen.')]),
    'loodgieter': ('een loodgieter', 'een loodgieter', 'Van uw badkamer tot uw keuken: ' + HUIS, HOME, 'een loodgieter', [
        ('Voor uw badkamer', 'Toevallig ook uw badkamer verbouwen? Van sanitair tot tegels.'),
        ('Voor veilige elektriciteit', 'Elektriciteit als u naast leidingen ook aansluitingen nodig hebt.'),
        ('Voor een warm huis', 'Hulp bij uw verwarmingsketel als u ook de verwarming aanpakt.'),
        ('Voor uw keuken', 'Toevallig ook uw keuken opknappen of vervangen?')]),
    'personal-trainer': ('personal training', 'een personal trainer', 'Van coaching tot een luisterend oor: ' + IETS, HELP, 'een personal trainer', [
        ('Voor uw volgende stap', 'Coaching bij gewoontes en motivatie om uw doelen te bereiken.'),
        ('Voor een luisterend oor', 'Een psycholoog als u ook meer grip wilt op hoe u zich voelt.'),
        ('Voor uw relatie', 'Begeleiding voor u samen als u ook aan uw relatie wilt werken.'),
        ('Voor meer tijd', 'Een schoonmaakbedrijf, zodat er meer tijd is voor training en rust.')]),
    'psycholoog': ('een psycholoog', 'een psycholoog', 'Van relatietherapie tot beweging: ' + IETS, HELP, 'een psycholoog', [
        ('Voor uw relatie', 'Begeleiding voor u samen als u ook aan uw relatie wilt werken.'),
        ('Voor uw volgende stap', 'Coaching als u ook aan concrete persoonlijke doelen wilt werken.'),
        ('Voor een betere conditie', 'Meer bewegen met begeleiding op uw eigen niveau.'),
        ('Voor een gezamenlijke oplossing', 'Een gezamenlijke oplossing als er ook een conflict speelt.')]),
    'ramen-en-deuren': ('nieuwe ramen', 'een raam- en deurspecialist', 'Van isolatie tot zonwering: dit is wat er nog meer bij nieuwe ramen komt kijken.', HOME, 'een raam- en deurspecialist', [
        ('Voor warmte binnen', 'Advies over extra isolatie naast uw nieuwe ramen en deuren.'),
        ('Voor nieuw glas', 'Isolerend glas dat aansluit op uw nieuwe raamkaders.'),
        ('Voor binnen en buiten', 'Schilderwerk voor de afwerking rond uw nieuwe ramen.'),
        ('Voor koelte en privacy', 'Zonwering op maat die aansluit op uw nieuwe ramen.')]),
    'reisbureau': ('een reisbureau', 'een reisbureau', 'Van beveiliging tot een schoon huis: dit is wat u nog meer kunt regelen terwijl u weg bent.', HOME, 'een reisbureau', [
        ('Voor een veilig huis', 'Beveiliging die past bij uw woning, ook als u weg bent.'),
        ('Voor uw tuin', 'Tuinonderhoud, zodat gras en hagen bijgehouden worden.'),
        ('Voor een schoon huis', 'Thuiskomen in een frisse woning na uw reis.'),
        ('Voor heldere ramen', 'Ramen die gewassen worden terwijl u weg bent.')]),
    'relatietherapeut': ('relatietherapie', 'een relatietherapeut', 'Van een luisterend oor tot bemiddeling: ' + IETS, HELP, 'een relatietherapeut', [
        ('Voor een luisterend oor', 'Individuele begeleiding als u ook zelf zorgen wilt bespreken.'),
        ('Voor uw volgende stap', 'Coaching als u ook aan uw eigen persoonlijke doelen wilt werken.'),
        ('Voor een gezamenlijke oplossing', 'Begeleiding als u samen een conflict wilt oplossen.'),
        ('Voor minder stress', 'Meer bewegen met begeleiding op uw eigen niveau.')]),
    'rijschool': ('een rijschool', 'een rijschool', 'Van examenstress tot een verhuizing: ' + REGEL, ARRANGE, 'een rijschool', [
        ('Voor examenstress', 'Coaching als u last hebt van zenuwen voor uw praktijkexamen.'),
        ('Voor een luisterend oor', 'Een psycholoog als u meer grip wilt op hoe u zich voelt.'),
        ('Voor op uzelf wonen', 'Een verhuisfirma als u ook op uzelf gaat wonen.'),
        ("Voor mooie foto's", "Foto's voor uw cv, LinkedIn of een bijzondere gebeurtenis.")]),
    'schilder': ('een schilder', 'een schilder', 'Van strakke muren tot een nieuwe vloer: ' + HUIS, HOME, 'een schilder', [
        ('Voor strakke muren', 'Gladde muren en plafonds als basis voor uw nieuwe schilderwerk.'),
        ('Voor een schoon huis', 'Een grondige schoonmaak als het schilderwerk in uw huis klaar is.'),
        ('Voor uw verhuizing', 'Vervoer van meubels als u schilderwerk met een verhuizing combineert.'),
        ('Voor een nieuwe vloer', 'Een nieuwe vloer als u naast het schilderwerk ook de vloer aanpakt.')]),
    'schoonmaakbedrijf': ('schoonmaak', 'een schoonmaakbedrijf', 'Van uw verhuizing tot heldere ramen: ' + HUIS, HOME, 'een schoonmaakbedrijf', [
        ('Voor uw verhuizing', 'Een verhuisfirma als de schoonmaak deel is van een verhuizing.'),
        ('Voor uw tuin', 'Tuinonderhoud, zodat ook buiten alles verzorgd is.'),
        ('Voor heldere ramen', 'Ramen binnen en buiten gewassen, eenmalig of op vaste momenten.'),
        ('Voor binnen en buiten', 'Een frisse laag verf als u uw woning ook wilt opfrissen.')]),
    'schrijnwerker': ('een schrijnwerker', 'een schrijnwerker', 'Van bouwwerk tot elektriciteit: ' + HUIS, HOME, 'een schrijnwerker', [
        ('Voor bouwen en verbouwen', 'Een aannemer als het schrijnwerk deel is van een verbouwing.'),
        ('Voor andere klussen', 'Kleine klussen zoals ophangen, monteren en repareren.'),
        ('Voor binnen en buiten', 'Schilderwerk voor de kleur en afwerking van uw nieuwe houtwerk.'),
        ('Voor veilige elektriciteit', 'Nieuwe elektriciteit als u verlichting in uw maatwerk wilt.')]),
    'stukadoor': ('een stukadoor', 'een stukadoor', 'Van schilderwerk tot een nieuwe vloer: ' + HUIS, HOME, 'een stukadoor', [
        ('Voor binnen en buiten', 'Schilderwerk voor uw muren zodra het pleisterwerk droog is.'),
        ('Voor bouwen en verbouwen', 'Een aannemer als het pleisterwerk deel is van een verbouwing.'),
        ('Voor veilige elektriciteit', 'Nieuwe stopcontacten of leidingen voordat uw muren gepleisterd worden.'),
        ('Voor een nieuwe vloer', 'Een nieuwe vloer als u naast pleisterwerk ook de vloer vernieuwt.')]),
    'thuisbatterij': ('een thuisbatterij', 'een thuisbatterij', 'Van zonnepanelen tot uw EPC: ' + HUIS, HOME, 'een installateur voor uw thuisbatterij', [
        ('Voor eigen stroom', 'Zonnepanelen om zelf stroom op te wekken voor uw thuisbatterij.'),
        ('Voor thuis laden', 'Een laadpaal als u thuis ook uw elektrische auto wilt opladen.'),
        ('Voor veilige elektriciteit', 'Een elektrische aansluiting die geschikt is voor uw thuisbatterij.'),
        ('Voor uw EPC', 'Een EPC als u ook de energiezuinigheid van uw woning wilt kennen.')]),
    'traiteur': ('een traiteur', 'een traiteur', FEEST, PARTY, 'een traiteur', [
        ('Voor de muziek', 'Muziek voor uw feest of bijeenkomst die past bij uw gasten.'),
        ("Voor mooie foto's", "Foto's als u de bijeenkomst met uw gasten wilt vastleggen."),
        ('Voor na het feest', 'Een schoonmaakbedrijf dat de ruimte na afloop opruimt.'),
        ('Voor uw huwelijk', 'Een fotograaf die uw huwelijksdag van begin tot eind vastlegt.')]),
    'trouwfotograaf': ("huwelijksfoto's", 'een huwelijksfotograaf', 'Van een film tot het eten: dit is wat u nog meer voor uw huwelijk kunt regelen.', PARTY, 'een huwelijksfotograaf', [
        ('Voor een film', 'Een film van uw huwelijksdag, van de ceremonie tot het feest.'),
        ('Voor de muziek', 'Muziek die aansluit op uw smaak en uw huwelijksgasten.'),
        ('Voor eten en drinken', 'Eten en drinken voor uw gasten op de dag van uw huwelijk.'),
        ('Voor na het feest', 'Een schoonmaakbedrijf dat de ruimte na afloop opruimt.')]),
    'tuinaanleg-en-tuinonderhoud': ('tuinonderhoud', 'een tuinonderhoudbedrijf', 'Van een tuinpoort tot tuinverlichting: dit is wat u nog meer voor uw tuin kunt laten doen.', GARDEN, 'een tuinonderhoudbedrijf', [
        ('Voor maatwerk in hout', 'Een tuinpoort of houten afsluiting die stevig geplaatst wordt.'),
        ('Voor andere klussen', 'Kleine reparaties aan uw afsluiting of tuinhuis naast het tuinwerk.'),
        ('Voor binnen en buiten', 'Een frisse laag verf voor poort, gevel of tuinhuis.'),
        ('Voor licht in de tuin', 'Tuinverlichting en buitenstopcontacten, veilig aangesloten.')]),
    'vastgoedmakelaar': ('een makelaar', 'een vastgoedmakelaar', 'Van het EPC tot de verhuisdag: ' + REGEL, ARRANGE, 'een vastgoedmakelaar', [
        ('Voor uw EPC', 'Een EPC, verplicht als u uw woning verkoopt of verhuurt.'),
        ('Voor een schone woning', 'Een grondige schoonmaak voor de overdracht of een bezichtiging.'),
        ('Voor uw financiering', 'Hypotheekadvies als u ook een nieuwe woning koopt.'),
        ('Voor uw verhuizing', 'Een verhuisfirma die inpakken, vervoeren en dragen regelt.')]),
    'verhuisfirma': ('een verhuisfirma', 'een verhuisfirma', 'Van een grote schoonmaak tot schilderwerk: ' + REGEL, ARRANGE, 'een verhuisfirma', [
        ('Voor een schoon huis', 'Een schone woning als u ook schoonmaak rond uw verhuizing zoekt.'),
        ('Voor binnen en buiten', 'Een frisse laag verf in uw nieuwe woning voor u erin trekt.'),
        ('Voor andere klussen', 'Hulp bij het demonteren en monteren van meubels bij uw verhuizing.'),
        ('Voor maatwerk in hout', 'Kasten of afwerking op maat voor uw nieuwe woning.')]),
    'videograaf': ('een videograaf', 'een videograaf', FEEST, PARTY, 'een videograaf', [
        ("Voor mooie foto's", "Foto's als u de beelden ook naast uw video wilt gebruiken."),
        ('Voor de muziek', 'Een feest op de planning? Muziek die past bij uw gasten.'),
        ('Voor eten en drinken', 'Een traiteur als u voor een feest eten en drinken zoekt.'),
        ('Voor uw huwelijk', 'Een fotograaf die uw huwelijksdag van begin tot eind vastlegt.')]),
    'vloerder': ('een vloerder', 'een vloerder', 'Van strakke muren tot vloerverwarming: ' + HUIS, HOME, 'een vloerder', [
        ('Voor strakke muren', 'Strakke muren en plafonds voordat uw nieuwe vloer gelegd wordt.'),
        ('Voor binnen en buiten', 'Schilderwerk in kleuren die aansluiten op uw nieuwe vloer.'),
        ('Voor veilige elektriciteit', 'Stopcontacten of verlichting verleggen voordat de vloer erin ligt.'),
        ('Voor warme voeten', 'Vloerverwarming die afgestemd is op uw nieuwe vloer.')]),
    'vloerverwarming': ('vloerverwarming', 'een installateur voor vloerverwarming', 'Van isolatie tot een nieuwe vloer: ' + HUIS, HOME, 'een installateur', [
        ('Voor warmte binnen', 'Isolatie onder de vloer, zodat er geen warmte verloren gaat.'),
        ('Voor duurzaam verwarmen', 'Een warmtepomp die past bij uw woning en vloerverwarming.'),
        ('Voor een nieuwe vloer', 'Een vloer die geschikt is voor vloerverwarming.'),
        ('Voor een warm huis', 'Een chauffagist die de vloerverwarming op uw verwarming aansluit.')]),
    'vochtbestrijding': ('vochtbestrijding', 'een vochtbestrijder', 'Van leidingwerk tot uw dak: ' + HUIS, HOME, 'een vochtbestrijder', [
        ('Voor water en afvoer', 'Herstel van leidingen als een lek het vochtprobleem veroorzaakt.'),
        ('Voor strakke muren', 'Nieuw pleisterwerk als uw muren na de behandeling droog zijn.'),
        ('Voor een goed dak', 'Een dak dat geen water meer doorlaat.'),
        ('Voor uw gevel', 'Voegwerk herstellen of de gevel waterdicht laten maken.')]),
    'warmtepomp-installateur': ('een warmtepomp', 'een warmtepomp', 'Van isolatie tot zonnepanelen: ' + HUIS, HOME, 'een installateur voor uw warmtepomp', [
        ('Voor warmte binnen', 'Isolatie die warmteverlies beperkt en past bij uw warmtepomp.'),
        ('Voor een warm huis', 'Onderhoud aan uw ketel als die naast uw warmtepomp blijft werken.'),
        ('Voor veilige elektriciteit', 'Een elektrische aansluiting die geschikt is voor uw warmtepomp.'),
        ('Voor eigen stroom', 'Zonnepanelen om zelf stroom op te wekken voor uw warmtepomp.')]),
    'webdesign': ('een webdesigner', 'een webdesigner', "Van foto's tot uw boekhouding: " + UIT, ARRANGE, 'een webdesigner', [
        ("Voor mooie foto's", "Eigen foto's van uw zaak en uw werk voor uw nieuwe website."),
        ('Voor uw boekhouding', 'Een boekhouder die uw administratie en aangiftes op orde houdt.'),
        ('Voor een video', 'Een bedrijfsvideo of productvideo voor uw nieuwe website.'),
        ('Voor juridisch advies', 'Algemene voorwaarden en privacytekst die een advocaat nakijkt.')]),
    'zonnepanelen': ('zonnepanelen', 'zonnepanelen', 'Van een thuisbatterij tot een warmtepomp: ' + HUIS, HOME, 'een installateur voor uw zonnepanelen', [
        ('Voor opslag van stroom', 'Een thuisbatterij om de stroom van uw zonnepanelen te bewaren.'),
        ('Voor thuis laden', 'Een laadpaal als u ook uw elektrische auto thuis wilt opladen.'),
        ('Voor veilige elektriciteit', 'Een zekeringkast en aansluiting die passen bij uw zonnepanelen.'),
        ('Voor duurzaam verwarmen', 'Een warmtepomp die u verwarmt met uw eigen zonnestroom.')]),
    'zonwering': ('zonwering', 'zonwering', 'Van nieuwe ramen tot schilderwerk: ' + HUIS, HOME, 'een zonweringspecialist', [
        ('Voor nieuwe ramen', 'Nieuwe ramen als u naast zonwering ook uw ramen wilt vernieuwen.'),
        ('Voor nieuw glas', 'Isolerend glas als u ook warmteverlies via ramen wilt beperken.'),
        ('Voor uw tuin', 'Een tuin met meer schaduw als u ook de buitenruimte aanpakt.'),
        ('Voor binnen en buiten', 'Nieuw schilderwerk als u naast zonwering uw gevel wilt opfrissen.')]),
}

PRICE_RE = re.compile(r'Een [^€]{1,60}? kost (?:per (\w+) )?(?:gemiddeld )?tussen de € ([0-9.]+) ,- en € ([0-9.]+) ,-')
UNIT_OVERRIDE = {'beveiliging': 'uur'}  # prijsblok zonder eenheid; de pagina noemt € 45-50 per uur per beveiliger


def euro(n):
    return '€ ' + f'{int(n.replace(".", "")):,}'.replace(',', '.')


def page_text(slug):
    if PAGES:
        raw = open(os.path.join(PAGES, slug + '.html'), encoding='utf-8', errors='replace').read()
    else:
        req = urllib.request.Request(f'https://trustlocal.be/belgie/{slug}/', headers={'User-Agent': 'Mozilla/5.0 Chrome/130'})
        raw = urllib.request.urlopen(req, timeout=60).read().decode('utf-8', 'replace')
    return re.sub(r'\s+', ' ', htmlmod.unescape(re.sub(r'<[^>]+>', ' ', raw)))


def price(slug):
    m = PRICE_RE.search(page_text(slug))
    if not m:
        return 'Prijs op maat'
    unit = m.group(1) or UNIT_OVERRIDE.get(slug)
    return f'{euro(m.group(2))} – {euro(m.group(3))}' + (f' per {unit}' if unit else '')


def join_three(words):
    return words[0] if len(words) == 1 else ', '.join(words[:-1]) + ' of ' + words[-1]


def main():
    fields = json.load(open(SCHEMA, encoding='utf-8'))['required']
    prices = {t: price(t) for t in TARGETS}
    os.makedirs(OUT, exist_ok=True)
    warnings = []
    for slug, (subj, who, sub, group, closer, cards) in SOURCES.items():
        if slug in INACTIVE:
            path = os.path.join(OUT, slug + '.json')
            if os.path.exists(path):
                os.remove(path)
            continue
        x = json.load(open(os.path.join(SRC, slug + '.json'), encoding='utf-8'))
        key = f'crosssell_reminder_{slug}'
        utm = f'utm_source=brevo&utm_campaign={key}&utm_medium=email'
        targets = [re.search(r'/belgie/([^/]+)/', x[f'card{i}_url']).group(1) for i in range(1, 5) if x[f'card{i}_url']]
        assert len(targets) == len(cards), slug
        title = f'Naast {subj} nog hulp nodig?'
        if len(title) > 40:
            warnings.append(f'{slug}: titel {len(title)} tekens')
        f = {
            'title': title, 'subject_line': title,
            'preheader': f'Bekijk de gemiddelde kosten van {join_three([TARGETS[t][1] for t in targets[:3]])} en vraag gratis een prijsindicatie op.',
            'hero_image_url': x['hero_image_url'], 'hero_image_alt': x['hero_image_alt'],
            'hero_title_pre': f'Naast {subj} nog', 'hero_title_accent': 'hulp', 'hero_title_post': 'nodig?',
            'hero_subtitle': f'U zocht onlangs via Trustlocal {who}. ' + (sub if sub.startswith('Organiseert') else sub),
            'campaign_key': key,
            'services_heading_pre': group[0], 'services_heading_accent': group[1], 'services_heading_post': group[2],
            'services_intro': 'Op Trustlocal vergelijkt u de beste bedrijven bij u in de buurt voor ruim 50 verschillende diensten. Vraag gratis en vrijblijvend een prijsindicatie aan.',
            'grid_style': '' if len(cards) == 4 else HIDE,
            'stack_style': HIDE if len(cards) == 4 else '',
            'stack2_style': '' if len(cards) in (2, 3) else HIDE,
            'stack3_style': '' if len(cards) == 3 else HIDE,
            'prices_note': f'Gemiddelde prijzen op Trustlocal.be. Wat u betaalt, hangt af van {group[3]}.',
            'closing_heading_pre': f'Hebt u al {closer}', 'closing_heading_accent': 'gevonden?', 'closing_heading_post': '',
            'closing_intro': 'Uw aanvraag staat nog open. Hebt u al iemand gevonden of hebt u geen hulp meer nodig? Werk uw aanvraag bij in Mijn aanvragen.',
            'all_services_label': 'Alle diensten bekijken',
            'all_services_url': f'https://trustlocal.be/alle-diensten/?{utm}&utm_content=allediensten',
            'dashboard_label': 'Mijn aanvraag bijwerken',
        }
        for i in range(1, 5):
            p = f'service{i}_'
            if i <= len(cards):
                t = targets[i - 1]
                label, text = cards[i - 1]
                f.update({p + 'name': TARGETS[t][0], p + 'label': label, p + 'text': text, p + 'price': prices[t],
                          p + 'url': f'https://trustlocal.be/belgie/{t}/?{utm}&utm_content=kaart{i}',
                          p + 'link_label': 'Ontvang prijsindicatie',
                          p + 'image_url': x[f'card{i}_image_url'], p + 'image_alt': x[f'card{i}_image_alt']})
                if len(text) > 72:
                    warnings.append(f'{slug} kaart {i}: tekst {len(text)} tekens')
            else:
                f.update({p + k: '' for k in ('name', 'label', 'text', 'price', 'url', 'link_label', 'image_url', 'image_alt')})
        missing = set(fields) ^ set(f)
        assert not missing, (slug, missing)
        with open(os.path.join(OUT, slug + '.json'), 'w', encoding='utf-8', newline='\n') as fh:
            json.dump({k: f[k] for k in fields}, fh, ensure_ascii=False, indent=2)
            fh.write('\n')
    print(f'{len(SOURCES) - len(INACTIVE)} feeds geschreven naar {os.path.relpath(OUT, ROOT)} (inactief: {", ".join(sorted(INACTIVE))})')
    for t, p in sorted(prices.items()):
        print(f'  prijs {t}: {p}')
    for w in warnings:
        print('  LET OP', w)


if __name__ == '__main__':
    main()
