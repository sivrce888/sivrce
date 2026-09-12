/**
 * Runnable check: npx tsx src/data/world-neighborhoods.check.ts
 * Verifies hood data integrity + full path resolvability for /{cc}/{city}/{hood}
 * pages (CountryMarket hoods). Top-10 markets (GE DE AE US GB ES FR TR CY GR)
 * must each have committed premium districts.
 */
import assert from 'node:assert/strict'
import { WORLD_NEIGHBORHOODS, hoodsByCity, hoodBySlug } from './world-neighborhoods'
import { MARKETS, COUNTRY_IDS, type PathCountryId } from '../lib/markets'
import { cityPack, countrySitemapPaths } from '../lib/country-copy'

const TOP10 = ['GE', 'DE', 'AE', 'US', 'GB', 'ES', 'FR', 'TR', 'CY', 'GR'] as const

// 1. Row integrity — every field a page renders must be present.
for (const n of WORLD_NEIGHBORHOODS) {
  assert.ok(n.slug && /^[a-z0-9-]+$/.test(n.slug), `Bad slug: ${n.slug}`)
  assert.ok(n.city && n.cc, `Missing city/cc: ${n.slug}`)
  assert.ok(n.en && n.ka, `Missing en/ka name: ${n.slug}`)
  assert.ok(Math.abs(n.lat) <= 90 && Math.abs(n.lng) <= 180, `Bad coords: ${n.slug}`)
  assert.ok(n.avgPricePerSqm === undefined || n.avgPricePerSqm > 0, `Bad price: ${n.slug}`)
  assert.ok(n.highlights.length >= 3, `Need ≥3 highlights: ${n.slug}`)
}

// 2. Slugs globally unique (URL space is flat per city but slugs double as keys).
{
  const seen = new Set<string>()
  for (const n of WORLD_NEIGHBORHOODS) {
    assert.ok(!seen.has(n.slug), `Duplicate slug: ${n.slug}`)
    seen.add(n.slug)
  }
}

// 3. Every top-10 market has committed hoods, on the country its market routes serve.
//    GE is the exception — Georgia's catalog lives on sivrce.ge (own neighborhoods system).
for (const cc of TOP10) {
  const total = WORLD_NEIGHBORHOODS.filter((n) => n.cc === cc).length
  assert.ok(total >= 3, `Top-10 ${cc} has too few hoods: ${total}`)
  if (cc === 'GE') continue
  const market = (Object.keys(MARKETS) as PathCountryId[]).find(
    (id) => MARKETS[id].countryCode === cc && COUNTRY_IDS.includes(id),
  )
  assert.ok(market, `No live market serves top-10 country ${cc}`)
}

// 4. Every hood resolves end-to-end through a market city pack → sitemap path exists.
//    (DE Berlin excluded — /de/berlin/[bezirk] owns that URL space.)
let resolved = 0
for (const n of WORLD_NEIGHBORHOODS) {
  const market = (Object.keys(MARKETS) as PathCountryId[]).find(
    (id) => MARKETS[id].countryCode === n.cc && COUNTRY_IDS.includes(id),
  )
  if (!market) continue
  for (const slug of MARKETS[market].citySlugs) {
    const pack = cityPack(market, slug)
    if (!pack || pack.name !== n.city) continue
    if (market === 'de' && slug === 'berlin') continue
    const hood = hoodBySlug(n.cc, n.city, n.slug)
    assert.ok(hood, `Resolver lost hood: ${n.slug}`)
    const prefix = MARKETS[market].pathPrefix
    assert.ok(
      countrySitemapPaths(market).includes(`${prefix}/${slug}/${n.slug}`),
      `Sitemap missing hood path: ${prefix}/${slug}/${n.slug}`,
    )
    resolved += 1
    break
  }
}

// 5. hoodsByCity grouping matches flat filter.
const ae = hoodsByCity('AE', 'Dubai')
assert.ok(ae.length >= 4, `Dubai hoods lost: ${ae.length}`)
assert.ok(ae.every((n) => n.cc === 'AE' && n.city === 'Dubai'))

assert.ok(resolved >= 60, `Too few hoods routed through market packs: ${resolved}/${WORLD_NEIGHBORHOODS.length}`)
console.log(`world-neighborhoods.check: OK — ${WORLD_NEIGHBORHOODS.length} hoods, ${resolved} routed`)
