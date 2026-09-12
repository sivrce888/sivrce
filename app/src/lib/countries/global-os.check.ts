/**
 * Runnable check: npx tsx src/lib/countries/global-os.check.ts
 * Global OS gate — derived layer stays in sync with its sources, never drifts.
 */
import assert from 'node:assert/strict'
import { DEVELOPERS, PROJECTS } from '@/data/professionals'
import { METRO_STATIONS } from '@/data/tbilisi-metro'
import { worldDevelopers } from '@/data/world-developers'
import { WORLD_PLACES } from '@/data/world-places'
import { COUNTRY_IDS, MARKETS } from '@/lib/markets'
import { MAP_CITIES_ALL as MAP_CITIES } from '@/lib/map/user-place.server'
import {
  countryJsonLd,
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
  assert.equal(countryJsonLd(cc), null, `thin entity: ${cc}`)
}
assert.equal(globalCountry('de')?.defaultCitySlug, 'berlin')
assert.ok((metrosForCountry('ae').length ?? 0) >= 2)
assert.ok(globalCountry('xx') === null)

// Metros: only Tbilisi verified; everything else live-only with zero invented pins.
assert.equal(metroStationsFor('tbilisi').length, METRO_STATIONS.length)
assert.ok(METRO_STATIONS.length >= 22, 'tbilisi stations shrank')
assert.deepEqual(metroStationsFor('berlin'), [])
assert.equal(metroSystemFor('tbilisi').status, 'verified')
assert.equal(metroSystemFor('berlin').status, 'live-only')

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
const ld = countryJsonLd('DE'.toLowerCase())
assert.ok(ld && (ld as { name: string }).name === 'Germany', 'json-ld germany')

console.log(
  `global-os.check: ${stats.countries} countries, ${stats.metros} metros, ` +
    `${stats.developers} devs, ${stats.projects} projects (${stats.renders} renders), ` +
    `${stats.verifiedMetroStations} verified metro stations ok`,
)
