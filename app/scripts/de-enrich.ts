/**
 * DE catalog enrichment (2026-09-11): injects German copy (LocalText.de) for
 * every German developer + project row and sourceUrl provenance per project.
 * Idempotent — blocks that already carry `de:` are skipped, so the script can
 * re-run after new rows land. Run: npx tsx scripts/de-enrich.ts
 */
import fs from 'node:fs'
import path from 'node:path'

const BERLIN = path.join(__dirname, '..', 'src', 'data', 'projects-new-berlin.ts')
const GERMANY = path.join(__dirname, '..', 'src', 'data', 'projects-new-germany.ts')

/** Official-source provenance per developer (their project overview page). */
const SOURCE: Record<string, string> = {
  wbm: 'https://www.wbm.de/neubau-berlin/komplexe-quartiere/',
  degewo: 'https://www.degewo.de/unsere-kieze/wohnungsbau/neubau',
  howoge: 'https://www.howoge.de/immobiliensuche/neubauprojekte.html',
  gewobag: 'https://www.gewobag.de/bauen-in-berlin/bauprojekte/',
  'stadt-und-land': 'https://www.stadtundland.de/bauen/neubau',
  gesobau: 'https://www.gesobau.de/wohnungsbau/neubauprojekte/',
  'buwog-berlin': 'https://www.buwog.de/wohnbauprojekte',
  'nhw-wiesbaden': 'https://www.nhw.de/neubau',
  'gewoba-bremen': 'https://www.gewoba.de/',
  'gag-koeln': 'https://www.gag-koeln.de/immobiliensuche/neubauprojekte',
  trockland: 'https://www.trockland.com/',
  covivio: 'https://www.covivio.eu/',
  'art-invest': 'https://www.art-invest.de/',
  greystar: 'https://www.greystar.com/',
  'ten-brinke': 'https://www.tenbrinke.de/',
  'gross-partner': 'https://www.grosspartner.de/',
  'saga-hamburg': 'https://www.saga.hamburg/',
  'muenchner-wohnen': 'https://www.muenchner-wohnen.de/',
  'euroboden-berlin': 'https://www.euroboden.de/',
  'quartier-eins-berlin': 'https://www.quartier-eins.de/',
}

/** German developer blurbs — one per row, facts mirror the en text. */
const DEV: Record<string, string> = {
  wbm: 'WBM (Wohnungsbaugesellschaft Berlin-Mitte) ist das städtische Bauträgerunternehmen mit rund 35.000 Mietwohnungen in Mitte, Friedrichshain-Kreuzberg und Spandau. Bis 2034: +10.000 Wohnungen, 3,3 Mrd. €.',
  degewo: 'degewo ist Berlins größtes staatliches Wohnungsunternehmen (rund 75.000 Wohnungen) und baut Neulichterfelde in Lichterfelde – etwa 2.500 Wohnungen mit WÖHR + BAUER und Groth.',
  howoge: 'HOWOGE ist einer der größten kommunalen Vermieter Deutschlands (rund 83.000 Berliner Wohnungen). 2025 wurden 1.182 Wohnungen fertiggestellt; Ziel sind 100.000, überwiegend Neubau.',
  gewobag: 'Gewobag ist eines der sechs kommunalen Wohnungsunternehmen Berlins (rund 74.000 Wohnungen). Landsberger Allee in Lichtenberg: Europas größtes Modulbauprojekt mit 1.548 Wohnungen, 2026/27.',
  'stadt-und-land': 'STADT UND LAND ist ein kommunaler Bauträger mit rund 53.300 Wohnungen. Buckower Felder in Neukölln (rund 900 Wohnungen, 2026) ist fertig; Ziel bis 2034: 56.500 Einheiten.',
  gesobau: 'GESOBAU ist der kommunale Bauträger für Nord-Berlin (rund 48.000 Wohnungen in Pankow und Reinickendorf) und Co-Entwickler von Elisabeth-Aue mit HOWOGE.',
  'buwog-berlin': 'BUWOG (Vonovia) ist ein privater Bauträger mit rund 57.000 Wohnungen im Bau und in Planung deutschlandweit. In Berlin: 52° Nord in Grünau (rund 1.000) und NEUMARIEN in Neukölln (rund 800).',
  'pandion-berlin': 'PANDION ist ein deutscher Premium-Bauträger in Friedrichshain: PANDION MIDTOWN an der Pufendorfstraße (4 Bauabschnitte, gegenüber dem Volkspark Friedrichshain).',
  'primus-immobilien': 'Primus Immobilien ist ein Berliner Entwickler seit 1993 (Portfolio rund 1,2 Mrd. €). Mietmarken: arrive mit Greystar (2.300+ Wohnungen); im Verkauf: Céleste in Charlottenburg.',
  bauwert: 'Bauwert ist ein Berliner Entwickler hinter der Neuen Bockbrauerei im Bergmannkiez (Kreuzberg): rund 220 Wohnungen auf einem ehemaligen Brauereigelände, Fertigstellung 2026.',
  'diamona-harnisch': 'Diamona & Harnisch ist ein Premium-Entwickler (Charlottenburg, Mitte, Friedrichshain, Schöneberg). Aktiv: Eckert Carré (205 Wohnungen, 2029) und Am Winterfeldt.',
  'project-immobilien-berlin': 'PROJECT Immobilien ist ein deutscher Entwickler mit Sitz in Nürnberg. Seit August 2023 in der Insolvenz; der Insolvenzverwalter hat die Fertigstellung von sechs Berliner Projekten beauftragt (gruppenweit rund 940 Wohnungen). In Berlin: MALMÖ28 im Prenzlauer Berg (84 Einheiten, ausverkauft, Effizienzhaus 55).',
  'hamburg-team': 'HAMBURG TEAM entwickelt HEY Charlottenburg gemeinsam mit OTTO WULFF (Quedlinburger Straße 12, 337 Einheiten plus Kita, 2027).',
  'otto-wulff-berlin': 'OTTO WULFF ist eine Hamburger Bauunternehmung (seit 1932). In Berlin: HEY Charlottenburg mit HAMBURG TEAM (2027).',
  'groth-gruppe': 'Die Groth Gruppe ist ein Berliner Entwickler, der Neulichterfelde über 14 Jahre geprägt hat und im Quartier rund 420 Townhouses errichtet.',
  'wvm-berlin': 'Die wvm Gruppe Berlin ist ein Wohnentwickler (Berlin/Köln). Zwieseler Hof in Karlshorst: 321 Einheiten (147 Eigentums- und 174 Mietwohnungen), Fertigstellung 2027.',
  'liven-berlin': 'Liven ist ein junger Berliner Eco-Entwickler: Holz-Hybrid-Bauweise, Photovoltaik, gemeinschaftliche Gärten. Wohngarten in Neukölln an der Grenze zu Kreuzberg.',
  'bonava-berlin': 'Bonava ist ein börsennotierter Wohnentwickler und baut in Berlin Waldpanorama in Buch (rund 450 Wohnungen, Geothermie) sowie Fritz-Kirsch-Zeile in Köpenick – und realisiert Cecilien-Carré schlüsselfertig für GESOBAU.',
  'wohnquadrat-berlin': 'Wohnquadrat Berlin ist ein inhabergeführter Bauträger seit 2016 (5–10 Projekte pro Jahr). Harzer Straße 118 in Neukölln (12 Einheiten, Effizienzklasse A+, 2028).',
  'instone-real-estate': 'Instone Real Estate ist Deutschlands führender börsennotierter privater Wohnentwickler (CDAX). Berlin: Berlia in Mitte (rund 300 Einheiten), Kopenhagener Straße in Pankow, Topaz in Spandau, Wolfsbergquartier. Fokus: Premium/Bestandswechsel.',
  'tag-immobilien': 'TAG Immobilien ist ein börsennotierter Wohnungskonzern (rund 25.000 Berliner Einheiten). Weitlingkiez in Lichtenberg: 420 Einheiten aus Modernisierung und Aufstockung, Fertigstellung Q4 2026.',
  'patrizia-berlin': 'PATRIZIA ist ein europäischer Immobilieninvestmentmanager. Patriots Park in Tempelhof: 650 Einheiten (EH 55) im Forward-Funding mit Union Investment, gegenüber dem Park. Fertigstellung Q4 2029.',
  'dic-asset-berlin': 'Branicks Group (vormals DIC Asset AG) ist ein im SDAX gelisteter gewerblicher Immobilienmanager (rund 12 Mrd. € Assets). Berlin: QUARTIER POTSDAMER PLATZ (Co-Entwicklung) und Stadthausquartier in Mitte.',
  'grand-city-properties': 'Grand City Properties ist ein europäischer Wohnimmobilienkonzern. In Berlin-Neukölln entstehen an der Karl-Marx-Straße 180 Einheiten aus Sanierung und Aufstockung, die Hälfte gefördert.',
  'corpus-sireo': 'CORPUS SIREO (Swiss Life Asset Managers) entwickelt und managt Wohn- und Gewerbeimmobilien. Berlin: The Q an der Friedrichstraße (Co-Entwicklung mit Allianz) und QUARTIER 205 an der Revaler Straße.',
  'union-investment-berlin': 'Union Investment ist ein internationaler Immobilieninvestor. UPL Europacity: 320 Premium-Einheiten an der Heidestrasse im Forward-Funding, Fertigstellung Q4 2028.',
  'allianz-real-estate-berlin': 'Allianz Real Estate investiert weltweit in Immobilien. QUARTIER HEIDESTRASSE in der Europacity: 250 Premium-Einheiten als Co-Entwicklung mit CA Immo und QUARTIER EINS, ab 2,2 Mio. €.',
  'euroboden-berlin': 'Euroboden ist ein Münchner/Berliner Entwickler hochwertiger Stadthäuser und Quartiere. Berlin: AM TACHELES (190 Einheiten ab 3 Mio. €) und Köpenicker Strasse (160 Einheiten).',
  'quartier-eins-berlin': 'QUARTIER EINS ist ein Berliner Projektentwickler. QUARTIER SCHÖNEBERG (220 Einheiten, Hauptstrasse) und QUARTIER PRENZLAUER BERG (140 Einheiten, Dunckerstrasse) entstehen als gemischt genutzte Quartiere mit Kita.',
  'quartier-lilienthal': 'QUARTIER LILIENTHAL ist WBM — das Viertel an der Köpenicker Strasse mit 102 Mietwohnungen, rund 8.000 m² Gewerbe und sechs Höfen; rund 40 Wohnungen gefördert (ab 6,90 €/m²), Fertigstellung Q3 2026.',
  'howoge-elisabeth-aue': 'Elisabeth-Aue: gemeinsame Quartiersentwicklung von HOWOGE und GESOBAU in Pankow – rund 1.800 Wohnungen, Tiefgarage, Kita, grüne Höfe. Fertigstellung Q2 2029.',
  'gesobau-elisabeth-aue': 'Elisabeth-Aue: GESOBAU und HOWOGE entwickeln in Pankow gemeinsam ein Quartier mit rund 1.800 Wohnungen, Kita und Tiefgarage. Fertigstellung Q2 2029.',
  vonovia: 'Vonovia SE ist Europas größter Wohnungsvermieter (rund 540.000 Einheiten, DAX) mit Sitz in Bochum und Eigentümer von BUWOG. Fokus auf dem Bestand, seltener Neubau.',
  'deutsche-wohnen': 'Deutsche Wohnen SE ist ein Berlin-orientierter Wohnungskonzern (rund 140.000 Wohnungen, Teil von Vonovia): Bestand plus selektiver Neubau.',
  'leg-immobilien': 'LEG Immobilien SE ist ein börsennotierter Vermieter in NRW (rund 168.000 Wohnungen, Sitz Düsseldorf) mit Fokus auf bezahlbare Mieten in Ruhrgebiet und Rheinland.',
  vivawest: 'Vivawest GmbH ist eine große Wohnungsgruppe in NRW (rund 120.000 Wohnungen, Sitz Gelsenkirchen): Bestand, Neubau und Stadtentwicklung im Ruhrgebiet.',
  'saga-hamburg': 'Die SAGA Unternehmensgruppe ist Hamburgs kommunaler Vermieter (rund 137.000 Wohnungen) und Kern der bezahlbaren Miete mit Neubau in allen Bezirken.',
  'muenchner-wohnen': 'Münchner Wohnen ist das kommunale Wohnungsunternehmen Münchens (rund 70.000 Wohnungen; GEWOFAG und GWG fusionierten 2024) und baut bezahlbaren Neubau in städtischen Programmen.',
  'abg-frankfurt': 'ABG Frankfurt Holding ist die kommunale Gruppe Frankfurts (rund 50.000 Wohnungen): Bestand und Neubau im Rhein-Main-Gebiet mit Fokus auf Energieeffizienz.',
  'gag-koeln': 'Die GAG Immobilien AG ist Kölns kommunaler Vermieter (rund 45.000 Wohnungen, seit 1913) und größter Vermieter der Stadt mit Neubau in allen Stadtbezirken.',
  'gewoba-bremen': 'Gewoba ist Bremens führende Wohnungsgruppe (rund 42.000 Wohnungen): Bestand und Neubau auf beiden Weserseiten, ausgezeichnet u. a. mit dem Deutschen Bauherrenpreis 2026.',
  'nhw-wiesbaden': 'Die Unternehmensgruppe Nassauische Heimstätte | Wohnstadt (NHW) ist Hessens kommunale Gruppe (rund 60.000 Wohnungen, Sitz Wiesbaden): Rhein-Main plus Kassel, rund 1.374 Wohnungen im Bau und in Planung (Stand 06/2025).',
  'art-invest': 'Art-Invest Real Estate ist ein Projektentwickler mit Sitz in Köln (300+ Mitarbeiter; Büros, Hotels, Wohnquartiere). In Berlin entwickelt das Unternehmen das Mixed-Use-Viertel Die Macherei am Halleschen Ufer.',
  covivio: 'Covivio ist ein europäischer REIT mit Wohnungsneubauprognose von 40.000+ Einheiten in Europa (rund 2.600 in den nächsten Jahren). In Berlin: Biesdorf (106 Wohnungen), 030BLN am Alexanderplatz und rund 420 Co-Living-Einheiten.',
  trockland: 'Trockland ist ein Berliner Entwickler (22 Objekte; Neubau und Sanierung). Es entsteht das 289-Wohnungen-Quartier am Checkpoint Charlie sowie – per Forward Deal mit STADT UND LAND – 63 geförderte Wohnungen in Spandau.',
  greystar: 'Greystar ist der weltgrößte Betreiber und Entwickler von Mietwohnungen (USA). In Berlin entsteht mit ten brinke das Quartier Marzahn-Mitte mit 444 Mietwohnungen (Baubeginn Sommer 2026).',
  'ten-brinke': 'ten brinke ist ein deutsch-niederländischer Projektentwickler (Vreden, seit 1977) und baut in Berlin mit Greystar 444 Mietwohnungen in Marzahn-Mitte.',
  'gross-partner': 'Groß & Partner ist ein Frankfurter Projektentwickler. Flaggschiff ist FOUR Frankfurt: vier Türme in der Innenstadt, darunter RIZON mit 359 Wohnungen.',
  lwb: 'Die LWB ist die kommunale Wohnungsbaugesellschaft Leipzigs (rund 42.000 Wohnungen), größter Vermieter der Stadt mit Neubau in allen Stadtteilen seit dem Wohnungsbauprogramm 2018.',
  isaria: 'ISARIA Wohnbau ist ein privater Münchner Entwickler von Wohnungen, Wohnanlagen und Individualhäusern in und um München – darunter nido in Karlsfeld und App.artments in Bogenhausen.',
}

/** German project blurbs — one per DE catalog row. */
const PROJECT: Record<string, string> = {
  // ——— Berlin: WBM ———
  'wbm-mollstrasse': 'WBM Mollstrasse: 84 Mietwohnungen (36–71 m²) im 11-geschossigen Modulturm im Barnimkiez, die Hälfte gefördert (ab 7 €/m²), alle mit Balkon. Fertigstellung Q4 2027.',
  'wbm-lange-strasse': 'WBM Lange Strasse: zwei 8-geschossige Blöcke mit 110 Mietwohnungen (97 barrierefrei, 41 gefördert), EH 40. Baubeginn Q4 2026, Fertigstellung Q2 2029.',
  'wbm-rathausblock-sued': 'Rathausblock Süd: WBM fünf Gebäude auf dem Dragonerareal – rund 380 Mietwohnungen (mindestens 30 % gefördert) plus rund 90 genossenschaftliche. Genehmigungen ab 2027, Beginn Ende 2027.',
  'wbm-melchior-engeldamm': 'WBM Melchiorstrasse: Holz-Hybrid-Block in Mitte (EH 40) mit 54 Mietwohnungen (rund 3.000 m²), teilweise gefördert (ab 7 €/m²). Fertigstellung Q4 2028.',
  'wbm-neue-jakobstrasse': 'WBM Neue Jakobstrasse: Holz-Hybrid-Block auf einem ehemaligen Parkplatz – 35 Mietwohnungen (rund 2.300 m²) plus 265 m² Gewerbe. Fertigstellung Q4 2028.',
  'wbm-sez-quartier': 'SEZ Quartier: WBM 631 Wohnungen (316 gefördert) auf dem ehemaligen SEZ-Gelände – 22 Gebäude mit 4 bis 12 Geschossen (Stefan Forster), 6.080 m² Gewerbe, EH 40 / DGNB Platin. Baubeginn Februar 2029, Fertigstellung Mai 2031.',
  'wbm-haus-der-statistik': 'Haus der Statistik: gemeinwohlorientiertes Quartier auf 3,2 ha – WBM 278 bezahlbare Wohnungen (174 gefördert) in 15- und 12-geschossigen Türmen, ein 16-geschossiger Büroturm und eine Kita. Baubeginn Oktober 2027, Fertigstellung März 2030 (Teleinternetcafe/Treibhaus).',
  'wbm-breite-strasse': 'Breite Strasse: WBM 79 Mietwohnungen (24 gefördert) in fünf Einzelhäusern zwischen Scharrenstraße und Neumannsgasse, rund 7.500 m² Gewerbe mit 10 % Kulturfläche zum vergünstigten Satz. Baubeginn März 2028, Fertigstellung März 2030.',
  'wbm-molkenmarkt': 'Quartier Molkenmarkt: WBM Blöcke A und B auf rund 12.000 m² – 220 Wohnungen (110 gefördert) und rund 20.000 m² Gewerbe am ältesten Marktplatz Berlins; die archäologischen Grabungen laufen. Baubeginn Dezember 2029, Fertigstellung Juni 2033.',
  'wbm-rathenower-strasse': 'Ort der Vielfalt Rathenower Strasse 16: 108 Wohnungen (102 gefördert, 104 barrierefrei) in Moabit, darunter 24 Clusterwohnungen, plus 2.785 m² Gewerbe für soziale Organisationen. Richtfest April 2026, Fertigstellung Mai 2027 (CKRS).',
  'wbm-viktoriaspeicher': 'Viktoriaspeicher Areal: gemeinsames Quartier von WBM und Grundstückseigentümerin BEHALA am Spreeufer in Kreuzberg – über 1.000 Wohnungen, ein Klimapark und Arbeitsflächen. Sieger des Urbankollektiv-Workshops: Behles & Jochimsen (Juni 2026); Baubeginn ab etwa 2030.',
  'wbm-quartier-lilienthal': 'Quartier Lilienthal: WBM Viertel an der Köpenicker Strasse – 102 Mietwohnungen, rund 8.000 m² Einzelhandel, sechs Höfe, ein 12-geschossiger Kopfbau. Rund 40 Wohnungen gefördert (ab 6,90 €/m²). Q3 2026.',
  // ——— degewo ———
  'degewo-neulichterfelde': 'Neulichterfelde: degewo Quartier mit rund 2.500 Wohnungen in Lichterfelde (mit WÖHR + BAUER und Groth) – eines der größten Neubauprojekte Europas. Fertigstellung ab 2028.',
  'degewo-am-falkenberg': 'Am Falkenberg: degewo 528 Wohnungen in Grünau (84 gefördert, 170 Studentenwohnungen) in viergeschossigen Häusern mit Staffelgeschoss, KfW 55. Bau ab Mitte 2023, Bezug April 2026; Nettokaltmiete ab 7,00 €/m² (wiechers beck Architekten).',
  // ——— HOWOGE ———
  'howoge-anne-frank-strasse': 'Anne-Frank-Strasse: HOWOGE errichtete 583 Wohnungen in Altglienicke (304 gefördert, 292 barrierefrei). Der erste Abschnitt mit 211 Einheiten wurde im Juli 2025 übergeben, die Fertigstellung erfolgt im September 2026. Warmmiete ab 376,20 €.',
  'howoge-gartenstadt-karlshorst': 'Gartenstadt Karlshorst: drei 5-geschossige Blöcke von HOWOGE (mit Bonava) auf der ehemaligen Fliegerstation – 193 Mietwohnungen, 189 gefördert (WBS), denkmalgeschützte Hangare bleiben erhalten. Warmmiete ab 462 €.',
  'howoge-genslerstrasse-39-47': 'Genslerstrasse 39–47: 51 Wohnungen durch Dachaufstockung eines bestehenden Blocks in Alt-Hohenschönhausen.',
  'howoge-havelufer-quartier': 'Havelufer Quartier: 231 vollständig geförderte Mietwohnungen (WBS 100–140) in drei Gebäuden am Havelufer in Spandau-Hakenfelde. Bau Dezember 2023 bis Ende 2025; Warmmiete 352–880 €.',
  'howoge-huronseestrasse-28-34': 'Huronseestrasse 28–34: zwei 6-geschossige Gebäude mit 148 Wohnungen (74 gefördert) in Friedrichsfelde – ein Nur-Strom-Haus mit Wärmepumpe und PV. Bau Dezember 2023, Fertigstellung Sommer 2026 (Partner ten brinke).',
  'howoge-kirchsteig': 'Kirchsteig: 48 Mietwohnungen (2–4 Zimmer, teils Maisonettewohnungen) in drei 3-geschossigen Gebäuden in Bohnsdorf. Bau Q2 2024 bis Juli 2026; jede Wohnung mit Balkon oder Loggia.',
  'howoge-lueckstrasse': 'Lückstrasse 33–37: 155 Mietwohnungen mit 1 bis 6 Zimmern (die Hälfte gefördert) plus drei Gemeinschaftseinheiten in Rummelsburg. Bau 2023–2025; Warmmiete ab 395,20 €, Wärmepumpe und PV.',
  'howoge-oberseestrasse-oranke': 'Oberseestrasse 1 / Orankestrasse 40: 14 Einheiten – vier im sanierten Bestand, zehn im Neubau (EH 55, Wärmepumpe, PV). Erdgeschosswohnungen sind barrierefrei.',
  'howoge-plonzstrasse': 'Plonzstrasse 34: 42 Wohnungen (21 gefördert, 24 barrierefrei) in einem 5-geschossigen Gebäude mit Staffelgeschoss in Lichtenberg; HOWOGE bereitet den Bau vor.',
  'howoge-sewanstrasse-256': 'Sewanstrasse 256 A–C: 116 Mietwohnungen (58 gefördert) in Friedrichsfelde-Süd. Bau ab September 2022, Fertigstellung Q1 2026; Warmmiete ab 367,50 €.',
  'howoge-sewanstrasse-38-40': 'Sewanstrasse 38–40: 99 Wohnungen mit 1 bis 4 Zimmern an der Ecke Sewanstraße/Michiganstrasse. Bau Q3 2023 bis Q3 2025; alle Einheiten schwellenfrei, Warmmiete ab 388 €.',
  'howoge-studenthouse-eichbuschallee': 'StudentHouse Plänterwald: 280 vollmöblierte Studentenapartments (25–52 m²) zur All-inclusive-Miete von 530–560 €; nur für Immatrikulierte.',
  'howoge-wiecker-strasse': 'Wiecker Strasse 12: 11-geschossige Blockrandbebauung mit 91 Wohnungen (46 gefördert, 47 barrierefrei) in Neu-Hohenschönhausen auf rund 9.000 m², plus Kita mit zehn Plätzen.',
  'howoge-alfred-kowalke-strasse-22': 'Alfred-Kowalke-Strasse 22: 78 neue Wohnungen für Studierendes-Wohnen auf einem ehemaligen Parkplatz, nach HOWOGEs Nachhaltigkeitsstandard.',
  'howoge-am-lindenplatz': 'Am Lindenplatz: 297 Wohnungen mit 1 bis 5 Zimmern an der U-Bahn Friedrichsfelde; 50 % gefördert in Kooperation mit dem Land Berlin. Baubeginn Februar 2027, Fertigstellung Q1 2029.',
  'howoge-barther-strasse': 'Barther Strasse 17–19B: 177 Mietwohnungen in drei Holz-Hybrid-Punkthäusern im Ostseeviertel von Neu-Hohenschönhausen.',
  'howoge-detlevstrasse': 'Detlevstrasse: rund 400 Mietwohnungen in der Gartenstadt Hohenschönhausen, die Hälfte gefördert. Planungsphase; Baubeginn Oktober 2027, Fertigstellung Oktober 2029.',
  'howoge-ilsestrasse-marksburgstrasse': 'Ilsestrasse/Marksburgstrasse: 246 Mietwohnungen (1–5 Zimmer plus eine 8-Zimmer-Form) in zehn Karlshorster Gebäuden, eines mit 6 Geschossen und Gewerbe (CKRS Architekten). Baubeginn Februar 2026, Fertigstellung 2028.',
  'howoge-joachimsthaler-plauener': 'Joachimsthaler Strasse 1–7 / Plauener Strasse 8–26: 105 neue Wohnungen in zwei Gebäuden in Alt-Hohenschönhausen.',
  'howoge-konnekt-georg-knorr-park': 'KONNEKT / Georg-Knorr-Park: Marzahns größtes laufendes Vorhaben – rund 1.600 Wohnungen (50 % gefördert) auf 107.000 m² Wohnfläche plus rund 22.000 m² Gewerbe, in sechs Bauabschnitten. Abschnitt 1 ab Q4 2025; Gesamtende etwa Q4 2031.',
  'howoge-mahlower-strasse': 'Mahlower Strasse: siebengeschossiges modulares Holz-Hybrid-Gebäude mit rund 48 Wohnungen (50 % gefördert) in Köpenick, KfW 40, mit gewerblichem Erdgeschoss. Bau Q2 2025, Fertigstellung Q4 2026.',
  'howoge-rosenfelder-ring-88': 'Rosenfelder Ring 88: 88 Wohnungen auf über 6.000 m² am Birkenwäldchen in Lichtenberg.',
  'howoge-salzmannstrasse-34': 'Salzmannstrasse 34: 18-geschossiges Holz-Hybrid-Hochhaus mit 145 Wohnungen und gewerblichem Erdgeschoss in Friedrichsfelde; in der Planung.',
  'howoge-schkeuditzer-strasse': 'Schkeuditzer Strasse 3 A–C: 167 Mietwohnungen als Nur-Strom-Haus (Luft-Wasser-Wärmepumpe plus PV) in Hellersdorf-Nord am Hellersdorfer Theaterplatz.',
  'howoge-schulze-boysen-strasse': 'Schulze-Boysen-Strasse: 244 Wohnungen (50 % gefördert) auf einer ehemaligen Parkplatzfläche in Frankfurter Allee Süd. Bauantrag August 2026; Beginn Q4 2028, Fertigstellung Q1 2031.',
  'howoge-vincent-van-gogh-strasse': 'Vincent-van-Gogh-Strasse 33–41: rund 140 bezahlbare, altersgerechte Wohnungen (die Hälfte gefördert) in einem 11-geschossigen Holz-Hybrid-Bau; Bau ab Frühjahr 2027.',
  // ——— GESOBAU ———
  'gesobau-cecilien-carre': 'Cecilien-Carré: 272 bezahlbare Mietwohnungen in Hellersdorf; Bonava errichtet und übergibt an GESOBAU. Abschnitt 1 (128 Wohnungen) fertig bis Winter 2026, Abschnitt 2 (144) bis Ende 2028; Vermietung Schritt für Schritt ab Januar 2027.',
  'gesobau-gesocampus-alt-wittenau': 'GESOcampus Quartier Alt-Wittenau: 105 Wohnungen mit 242 Wohnplätzen für Studierende und Auszubildende (unter 21, Junges-WohnenRL) ab 380 €/Monat. Bau Sommer 2024 bis Sommer 2026; Richtfest Juni 2025.',
  'gesobau-reinickendorfer-strasse': 'Reinickendorfer Strasse 36–38: GESOBAUs 78 neue Wohnungen in Mitte nahe der Wedding-Grenze.',
  'gesobau-alte-hellersdorfer-strasse': 'Alte Hellersdorfer Strasse: neun Holz-Panelbauten mit 76 Mietwohnungen (etwa die Hälfte gefördert), KfW 40 mit Holzfassaden, auf rund 11.600 m². Bau Sommer 2025 bis Frühjahr 2027.',
  'gesobau-johann-georg-strasse-9a': 'Johann-Georg-Strasse 9A: 25 Wohnungen in modularer Holzbauweise in Mitte; Bezug Frühjahr 2027.',
  'gesobau-pankower-allee-55': 'Pankower Allee 55: 120 Wohnungen plus Kita und Nachbarschaftsraum in Reinickendorf; Bezug Herbst 2027.',
  'gesobau-stollberger-strasse': 'Stollberger Strasse 57–59: 147 Wohnungen in Hellersdorf.',
  'gesobau-wilhelmsruher-damm-150': 'Wilhelmsruher Damm 150: 173 Wohnungen als Erweiterung des Senior-Wohnkomplexes von GESOBAU.',
  // ——— Gewobag ———
  'gewobag-gartenfeld': 'Das Neue Gartenfeld: rund 1.100 Wohnungen von Gewobag in den Abschnitten 1–2 (später etwa 400 weitere) auf der neuen Siemensstadt-Insel; das Gesamtquartier erreicht mit Partnern (BUWOG, Genossenschaften) rund 3.700 Wohnungen. 90 % miet- und belegungsgebunden. Baubeginn April 2024; Abschnitte 1–2 bis Ende 2026, Gesamtende 2029.',
  'gewobag-am-muehlenberg': 'Am Mühlenberg: 120 barrierefreie Wohnungen von Gewobag (102 gebunden, WBS) in Schöneberg – drei neue Gebäude mit 8 und 12 Geschossen verdichten den Bestand. Bau Januar 2024; Gesamtende 2026.',
  'gewobag-wendenschlossstrasse': 'Wendenschlossstrasse 158/174: 255 Wohnungen von Gewobag (217 gebunden, 211 barrierefrei) auf sieben Geschossen, KfW 55, plus Seniorenresidenz, Boardinghouse (309 Zimmer) und Kita. Bau Juli 2023, Fertigstellung 2026; erste Bezüge ab August 2026.',
  'gewobag-allee-der-kosmonauten': 'Allee der Kosmonauten 42: 657 Mietwohnungen von Gewobag (609 mit WBS) zwischen 25 und 99 m² in Marzahn-Hellersdorf (mit Marzahner Chaussee 199/201). Bau ab 2022; Gesamtende 2027.',
  'gewobag-waterkant': 'Berliner WATERKANT: das rund 2.500 Wohnungen zählende Quartier von Gewobag und WBM am Havelufer in Spandau-Haselhorst (rund 6.000 Bewohner); 1.099 bereits fertig, TP3a (624) und TP3c (288) im Bau; etwa 60 % WBS. Gesamtende 2027.',
  'gewobag-hohensaatener-strasse-18': 'Hohensaatener Strasse 18: 375 neue Wohnungen von Gewobag in Marzahn; geplante Fertigstellung 2028.',
  'gewobag-landsberger-allee': 'Landsberger Allee: Europas größtes Modulbauprojekt von Gewobag in Lichtenberg – 1.548 Wohnungen, KfW 55. Fertigstellung 2026/27.',
  // ——— STADT UND LAND ———
  'stadt-und-land-buckower-felder': 'Buckower Felder: STADT UND LAND Quartier mit rund 900 Wohnungen in Buckow (Neukölln), Fertigstellung 2026.',
  'stadt-und-land-droepkeweg': 'Dröpkeweg 7a: 7-geschossiger Block von STADT UND LAND in Buckow (mit Ten Brinke/KIMAVI) – 53 geförderte Mietwohnungen, Wärmepumpen, PV. Fertigstellung Q4 2026.',
  'stadt-und-land-weinstrasse-9': 'Weinstrasse 9: 69 neue Mietwohnungen (66 gefördert) plus ein moderner ALDI-Markt in Friedrichshain. Baubeginn Juli 2025, Fertigstellung 2028.',
  'stadt-und-land-kaserne-hessenwinkel': 'Kaserne Hessenwinkel: die geplanten 450 Wohnungen von STADT UND LAND auf der ehemaligen Kaserne in Rahnsdorf (Fürstenwalder Allee 356 / Wolfgang-Steinitz-Strasse), maximal 6 Geschosse, Kita mit rund 60 Plätzen; B-Plan 9-100 VE läuft. Baubeginn Anfang der 2030er Jahre.',
  'stadt-und-land-johanna-tesch-strasse': 'Johanna-Tesch-Strasse: 150 Wohnungen in fünf 4-geschossigen Häusern in Niederschöneweide – 120 bereits vermietet, Abschnitt 2 ergänzt 30 weitere bis Dezember 2026.',
  'stadt-und-land-johannes-tobei-strasse': 'Johannes-Tobei-Strasse: 53 moderne Mietwohnungen (1–5 Zimmer) in Bohnsdorf mit Gewerbe im Erdgeschoss und 20 Stellplätzen. Baubeginn November 2025; Fertigstellung etwa Q3 2027; geförderte Einheiten mit WBS 100–220.',
  'stadt-und-land-walkuerenstrasse': 'Walkürenstrasse 17–21 / Wallensteinstrasse 50–56: 234 Mietwohnungen in Karlshorst, 230 unter WFB 2023 gefördert (überwiegend WBS 220), plus 24 Außenstellplätze. Schlüsselfertig von der INTER Stadt AG erworben; Bezug etwa Ende 2027.',
  'stadt-und-land-maybachufer': 'Maybachufer 48–52: Revitalisierung der Möbelfabrik J. C. Pfaff in Neukölln – 160 Mietwohnungen (90 gefördert), 24 Gewerbeeinheiten, zwei Neubauten und ein Dachgeschosszuschnitt. Baubeginn Januar 2027; Fertigstellung 2029.',
  'stadt-und-land-fritz-werner-strasse-45': 'Fritz-Werner-Strasse 45: 73 Mietwohnungen (62 landesgefördert, WBS) in Buckow auf der Fläche Kruckenbergstrasse 40–64, plus Tiefgarage mit 39 Plätzen. Bau Juli/August 2026; Bezug etwa Juni 2029.',
  'stadt-und-land-sonnenallee-210': 'Sonnenallee 210: 43 geförderte Wohnungen (rund 2.650 m²) plus eine Gewerbeeinheit (rund 190 m²) auf rund 800 m² Eckgrundstück an der S-Bahn beim Estrel Tower in Neukölln. Baubeginn Juni 2026; Fertigstellung 2028 (Angaben abweichend: Q1 statt Q2 – konservativ Q2).',
  'stadt-und-land-paule-panke': 'Paule Panke: 361 neue bezahlbare Wohnungen von STADT UND LAND in Pankow (über 500 im Gesamtquartier) – Bauteil A umfasst 50 Wohnungen an der Damerowstrasse 8–11 / Hadlichstrasse 18–19, erworben von Kondor Wessels; Beginn Oktober 2025, Fertigstellung etwa April 2028.',
  'stadt-und-land-john-locke-siedlung': 'Nachverdichtung John-Locke-Siedlung: 250 neue Wohnungen (überwiegend gefördert – rund 30 % WBS 140, 70 % WBS 180/220) in fünf 6- bis 8-geschossigen Gebäuden auf bestehenden Stellplatzflächen in Tempelhof, Siedlung mit rund 4.000 Mieterschaft. In Planung; Beginn innerhalb von 1–3 Jahren.',
  // ——— BUWOG ———
  'buwog-dahmeglanz': 'BUWOG DAHMEGLANZ: der Abschluss von 52° Nord an der Dahme – 52 Einheiten (2–5 Zimmer, 54–138 m²), KfW 55, PV. Das Quartier umfasst rund 1.000 Wohnungen, DGNB Gold. 2027.',
  'buwog-neumarien': 'BUWOG NEUMARIEN: rund 800 Einheiten zählendes Neuköllner Quartier (56.000 m², DGNB): Eigentums- und Mietwohnungen (teilweise gefördert), Kita mit 70 Plätzen. Etappen bis 2028.',
  'buwog-havellichter': 'BUWOG HAVELLICHTER: Ensemble an 200 m Havelpromenade – 284 Eigentumswohnungen (33–126 m², ab 234.000 €) plus 5 Gewerbeeinheiten, jede mit Balkon oder Terrasse. Autoschwaches Quartier, rund 160 Stellplätze. 2028.',
  'buwog-weydenhof': 'BUWOG WEYDENHOF: 135 Eigentumswohnungen (2–5 Zimmer, 48–149 m²) in fünf Gebäuden am Südufer der Spree, Teil des rund 6 ha großen Quartiers BUWOG WOHNWERK. Fertiggestellt 2025; verbleibende Einheiten ab 285.000 €, Kita im Quartier.',
  'buwog-set-44': 'BUWOG SET 44: 150 Eigentumswohnungen (1–4 Zimmer, 36–131 m²) auf dem Gelände der Geyer-Werke, der ältesten Filmfabrik Deutschlands, in Neukölln – Klinkerfassade, Dachterrasse, Kita, Tiefgarage. Fertigstellung ab 2028; ab 287.700 €.',
  'buwog-zweiklang': 'BUWOG ZWEIKLANG: 69 Eigentumswohnungen (2–5 Zimmer, 47–145 m²) in zwei KfW-55-Gebäuden mit bis zu sechs Geschossen in Süd-Pankow, 400 m vom Prenzlauer Berg; jede Einheit mit Balkon, Terrasse oder Gartenanteil. Im Verkauf; Fertigstellung etwa 2028.',
  // ——— private Berlin ———
  'arrive-kreuzberg': 'arrive kreuzberg: das Mietquartier von Primus und Greystar am Landwehrkanal – 359 Einheiten (1–3 Zimmer), denkmalgeschützter Bestand plus 4 Neubauten, EH 40 QNG+. 2028.',
  'celeste-charlottenburg': 'Céleste: 25 Eigentumswohnungen von Primus am Ku’damm – Gartentownhouses, Terrassen-Penthäuser, eine Gewerbeeinheit. Fertigstellung 2027.',
  'neue-bockbrauerei': 'Neue Bockbrauerei: das Bergmannkiez-Quartier von Bauwert auf einer ehemaligen Brauerei – rund 220 Wohnungen (25 gefördert, 130 Eigentumswohnungen), Büros und Ateliers. Fertigstellung 2026.',
  'pandion-midtown-4': 'PANDION MIDTOWN 4: die letzte Etappe am Volkspark – 26 Einheiten (3–4 Zimmer, 63–122 m²), Balkone, Kita, EH 55. Ab 599.900 € (rund 9.500 €/m²). Q3 2026.',
  'malmoe28': 'MALMÖ28: 84 Eigentumswohnungen von PROJECT Immobilien (4.500 m², Effizienzhaus 55) um einen ruhigen Innenhof, Tiefgarage. Ausverkauft (rund 33,7 Mio. €, etwa 7.400 €/m²). Q4 2026.',
  'hey-charlottenburg': 'HEY Charlottenburg von HAMBURG TEAM und OTTO WULFF: 64 Eigentumswohnungen (Quartier mit 337 Einheiten plus Kita, zwei Höfen) auf der Mierendorff-Insel. Q2 2027.',
  'eckert-carre': 'Eckert Carré: 205 Eigentumswohnungen von Diamona & Harnisch (rund 11.200 m²) in Friedrichshain mit grünen Höfen und einem EDEKA im Quartier. Fertigstellung 2029.',
  'wohnquadrat-harzer-118': 'Harzer Strasse 118: 12 Eigentumswohnungen von Wohnquadrat (Effizienzklasse A+) – Eichendielen, Fußbodenheizung, Innenhof, Wallboxen. Beginn 2026, Fertigstellung Q1 2028.',
  'bonava-fritz-kirsch-zeile': 'Fritz-Kirsch-Zeile 11: Bonavas Erweiterung mit 30 Wohnungen in Köpenick (2–3 Zimmer, rund 1.832 m²) neben dem Wuhlheider Blick (45 Wohnungen, 2022). Beginn Q2 2027.',
  'instone-berlia': 'Berlia: Instones Premiumprojekt in der historischen Mitte (nahe Gendarmenmarkt) – 185 Einheiten (2–5 Zimmer), EH 55, Tiefgarage, Concierge. Ab 1,3 Mio. €. Q4 2027.',
  'instone-kopenhagener-strasse': 'Kopenhagener Strasse: 220 Eigentumswohnungen von Instone (1–4 Zimmer, EH 55) in Pankow, teilweise gefördert. Stellplätze, Höfe, Fertigstellung Q2 2028.',
  'instone-topaz': 'Topaz: 380 Einheiten von Instone in Spandau (Galileistrasse/Zeppelinstrasse, EH 55) – 1–5 Zimmer, Stellplätze, Höfe, KfW-55-Standard. Fertigstellung Q4 2029.',
  'tag-weitlingkiez': 'Weitlingkiez: 420 Einheiten von TAG (Sanierung plus Aufstockung) in Lichtenberg, überwiegend Mietwohnungen. Fertigstellung Q4 2026.',
  'patrizia-patriots-park': 'Patriots Park: Co-Entwicklung von Patrizia und Union Investment mit 650 Einheiten (2–5 Zimmer, EH 55) in Tempelhof gegenüber dem Park als Forward-Funding. Q4 2029.',
  'dic-quartier-potsdamer-platz': 'QUARTIER POTSDAMER PLATZ: Co-Entwicklung von DIC/Branicks und CA Immo mit 90 Premium-Einheiten am Potsdamer Platz (EH 40), 12 Geschosse, Tiefgarage, Concierge. Ab 2,5 Mio. €. Q4 2028.',
  'dic-stadthausquartier': 'Stadthausquartier: 140 Premium-Eigentumswohnungen von Branicks (vormals DIC Asset) in Mitte (Stadthausstrasse, EH 55), gemischt genutzt mit Einzelhandel im Erdgeschoss. Q2 2029.',
  'grand-city-neukolln-neubau': 'Grand City Neukölln Neubau: 180 Einheiten an der Karl-Marx-Strasse – Sanierung plus zwei Aufstockungsgeschosse, 50 % geförderte Mietwohnungen, EH 70. Q2 2027.',
  'corpus-the-q': 'The Q: Co-Entwicklung von CORPUS SIREO und Allianz mit 110 Premium-Einheiten an der Friedrichstraße (Mitte, EH 40), 14 Geschosse, Tiefgarage und Spa. Ab 2 Mio. €. Q2 2028.',
  'corpus-quartier-205': 'QUARTIER 205: 280 Einheiten von CORPUS SIREO an der Revaler Strasse (Friedrichshain, EH 55): gemischt genutzt, denkmalgerechte Sanierung, Kita, Stellplätze. Q4 2029.',
  'union-upl-europacity': 'UPL Europacity: 320 Premium-Einheiten aus der UPL-Pipeline von Union Investment in der Europacity (Heidestrasse, EH 40) als Forward-Funding. Gemischt genutzt, Kita, Stellplätze. Q4 2028.',
  'allianz-quartier-heidestrasse': 'QUARTIER HEIDESTRASSE: Co-Entwicklung von Allianz, CA Immo und QUARTIER EINS mit 250 Premium-Einheiten in der Europacity (EH 40), 16 Geschosse, Tiefgarage, Kita. Ab 2,2 Mio. €. Q2 2028.',
  'euroboden-am-tacheles': 'AM TACHELES: Eurobodens Ultra-Premium-Projekt in Mitte – 190 Einheiten (2–5 Zimmer, EH 40), 10 Geschosse, Spa, Pool, Tiefgarage, 24/7-Concierge. Ab 3 Mio. €. Q4 2027.',
  'euroboden-kopenicker-strasse': 'Euroboden Köpenicker Strasse: 160 Premium-Eigentumswohnungen in Mitte (EH 40), gemischt genutzt, Tiefgarage und Spa-Bereich. Q2 2029.',
  'quartier-eins-schoeneberg': 'QUARTIER SCHÖNEBERG: 220 Einheiten von QUARTIER EINS an der Hauptstrasse (Schöneberg, EH 55): gemischt genutzt, Höfe, Kita, Stellplätze. Q4 2028.',
  'quartier-eins-prenzlauer-berg': 'QUARTIER PRENZLAUER BERG: 140 Premium-Einheiten von QUARTIER EINS an der Dunckerstrasse (Prenzlauer Berg, EH 40): gemischt genutzt, Tiefgarage, Kita. Q4 2029.',
  // ——— Germany-national ———
  'trockland-checkpoint': 'Checkpoint Quartier: das Vorhaben von Trockland auf rund 26.400 m² am Checkpoint Charlie – 289 Wohneinheiten, darunter 48 Serviced Apartments, mit Gewerbe in den Erdgeschossen.',
  'schoenwalder-strasse-57': 'Schönwalder Strasse 57: Trocklands 63 geförderte Mietwohnungen (1–5 Zimmer, barrierefrei) per Forward Deal mit STADT UND LAND. Baubeginn Juli 2026.',
  'covivio-biesdorf': 'Covivio Biesdorf: 106 neue Wohnungen im Berliner Biesdorf aus Covivios europäischem Wohnprogramm (rund 2.600 neue Einheiten in den kommenden Jahren).',
  'covivio-030bln': '030BLN: Covivios 130-Meter-Turm am Alexanderplatz – rund 60.000 m² Büro, Einzelhandel und Gastronomie plus rund 300 Urban-Living-Einheiten.',
  'greystar-marzahn-mitte': 'Greystar Marzahn Mitte: ein Quartier mit 444 Mietwohnungen, gemeinsam von Greystar und ten brinke entwickelt; Baubeginn Sommer 2026.',
  'saga-horn': 'SAGA Horn: 220 bezahlbare Mietwohnungen in Hamburg-Horn (2–3 Zimmer, Balkone/Terrassen, Aufzüge, E-Mobilität); Fertigstellung Ende 2026 mit Nahwärme.',
  'muenchner-wohnen-neufreimann': 'Münchner Wohnen Neufreimann: 190 Wohnungen im neuen Quartier Neufreimann im Norden Münchens; zusammen mit dem Knorr-Bremse-Areal entstehen hier über 4.000 Wohnungen.',
  'euroboden-haus-fuer-muenchen': 'Haus für München: Eurobodens Holzbau im Kreativquartier – 64 bezahlbare Wohnungen zur Modellmiete (rund 10 €/m²).',
  'rizon-im-four': 'RIZON im FOUR: Groß & Partners 359 Wohnungen in den FOUR-Frankfurt-Türmen in der Innenstadt – Hotel, Gastronomie, Dachgarten; erste Übergaben Ende 2026.',
  'nhw-riedbogen': 'Riedbogen: 102 Mietwohnungen von NHW (frei finanziert plus gefördert) im neuen Gebiet Leuchte in Bergen-Enkheim – 5 Gebäude mit 3 Geschossen plus Staffel, KfW 55, Nahwärme; Nettokaltmieten 1.236–1.549 € (2–3 Zimmer). Vermietung läuft; Fertigstellung bis 2026.',
  'nhw-elisabethentor': 'Elisabethentor: 248 Mietwohnungen von NHW in 13 viergeschossigen Mehrfamilienhäusern auf 5,75 ha in Wiesbaden-Delkenheim – 86 gefördert (6,80 €/m²), frei finanziert rund 16,90 €/m², plus Kita und zwei Tiefgaragen. KfW 55. Fertiggestellt; Zweitvermietung läuft.',
  'nhw-schoenhof-viertel': 'Schönhof-Viertel: das mehrjährige Quartier von NHW und Instone Real Estate auf der ehemaligen Kaserne in Bockenheim – rund 2.000 neue Wohnungen (gefördert, frei finanziert, Eigentum), ein 28.000 m²-Park und Hessens erste hybride Schule. Schönhof-Ost vollständig vermietet; Vermietung seit 2024 abschnittsweise.',
  'nhw-nuville': 'nuville: der Osten des Schönhof-Viertels – 224 Eigentumswohnungen (2–4 Zimmer, 52–109 m²) plus Gewerbefläche, das eigene Verkaufsprogramm von NHW in Bockenheim.',
  'nhw-mariengaerten': 'Mariengärten: 154 Mietwohnungen von NHW (126 gefördert) in acht Mehrfamilienhäusern im neuen Ludwigshöhviertel von Darmstadt-Bessungen – zwei 5-geschossige Zeilenbauten plus Punkthäuser, Kita mit 5 Gruppen, KfW 40 EE. Fertigstellung bis 2027.',
  'gewoba-kistner-carre': 'Kistner-Carré: 66 preisgebundene Neubauwohnungen von Gewoba in zwei 5- bis 7-geschossigen Häusern auf dem ehemaligen Kistner-Gelände an der Geeste in Bremerhaven-Lehe; Klinkerfassade und Schwalbennester-Balkone (Spengler Wiescholek). Erste Mieter zogen im Frühjahr 2025 ein; Deutscher Bauherrenpreis 2026.',
  'gag-zollstockguertel': 'Zollstockgürtel: die geplanten rund 36 öffentlich geförderten Wohnungen von GAG plus eine inklusive Wohngruppe auf einer ehemaligen Tankstelle in Köln-Zollstock (Ankündigung August 2026).',
}

const q = (s: string) => s.replace(/\\/g, '\\\\').replace(/'/g, '’')

function enrich(file: string): { de: number; src: number } {
  let src = fs.readFileSync(file, 'utf8')
  let de = 0
  for (const [slug, text] of Object.entries(DEV)) {
    const anchor = `slug: '${slug}',`
    const i = src.indexOf(anchor)
    if (i < 0) continue
    const blockEnd = src.indexOf('\n  },', i)
    const block = src.slice(i, blockEnd)
    if (/^      de: '/m.test(block)) continue
    const enLine = src.indexOf("\n      en: '", i)
    if (enLine < 0 || enLine > blockEnd) continue
    const lineEnd = src.indexOf('\n', enLine + 1)
    src = src.slice(0, lineEnd + 1) + `      de: '${q(text)}',\n` + src.slice(lineEnd + 1)
    de++
  }
  for (const [slug, text] of Object.entries(PROJECT)) {
    const anchor = `slug: '${slug}',`
    const i = src.indexOf(anchor)
    if (i < 0) continue
    const blockEnd = src.indexOf('\n  },', i)
    const block = src.slice(i, blockEnd)
    if (/^      de: '/m.test(block)) continue
    const enLine = src.indexOf("\n      en: '", i)
    if (enLine < 0 || enLine > blockEnd) continue
    const lineEnd = src.indexOf('\n', enLine + 1)
    src = src.slice(0, lineEnd + 1) + `      de: '${q(text)}',\n` + src.slice(lineEnd + 1)
    de++
  }
  let added = 0
  for (const [slug, text] of Object.entries(PROJECT)) {
    const anchor = `slug: '${slug}',`
    const i = src.indexOf(anchor)
    if (i < 0) continue
    const devMatch = /developerSlug: '([a-z0-9-]+)',/.exec(src.slice(i, i + 200))
    const dev = devMatch?.[1]
    const url = dev ? SOURCE[dev] : undefined
    if (!url) continue
    const blockEnd = src.indexOf('\n  },', i)
    if (/sourceUrl: '/.test(src.slice(i, blockEnd))) continue
    const ins = src.indexOf(`developerSlug: '${dev}',`, i)
    const lineEnd = src.indexOf('\n', ins)
    src = src.slice(0, lineEnd + 1) + `    sourceUrl: '${url}',\n` + src.slice(lineEnd + 1)
    added++
  }
  fs.writeFileSync(file, src)
  return { de, src: added }
}

for (const file of [BERLIN, GERMANY]) {
  const r = enrich(file)
  console.log(`${path.basename(file)}: +de ${r.de}, +sourceUrl ${r.src}`)
}

/** Pass 2: projects of devs without an overview page inherit the dev website. */
for (const file of [BERLIN, GERMANY]) {
  let src = fs.readFileSync(file, 'utf8')
  const sites: Record<string, string> = {}
  for (const m of src.matchAll(/slug: '([a-z0-9-]+)',[\s\S]*?website: '(https:[^']+)',/g)) sites[m[1]] = m[2]
  let added = 0
  for (const m of src.matchAll(/slug: '([a-z0-9-]+)',\n    name: '[^']+',\n    developerSlug: '([a-z0-9-]+)',/g)) {
    const [full, , dev] = m
    if (sites[dev] === undefined) continue
    const i = src.indexOf(full)
    const blockEnd = src.indexOf('\n  },', i)
    if (/sourceUrl: '/.test(src.slice(i, blockEnd))) continue
    const devLineEnd = src.indexOf('\n', i + full.indexOf(`developerSlug: '${dev}'`))
    src = src.slice(0, devLineEnd + 1) + `    sourceUrl: '${sites[dev]}',\n` + src.slice(devLineEnd + 1)
    added++
  }
  fs.writeFileSync(file, src)
  console.log(`${path.basename(file)}: +sourceUrl(fallback website) ${added}`)
}
console.log('OK')
