/**
 * Self-check for the sivrce.com World Desk resolver (no network, no DB).
 * Run: npx tsx src/lib/home-desk.check.ts
 *
 * Guards the three ways this rots: a dead city URL on the global home, an
 * unverified cost table rendered as fact, and a launched market falling out
 * of the world index.
 */
import assert from 'node:assert/strict'
import { countryName, deskWorldIndex, visitorDesk } from './home-desk'
import { COUNTRY_IDS, MARKETS } from '@/lib/markets'
import { cityFact } from '@/lib/countries/costs'
import { LANGS } from '@/lib/i18n/core'

// ── Garbage in → null out. The UI must fall back to the world index, never guess.
for (const bad of [null, undefined, '', ' ', 'X', 'GEO', '12', 'zz']) {
  const desk = visitorDesk(bad as string | null, 'en')
  assert.ok(desk === null || desk.cc === 'ZZ', `bad ISO must not resolve: ${String(bad)}`)
}
assert.equal(visitorDesk('zz', 'en')?.cc ?? null, null, 'unassigned ISO resolves to nothing')

// ── Deep market: hub + verified costs + only shipped city URLs.
const de = visitorDesk('de', 'en')
assert.ok(de, 'DE must resolve')
assert.equal(de!.state, 'deep')
assert.equal(de!.hubPath, '/de')
assert.equal(de!.currency, 'EUR')
assert.ok(de!.cities.length > 0, 'DE cities')
assert.ok(de!.cost, 'DE has a verified cost model')
assert.ok(de!.cost!.totalPct > 0 && de!.cost!.totalPct < 40, `plausible DE buyer surcharge: ${de!.cost!.totalPct}`)
assert.match(de!.cost!.asOf, /^\d{4}$/, 'asOf is a year')

// Lowercase, whitespace and mixed case all normalize to the same desk.
assert.deepEqual(visitorDesk(' De ', 'en'), de)

// ── No dead URLs: every linked city path is a slug the market actually ships.
for (const cc of ['de', 'ae', 'fr', 'es', 'gb', 'us', 'jp', 'br', 'za', 'ge']) {
  const desk = visitorDesk(cc, 'en')
  if (!desk) continue
  for (const city of desk.cities) {
    assert.ok(city.searchHref.startsWith('/search?'), `search href: ${cc}/${city.slug}`)
    assert.ok(city.name.length > 0, `city name: ${cc}/${city.slug}`)
    if (!city.href) continue
    const id = COUNTRY_IDS.find((x) => MARKETS[x].pathPrefix === `/${cc}`)
    assert.ok(id, `linked city on a non-launched market: ${cc}`)
    assert.equal(city.href, `/${cc}/${city.slug}`)
    assert.ok(
      MARKETS[id!].citySlugs.includes(city.slug),
      `city URL not shipped by the market: ${city.href}`,
    )
  }
}

// ── Non-launched countries never claim a hub or a cost model.
for (const cc of ['MN', 'BT', 'FJ', 'TD']) {
  const desk = visitorDesk(cc, 'en')
  if (!desk) continue
  assert.equal(desk.hubPath, null, `no hub for ${cc}`)
  assert.equal(desk.cost, null, `no invented cost table for ${cc}`)
  assert.ok(desk.state === 'pinned' || desk.state === 'discovery', `state for ${cc}`)
  assert.ok(desk.searchHref.includes(cc), 'search still works')
  for (const city of desk.cities) assert.equal(city.href, null, `no hub URL for ${cc}/${city.slug}`)
}

// ── Every UI language yields a non-empty, non-code country name.
for (const lang of LANGS) {
  for (const cc of ['DE', 'GE', 'AE', 'JP']) {
    const n = countryName(cc, lang)
    assert.ok(n.length > 1 && n !== cc, `country name ${cc}/${lang}: ${n}`)
  }
}
assert.equal(countryName('GE', 'ka'), 'საქართველო')
assert.equal(countryName('TR', 'en'), 'Türkiye')

// ── World index: every launched market appears exactly once, chips honest.
const index = deskWorldIndex('en')
const rows = index.flatMap((r) => r.countries)
assert.equal(rows.length, COUNTRY_IDS.length, 'every launched market is indexed once')
assert.equal(new Set(rows.map((r) => r.id)).size, rows.length, 'no duplicate markets')
for (const row of rows) {
  assert.equal(row.path, MARKETS[row.id].pathPrefix)
  assert.equal(row.currency, MARKETS[row.id].currency)
  assert.ok(row.cities > 0, `market with no cities: ${row.id}`)
  const verified = cityFact(row.id).chip !== '—'
  assert.equal(row.chip !== null, verified, `chip must mirror verification: ${row.id}`)
}
assert.ok(index.length >= 4, 'markets span several regions')
assert.ok(
  index.every((r) => r.region.length > 0),
  'no empty region bucket',
)
// Biggest region first — the grid reads widest-to-narrowest.
for (let i = 1; i < index.length; i++) {
  assert.ok(
    index[i - 1]!.countries.length >= index[i]!.countries.length,
    'regions ordered by market count',
  )
}

const modelled = rows.filter((r) => r.chip).length
console.log(
  `home-desk.check: ${rows.length} markets / ${index.length} regions / ${modelled} verified cost chips ✓`,
)
