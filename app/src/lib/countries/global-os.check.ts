/**
 * Runnable check: npx tsx src/lib/countries/global-os.check.ts
 * Global OS gate — derived layer stays in sync with its sources, never drifts.
 */
import assert from 'node:assert/strict'
import { DEVELOPERS, PROJECTS } from '@/data/professionals'
import { METRO_STATIONS } from '@/data/tbilisi-metro'
import { worldDevelopers } from '@/data/world-developers'
import { WORLD_METROS } from '@/data/world-metros'
import { WORLD_NEIGHBORHOODS } from '@/data/world-neighborhoods'
import { WORLD_PLACES } from '@/data/world-places'
import { COUNTRY_IDS, MARKETS } from '@/lib/markets'
import { MAP_CITIES_ALL as MAP_CITIES } from '@/lib/map/user-place.server'
import {
  countryInfo,
  deepMarketFor,
  discoveryCountryCodes,
  discoveryMetroSlugs,
  globalCountries,
  globalCountry,
  globalCoverage,
  globalMetros,
  globalOsSearch,
  globalOsSitemapPaths,
  globalOsStats,
  metroStationsFor,
  metroSystemFor,
  metrosForCountry,
  neighborhoodsForCountry,
  nearestWorldMetroStation,
  osFreshness,
} from './global-os'

const metros = globalMetros()
assert.equal(metros.length, MAP_CITIES.length, 'metros cover every map city')
assert.equal(new Set(metros.map((m) => m.slug)).size, metros.length, 'dup metro slug')

// Every deep-market city resolves deep with a canonical path; intent ⊆ deep.
for (const id of COUNTRY_IDS) {
  for (const slug of MARKETS[id].citySlugs) {
    const m = metros.find((x) => x.slug === slug)
    assert.ok(m, `deep city missing from OS: ${slug}`)
    assert.ok(m.deep, `deep flag off: ${slug}`)
    assert.equal(m.marketPath, `${MARKETS[id].pathPrefix}/${slug}`)
  }
  for (const slug of MARKETS[id].intentCities) {
    assert.ok(metros.find((x) => x.slug === slug)?.intent, `intent flag off: ${id}/${slug}`)
  }
}

// Countries: one row per cc, deep hubs wired, centers finite (null = discovery-only, never invented).
const countries = globalCountries()
assert.equal(new Set(countries.map((c) => c.cc)).size, countries.length, 'dup country cc')
assert.ok(countries.length >= COUNTRY_IDS.length, 'fewer countries than deep hubs')
for (const c of countries) {
  assert.ok(c.cityCount >= 0 && c.metros.length === c.cityCount, `city count: ${c.cc}`)
  assert.ok(
    c.center === null || Number.isFinite(c.center.lat + c.center.lng),
    `center: ${c.cc}`,
  )
  assert.ok(c.names.en.length > 1, `name: ${c.cc}`)
  assert.ok(c.info !== null, `info row missing: ${c.cc}`)
  assert.equal(c.info?.cc, c.cc, `info drift: ${c.cc}`)
  assert.equal(c.deep, deepMarketFor(c.cc) !== null, `deep drift: ${c.cc}`)
  assert.equal(c.center === null, c.cityCount === 0, `center/city drift: ${c.cc}`)
  assert.equal(c.path === null, !c.deep, `path/deep drift: ${c.cc}`)
}
// Full ISO coverage: every assignment resolves; discovery rows carry no pins/links.
const stats = globalOsStats()
const discovery = discoveryCountryCodes()
assert.equal(stats.isoCountries, 250, `ISO coverage drift: ${stats.isoCountries}`)
assert.equal(discovery.length, stats.discoveryCountries, 'discovery count drift')
assert.equal(stats.countries + stats.discoveryCountries, stats.isoCountries, 'coverage leak')
for (const cc of discovery) {
  const row = globalCountry(cc)
  assert.ok(row && !row.deep && row.center === null && row.path === null, `discovery row: ${cc}`)
}
assert.equal(globalCountry('de')?.defaultCitySlug, 'berlin')
assert.ok((metrosForCountry('ae').length ?? 0) >= 2)
assert.ok(globalCountry('xx') === null)

// Metros: Tbilisi + 100+ world systems verified; the rest resolve live (never invented).
assert.equal(metroStationsFor('tbilisi').length, METRO_STATIONS.length)
assert.ok(METRO_STATIONS.length >= 22, 'tbilisi stations shrank')
assert.equal(metroSystemFor('tbilisi').status, 'verified')
assert.equal(metroSystemFor('tokyo').status, 'verified')
assert.ok(metroSystemFor('tokyo').stations! >= 20, 'tokyo pins shrank')
assert.ok(metroStationsFor('tokyo').length >= 20, 'tokyo station pins shrank')
assert.equal(metroSystemFor('berlin').status, 'verified')
assert.ok(metroStationsFor('berlin').length > 0, 'berlin pins missing')
assert.equal(metroSystemFor('sharjah').status, 'live-only')
assert.deepEqual(metroStationsFor('sharjah'), [])
assert.equal(stats.verifiedMetroSystems, WORLD_METROS.length + 1, 'metro system count drift')
assert.ok(stats.verifiedMetroSystems >= 100, 'verified metro systems shrank')
assert.equal(
  stats.verifiedMetroStations,
  METRO_STATIONS.length + WORLD_METROS.reduce((n, m) => n + m.stations.length, 0),
  'verified station count drift',
)
// World nearest: exact pin hits, catchment zones, invalid/far input, no Tbilisi overlap.
const shibuya = nearestWorldMetroStation(35.658, 139.7016)
assert.equal(shibuya?.name, 'Shibuya')
assert.equal(shibuya?.meters, 0)
assert.equal(shibuya?.zone, 'near')
assert.ok((shibuya?.line.length ?? 0) > 0 && (shibuya?.system.length ?? 0) > 0, 'world pin info thin')
assert.equal(nearestWorldMetroStation(0, -140), null, 'mid-Pacific must miss')
assert.equal(nearestWorldMetroStation(NaN, NaN), null, 'NaN must miss')
assert.equal(nearestWorldMetroStation(41.7035, 44.7896), null, 'Tbilisi grid owns Tbilisi')
for (const [la, ln] of [[48.8584, 2.2945], [25.1972, 55.2744]] as const) {
  const hit = nearestWorldMetroStation(la, ln)
  if (hit) {
    assert.ok(hit.meters <= 2500, `catchment leak: ${hit.name} ${hit.meters}m`)
    assert.ok(hit.walkMin >= 1, 'walkMin floor')
    assert.equal(hit.zone, hit.meters <= 800 ? 'near' : 'walk', `zone drift: ${hit.name}`)
  }
}
const timesSq = nearestWorldMetroStation(40.758, -73.9855)
assert.equal(timesSq?.name, 'Times Square-42nd St')
assert.equal(timesSq?.zone, 'near')
// Country facts: every ISO assignment (+XK extra) carries an info row.
assert.equal(stats.countryInfos, 250, `country info drift: ${stats.countryInfos}`)

// Neighborhoods: committed districts stay dup-free, priced, and per-country resolvable.
assert.equal(stats.neighborhoods, WORLD_NEIGHBORHOODS.length, 'neighborhood stat drift')
assert.ok(stats.neighborhoods >= 80, 'neighborhood corpus shrank')
assert.ok(new Set(WORLD_NEIGHBORHOODS.map((n) => n.slug)).size === WORLD_NEIGHBORHOODS.length, 'dup neighborhood slug')
assert.ok(WORLD_NEIGHBORHOODS.every((n) => n.avgPricePerSqm === undefined || n.avgPricePerSqm > 0), 'non-positive price anchor')
assert.ok(neighborhoodsForCountry('ae').length >= 3, 'ae neighborhoods missing')
assert.ok(neighborhoodsForCountry('gb')[0]?.city === 'London', 'gb neighborhood drift')
assert.equal(countryInfo('ge')?.capital, 'tbilisi', 'georgia info missing')
assert.equal(countryInfo('de')?.capital, 'berlin', 'germany info drift')
assert.ok((countryInfo('aq')?.population ?? -1) >= 0, 'territory info drift')

// Corpus floors mirror the directory gate so the OS never drifts below it.
// worldDevelopers are merged into DEVELOPERS — one registry, counted once.
assert.ok(DEVELOPERS.length >= 150 && stats.developers >= 300, 'developer corpus shrank')
assert.equal(stats.developers, DEVELOPERS.length, 'developer stat drift')
assert.ok(new Set(worldDevelopers.map((d) => d.slug)).size === worldDevelopers.length, 'dup world dev')
assert.ok(
  worldDevelopers.every((w) => DEVELOPERS.some((d) => d.slug === w.slug)),
  'world developer not in registry',
)
assert.ok(PROJECTS.length >= 400 && stats.projects >= 400, 'project corpus shrank')
assert.ok(stats.renders / stats.projects >= 0.95, 'renders shrank')
assert.ok(stats.countries >= 60, `country coverage shrank to ${stats.countries}`)
assert.ok(stats.worldPlaces === WORLD_PLACES.length, 'world places drift')
const cov = globalCoverage()
assert.ok(cov.rows.length >= 1, 'coverage empty')
assert.equal(
  cov.rows.reduce((n, r) => n + r.projects, 0) + cov.unmappedProjects,
  PROJECTS.length,
  'coverage leaks projects',
)
assert.equal(
  cov.rows.reduce((n, r) => n + r.developers, 0) + cov.unmappedDevelopers,
  DEVELOPERS.length,
  'coverage leaks developers',
)
// Every deep market carries at least one developer — no empty country page data.
for (const id of COUNTRY_IDS) {
  const cc = MARKETS[id].countryCode
  const row = cov.rows.find((r) => r.cc === cc)
  assert.ok(row && row.developers >= 1, `deep market without developers: ${id}`)
}

// Search, sitemap, freshness, JSON-LD.
assert.ok(globalOsSearch('tbilisi')[0]?.slug === 'tbilisi', 'search tbilisi')
assert.ok(globalOsSearch('berlin').some((h) => h.slug === 'berlin'), 'search berlin')
assert.ok(globalOsSearch('dubai').some((h) => h.slug === 'dubai'), 'search dubai')
assert.deepEqual(globalOsSearch('   '), [])
const paths = globalOsSitemapPaths()
assert.ok(paths.includes('/de') && paths.includes('/de/berlin') && paths.includes('/ae/dubai'))
assert.ok(discoveryMetroSlugs().length > 0, 'no discovery metros')
assert.ok(!paths.some((p) => p.includes('undefined')), 'sitemap has undefined')
assert.ok(osFreshness().asOf.length >= 4 && osFreshness().cycles.length >= 5, 'freshness thin')

console.log(
  `global-os.check: ${stats.countries} countries (${stats.countryInfos} info rows), ${stats.metros} metros, ` +
    `${stats.developers} devs, ${stats.projects} projects (${stats.renders} renders), ` +
    `${stats.verifiedMetroSystems} metro systems / ${stats.verifiedMetroStations} verified stations, ` +
    `${stats.neighborhoods} neighborhoods ok`,
)
