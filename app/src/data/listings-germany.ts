/**
 * Germany sample inventory — street-real addresses, EUR, every deal/prop type.
 * Server-only. Do not import from client components (device-budget).
 *
 * Photos: first-party /images/de/*.webp (Commons/Unsplash, stored locally).
 * Prices: DE_CITIES buy/rent €/m² anchors × district multiplier.
 * ponytail: compact tuples → Listing. Live DB rows always win.
 */
import type { Agent, Badge, DealType, Listing, PropType } from './listings'
import { EUR_GEL, USD_GEL } from '@/lib/listing-format'
import { DE_CITIES, deCityBySlug } from '@/lib/countries/de'

const AGENTS: Agent[] = [
  { name: 'Lena Hoffmann', phone: '+49 30 8900 1240', agency: 'Sivrce Berlin' },
  { name: 'Markus Weber', phone: '+49 40 5566 7712', agency: 'Hanseatische Wohnen' },
  { name: 'Sophie Bauer', phone: '+49 89 2134 5601', agency: 'Bavaria Prime' },
  { name: 'Jonas Klein', phone: '+49 69 4455 6610', agency: 'Mainhattan Living' },
  { name: 'Anna Schäfer', phone: '+49 221 3344 8802', agency: 'Rheinland Homes' },
  { name: 'Felix Brandt', phone: '+49 711 8890 2204', agency: 'Sivrce Stuttgart' },
  { name: 'Clara Meier', phone: '+49 211 7788 3306', agency: 'Rheinbogen Immobilien' },
  { name: 'Tobias Krüger', phone: '+49 341 2200 4418', agency: 'Sivrce Sachsen' },
]

const PHOTO: Record<PropType, string[]> = {
  apartment: [
    '/images/de/apt-1.webp', '/images/de/apt-2.webp', '/images/de/apt-3.webp', '/images/de/apt-4.webp',
    '/images/de/apt-5.webp', '/images/de/apt-6.webp', '/images/de/balkon-1.webp', '/images/de/neubau-1.webp',
    '/images/de/loft-1.webp', '/images/de/terrasse-1.webp',
  ],
  house: ['/images/de/house-1.webp', '/images/de/house-2.webp', '/images/de/apt-2.webp', '/images/de/apt-3.webp', '/images/de/balkon-1.webp'],
  villa: ['/images/de/villa-1.webp', '/images/de/house-1.webp', '/images/de/terrasse-1.webp', '/images/de/apt-1.webp', '/images/de/apt-4.webp'],
  commercial: ['/images/de/commercial-1.webp', '/images/de/neubau-1.webp', '/images/de/apt-6.webp', '/images/de/loft-1.webp'],
  land: ['/images/de/land-1.webp', '/images/de/house-2.webp', '/images/de/neubau-1.webp'],
  hotel: ['/images/de/hotel-1.webp', '/images/de/apt-1.webp', '/images/de/apt-4.webp', '/images/de/terrasse-1.webp', '/images/de/balkon-1.webp'],
}

type BadgeKey = 'sv' | 'vp' | 'v' | '-'
type Row = [
  id: string, city: string, dist: string, street: string, no: string, plz: string,
  lat: number, lng: number, mul: number,
  deal: DealType, prop: PropType, rooms: number, beds: number, baths: number,
  area: number, floor: number, total: number, badge: BadgeKey,
  title: string, feats: string, blurb: string,
]

/** Street-verified German addresses. mul = % of city €/m² anchor (100 = median). */
const ROWS: Row[] = [
  ['berlin-mitte-torstrasse-140', 'berlin', 'Mitte', 'Torstraße', '140', '10119', 52.5298, 13.3989, 122, 'sale', 'apartment', 3, 2, 1, 80, 3, 5, 'sv', 'Altbau-Wohnung mit Südbalkon in der Torstraße', 'Balkon|Stuckdecken 3,4 m|Fischgrätparkett|Einbauküche|Aufzug|Keller', 'Dritte Etage eines sanierten Gründerzeitbaus, zwei Minuten zum Rosenthaler Platz (U8). Energieausweis C, Baujahr 1902, Kernsanierung 2019.'],
  ['berlin-charlottenburg-kudamm-182', 'berlin', 'Charlottenburg', 'Kurfürstendamm', '182', '10707', 52.5015, 13.3245, 140, 'sale', 'apartment', 4, 3, 2, 120, 4, 7, 'sv', 'Neubau-Wohnung am Kurfürstendamm, nahe Olivaer Platz', 'Loggia|Tiefgarage|Fußbodenheizung|Smart Home|Concierge|KfW 40', 'Hochwertiger Erstbezug in bester City-West-Lage. U-Bahn Adenauerplatz und Ku’damm zu Fuß. Baujahr 2024, Energieausweis A+.'],
  ['berlin-prenzlauerberg-kastanienallee-22', 'berlin', 'Prenzlauer Berg', 'Kastanienallee', '22', '10435', 52.5372, 13.4091, 118, 'sale', 'apartment', 2, 1, 1, 65, 2, 5, 'vp', 'Helle 2-Zimmer im Helmholzkiez nach Kernsanierung', 'Dachterrasse Mitnutzung|Gäste-WC|Modern saniert|Fahrradkeller', 'Lichtdurchflutete Etage im Kastanienkiez, Eberswalder Straße (U2) in 6 Minuten. Baujahr 1910, Sanierung 2025, Energieausweis B.'],
  ['berlin-friedrichshain-warschauer-45-rent', 'berlin', 'Friedrichshain', 'Warschauer Straße', '45', '10243', 52.5085, 13.4502, 128, 'rent', 'apartment', 2, 1, 1, 75, 5, 8, 'vp', 'Möblierte 2-Zimmer mit Spreeblick an der Warschauer', 'Spreeblick|Vollmöbliert|Glasfaser|Aufzug|Balkon', 'Kaltmiete, möbliert, befristet 24 Monate. Oberbaumbrücke und S/U Warschauer Straße um die Ecke. Nebenkostenabrechnung nach Betriebskostenverordnung.'],
  ['berlin-kreuzberg-bergmann-14-rent', 'berlin', 'Kreuzberg', 'Bergmannstraße', '14', '10961', 52.4891, 13.3887, 125, 'rent', 'apartment', 3, 2, 1, 92, 1, 4, 'sv', 'Loft im Bergmannkiez mit Gartenanteil', 'Industrie-Charme|Gartenmitbenutzung|Einbauküche|Holzdielen', 'Fabriketage im Quergebäude, ruhig trotz Kiezlage. U-Bahn Gneisenaustraße (U7). Kaution drei Kaltmieten, unvermietete Einbauküche bleibt.'],
  ['berlin-pankow-schoenhauser-73', 'berlin', 'Prenzlauer Berg', 'Schönhauser Allee', '73', '10437', 52.5404, 13.4122, 112, 'sale', 'apartment', 3, 2, 1, 88, 4, 6, 'sv', 'Etagenwohnung an der Schönhauser Allee mit Fahrstuhl', 'Aufzug|Balkon|Einbauküche|Keller|Waschküche', 'S-Bahn Schönhauser Allee direkt, Mauerpark 8 Minuten. Baujahr 1912, Teilmodernisierung 2022, Energieausweis C.'],
  ['berlin-kreuzberg-oranien-25', 'berlin', 'Kreuzberg', 'Oranienstraße', '25', '10999', 52.5031, 13.4224, 115, 'sale', 'apartment', 2, 1, 1, 58, 3, 5, 'v', 'Kompakte 2-Zimmer am Oranienplatz', 'Balkon|Altbau|hohe Decken|Kaminofen', 'SO36-Lage, U-Bahn Kottbusser Tor 7 Minuten. Ideal als Eigennutz oder kleine Kapitalanlage. Energieausweis D.'],
  ['berlin-pankow-kollwitz-52-rent', 'berlin', 'Prenzlauer Berg', 'Kollwitzstraße', '52', '10405', 52.5364, 13.4181, 130, 'rent', 'apartment', 3, 2, 1, 96, 2, 5, 'vp', 'Familienwohnung am Kollwitzplatz, unmöbliert', 'Balkon|Kinderzimmer|Einbauküche|Keller', 'Ruhiger Seitenflügel, Wochenmarkt vor der Tür. Senefelderplatz (U2). Mietpreisbremse-konform ausgewiesen, Staffelmiete nicht vereinbart.'],
  ['berlin-friedrichshain-boxhagener-16', 'berlin', 'Friedrichshain', 'Boxhagener Straße', '16', '10245', 52.5106, 13.4591, 108, 'sale', 'apartment', 3, 2, 1, 78, 1, 5, 'v', 'Hochparterre im Boxi mit Gartenblick', 'Gartenblick|Altbau|Einbauküche|Keller', 'Samariterstraße (U5) und Ostkreuz erreichbar. Baujahr 1905, Bäder erneuert 2023. Energieausweis C.'],
  ['berlin-friedrichshain-kma-90', 'berlin', 'Friedrichshain', 'Karl-Marx-Allee', '90', '10243', 52.5178, 13.4412, 105, 'sale', 'apartment', 4, 3, 2, 110, 8, 10, 'sv', 'DDR-Prachtbau an der Karl-Marx-Allee, weite Sicht', 'Loggia|Aufzug|Weitblick|Abstellraum', 'Zweite Stalinallee-Generation, Strausberger Platz (U5). Deckenhöhe 3,1 m, Energieausweis B nach Dämmung 2018.'],
  ['berlin-charlottenburg-kant-17-rent', 'berlin', 'Charlottenburg', 'Kantstraße', '17', '10623', 52.5062, 13.3124, 120, 'rent', 'apartment', 2, 1, 1, 62, 4, 6, 'v', '2-Zimmer an der Kantstraße, Savignyplatz', 'Balkon|Altbau|Einbauküche|Keller', 'S Savignyplatz vor der Tür, Zoo und Ku’damm fußläufig. Unmöbliert, Einbauküche vom Vermieter. Energieausweis C.'],
  ['berlin-steglitz-schloss-44', 'berlin', 'Steglitz', 'Schloßstraße', '44', '12163', 52.4621, 13.3254, 98, 'sale', 'apartment', 3, 2, 1, 85, 5, 8, 'vp', 'Süd-Balkon an der Schloßstraße, Steglitz', 'Süd-Balkon|Aufzug|Tiefgarage optional|Keller', 'U-Bahn Schloßstraße, Einkaufszentrum und Gymnasium um die Ecke. Baujahr 1998, Energieausweis C.'],
  ['berlin-neukoelln-hermann-120-rent', 'berlin', 'Neukölln', 'Hermannstraße', '120', '12051', 52.4702, 13.4251, 95, 'rent', 'apartment', 2, 1, 1, 54, 3, 5, 'v', '2-Zimmer an der Hermannstraße, Leinestraße', 'Balkon|Einbauküche|Keller', 'U-Bahn Leinestraße (U8). Kaltmiete, unmöbliert. WBS nicht erforderlich. Energieausweis D.'],
  ['berlin-wedding-mueller-36', 'berlin', 'Wedding', 'Müllerstraße', '36', '13349', 52.5482, 13.3654, 92, 'sale', 'apartment', 3, 2, 1, 74, 2, 6, 'v', 'Sanierte 3-Zimmer an der Müllerstraße', 'Balkon|Frisch saniert|Einbauküche|Keller', 'U-Bahn Leopoldplatz. Gute Anbindung Richtung Mitte. Baujahr 1930, Bad und Küche 2024. Energieausweis C.'],
  ['berlin-moabit-turm-21-rent', 'berlin', 'Moabit', 'Turmstraße', '21', '10559', 52.5256, 13.3412, 102, 'rent', 'apartment', 3, 2, 1, 82, 3, 5, 'vp', 'Ruhige 3-Zimmer in Moabit, Turmstraße', 'Balkon|Einbauküche|Keller|Waschmaschinenstellplatz', 'U-Bahn Turmstraße (U9), Kleiner Tiergarten. Unmöbliert, befristet auf 3 Jahre wegen Eigenbedarf-Ausschluss.'],
  ['berlin-schoeneberg-potsdamer-58', 'berlin', 'Schöneberg', 'Potsdamer Straße', '58', '10785', 52.5034, 13.3651, 110, 'sale', 'apartment', 2, 1, 1, 68, 6, 8, 'sv', 'Loft-Schnitt an der Potsdamer Straße', 'Loft|Aufzug|Concierge|Keller', 'Nähe Gleisdreieck-Park und U-Bahn Kurfürstenstraße. Offener Grundriss, 3,2 m Höhe. Energieausweis B.'],
  ['berlin-mitte-udl-40-commercial', 'berlin', 'Mitte', 'Unter den Linden', '40', '10117', 52.517, 13.3888, 180, 'sale', 'commercial', 0, 0, 2, 220, 1, 6, 'sv', 'Ladenlokal Unter den Linden, Erdgeschoss mit Schaufenster', 'Schaufenster|Denkmalschutz|Klima|Barrierefrei', 'Frequenzlage zwischen Brandenburger Tor und Museumsinsel. U-Bahn Französische Straße. Denkmalschutzauflagen im Exposé.'],
  ['berlin-mitte-friedrich-88-office-rent', 'berlin', 'Mitte', 'Friedrichstraße', '88', '10117', 52.52, 13.3886, 165, 'rent', 'commercial', 0, 0, 2, 340, 4, 8, 'vp', 'Bürofläche Friedrichstraße, teilbar ab 170 m²', 'Klimatisiert|Aufzug|Glasfaser|Repräsentativ', 'S/U Friedrichstraße. Kaltmiete zzgl. NK und MwSt. Fit-out 2022, Energieausweis A.'],
  ['berlin-grunewald-hagen-30-villa', 'berlin', 'Grunewald', 'Hagenstraße', '30', '14193', 52.4834, 13.2678, 210, 'sale', 'villa', 7, 5, 4, 320, 0, 3, 'sv', 'Gründerzeitvilla in Grunewald mit Garten', 'Garten 780 m²|Kamin|Garage|Einliegerwohnung|Denkmalschutz', 'Ruhige Villenlage, S-Bahn Grunewald 8 Minuten. Baujahr 1911, denkmalgerecht saniert 2018. Energieausweis D (Denkmal).'],
  ['berlin-zehlendorf-onkeltom-22-house', 'berlin', 'Zehlendorf', 'Onkel-Tom-Straße', '22', '14169', 52.4348, 13.2526, 145, 'sale', 'house', 5, 4, 2, 168, 0, 2, 'sv', 'Einfamilienhaus Onkel-Toms-Hütte, Südwestgrundstück', 'Garten|Garage|Kamin|Vollkeller', 'U-Bahn Onkel-Toms-Hütte, Wald und Krumme Lanke. Baujahr 1934, Anbau 2008. Energieausweis C.'],
  ['berlin-spandau-breite-12-house', 'berlin', 'Spandau', 'Breite Straße', '12', '13597', 52.5372, 13.2054, 88, 'sale', 'house', 4, 3, 2, 142, 0, 2, 'vp', 'Stadthaus in der Spandauer Altstadt', 'Hof|Stellplatz|Vollkeller|Nähe Zitadelle', 'U-Bahn Altstadt Spandau. Backstein, Baujahr 1898, Dach 2020 neu. Energieausweis D.'],
  ['berlin-koepenick-alt-15-house-rent', 'berlin', 'Köpenick', 'Alt-Köpenick', '15', '12555', 52.4462, 13.5784, 90, 'rent', 'house', 4, 3, 2, 130, 0, 2, 'v', 'Hausmiete in Alt-Köpenick, Dahme-Nähe', 'Garten|Kahnsteg-Nähe|Einbauküche', 'S-Bahn Köpenick, Altstadt. Unmöbliert, Gartenpflege laut Vertrag beim Mieter. Kaution drei Kaltmieten.'],
  ['berlin-lichtenberg-landsberger-210-land', 'berlin', 'Lichtenberg', 'Landsberger Allee', '210', '10369', 52.5294, 13.4792, 55, 'sale', 'land', 0, 0, 0, 620, 0, 0, 'v', 'Baugrundstück Landsberger Allee, B-Plan Wohnen', 'B-Plan|Erschlossen|Wohnen GFZ 1,2', 'Erschlossenes Grundstück laut festgesetztem B-Plan. Tram Landsberger Allee. Kein Altlastenverdacht im Bodenbericht 2025.'],
  ['berlin-zehlendorf-teltower-90-land', 'berlin', 'Zehlendorf', 'Teltower Damm', '90', '14167', 52.4338, 13.2594, 70, 'sale', 'land', 0, 0, 0, 480, 0, 0, 'vp', 'Wohngrundstück Teltower Damm, Südausrichtung', 'Erschlossen|Süd|Einzelhaus möglich', 'S-Bahn Mexikoplatz. Reines Wohngebiet, Einzelhaus oder Doppelhaushälfte laut Bebauungsplan.'],
  ['berlin-tiergarten-budapester-2-hotel', 'berlin', 'Tiergarten', 'Budapester Straße', '2', '10787', 52.5068, 13.3436, 195, 'sale', 'hotel', 42, 42, 42, 1850, 0, 7, 'sv', 'Boutique-Hotel am Zoo, 42 Zimmer, laufender Betrieb', 'Rezeption 24/7|Restaurant|Aufzug|Denkmalfassade', 'Zwischen Zoo und Lützowplatz. Pachtvertrag Hotelbetrieb, Zahlen im Datenraum. U-Bahn Zoologischer Garten.'],
  ['berlin-schoeneberg-motz-9-daily', 'berlin', 'Schöneberg', 'Motzstraße', '9', '10777', 52.4972, 13.3448, 140, 'daily', 'apartment', 2, 1, 1, 48, 3, 5, 'vp', 'Möblierte Ferienwohnung Nollendorfplatz, tagesweise', 'WLAN|Vollmöbliert|Nespresso|Waschmaschine', 'Nollendorfplatz (U1/U2/U3/U4). Mindestaufenthalt 3 Nächte, Endreinigung extra. Keine Parties.'],
  ['berlin-friedrichshain-simondach-11-daily', 'berlin', 'Friedrichshain', 'Simon-Dach-Straße', '11', '10245', 52.5118, 13.4574, 135, 'daily', 'apartment', 1, 1, 1, 38, 2, 5, 'v', 'Studio am Boxhagener Platz, Kurzzeit', 'WLAN|Küchenzeile|Smart-TV', 'Ostkreuz 10 Minuten zu Fuß. Check-in ab 15 Uhr. Touristensteuer Berlin wird ausgewiesen.'],
  ['berlin-friedrichshain-rigaer-64-pledge', 'berlin', 'Friedrichshain', 'Rigaer Straße', '64', '10247', 52.5164, 13.4652, 82, 'pledge', 'apartment', 3, 2, 1, 76, 2, 5, 'v', 'Beleihungsfähiger Altbau an der Rigaer Straße', 'Altbau|Balkon|Keller|Kapitalanlage', 'Vermietet, Indexmiete. Frankfurter Allee (U5). Beleihungswert-Gutachten 2025 liegt vor — keine Zwangsversteigerung.'],
  ['berlin-mitte-oderberger-50', 'berlin', 'Prenzlauer Berg', 'Oderberger Straße', '50', '10435', 52.5408, 13.4098, 124, 'sale', 'apartment', 1, 1, 1, 42, 4, 5, 'vp', 'Dachgeschoss-Studio Oderberger Straße', 'Dachschräge|Galerie|Altbau', 'Zwischen Mauerpark und Kastanienallee. Eberswalder Straße (U2). Baujahr 1900, Ausbau 2016. Energieausweis C.'],
  ['berlin-neukoelln-weser-28', 'berlin', 'Neukölln', 'Weserstraße', '28', '12045', 52.4816, 13.4372, 100, 'sale', 'apartment', 2, 1, 1, 61, 3, 5, 'v', '2-Zimmer Weserstraße, Reuterkiez', 'Balkon|Altbau|Einbauküche', 'Hermannplatz (U7/U8). Kiezlage mit Cafés. Energieausweis D, Fenster 2021 erneuert.'],
  ['berlin-pankow-schoenholzer-3', 'berlin', 'Pankow', 'Schönholzer Straße', '3', '13187', 52.5694, 13.4112, 90, 'sale', 'apartment', 4, 3, 1, 105, 1, 4, 'vp', 'Familien-Altbau in Pankow, nahe Breite Straße', 'Gartenanteil|Einbauküche|Keller|Kinderzimmer', 'S-Bahn Pankow. Ruhige Seitenstraße, Grundschule fußläufig. Baujahr 1910. Energieausweis C.'],
  ['berlin-friedrichshain-ffa-40-rent', 'berlin', 'Friedrichshain', 'Frankfurter Allee', '40', '10247', 52.5156, 13.4548, 108, 'rent', 'apartment', 1, 1, 1, 36, 6, 11, '-', '1-Zimmer Hochhaus Frankfurter Allee', 'Aufzug|Weitblick|Einbauküche', 'U-Bahn Frankfurter Allee. Unmöbliert, für Berufstätige. Energieausweis B.'],
  ['berlin-kreuzberg-mehringdamm-33', 'berlin', 'Kreuzberg', 'Mehringdamm', '33', '10961', 52.4934, 13.3872, 112, 'sale', 'apartment', 3, 2, 1, 84, 2, 5, 'sv', '3-Zimmer am Mehringdamm, Tempelhofer Feld nah', 'Balkon|Altbau|Einbauküche|Keller', 'U-Bahn Mehringdamm (U6/U7). Feld und Bergmannkiez in 10 Minuten. Energieausweis C.'],
  ['berlin-charlottenburg-helmholtz-2-daily', 'berlin', 'Charlottenburg', 'Helmholtzstraße', '2', '10587', 52.5186, 13.3214, 118, 'daily', 'apartment', 3, 2, 1, 72, 2, 4, 'vp', 'Wohnung Technische Universität, Kurzzeit', 'WLAN|Arbeitszimmer|Einbauküche', 'U-Bahn Ernst-Reuter-Platz. Mindestaufenthalt 5 Nächte, Monatsrabatt ab 28 Tagen.'],

  ['muenchen-schwabing-leopold-55', 'munich', 'Schwabing', 'Leopoldstraße', '55', '80802', 48.1581, 11.5855, 130, 'sale', 'apartment', 3, 2, 2, 100, 4, 6, 'sv', 'Wohnung am Englischen Garten, Leopoldstraße', 'Terrasse|Tiefgarage|Parkett|Portier', 'Schwabing-Bestlage, Münchner Freiheit (U3/U6) 6 Minuten. Baujahr 2012, Energieausweis A.'],
  ['muenchen-altstadt-maximilian-12', 'munich', 'Altstadt', 'Maximilianstraße', '12', '80539', 48.1386, 11.5858, 175, 'sale', 'apartment', 2, 1, 1, 78, 3, 5, 'sv', 'Residenz-Nähe an der Maximilianstraße', 'Stuck|Concierge|Aufzug|Keller', 'Zwischen Oper und Residenz. U-Bahn Lehel. Denkmalfassade, innen 2019. Energieausweis C.'],
  ['muenchen-maxvorstadt-ludwig-8-rent', 'munich', 'Maxvorstadt', 'Ludwigstraße', '8', '80539', 48.1482, 11.5814, 125, 'rent', 'apartment', 2, 1, 1, 64, 2, 5, 'vp', '2-Zimmer Ludwigstraße, Universität', 'Stuck|Einbauküche|Keller', 'U-Bahn Universität. Unmöbliert, für Forscher und Berufstätige. Energieausweis C.'],
  ['muenchen-isarvorstadt-gaertner-6', 'munich', 'Isarvorstadt', 'Gärtnerplatz', '6', '80469', 48.1314, 11.5756, 145, 'sale', 'apartment', 3, 2, 1, 92, 4, 5, 'sv', 'Altbau am Gärtnerplatz mit Südloggia', 'Loggia|Altbau|Einbauküche|Keller', 'Glockenbachviertel, U-Bahn Fraunhoferstraße. Baujahr 1898. Energieausweis C.'],
  ['muenchen-schwabing-teng-22-house', 'munich', 'Schwabing', 'Tengstraße', '22', '80798', 48.1594, 11.5692, 155, 'sale', 'house', 5, 4, 3, 186, 0, 3, 'sv', 'Stadthaus Tengstraße, Innenhof-Ruhe', 'Garten|Garage|Kamin|Arbeitszimmer', 'U-Bahn Josephsplatz. Baujahr 1908, Anbau 2015. Energieausweis C.'],
  ['muenchen-bogenhausen-ismaninger-68-villa', 'munich', 'Bogenhausen', 'Ismaninger Straße', '68', '81675', 48.1438, 11.6074, 190, 'sale', 'villa', 6, 5, 4, 280, 0, 2, 'sv', 'Villa in Bogenhausen, Prinzregentenstraße-Nähe', 'Garten|Doppelgarage|Pool|Einlieger', 'U-Bahn Prinzregentenplatz. Baujahr 1924, Sanierung 2020. Energieausweis B.'],
  ['muenchen-laim-landsberger-150-commercial', 'munich', 'Laim', 'Landsberger Straße', '150', '80339', 48.1402, 11.5328, 110, 'sale', 'commercial', 0, 0, 2, 410, 0, 3, 'vp', 'Gewerbehof Laim, Hallen + Büro', 'Rampe|Parkplätze|Glasfaser', 'S-Bahn Laim. Teilbar, frei ab Q1 2027. Energieausweis C.'],
  ['muenchen-altstadt-sendlinger-20-daily', 'munich', 'Altstadt', 'Sendlinger Straße', '20', '80331', 48.1352, 11.5684, 150, 'daily', 'apartment', 2, 1, 1, 52, 3, 5, 'vp', 'Ferienwohnung Sendlinger Tor, tagesweise', 'WLAN|Altstadt|Vollmöbliert', 'U-Bahn Sendlinger Tor. Marienplatz 8 Minuten. City-Tax ausgewiesen.'],
  ['muenchen-schwabing-hohenzollern-14-rent', 'munich', 'Schwabing', 'Hohenzollernstraße', '14', '80801', 48.1598, 11.5764, 122, 'rent', 'apartment', 3, 2, 1, 88, 1, 4, 'v', 'Erdgeschoss Hohenzollernstraße mit Garten', 'Garten|Einbauküche|Keller', 'U-Bahn Hohenzollernplatz. Unmöbliert. Energieausweis C.'],
  ['muenchen-bogenhausen-prinzregenten-22', 'munich', 'Bogenhausen', 'Prinzregentenstraße', '22', '80538', 48.1406, 11.5948, 160, 'sale', 'apartment', 4, 3, 2, 135, 2, 4, 'sv', 'Repräsentative Wohnung Prinzregentenstraße', 'Stuck|Balkon|Concierge|Keller', 'Nähe Haus der Kunst und Englischer Garten. U-Bahn Lehel. Energieausweis C.'],
  ['muenchen-au-lilienberg-land', 'munich', 'Au', 'Lilienstraße', '18', '81669', 48.1284, 11.5886, 95, 'sale', 'land', 0, 0, 0, 310, 0, 0, 'v', 'Baulücke Au, Wohnen gemäß B-Plan', 'Erschlossen|Innenstadt-Rand', 'S-Bahn Rosenheimer Platz. Kleines Grundstück, Geschosswohnungsbau laut Plan.'],
  ['muenchen-haidhausen-kirchen-hotel', 'munich', 'Haidhausen', 'Kirchenstraße', '9', '81675', 48.1338, 11.5972, 140, 'sale', 'hotel', 18, 18, 18, 720, 0, 4, 'sv', 'Privathotel Haidhausen, 18 Zimmer', 'Frühstücksraum|Aufzug|Innenhof', 'U-Bahn Max-Weber-Platz. Laufender Betrieb, Pacht oder Eigenregie. Ostbahnhof nah.'],

  ['hamburg-hafencity-uebersee-8', 'hamburg', 'HafenCity', 'Überseeboulevard', '8', '20457', 53.5413, 9.9982, 145, 'sale', 'apartment', 3, 2, 1, 85, 6, 10, 'sv', 'Elbblick im Überseequartier, HafenCity', 'Elbblick|Loggia|Concierge|Energie A+', 'U4 Überseequartier. Baujahr 2021, Tiefgarage zuzüglich. Energieausweis A+.'],
  ['hamburg-neustadt-jungfernstieg-30', 'hamburg', 'Neustadt', 'Jungfernstieg', '30', '20354', 53.5534, 9.9926, 160, 'sale', 'apartment', 2, 1, 1, 74, 5, 7, 'sv', 'Alsterblick am Jungfernstieg', 'Alsterblick|Aufzug|Concierge', 'U Jungfernstieg. Repräsentative City-Wohnung, Baujahr 2010. Energieausweis B.'],
  ['hamburg-eppendorf-land-44', 'hamburg', 'Eppendorf', 'Eppendorfer Landstraße', '44', '20249', 53.5912, 9.9884, 125, 'sale', 'apartment', 3, 2, 1, 92, 2, 4, 'vp', 'Altbau in Eppendorf, Landstraße', 'Balkon|Stuck|Einbauküche|Keller', 'U-Bahn Kellinghusenstraße. Baujahr 1908. Energieausweis C.'],
  ['hamburg-sternschanze-schulterblatt-26-rent', 'hamburg', 'Sternschanze', 'Schulterblatt', '26', '20357', 53.5614, 9.9628, 118, 'rent', 'apartment', 2, 1, 1, 58, 3, 5, 'vp', '2-Zimmer Schanze, Schulterblatt', 'Balkon|Altbau|Einbauküche', 'S/U Sternschanze. Unmöbliert, Kiezlage. Energieausweis D.'],
  ['hamburg-ottensen-elbchaussee-180-villa', 'hamburg', 'Othmarschen', 'Elbchaussee', '180', '22605', 53.5524, 9.8946, 185, 'sale', 'villa', 6, 5, 3, 260, 0, 2, 'sv', 'Elbvilla an der Elbchaussee', 'Elbblick|Garten|Garage|Kamin', 'S-Bahn Othmarschen. Baujahr 1912, Sanierung 2017. Energieausweis C.'],
  ['hamburg-altstadt-speersort-10-commercial', 'hamburg', 'Altstadt', 'Speersort', '10', '20095', 53.5496, 9.9978, 140, 'rent', 'commercial', 0, 0, 1, 186, 2, 6, 'v', 'Büro Altstadt, Speersort / Kontorhausviertel', 'Kontorhaus|Aufzug|Denkmalschutz', 'U Mönckebergstraße. Kaltmiete zzgl. NK/MwSt. Energieausweis C.'],
  ['hamburg-eppendorf-hayn-12-house', 'hamburg', 'Eppendorf', 'Haynstraße', '12', '20249', 53.5886, 9.9812, 135, 'sale', 'house', 5, 4, 2, 172, 0, 2, 'sv', 'Stadthaus Haynstraße, Eppendorf', 'Garten|Stellplatz|Vollkeller', 'U-Bahn Lattenkamp nah. Baujahr 1928. Energieausweis C.'],
  ['hamburg-stpauli-david-8-hotel', 'hamburg', 'St. Pauli', 'Davidstraße', '8', '20359', 53.5492, 9.9634, 120, 'sale', 'hotel', 22, 22, 22, 890, 0, 5, 'vp', 'Stadthotel St. Pauli, 22 Zimmer', 'Rezeption|Bar|Aufzug', 'U St. Pauli. Laufender kleiner Hotelbetrieb, Zahlen im Datenraum.'],
  ['hamburg-winterhude-moenkeberg-daily', 'hamburg', 'Winterhude', 'Poelchaukamp', '9', '22301', 53.5918, 10.0012, 122, 'daily', 'apartment', 2, 1, 1, 55, 3, 5, 'v', 'Ferienwohnung City Nord-Rand, Winterhude', 'WLAN|Alster-Nähe|Möbliert', 'U-Bahn Sierichstraße. Mindestaufenthalt 4 Nächte.'],
  ['hamburg-altona-ottenser-pledge', 'hamburg', 'Ottensen', 'Ottenser Hauptstraße', '19', '22765', 53.5528, 9.9296, 80, 'pledge', 'apartment', 2, 1, 1, 64, 3, 5, '-', 'Kapitalanlage Ottensen, beleihungsfähig', 'Balkon|Vermietet|Indexmiete', 'S-Bahn Altona. Gutachten 2025, Beleihungsauslauf konservativ.'],

  ['frankfurt-westend-mainzer-180', 'frankfurt', 'Westend', 'Mainzer Landstraße', '180', '60327', 50.1147, 8.6534, 135, 'sale', 'apartment', 4, 3, 2, 115, 18, 24, 'sv', 'Skyline-Penthouse im Westend, hohe Etage', 'Skyline|Rundterrasse|Doppelparker|Fitness', 'S-Bahn Taunusanlage. Baujahr 2016. Energieausweis A.'],
  ['frankfurt-westend-westendstr-20', 'frankfurt', 'Westend', 'Westendstraße', '20', '60325', 50.1178, 8.6624, 148, 'sale', 'apartment', 3, 2, 2, 98, 3, 5, 'sv', 'Altbau Westendstraße, Grüneburgpark nah', 'Stuck|Balkon|Einbauküche|Keller', 'U-Bahn Westend. Baujahr 1905. Energieausweis C.'],
  ['frankfurt-nordend-berger-112-rent', 'frankfurt', 'Nordend', 'Berger Straße', '112', '60316', 50.1246, 8.6924, 112, 'rent', 'apartment', 2, 1, 1, 58, 2, 4, 'vp', '2-Zimmer Berger Straße, Nordend', 'Balkon|Altbau|Einbauküche', 'U-Bahn Merianplatz. Unmöbliert. Energieausweis C.'],
  ['frankfurt-sachsenhausen-schweizer-30', 'frankfurt', 'Sachsenhausen', 'Schweizer Straße', '30', '60594', 50.1024, 8.6796, 118, 'sale', 'apartment', 3, 2, 1, 86, 2, 5, 'vp', 'Wohnung Schweizer Straße, Apfelwein-Viertel', 'Balkon|Altbau|Keller', 'U-Bahn Schweizer Platz. Main und Museumsufer nah. Energieausweis C.'],
  ['frankfurt-innenstadt-goethe-8-commercial', 'frankfurt', 'Innenstadt', 'Goethestraße', '8', '60313', 50.1136, 8.6732, 200, 'sale', 'commercial', 0, 0, 1, 95, 0, 5, 'sv', 'Retail Goethestraße, Erdgeschoss', 'Schaufenster|Lauflage|Klima', 'Zwischen Hauptwache und Opernplatz. U Hauptwache. Denkmalschutz innen frei.'],
  ['frankfurt-ostend-hanauer-126-house', 'frankfurt', 'Ostend', 'Hanauer Landstraße', '126', '60314', 50.1128, 8.7146, 95, 'sale', 'house', 4, 3, 2, 148, 0, 2, 'v', 'Reihenhaus Ostend, EZB-Nähe', 'Garten|Stellplatz|Vollkeller', 'U-Bahn Ostendstraße. Baujahr 2011. Energieausweis B.'],
  ['frankfurt-westend-kettenhof-daily', 'frankfurt', 'Westend', 'Kettenhofweg', '27', '60325', 50.1194, 8.6588, 130, 'daily', 'apartment', 1, 1, 1, 42, 4, 6, 'vp', 'Business-Apartment Westend, tagesweise', 'WLAN|Schreibtisch|Küche', 'Messe 12 Minuten. Mindestaufenthalt 2 Nächte, Wochenrate.'],
  ['frankfurt-sachsenhausen-land', 'frankfurt', 'Sachsenhausen', 'Mörfelder Landstraße', '72', '60598', 50.0912, 8.6854, 72, 'sale', 'land', 0, 0, 0, 540, 0, 0, 'v', 'Wohngrundstück Sachsenhausen-Süd', 'Erschlossen|Einzelhaus', 'S-Bahn Südbahnhof. Reines Wohnen laut Plan.'],

  ['koeln-belgisches-ehren-45', 'cologne', 'Belgisches Viertel', 'Ehrenstraße', '45', '50672', 50.9378, 6.9394, 125, 'sale', 'apartment', 2, 1, 1, 68, 3, 5, 'sv', 'Altbau Ehrenstraße, Belgisches Viertel', 'Balkon|Stuck|Einbauküche', 'U-Bahn Friesenplatz. Baujahr 1902. Energieausweis C.'],
  ['koeln-ringen-hohenzollern-22-rent', 'cologne', 'Ringe', 'Hohenzollernring', '22', '50672', 50.9364, 6.9412, 118, 'rent', 'apartment', 3, 2, 1, 90, 4, 6, 'vp', '3-Zimmer am Hohenzollernring', 'Balkon|Aufzug|Einbauküche', 'U-Bahn Christophstraße. Unmöbliert. Energieausweis C.'],
  ['koeln-severins-severin-80', 'cologne', 'Severinsviertel', 'Severinstraße', '80', '50678', 50.9256, 6.9594, 105, 'sale', 'apartment', 3, 2, 1, 82, 2, 5, 'vp', 'Wohnung Severinstraße, Südstadt', 'Balkon|Altbau|Keller', 'U-Bahn Severinstraße. Rheinauhafen 12 Minuten. Energieausweis C.'],
  ['koeln-lindenthal-aachener-220-house', 'cologne', 'Lindenthal', 'Aachener Straße', '220', '50931', 50.9368, 6.9164, 115, 'sale', 'house', 5, 4, 2, 164, 0, 2, 'sv', 'Stadthaus Lindenthal, Aachener Straße', 'Garten|Garage|Kamin', 'U-Bahn Dasselstraße. Baujahr 1922. Energieausweis C.'],
  ['koeln-altstadt-rheingasse-6-commercial', 'cologne', 'Altstadt', 'Rheingasse', '6', '50676', 50.9372, 6.9618, 150, 'rent', 'commercial', 0, 0, 1, 128, 0, 4, 'v', 'Gastro-/Retail Rheingasse, Altstadt', 'Schaufenster|Außenfläche möglich', 'U Heumarkt. Kaltmiete zzgl. NK/MwSt. Denkmalfassade.'],
  ['koeln-marienburg-bayenthal-villa', 'cologne', 'Marienburg', 'Bayenthalgürtel', '4', '50968', 50.9112, 6.9784, 170, 'sale', 'villa', 6, 5, 3, 240, 0, 2, 'sv', 'Villa Marienburg, Rheinnähe', 'Garten|Garage|Rheinnähe', 'U-Bahn Schönhauser Straße. Baujahr 1910. Energieausweis D (Denkmal).'],
  ['koeln-deutz-messe-daily', 'cologne', 'Deutz', 'Deutz-Mülheimer Straße', '18', '50679', 50.9424, 6.9756, 110, 'daily', 'apartment', 2, 1, 1, 50, 6, 12, 'v', 'Messe-Apartment Deutz, tagesweise', 'WLAN|Messe nah|Aufzug', 'U-Bahn Deutz/Messe. Mindestaufenthalt 2 Nächte zu Messetagen 3.'],
  ['koeln-kalk-land', 'cologne', 'Kalk', 'Kalker Hauptstraße', '210', '51103', 50.9374, 7.0068, 60, 'sale', 'land', 0, 0, 0, 780, 0, 0, '-', 'Baugrund Kalk, Mischgebiet', 'Erschlossen|Mischgebiet', 'U-Bahn Kalk Post. GFZ laut B-Plan 1,6.'],

  ['stuttgart-mitte-koenig-28', 'stuttgart', 'Mitte', 'Königstraße', '28', '70173', 48.7786, 9.1774, 130, 'sale', 'apartment', 3, 2, 1, 88, 5, 7, 'sv', 'Wohnung Königstraße, Stuttgart-Mitte', 'Loggia|Aufzug|Einbauküche', 'S-Bahn Stadtmitte. Baujahr 2014. Energieausweis A.'],
  ['stuttgart-west-bismarck-14-rent', 'stuttgart', 'West', 'Bismarckstraße', '14', '70176', 48.7772, 9.1648, 115, 'rent', 'apartment', 2, 1, 1, 61, 2, 4, 'vp', '2-Zimmer Stuttgart-West, Bismarckstraße', 'Balkon|Altbau|Einbauküche', 'U-Bahn Feuersee. Unmöbliert. Energieausweis C.'],
  ['stuttgart-deglerloch-house', 'stuttgart', 'Degerloch', 'Epplestraße', '22', '70597', 48.7486, 9.1694, 120, 'sale', 'house', 4, 3, 2, 156, 0, 2, 'vp', 'Hanghaus Degerloch mit Fernsicht', 'Garage|Garten|Weitblick', 'Zahnradbahn Degerloch. Baujahr 1968, Dach 2019. Energieausweis D.'],
  ['stuttgart-vaihingen-commercial', 'stuttgart', 'Vaihingen', 'Industriestraße', '8', '70565', 48.7302, 9.1126, 95, 'sale', 'commercial', 0, 0, 1, 520, 0, 2, 'v', 'Gewerbehalle Vaihingen, Autobahnnähe', 'Rampe|Parkplätze|Halle', 'S-Bahn Vaihingen. Frei für Produktion/Logistik leicht.'],
  ['stuttgart-killesberg-villa', 'stuttgart', 'Nord', 'Stresemannstraße', '7', '70191', 48.8034, 9.1688, 165, 'sale', 'villa', 5, 4, 3, 210, 0, 2, 'sv', 'Villa am Killesberg', 'Garten|Garage|Ruhige Lage', 'U-Bahn Killesberg. Baujahr 1954, Sanierung 2016. Energieausweis C.'],
  ['stuttgart-mitte-daily', 'stuttgart', 'Mitte', 'Calwer Straße', '11', '70173', 48.7768, 9.1742, 120, 'daily', 'apartment', 1, 1, 1, 34, 4, 6, 'v', 'City-Studio Calwer Straße, tagesweise', 'WLAN|Küche|Aufzug', 'S-Bahn Stadtmitte. Messe 20 Minuten S-Bahn.'],

  ['duesseldorf-altstadt-rheinufer-9', 'duesseldorf', 'Altstadt', 'Rathausufer', '9', '40213', 51.2258, 6.7722, 140, 'sale', 'apartment', 3, 2, 1, 94, 4, 6, 'sv', 'Rheinblick Altstadt, Rathausufer', 'Rheinblick|Loggia|Aufzug', 'U-Bahn Heinrich-Heine-Allee. Baujahr 2008. Energieausweis B.'],
  ['duesseldorf-pempelfort-nord-rent', 'duesseldorf', 'Pempelfort', 'Nordstraße', '16', '40477', 51.2364, 6.7846, 118, 'rent', 'apartment', 2, 1, 1, 63, 3, 5, 'vp', '2-Zimmer Pempelfort, Nordstraße', 'Balkon|Einbauküche|Keller', 'U-Bahn Nordstraße. Unmöbliert. Energieausweis C.'],
  ['duesseldorf-oberkassel-house', 'duesseldorf', 'Oberkassel', 'Luegallee', '40', '40545', 51.2306, 6.7554, 150, 'sale', 'house', 5, 4, 2, 178, 0, 3, 'sv', 'Stadthaus Oberkassel, Luegallee', 'Garten|Garage|Rheinnähe', 'U-Bahn Luegplatz. Baujahr 1912. Energieausweis C.'],
  ['duesseldorf-hafen-commercial', 'duesseldorf', 'Hafen', 'Speditionstraße', '19', '40221', 51.2154, 6.7518, 125, 'rent', 'commercial', 0, 0, 2, 280, 3, 8, 'vp', 'Medienhafen-Büro, Speditionstraße', 'Rheinblick|Klima|Fit-out', 'U-Bahn Landtag/Kniebrücke. Kaltmiete zzgl. NK/MwSt.'],
  ['duesseldorf-golzheim-villa', 'duesseldorf', 'Golzheim', 'Cecilienallee', '12', '40474', 51.2458, 6.7624, 175, 'sale', 'villa', 6, 5, 3, 245, 0, 2, 'sv', 'Rheinvilla Golzheim', 'Garten|Rheinnähe|Garage', 'U-Bahn Reeser Platz. Baujahr 1928. Energieausweis C.'],
  ['duesseldorf-stadtmitte-daily', 'duesseldorf', 'Stadtmitte', 'Königsallee', '60', '40212', 51.2246, 6.7794, 145, 'daily', 'apartment', 2, 1, 1, 56, 5, 8, 'vp', 'Kö-Apartment, tagesweise', 'WLAN|Kö-Lage|Aufzug', 'U-Bahn Steinstraße/Königsallee. Business-Aufenthalt.'],

  ['leipzig-mitte-nikolai-8', 'leipzig', 'Mitte', 'Nikolaistraße', '8', '04109', 51.3412, 12.3784, 125, 'sale', 'apartment', 3, 2, 1, 86, 3, 5, 'sv', 'Altbau Nikolaistraße, Nikolaikirche nah', 'Stuck|Balkon|hohe Decken', 'S-Bahn Leipzig Markt. Baujahr 1890, Sanierung 2018. Energieausweis C.'],
  ['leipzig-suedvorstadt-karl-lieb-rent', 'leipzig', 'Südvorstadt', 'Karl-Liebknecht-Straße', '54', '04275', 51.3224, 12.3736, 110, 'rent', 'apartment', 2, 1, 1, 58, 2, 5, 'vp', '2-Zimmer Karli, Südvorstadt', 'Balkon|Altbau|Einbauküche', 'Tram Südvorstadt. Unmöbliert. Energieausweis C.'],
  ['leipzig-plagwitz-house', 'leipzig', 'Plagwitz', 'Karl-Heine-Straße', '62', '04229', 51.3316, 12.3354, 105, 'sale', 'house', 4, 3, 2, 138, 0, 2, 'vp', 'Gründerzeithaus Plagwitz, Karl-Heine', 'Hof|Klinker|Vollkeller', 'S-Bahn Leipzig-Plagwitz. Baujahr 1896. Energieausweis D.'],
  ['leipzig-mitte-commercial', 'leipzig', 'Mitte', 'Grimmaische Straße', '13', '04109', 51.3404, 12.3758, 140, 'sale', 'commercial', 0, 0, 1, 160, 0, 5, 'sv', 'Ladenzeile Grimmaische Straße', 'Lauflage|Schaufenster', 'Zwischen Markt und Augustusplatz. Denkmalfassade.'],
  ['leipzig-connewitz-land', 'leipzig', 'Connewitz', 'Wolfgang-Heinze-Straße', '40', '04277', 51.3102, 12.3728, 55, 'sale', 'land', 0, 0, 0, 890, 0, 0, 'v', 'Baufeld Connewitz, Wohnen', 'Erschlossen|Wohnen', 'S-Bahn Connewitz. Mehrfamilienhaus laut Plan möglich.'],
  ['leipzig-mitte-daily', 'leipzig', 'Mitte', 'Peterstraße', '5', '04109', 51.3394, 12.3742, 115, 'daily', 'apartment', 2, 1, 1, 49, 3, 5, 'v', 'Altstadt-Apartment Leipzig, tagesweise', 'WLAN|Markt nah|Möbliert', 'Thomaskirche 4 Minuten. City-Tax ausgewiesen.'],

  ['dortmund-city-westenhellweg-70', 'dortmund', 'City', 'Westenhellweg', '70', '44137', 51.5138, 7.4634, 115, 'sale', 'apartment', 3, 2, 1, 78, 4, 6, 'vp', 'Wohnung Westenhellweg, City', 'Balkon|Aufzug|Einbauküche', 'U-Bahn Kampstraße. Baujahr 2005. Energieausweis C.'],
  ['dortmund-kreuzviertel-rent', 'dortmund', 'Kreuzviertel', 'Arndtstraße', '18', '44147', 51.5086, 7.4512, 108, 'rent', 'apartment', 2, 1, 1, 55, 2, 4, 'v', '2-Zimmer Kreuzviertel', 'Balkon|Altbau', 'U-Bahn Kreuzstraße. Unmöbliert.'],
  ['dortmund-hoerde-house', 'dortmund', 'Hörde', 'Hörder Burgstraße', '6', '44263', 51.4854, 7.5002, 95, 'sale', 'house', 4, 3, 2, 132, 0, 2, 'vp', 'Haus am Phoenix-See, Hörde', 'Garten|See-Nähe|Stellplatz', 'S-Bahn Hörde. Baujahr 2012. Energieausweis B.'],
  ['dortmund-union-commercial', 'dortmund', 'Unionviertel', 'Rheinische Straße', '33', '44137', 51.5156, 7.4432, 85, 'rent', 'commercial', 0, 0, 1, 210, 0, 3, '-', 'Atelier-/Büro Unionviertel', 'Loft|hohe Decken', 'U-Bahn Unionstraße. Kreativnutzung möglich.'],

  ['essen-suedviertel-ruttenscheider-64', 'essen', 'Rüttenscheid', 'Rüttenscheider Straße', '64', '45130', 51.4348, 7.0046, 118, 'sale', 'apartment', 3, 2, 1, 81, 3, 5, 'vp', 'Wohnung Rü, Rüttenscheider Straße', 'Balkon|Altbau|Einbauküche', 'U-Bahn Martinstraße. Energieausweis C.'],
  ['essen-werden-house', 'essen', 'Werden', 'Brückstraße', '11', '45239', 51.3872, 7.0024, 110, 'sale', 'house', 5, 4, 2, 154, 0, 2, 'sv', 'Haus in Werden, Ruhrtal', 'Garten|Garage|Ruhig', 'S-Bahn Essen-Werden. Baujahr 1932. Energieausweis D.'],
  ['essen-city-commercial', 'essen', 'Stadtkern', 'Kettwiger Straße', '20', '45127', 51.4552, 7.0128, 125, 'sale', 'commercial', 0, 0, 1, 140, 0, 4, 'v', 'Retail Kettwiger Straße', 'Fußgängerzone|Schaufenster', 'U-Bahn Rathaus Essen. Frequenzlage.'],
  ['essen-kettwig-villa', 'essen', 'Kettwig', 'Hauptstraße', '48', '45219', 51.3634, 6.9378, 130, 'sale', 'villa', 6, 5, 3, 220, 0, 2, 'sv', 'Villa Kettwig, Altstadt-Rand', 'Garten|Garage|Fachwerk-Nähe', 'S-Bahn Kettwig. Baujahr 1910. Energieausweis D.'],

  ['bremen-ostertor-ostertorsteinweg-22', 'bremen', 'Ostertor', 'Ostertorsteinweg', '22', '28203', 53.0734, 8.8176, 120, 'sale', 'apartment', 3, 2, 1, 84, 2, 4, 'vp', 'Wohnung Viertel, Ostertorsteinweg', 'Balkon|Altbau', 'Tram Ostertor. Energieausweis C.'],
  ['bremen-schwachhausen-house', 'bremen', 'Schwachhausen', 'Parkallee', '30', '28209', 53.0846, 8.8334, 125, 'sale', 'house', 5, 4, 2, 168, 0, 2, 'sv', 'Stadthaus Parkallee, Schwachhausen', 'Garten|Garage', 'Tram Parkallee. Baujahr 1924. Energieausweis C.'],
  ['bremen-schnoor-daily', 'bremen', 'Schnoor', 'Wüstestätte', '4', '28195', 53.0748, 8.8096, 130, 'daily', 'apartment', 1, 1, 1, 32, 1, 2, 'v', 'Schnoor-Apartment, tagesweise', 'WLAN|Altstadt|Fachwerk', 'Marktplatz 5 Minuten. Denkmalschutz, 2 Personen max.'],
  ['bremen-ueberseestadt-commercial', 'bremen', 'Überseestadt', 'Konsul-Smidt-Straße', '24', '28217', 53.0836, 8.7784, 100, 'rent', 'commercial', 0, 0, 1, 310, 2, 6, 'vp', 'Büro Überseestadt', 'Hafenlage|Klima|Aufzug', 'Tram Überseestadt. Kaltmiete zzgl. NK/MwSt.'],

  ['dresden-neustadt-alaun-24', 'dresden', 'Neustadt', 'Alaunstraße', '24', '01099', 51.0668, 13.7524, 122, 'sale', 'apartment', 3, 2, 1, 79, 3, 5, 'sv', 'Altbau Äußere Neustadt, Alaunstraße', 'Stuck|Balkon|hohe Decken', 'Tram Albertplatz. Baujahr 1894, Sanierung 2016. Energieausweis C.'],
  ['dresden-blasewitz-house', 'dresden', 'Blasewitz', 'Loschwitzer Straße', '18', '01309', 51.0524, 13.8026, 128, 'sale', 'house', 5, 4, 2, 176, 0, 2, 'sv', 'Villa-ähnlich Blasewitz, Loschwitzer', 'Garten|Elbnähe|Garage', 'Schwebebahn Loschwitz nah. Baujahr 1906. Energieausweis D.'],
  ['dresden-altstadt-rent', 'dresden', 'Altstadt', 'Wilsdruffer Straße', '15', '01067', 51.0496, 13.7378, 115, 'rent', 'apartment', 2, 1, 1, 60, 3, 6, 'vp', '2-Zimmer Altstadt, Wilsdruffer', 'Aufzug|Altstadt', 'Tram Altmarkt. Unmöbliert.'],
  ['dresden-friedrichstadt-land', 'dresden', 'Friedrichstadt', 'Friedrichstraße', '50', '01067', 51.0584, 13.7124, 58, 'sale', 'land', 0, 0, 0, 1100, 0, 0, 'v', 'Baufeld Friedrichstadt', 'Erschlossen|Wohnen/Gewerbe', 'S-Bahn Dresden-Friedrichstadt. Mischgebiet.'],

  ['hanover-list-lister-meile-40', 'hanover', 'List', 'Lister Meile', '40', '30161', 52.3864, 9.7486, 118, 'sale', 'apartment', 3, 2, 1, 82, 3, 5, 'vp', 'Wohnung Lister Meile', 'Balkon|Altbau|Einbauküche', 'U-Bahn Lister Platz. Energieausweis C.'],
  ['hanover-kleefeld-house', 'hanover', 'Kleefeld', 'Kirchöder Straße', '9', '30559', 52.3586, 9.8124, 105, 'sale', 'house', 4, 3, 2, 144, 0, 2, 'vp', 'Einfamilienhaus Kleefeld', 'Garten|Garage|Ruhig', 'U-Bahn Kleefeld. Baujahr 1965, Dach 2018. Energieausweis D.'],
  ['hanover-mitte-rent', 'hanover', 'Mitte', 'Georgstraße', '22', '30159', 52.3748, 9.7394, 122, 'rent', 'apartment', 2, 1, 1, 57, 4, 6, 'v', '2-Zimmer Georgstraße, City', 'Aufzug|Citylage', 'U Kröpcke. Unmöbliert.'],
  ['hanover-messe-daily', 'hanover', 'Mittelfeld', 'Karlsruher Straße', '8', '30519', 52.3274, 9.8096, 100, 'daily', 'apartment', 2, 1, 1, 48, 2, 4, 'v', 'Messe-Apartment Laatzen-Rand', 'WLAN|Messe nah|Parkplatz', 'Zu CeBIT-/Messewochen Mindestaufenthalt 3 Nächte.'],

  ['nuremberg-altstadt-koenig-12', 'nuremberg', 'Altstadt', 'Königstraße', '12', '90402', 49.4502, 11.0778, 120, 'sale', 'apartment', 3, 2, 1, 80, 3, 5, 'sv', 'Wohnung Königstraße, Lorenzer Altstadt', 'Altbau|Balkon|Sandstein', 'U-Bahn Lorenzkirche. Energieausweis C.'],
  ['nuremberg-gostenhof-rent', 'nuremberg', 'Gostenhof', 'Adam-Klein-Straße', '16', '90429', 49.4508, 11.0546, 102, 'rent', 'apartment', 2, 1, 1, 52, 2, 4, 'v', '2-Zimmer Gostenhof', 'Balkon|Altbau', 'U-Bahn Gostenhof. Unmöbliert.'],
  ['nuremberg-erlenstegen-house', 'nuremberg', 'Erlenstegen', 'Erlenstegenstraße', '28', '90491', 49.4734, 11.1268, 115, 'sale', 'house', 5, 4, 2, 162, 0, 2, 'sv', 'Haus Erlenstegen, Waldrand', 'Garten|Garage|Waldnähe', 'S-Bahn Erlenstegen. Baujahr 1972. Energieausweis D.'],
  ['nuremberg-hafen-commercial', 'nuremberg', 'Hafen', 'Hafenstraße', '60', '90451', 49.4072, 11.0614, 80, 'sale', 'commercial', 0, 0, 1, 640, 0, 1, 'v', 'Halle Nürnberg Hafen', 'Rampe|Kranbahn|Parkplätze', 'Hafenanbindung. Produktion/Lager.'],

  ['duisburg-innenstadt-koenig-18', 'duisburg', 'Innenstadt', 'Königstraße', '18', '47051', 51.4342, 6.7628, 110, 'sale', 'apartment', 3, 2, 1, 76, 4, 6, 'v', 'Wohnung Königstraße Duisburg', 'Balkon|Aufzug', 'U König-Heinrich-Platz. Energieausweis C.'],
  ['duisburg-ruhrort-house', 'duisburg', 'Ruhrort', 'Dr.-Hammacher-Straße', '7', '47119', 51.4468, 6.7374, 85, 'sale', 'house', 4, 3, 1, 128, 0, 2, 'v', 'Haus Ruhrort, Hafenlage', 'Garten|Stellplatz', 'S-Bahn Rheinhausen nah über Rhein. Baujahr 1958.'],
  ['duisburg-innen-rent', 'duisburg', 'Innenstadt', 'Sonnenwall', '29', '47051', 51.4326, 6.7664, 95, 'rent', 'apartment', 2, 1, 1, 51, 3, 5, '-', '2-Zimmer Sonnenwall', 'Balkon|City', 'U König-Heinrich-Platz. Unmöbliert.'],

  ['bochum-ehrenfeld-uhren-14', 'bochum', 'Ehrenfeld', 'Uhlandstraße', '14', '44789', 51.4768, 7.2168, 108, 'sale', 'apartment', 3, 2, 1, 74, 2, 4, 'vp', 'Wohnung Ehrenfeld, Bermuda3eck nah', 'Balkon|Altbau', 'U-Bahn Planetarium. Energieausweis C.'],
  ['bochum-stiepel-house', 'bochum', 'Stiepel', 'Kemnader Straße', '90', '44799', 51.4324, 7.2468, 100, 'sale', 'house', 4, 3, 2, 146, 0, 2, 'vp', 'Haus Stiepel, Kemnader See', 'Garten|Garage|Seenähe', 'A43 nah. Baujahr 1978. Energieausweis D.'],
  ['bochum-innen-commercial', 'bochum', 'Innenstadt', 'Kortumstraße', '55', '44787', 51.4816, 7.2164, 115, 'rent', 'commercial', 0, 0, 1, 118, 0, 4, 'v', 'Laden Kortumstraße', 'Fußgängerzone|Schaufenster', 'U Bochum Hbf. Kaltmiete zzgl. NK/MwSt.'],

  ['wuppertal-elberfeld-post-10', 'wuppertal', 'Elberfeld', 'Poststraße', '10', '42103', 51.2564, 7.1462, 108, 'sale', 'apartment', 3, 2, 1, 72, 3, 5, 'v', 'Wohnung Elberfeld, Poststraße', 'Balkon|Altbau', 'Schwebebahn Adlerbrücke. Energieausweis C.'],
  ['wuppertal-barmen-house', 'wuppertal', 'Barmen', 'Werth', '44', '42275', 51.2712, 7.2014, 92, 'sale', 'house', 4, 3, 1, 136, 0, 2, 'v', 'Haus Barmen, Werth', 'Garten|Stellplatz', 'Schwebebahn Werther Brücke. Baujahr 1910.'],
  ['wuppertal-elberfeld-rent', 'wuppertal', 'Elberfeld', 'Herzogstraße', '19', '42103', 51.2582, 7.1486, 100, 'rent', 'apartment', 2, 1, 1, 49, 2, 4, '-', '2-Zimmer Herzogstraße', 'Balkon|City', 'Unmöbliert. Energieausweis D.'],

  ['bielefeld-mitte-niedern-15', 'bielefeld', 'Mitte', 'Niedernstraße', '15', '33602', 52.0214, 8.5328, 112, 'sale', 'apartment', 3, 2, 1, 77, 3, 5, 'vp', 'Wohnung Bielefeld-Mitte, Niedernstraße', 'Balkon|Aufzug', 'Stadtbahn Jahnplatz. Energieausweis C.'],
  ['bielefeld-dornberg-house', 'bielefeld', 'Dornberg', 'Wertherstraße', '220', '33615', 52.0416, 8.5012, 98, 'sale', 'house', 4, 3, 2, 150, 0, 2, 'v', 'Einfamilienhaus Dornberg', 'Garten|Garage', 'Stadtbahn Babenhausen Süd. Baujahr 1984.'],
  ['bielefeld-mitte-rent', 'bielefeld', 'Mitte', 'Bahnhofstraße', '8', '33602', 52.0278, 8.5336, 105, 'rent', 'apartment', 2, 1, 1, 54, 4, 6, 'v', '2-Zimmer Bahnhofstraße', 'Aufzug|Hbf nah', 'Unmöbliert.'],

  ['bonn-suedstadt-koblenzer-40', 'bonn', 'Südstadt', 'Koblenzer Straße', '40', '53173', 50.7186, 7.1424, 128, 'sale', 'apartment', 3, 2, 1, 90, 2, 4, 'sv', 'Wohnung Bonner Südstadt, Koblenzer', 'Balkon|Altbau|Rheinnähe', 'U-Bahn Rheinaue. Energieausweis C.'],
  ['bonn-badgodesberg-villa', 'bonn', 'Bad Godesberg', 'Koblenzer Straße', '110', '53177', 50.6848, 7.1552, 145, 'sale', 'villa', 6, 5, 3, 230, 0, 2, 'sv', 'Villa Bad Godesberg', 'Garten|Rheinblick|Garage', 'U-Bahn Bad Godesberg. Baujahr 1920. Energieausweis D.'],
  ['bonn-zentrum-rent', 'bonn', 'Zentrum', 'Markt', '6', '53111', 50.7354, 7.1022, 120, 'rent', 'apartment', 2, 1, 1, 58, 3, 5, 'vp', '2-Zimmer am Bonner Markt', 'Altbau|City', 'U Universität/Markt. Unmöbliert.'],
  ['bonn-beuel-house', 'bonn', 'Beuel', 'Rheinaustraße', '22', '53225', 50.7378, 7.1194, 112, 'sale', 'house', 4, 3, 2, 152, 0, 2, 'vp', 'Haus Beuel, Rheinseite', 'Garten|Stellplatz', 'U-Bahn Beuel. Baujahr 1961, Fenster 2022.'],

  ['muenster-prinzipal-8', 'muenster', 'Zentrum', 'Prinzipalmarkt', '8', '48143', 51.9626, 7.6284, 140, 'sale', 'apartment', 2, 1, 1, 70, 2, 4, 'sv', 'Wohnung Prinzipalmarkt, Altstadt', 'Denkmalschutz|Altbau|Lage', 'Lambertikirche vor der Tür. Energieausweis D (Denkmal).'],
  ['muenster-schloss-rent', 'muenster', 'Schloss', 'Schlossplatz', '4', '48143', 51.9634, 7.6132, 125, 'rent', 'apartment', 3, 2, 1, 86, 1, 3, 'vp', '3-Zimmer am Schloss', 'Gartenblick|Altbau', 'Unmöbliert. Energieausweis C.'],
  ['muenster-hiltrup-house', 'muenster', 'Hiltrup', 'Westfalenstraße', '16', '48165', 51.9048, 7.6502, 105, 'sale', 'house', 5, 4, 2, 160, 0, 2, 'vp', 'Einfamilienhaus Hiltrup', 'Garten|Garage|Ruhig', 'S-Bahn Hiltrup. Baujahr 1992. Energieausweis C.'],
  ['muenster-hafen-commercial', 'muenster', 'Hafen', 'Hafenweg', '20', '48155', 51.9512, 7.6386, 110, 'rent', 'commercial', 0, 0, 1, 240, 1, 4, 'v', 'Kreativbüro Hafenweg', 'Loft|Kanal-Lage', 'Kreativkai. Kaltmiete zzgl. NK/MwSt.'],

  ['mannheim-quadrate-p7', 'mannheim', 'Quadrate', 'P7', '16', '68161', 49.4878, 8.4668, 118, 'sale', 'apartment', 3, 2, 1, 84, 3, 5, 'vp', 'Wohnung Quadrate P7', 'Balkon|City', 'U Paradeplatz. Energieausweis C.'],
  ['mannheim-oststadt-house', 'mannheim', 'Oststadt', 'Augartenstraße', '22', '68165', 49.4834, 8.4856, 112, 'sale', 'house', 4, 3, 2, 148, 0, 2, 'vp', 'Stadthaus Oststadt, Augarten', 'Garten|Stellplatz', 'U-Bahn Oststadt. Baujahr 1908.'],
  ['mannheim-jungbusch-rent', 'mannheim', 'Jungbusch', 'Hafenstraße', '9', '68159', 49.4962, 8.4574, 100, 'rent', 'apartment', 2, 1, 1, 50, 2, 4, 'v', '2-Zimmer Jungbusch', 'Balkon|Hafenlage', 'Unmöbliert. Energieausweis C.'],
  ['mannheim-lindenhof-land', 'mannheim', 'Lindenhof', 'Meeräckerstraße', '40', '68163', 49.4688, 8.4702, 65, 'sale', 'land', 0, 0, 0, 420, 0, 0, '-', 'Wohngrund Lindenhof', 'Erschlossen|Rheinnähe', 'Einzelhaus laut Plan.'],

  ['karlsruhe-innen-kaiser-40', 'karlsruhe', 'Innenstadt', 'Kaiserstraße', '40', '76131', 49.0092, 8.4038, 120, 'sale', 'apartment', 3, 2, 1, 80, 4, 6, 'vp', 'Wohnung Kaiserstraße, Karlsruhe', 'Balkon|Aufzug|City', 'S Marktplatz. Energieausweis B.'],
  ['karlsruhe-durlach-house', 'karlsruhe', 'Durlach', 'Pfinztalstraße', '18', '76227', 49.0034, 8.4712, 108, 'sale', 'house', 4, 3, 2, 142, 0, 2, 'vp', 'Haus Durlach, Altstadt-Rand', 'Garten|Garage', 'S-Bahn Durlach. Baujahr 1969.'],
  ['karlsruhe-suedstadt-rent', 'karlsruhe', 'Südstadt', 'Augartenstraße', '12', '76137', 49.0012, 8.4086, 105, 'rent', 'apartment', 2, 1, 1, 56, 2, 4, 'v', '2-Zimmer Südstadt', 'Balkon|Altbau', 'Unmöbliert.'],
  ['karlsruhe-innen-daily', 'karlsruhe', 'Innenstadt', 'Waldstraße', '7', '76133', 49.0114, 8.3964, 115, 'daily', 'apartment', 1, 1, 1, 36, 3, 5, 'v', 'City-Studio Waldstraße', 'WLAN|Messe-S-Bahn', 'Mindestaufenthalt 3 Nächte.'],

  ['augsburg-innen-maximilian-22', 'augsburg', 'Innenstadt', 'Maximilianstraße', '22', '86150', 48.3668, 10.8986, 118, 'sale', 'apartment', 3, 2, 1, 83, 2, 5, 'vp', 'Wohnung Maximilianstraße, Augsburg', 'Altbau|Stuck|Balkon', 'Tram Moritzplatz. Energieausweis C.'],
  ['augsburg-goeggingen-house', 'augsburg', 'Göggingen', 'Gögginger Straße', '80', '86199', 48.3472, 10.8724, 100, 'sale', 'house', 4, 3, 2, 140, 0, 2, 'v', 'Haus Göggingen', 'Garten|Garage', 'Tram Göggingen. Baujahr 1975.'],
  ['augsburg-innen-rent', 'augsburg', 'Innenstadt', 'Annastraße', '6', '86150', 48.3684, 10.8962, 110, 'rent', 'apartment', 2, 1, 1, 54, 3, 4, 'v', '2-Zimmer Annastraße', 'Altbau|City', 'Unmöbliert.'],

  ['wiesbaden-mitte-wilhelm-18', 'wiesbaden', 'Mitte', 'Wilhelmstraße', '18', '65183', 50.0824, 8.2416, 125, 'sale', 'apartment', 3, 2, 1, 92, 3, 5, 'sv', 'Wohnung Wilhelmstraße, Wiesbaden', 'Stuck|Balkon|Kur-Lage', 'Nerotal und Kurhaus nah. Energieausweis C.'],
  ['wiesbaden-dotzheim-house', 'wiesbaden', 'Dotzheim', 'Dotzheimer Straße', '140', '65197', 50.0786, 8.2112, 105, 'sale', 'house', 5, 4, 2, 158, 0, 2, 'vp', 'Haus Dotzheim', 'Garten|Garage|Ruhig', 'ESWE Bus. Baujahr 1988. Energieausweis C.'],
  ['wiesbaden-mitte-rent', 'wiesbaden', 'Mitte', 'Luisenstraße', '9', '65185', 50.0798, 8.2394, 118, 'rent', 'apartment', 2, 1, 1, 60, 2, 4, 'vp', '2-Zimmer Luisenplatz', 'Altbau|City', 'Unmöbliert.'],
  ['wiesbaden-bierstadt-villa', 'wiesbaden', 'Bierstadt', 'Poststraße', '5', '65191', 50.0836, 8.2774, 140, 'sale', 'villa', 6, 5, 3, 215, 0, 2, 'sv', 'Villa Bierstadt', 'Garten|Garage|Ruhige Lage', 'Baujahr 1914, Sanierung 2015. Energieausweis C.'],

  ['freiburg-wiehre-gunterstal-20', 'freiburg', 'Wiehre', 'Günterstalstraße', '20', '79100', 47.9836, 7.8452, 130, 'sale', 'apartment', 3, 2, 1, 86, 2, 4, 'sv', 'Wohnung Wiehre, Günterstalstraße', 'Balkon|Altbau|Schwarzwald-Nähe', 'VAG Günterstalstraße. Energieausweis C.'],
  ['freiburg-herdern-house', 'freiburg', 'Herdern', 'Stadtstraße', '14', '79104', 47.9998, 7.8586, 135, 'sale', 'house', 5, 4, 2, 166, 0, 2, 'sv', 'Haus Herdern', 'Garten|Garage', 'VAG Herdern Kirche. Baujahr 1930.'],
  ['freiburg-altstadt-rent', 'freiburg', 'Altstadt', 'Oberlinden', '3', '79098', 47.9948, 7.8524, 140, 'rent', 'apartment', 2, 1, 1, 52, 2, 4, 'vp', '2-Zimmer Oberlinden, Altstadt', 'Fachwerk-Nähe|Altbau', 'Unmöbliert. Denkmallage.'],
  ['freiburg-stgeorgen-land', 'freiburg', 'St. Georgen', 'Munzinger Straße', '8', '79111', 47.9864, 7.8026, 75, 'sale', 'land', 0, 0, 0, 510, 0, 0, 'v', 'Wohngrund St. Georgen', 'Erschlossen|Südhang', 'VAG Munzinger Straße. Einzelhaus.'],

  ['heidelberg-altstadt-haupt-40', 'heidelberg', 'Altstadt', 'Hauptstraße', '40', '69117', 49.4116, 8.7068, 145, 'sale', 'apartment', 2, 1, 1, 68, 2, 4, 'sv', 'Wohnung Hauptstraße, Heidelberger Altstadt', 'Altbau|Neckar-Nähe', 'RNV Bismarckplatz. Energieausweis D (Denkmal).'],
  ['heidelberg-neuenheim-house', 'heidelberg', 'Neuenheim', 'Brückenstraße', '22', '69120', 49.4148, 8.6924, 150, 'sale', 'house', 5, 4, 2, 170, 0, 2, 'sv', 'Haus Neuenheim, Neckarseite', 'Garten|Stellplatz', 'RNV Neuenheim. Baujahr 1926.'],
  ['heidelberg-altstadt-daily', 'heidelberg', 'Altstadt', 'Untere Straße', '11', '69117', 49.4124, 8.7092, 155, 'daily', 'apartment', 1, 1, 1, 38, 3, 4, 'vp', 'Altstadt-Studio Untere Straße', 'WLAN|Schloss-Blick-nah|Möbliert', 'Mindestaufenthalt 3 Nächte. 2 Personen.'],
  ['heidelberg-bergheim-rent', 'heidelberg', 'Bergheim', 'Bergheimer Straße', '18', '69115', 49.4092, 8.6854, 122, 'rent', 'apartment', 3, 2, 1, 78, 2, 5, 'v', '3-Zimmer Bergheim', 'Balkon|Uni-Klinik nah', 'Unmöbliert.'],

  ['potsdam-nauenertor-brandenburger-18', 'potsdam', 'Nauener Tor', 'Brandenburger Straße', '18', '14467', 52.4008, 13.0574, 128, 'sale', 'apartment', 3, 2, 1, 88, 2, 4, 'sv', 'Wohnung Brandenburger Straße, Potsdam', 'Altbau|Holländisches Viertel nah', 'Tram Nauener Tor. Energieausweis C.'],
  ['potsdam-babelsberg-house', 'potsdam', 'Babelsberg', 'Großbeerenstraße', '40', '14482', 52.3912, 13.0936, 118, 'sale', 'house', 4, 3, 2, 148, 0, 2, 'vp', 'Haus Babelsberg, Filmpark-Nähe', 'Garten|Stellplatz', 'S-Bahn Babelsberg. Baujahr 1930.'],
  ['potsdam-innen-rent', 'potsdam', 'Innenstadt', 'Lindenstraße', '9', '14467', 52.3984, 13.0536, 120, 'rent', 'apartment', 2, 1, 1, 56, 3, 4, 'vp', '2-Zimmer Lindenstraße', 'Altbau|Stadtkanal', 'Unmöbliert.'],
  ['potsdam-bornstedt-villa', 'potsdam', 'Bornstedt', 'Ribbeckstraße', '6', '14469', 52.4186, 13.0432, 145, 'sale', 'villa', 6, 5, 3, 235, 0, 2, 'sv', 'Villa Bornstedt, Schlosspark-Nähe', 'Garten|Garage|Parknähe', 'Tram Bornstedt. Baujahr 1898. Energieausweis D.'],

  ['aachen-innen-pont-12', 'aachen', 'Innenstadt', 'Pontstraße', '12', '52062', 50.7774, 6.0832, 115, 'sale', 'apartment', 3, 2, 1, 76, 3, 5, 'vp', 'Wohnung Pontstraße, Aachen', 'Balkon|Uni-Nähe', 'ASEAG Ponttor. Energieausweis C.'],
  ['aachen-burtscheid-house', 'aachen', 'Burtscheid', 'Deliusstraße', '8', '52064', 50.7628, 6.0924, 108, 'sale', 'house', 4, 3, 2, 138, 0, 2, 'vp', 'Haus Burtscheid', 'Garten|Thermen-Nähe', 'ASEAG Burtscheid. Baujahr 1964.'],
  ['aachen-innen-rent', 'aachen', 'Innenstadt', 'Adalbertstraße', '20', '52062', 50.7752, 6.0896, 110, 'rent', 'apartment', 2, 1, 1, 50, 2, 4, 'v', '2-Zimmer Adalbertstraße', 'City|Altbau', 'Unmöbliert.'],
  ['aachen-innen-daily', 'aachen', 'Innenstadt', 'Büchel', '5', '52062', 50.7758, 6.0838, 125, 'daily', 'hotel', 12, 12, 12, 380, 0, 3, 'vp', 'Kleines Stadthotel Büchel, 12 Zimmer', 'Frühstück|Altstadt|WLAN', 'Dom 4 Minuten. Tages- und Wochenraten. Betrieb laufend.'],

  ['mainz-altstadt-augustiner-9', 'mainz', 'Altstadt', 'Augustinerstraße', '9', '55116', 49.9986, 8.2734, 122, 'sale', 'apartment', 3, 2, 1, 81, 2, 4, 'vp', 'Wohnung Augustinerstraße, Mainz', 'Altbau|Dom-Nähe', 'Tram Höfchen. Energieausweis C.'],
  ['mainz-gonsenheim-house', 'mainz', 'Gonsenheim', 'Mainzer Straße', '80', '55124', 50.0034, 8.2168, 100, 'sale', 'house', 4, 3, 2, 146, 0, 2, 'v', 'Haus Gonsenheim', 'Garten|Garage', 'Tram Gonsenheim. Baujahr 1971.'],
  ['mainz-neustadt-rent', 'mainz', 'Neustadt', 'Kaiserstraße', '16', '55116', 50.0048, 8.2662, 115, 'rent', 'apartment', 2, 1, 1, 55, 3, 5, 'v', '2-Zimmer Kaiserstraße, Neustadt', 'Balkon|Rhein-Nähe', 'Unmöbliert.'],

  ['kiel-gaarden-georg-14', 'kiel', 'Damperhof', 'Holstenstraße', '28', '24103', 54.3236, 10.1392, 112, 'sale', 'apartment', 3, 2, 1, 78, 4, 6, 'vp', 'Wohnung Holstenstraße, Kiel', 'Balkon|Förde-Nähe', 'Bus Hauptbahnhof. Energieausweis C.'],
  ['kiel-duesternbrook-villa', 'kiel', 'Düsternbrook', 'Düsternbrooker Weg', '20', '24105', 54.3428, 10.1486, 150, 'sale', 'villa', 6, 5, 3, 250, 0, 2, 'sv', 'Fördevilla Düsternbrook', 'Garten|Wasserblick|Garage', 'Bus Düsternbrook. Baujahr 1910. Energieausweis D.'],
  ['kiel-schreventeich-rent', 'kiel', 'Schreventeich', 'Waitzstraße', '7', '24105', 54.3312, 10.1284, 105, 'rent', 'apartment', 2, 1, 1, 53, 2, 4, 'v', '2-Zimmer Schreventeich', 'Balkon|Uni nah', 'Unmöbliert.'],
  ['kiel-gaarden-house', 'kiel', 'Gaarden', 'Werftstraße', '120', '24143', 54.3134, 10.1512, 85, 'sale', 'house', 4, 3, 1, 124, 0, 2, '-', 'Haus Gaarden, Werftstraße', 'Garten|Stellplatz', 'Bus Gaarden. Baujahr 1955.'],

  ['rostock-kropeliner-15', 'rostock', 'Kröpeliner-Tor-Vorstadt', 'Kröpeliner Straße', '15', '18055', 54.0888, 12.1402, 115, 'sale', 'apartment', 3, 2, 1, 80, 3, 5, 'vp', 'Wohnung Kröpeliner Straße', 'Altbau|Uni-Nähe', 'Tram Universitätsplatz. Energieausweis C.'],
  ['rostock-warnemuende-hotel', 'rostock', 'Warnemünde', 'Am Strom', '22', '18119', 54.1812, 12.0846, 160, 'sale', 'hotel', 16, 16, 16, 640, 0, 3, 'sv', 'Strandhotel Warnemünde, 16 Zimmer', 'Ostseelage|Restaurant|Düne nah', 'S-Bahn Warnemünde Werft. Saisonbetrieb, Zahlen im Datenraum.'],
  ['rostock-reutershagen-house', 'rostock', 'Reutershagen', 'Händelstraße', '9', '18069', 54.0946, 12.0784, 95, 'sale', 'house', 4, 3, 2, 134, 0, 2, 'v', 'Haus Reutershagen', 'Garten|Garage', 'Tram Reutershagen. Baujahr 1968.'],
  ['rostock-stadtmitte-rent', 'rostock', 'Stadtmitte', 'Lange Straße', '20', '18055', 54.0882, 12.1408, 108, 'rent', 'apartment', 2, 1, 1, 52, 5, 8, 'v', '2-Zimmer Lange Straße', 'Aufzug|City', 'Unmöbliert.'],

  ['erfurt-andreasviertel-8', 'erfurt', 'Andreasviertel', 'Andreasstraße', '8', '99084', 50.9786, 11.0264, 112, 'sale', 'apartment', 3, 2, 1, 75, 2, 4, 'vp', 'Wohnung Andreasviertel, Erfurt', 'Altbau|Domberg nah', 'Straßenbahn Anger. Energieausweis C.'],
  ['erfurt-ilversgehofen-house', 'erfurt', 'Ilversgehofen', 'Magdeburger Allee', '34', '99086', 51.0002, 11.0328, 90, 'sale', 'house', 4, 3, 1, 130, 0, 2, 'v', 'Haus Ilversgehofen', 'Garten|Stellplatz', 'Straßenbahn Magdeburger Allee. Baujahr 1938.'],
  ['erfurt-altstadt-rent', 'erfurt', 'Altstadt', 'Schlösserstraße', '4', '99084', 50.9778, 11.0288, 118, 'rent', 'apartment', 2, 1, 1, 48, 3, 4, 'v', '2-Zimmer Schlösserstraße', 'Krämerbrücke nah|Altbau', 'Unmöbliert.'],
  ['erfurt-altstadt-daily', 'erfurt', 'Altstadt', 'Domplatz', '3', '99084', 50.9764, 11.0236, 125, 'daily', 'apartment', 2, 1, 1, 46, 2, 4, 'vp', 'Ferienwohnung Domplatz', 'WLAN|Dom-Blick|Möbliert', 'Mindestaufenthalt 2 Nächte. City-Tax Thüringen.'],
]

function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

function photos(prop: PropType, id: string, n = 4): string[] {
  const pool = PHOTO[prop]
  const start = hash(id) % pool.length
  const out: string[] = []
  for (let i = 0; i < Math.min(n, pool.length); i++) out.push(pool[(start + i) % pool.length]!)
  return out
}

function badgeOf(k: BadgeKey): Badge {
  if (k === 'sv') return 'SUPER VIP'
  if (k === 'vp') return 'VIP+'
  if (k === 'v') return 'VIP'
  return null
}

function eurPrice(citySlug: string, deal: DealType, prop: PropType, area: number, mul: number): number {
  const city = deCityBySlug(citySlug)
  const buy = city?.buyEurSqm ?? 4000
  const rent = city?.rentEurSqm ?? 12
  if (deal === 'daily') return Math.max(55, Math.round((rent * area * 0.045 * mul) / 100 / 5) * 5)
  const m2 = deal === 'rent' ? rent : buy
  let factor = mul / 100
  if (prop === 'land') factor *= 0.38
  if (prop === 'commercial') factor *= deal === 'rent' ? 1.15 : 0.92
  if (prop === 'hotel') factor *= 0.85
  if (prop === 'villa') factor *= 1.08
  if (prop === 'house') factor *= 0.95
  const raw = m2 * factor * area
  if (deal === 'rent') return Math.max(380, Math.round(raw / 10) * 10)
  return Math.max(49_000, Math.round(raw / 1000) * 1000)
}

function postedAt(id: string): string {
  const d = 1 + (hash(id) % 100)
  const dt = new Date(Date.UTC(2026, 5, 4 + (d % 100)))
  return dt.toISOString().slice(0, 10)
}

function expand(row: Row, i: number): Listing {
  const [id, citySlug, dist, street, no, plz, lat, lng, mul, deal, prop, rooms, beds, baths, area, floor, total, bKey, title, feats, blurb] = row
  const city = deCityBySlug(citySlug)?.de ?? citySlug
  const eur = eurPrice(citySlug, deal, prop, area, mul)
  const priceGEL = Math.round(eur * EUR_GEL)
  const priceUSD = Math.round(priceGEL / USD_GEL)
  const perM2USD = area > 0 ? Math.round((eur / area) * EUR_GEL / USD_GEL) : 0
  const imgs = photos(prop, id, bKey === 'sv' ? 5 : 4)
  const agent = AGENTS[hash(id) % AGENTS.length]!
  const posted = postedAt(id)
  return {
    id,
    country: 'DE',
    img: imgs[0]!,
    images: imgs,
    priceUSD,
    priceGEL,
    priceOriginal: eur,
    currencyOriginal: 'EUR',
    perM2USD,
    title,
    address: `${street} ${no}, ${plz} ${city}`,
    city,
    district: dist,
    dealType: deal,
    propType: prop,
    rooms,
    beds,
    baths,
    area,
    floor,
    totalFloors: total,
    views: 700 + (hash(id) % 5400),
    badge: badgeOf(bKey),
    isExclusive: bKey === 'sv' && i % 3 === 0,
    isSivrceExclusive: bKey === 'sv' && i % 5 === 0,
    verified: true,
    ai: { score: bKey === 'sv' ? 99 : bKey === 'vp' ? 96 : 90, label: 'Marktgerecht' },
    features: feats.split('|'),
    description: blurb.length >= 40 ? blurb : `${blurb} ${street} ${no}, ${plz} — Grundbuch und Energieausweis auf Anfrage.`,
    coords: { lat, lng },
    buildingNumber: no,
    postedAt: posted,
    agent,
    sellerType: 'agency',
    isNew: posted >= '2026-08-30',
  }
}

/** `expand` always writes a description, so narrow it for callers that require one. */
type DeListing = Listing & { description: string }

export const GERMANY_LISTINGS: DeListing[] = ROWS.map(expand) as DeListing[]

export function germanyListingById(id: string): DeListing | undefined {
  return GERMANY_LISTINGS.find((l) => l.id === id)
}

function cityMatchKeys(listingCity: string): string[] {
  const row = DE_CITIES.find((c) => c.de === listingCity)
  if (!row) return [listingCity.toLowerCase()]
  return [row.de, row.slug, row.ka, row.de.replace(/ am Main$/i, '')].map((s) => s.toLowerCase())
}

export function filterGermanyInventory(opts: {
  cityNames?: string[]
  deal?: 'buy' | 'rent' | DealType
  propType?: PropType
  district?: string
  q?: string
  minPrice?: number
  maxPrice?: number
  rooms?: number
}): DeListing[] {
  const deal = opts.deal === 'buy' ? 'sale' : opts.deal
  const cities = opts.cityNames?.map((c) => c.toLowerCase())
  return GERMANY_LISTINGS.filter((l) => {
    if (deal && l.dealType !== deal) return false
    if (opts.propType && l.propType !== opts.propType) return false
    if (opts.district && l.district.toLowerCase() !== opts.district.toLowerCase()) return false
    if (cities?.length) {
      const keys = cityMatchKeys(l.city)
      if (!cities.some((c) => keys.includes(c) || keys.some((k) => k.includes(c) || c.includes(k)))) return false
    }
    if (opts.minPrice != null && l.priceOriginal != null && l.priceOriginal < opts.minPrice) return false
    if (opts.maxPrice != null && l.priceOriginal != null && l.priceOriginal > opts.maxPrice) return false
    if (opts.rooms != null && l.rooms < opts.rooms) return false
    if (opts.q) {
      const q = opts.q.toLowerCase()
      const hay = `${l.title} ${l.address} ${l.city} ${l.district} ${l.id}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
}
