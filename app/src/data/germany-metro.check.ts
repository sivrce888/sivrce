/**
 * germany-metro.check.ts — validates germany-metro.ts data integrity.
 * Run: npx tsx src/data/germany-metro.check.ts
 */

import {
  BERLIN_U_STATIONS,
  BERLIN_S_STATIONS,
  GERMAN_METRO_SYSTEMS,
} from './germany-metro'

let errors = 0
const fail = (msg: string) => { console.error(`✗ ${msg}`); errors++ }
const ok = (msg: string) => console.log(`✓ ${msg}`)

// ── Wikipedia roster of open Berlin U-Bahn stations (fetched 2026-09-12) —
// the anti-fabrication fixture: every canonical station must be on it. ──
const WIKI_ROSTER = [
  'Adenauerplatz',
  'Afrikanische Straße',
  'Alexanderplatz',
  'Alt-Mariendorf',
  'Alt-Tegel',
  'Alt-Tempelhof',
  'Altstadt Spandau',
  'Amrumer Straße',
  'Anton-Wilhelm-Amo-Straße',
  'Augsburger Straße',
  'Bayerischer Platz',
  'Berliner Straße',
  'Bernauer Straße',
  'Biesdorf-Süd',
  'Birkenstraße',
  'Bismarckstraße',
  'Blaschkoallee',
  'Blissestraße',
  'Boddinstraße',
  'Borsigwerke',
  'Breitenbachplatz',
  'Brandenburger Tor',
  'Britz-Süd',
  'Bülowstraße',
  'Bundestag',
  'Bundesplatz',
  'Cottbusser Platz',
  'Dahlem-Dorf',
  'Deutsche Oper',
  'Eberswalder Straße',
  'Eisenacher Straße',
  'Elsterwerdaer Platz',
  'Ernst-Reuter-Platz',
  'Fehrbelliner Platz',
  'Frankfurter Allee',
  'Frankfurter Tor',
  'Franz-Neumann-Platz',
  'Freie Universität (Thielplatz)',
  'Friedrichsfelde',
  'Friedrichstraße',
  'Friedrich-Wilhelm-Platz',
  'Gesundbrunnen',
  'Gleisdreieck',
  'Gneisenaustraße',
  'Görlitzer Bahnhof',
  'Grenzallee',
  'Güntzelstraße',
  'Halemweg',
  'Hallesches Tor',
  'Hansaplatz',
  'Haselhorst',
  'Hauptbahnhof',
  'Hausvogteiplatz',
  'Heidelberger Platz',
  'Heinrich-Heine-Straße',
  'Hellersdorf',
  'Hermannplatz',
  'Hermannstraße',
  'Hönow',
  'Hohenzollernplatz',
  'Holzhauser Straße',
  'Innsbrucker Platz',
  'Jakob-Kaiser-Platz',
  'Jannowitzbrücke',
  'Johannisthaler Chaussee',
  'Jungfernheide',
  'Kaiserdamm',
  'Kaiserin-Augusta-Straße',
  'Karl-Bonhoeffer-Nervenklinik',
  'Karl-Marx-Straße',
  'Kaulsdorf-Nord',
  'Kienberg (Gärten der Welt)',
  'Kleistpark',
  'Klosterstraße',
  'Kochstraße',
  'Konstanzer Straße',
  'Kottbusser Tor',
  'Krumme Lanke',
  'Kurfürstendamm',
  'Kurfürstenstraße',
  'Kurt-Schumacher-Platz',
  'Leinestraße',
  'Leopoldplatz',
  'Lichtenberg',
  'Lindauer Allee',
  'Lipschitzallee',
  'Louis-Lewin-Straße',
  'Magdalenenstraße',
  'Märkisches Museum',
  'Mehringdamm',
  'Mendelssohn-Bartholdy-Park',
  'Mierendorffplatz',
  'Möckernbrücke',
  'Moritzplatz',
  'Museumsinsel',
  'Naturkundemuseum',
  'Nauener Platz',
  'Neu-Westend',
  'Neukölln',
  'Nollendorfplatz',
  'Olympia-Stadion',
  'Onkel Toms Hütte',
  'Oranienburger Tor',
  'Oskar-Helene-Heim',
  'Osloer Straße',
  'Otisstraße',
  'Pankow',
  'Pankstraße',
  'Paracelsus-Bad',
  'Paradestraße',
  'Parchimer Allee',
  'Paulsternstraße',
  'Platz der Luftbrücke',
  'Podbielskiallee',
  'Potsdamer Platz',
  'Prinzenstraße',
  'Rathaus Neukölln',
  'Rathaus Reinickendorf',
  'Rathaus Schöneberg',
  'Rathaus Spandau',
  'Rathaus Steglitz',
  'Rehberge',
  'Reinickendorfer Straße',
  'Residenzstraße',
  'Richard-Wagner-Platz',
  'Rohrdamm',
  'Rosa-Luxemburg-Platz',
  'Rosenthaler Platz',
  'Rotes Rathaus',
  'Rüdesheimer Platz',
  'Rudow',
  'Ruhleben',
  'Samariterstraße',
  'Scharnweberstraße',
  'Schillingstraße',
  'Schlesisches Tor',
  'Schloßstraße',
  'Schönhauser Allee',
  'Schönleinstraße',
  'Schwartzkopffstraße',
  'Seestraße',
  'Senefelderplatz',
  'Siemensdamm',
  'Sophie-Charlotte-Platz',
  'Spichernstraße',
  'Spittelmarkt',
  'Stadtmitte',
  'Strausberger Platz',
  'Südstern',
  'Tempelhof',
  'Theodor-Heuss-Platz',
  'Tierpark',
  'Turmstraße',
  'Uhlandstraße',
  'Ullsteinstraße',
  'Unter den Linden',
  'Viktoria-Luise-Platz',
  'Vinetastraße',
  'Voltastraße',
  'Walther-Schreiber-Platz',
  'Warschauer Straße',
  'Weberwiese',
  'Wedding',
  'Weinmeisterstraße',
  'Westhafen',
  'Westphalweg',
  'Wilmersdorfer Straße',
  'Wittenau',
  'Wittenbergplatz',
  'Wuhletal',
  'Wutzkyallee',
  'Yorckstraße',
  'Zitadelle',
  'Zoologischer Garten',
  'Zwickauer Damm',
]

const normName = (n: string) =>
  n
    .toLowerCase()
    .split('(')[0]!
    .split('/')[0]!
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]/g, '')
const roster = new Set(WIKI_ROSTER.map(normName))

const notOnRoster = BERLIN_U_STATIONS.filter((s) => !roster.has(normName(s.name)))
if (notOnRoster.length === 0) {
  ok(`Berlin U-Bahn: all ${BERLIN_U_STATIONS.length} stations on Wikipedia roster`)
} else {
  fail(`Stations not on roster (fabricated?): ${notOnRoster.map((s) => s.name).join(', ')}`)
}

// ── Lines are real U-Bahn lines only ──
const lineRe = /^U[1-9]$/
const badLines = BERLIN_U_STATIONS.flatMap((s) =>
  s.lines.filter((l) => !lineRe.test(l)).map((l) => `${s.name}: ${l}`),
)
if (badLines.length === 0) {
  ok('All U-Bahn lines ∈ U1–U9')
} else {
  fail(`Invalid lines: ${badLines.join(', ')}`)
}

// ── Berlin canonical stations: one station = one page (no per-line dupes) ──
const dupeNames = (list: { name: string }[]) =>
  list.map((s) => s.name).filter((n, i, a) => a.indexOf(n) !== i)
const uDupes = dupeNames(BERLIN_U_STATIONS)
const sDupes = dupeNames(BERLIN_S_STATIONS)
if (uDupes.length === 0 && BERLIN_U_STATIONS.length >= 165) {
  ok(`Berlin U-Bahn canonical: ${BERLIN_U_STATIONS.length} unique stations`)
} else {
  fail(`Berlin U-Bahn: ${uDupes.length} duplicate names, ${BERLIN_U_STATIONS.length} stations — expected canonical ≥165`)
}
if (sDupes.length === 0 && BERLIN_S_STATIONS.length > 20) {
  ok(`Berlin S-Bahn canonical: ${BERLIN_S_STATIONS.length} stations`)
} else {
  fail(`Berlin S-Bahn: ${sDupes.length} duplicate names, ${BERLIN_S_STATIONS.length} stations`)
}

// ── Interchanges must carry the merged lines of all their rows ──
const thinLines = [...BERLIN_U_STATIONS, ...BERLIN_S_STATIONS].filter(
  (s) => s.interchange && s.lines.length < 2,
)
if (thinLines.length === 0) {
  ok('All interchange stations have ≥2 lines')
} else {
  fail(`Interchanges with <2 lines: ${thinLines.map((s) => s.slug).join(', ')}`)
}

// ── Unique slugs ──
const allBerlin = [...BERLIN_U_STATIONS, ...BERLIN_S_STATIONS]
const slugs = allBerlin.map((s) => s.slug)
const dupeSlugs = slugs.filter((s, i) => slugs.indexOf(s) !== i)
if (dupeSlugs.length === 0) {
  ok('All Berlin station slugs are unique')
} else {
  fail(`Duplicate Berlin slugs: ${[...new Set(dupeSlugs)].join(', ')}`)
}

// ── Coordinate bounds (Berlin: ~52.3–52.7 lat, ~13.0–13.8 lng) ──
const outOfBounds = allBerlin.filter(
  (s) => s.lat < 52.3 || s.lat > 52.7 || s.lng < 13.0 || s.lng > 13.8,
)
if (outOfBounds.length === 0) {
  ok('All Berlin coordinates within bounds')
} else {
  fail(`${outOfBounds.length} stations out of Berlin bounds: ${outOfBounds.map((s) => s.slug).join(', ')}`)
}

// ── Every U-Bahn station has at least one line ──
const noLines = allBerlin.filter((s) => s.lines.length === 0)
if (noLines.length === 0) {
  ok('All Berlin stations have at least one line')
} else {
  fail(`${noLines.length} stations with no lines: ${noLines.map((s) => s.slug).join(', ')}`)
}

// ── German systems ──
if (GERMAN_METRO_SYSTEMS.length >= 10) {
  ok(`German metro systems: ${GERMAN_METRO_SYSTEMS.length}`)
} else {
  fail(`German metro systems: only ${GERMAN_METRO_SYSTEMS.length} (expected >=10)`)
}

// ── Every system has stations ──
for (const sys of GERMAN_METRO_SYSTEMS) {
  if (sys.stations.length > 0) {
    ok(`${sys.name}: ${sys.stations.length} stations`)
  } else {
    fail(`${sys.name}: no stations`)
  }
}

// ── Every system has lines ──
for (const sys of GERMAN_METRO_SYSTEMS) {
  if (sys.lines.length > 0) {
    ok(`${sys.name}: ${sys.lines.length} lines`)
  } else {
    fail(`${sys.name}: no lines`)
  }
}

// ── Line colors are valid hex ──
const hexRe = /^#[0-9A-Fa-f]{6}$/
const badColors = GERMAN_METRO_SYSTEMS.flatMap((sys) =>
  sys.lines.filter((l) => !hexRe.test(l.color)).map((l) => `${sys.name}/${l.name}: ${l.color}`),
)
if (badColors.length === 0) {
  ok('All line colors are valid hex')
} else {
  fail(`Invalid line colors: ${badColors.join(', ')}`)
}

// ── Summary ──
console.log('')
if (errors === 0) {
  console.log(`✅ All checks passed (${GERMAN_METRO_SYSTEMS.length} systems, ${allBerlin.length} Berlin stations)`)
} else {
  console.log(`❌ ${errors} check(s) failed`)
  process.exit(1)
}
