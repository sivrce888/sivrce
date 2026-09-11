/**
 * Runnable check: npx tsx src/lib/country-copy.check.ts
 */
import assert from 'node:assert/strict'
import { COUNTRY_IDS, MARKETS, parseCountryPath } from './markets'
import {
  AE_CITIES,
  AE_HUB,
  AE_HUB_AR,
  COUNTRY_HUBS,
  DE_BERLIN_BUY_DE,
  DE_CITIES,
  DE_HUB,
  DE_HUB_DE,
  cityPack,
  countrySitemapPaths,
  heroPair,
} from './country-copy'

assert.ok(DE_HUB.lede.length > 80)
assert.ok(DE_HUB.body.length >= 2)
assert.ok(DE_HUB.faqs.length >= 2)
assert.ok(AE_HUB.lede.length > 80)
assert.ok(AE_HUB_AR.lede.length > 40)
assert.ok(DE_CITIES.berlin?.buy && DE_CITIES.berlin.rent)
assert.ok(AE_CITIES.dubai?.buy && AE_CITIES.dubai.rent)

for (const slug of MARKETS.de.citySlugs) {
  const pack = DE_CITIES[slug]
  assert.ok(pack, `missing DE copy for ${slug}`)
  assert.ok(pack.hub.lede.length > 60, `thin DE lede ${slug}`)
  assert.ok(pack.hub.body.length >= 2, `thin DE body ${slug}`)
  assert.ok(pack.hub.faqs.length >= 2, `DE faqs ${slug}`)
}

for (const slug of MARKETS.ae.citySlugs) {
  assert.ok(AE_CITIES[slug], `missing AE copy for ${slug}`)
}

const LAUNCHED = COUNTRY_IDS
const ledes: string[] = []
for (const cc of LAUNCHED) {
  const hub = COUNTRY_HUBS[cc]
  assert.ok(hub?.lede.length > 80, `thin ${cc} hub lede`)
  assert.ok(hub.body.length >= 2, `thin ${cc} hub body`)
  assert.ok(hub.faqs.length >= 2, `thin ${cc} hub faqs`)
  ledes.push(hub.lede)
  for (const slug of MARKETS[cc].citySlugs) {
    const pack = cityPack(cc, slug)
    assert.ok(pack, `missing ${cc} copy for ${slug}`)
    assert.ok(pack.hub.lede.length > 60, `thin ${cc} lede ${slug}`)
    assert.ok(pack.hub.body.length >= 2, `thin ${cc} body ${slug}`)
    assert.ok(pack.hub.faqs.length >= 2, `${cc} faqs ${slug}`)
    ledes.push(pack.hub.lede)
  }
  const paths = countrySitemapPaths(cc)
  assert.ok(paths[0] === MARKETS[cc].pathPrefix, `${cc} hub path`)
}
assert.equal(ledes.length, new Set(ledes).size, 'country ledes must be unique')

// Intent pages must be real copy, not a renamed city hub.
const intentLedes: string[] = []
for (const cc of COUNTRY_IDS) {
  for (const slug of MARKETS[cc].intentCities) {
    const pack = cityPack(cc, slug)!
    for (const [kind, copy] of [['buy', pack.buy!], ['rent', pack.rent!]] as const) {
      assert.ok(copy.lede.length > 80, `thin ${cc}/${slug}/${kind} lede`)
      assert.ok(copy.body.length >= 2, `thin ${cc}/${slug}/${kind} body`)
      assert.ok(copy.faqs.length >= 2, `${cc}/${slug}/${kind} faqs`)
      assert.notEqual(copy.lede, pack.hub.lede, `${cc}/${slug}/${kind} reuses the hub lede`)
      intentLedes.push(copy.lede)
    }
  }
}
assert.equal(intentLedes.length, new Set(intentLedes).size, 'intent ledes must be unique')

const dePaths = countrySitemapPaths('de')
assert.ok(dePaths.includes('/de'))
assert.ok(dePaths.includes('/de/berlin'))
assert.ok(dePaths.includes('/de/berlin/buy'))
assert.ok(!dePaths.includes('/de/berlin/sale'))
assert.ok(countrySitemapPaths('ae').includes('/ae/dubai'))

assert.deepEqual(heroPair('Real estate in Germany'), { lead: 'Real estate', place: 'in Germany' })
assert.deepEqual(heroPair('Immobilien in Deutschland'), { lead: 'Immobilien', place: 'in Deutschland' })
assert.deepEqual(heroPair('Kaufen in Berlin'), { lead: 'Kaufen', place: 'in Berlin' })
assert.deepEqual(heroPair('Mieten in Berlin'), { lead: 'Mieten', place: 'in Berlin' })
assert.ok(DE_HUB_DE.lede !== DE_HUB.lede)
assert.ok(DE_HUB_DE.body.length >= 2)
assert.ok(DE_BERLIN_BUY_DE.h1.includes('Kaufen'))
assert.deepEqual(heroPair('Berlin real estate'), { lead: 'Berlin', place: 'real estate' })
assert.deepEqual(heroPair('Buy in Dubai'), { lead: 'Buy', place: 'in Dubai' })
assert.deepEqual(parseCountryPath('/de/berlin/buy'), { country: 'de', city: 'berlin', intent: 'buy' })
assert.deepEqual(parseCountryPath('/en/de/berlin'), { country: 'de', city: 'berlin', intent: undefined })
assert.deepEqual(parseCountryPath('/ae'), { country: 'ae', city: undefined, intent: undefined })
assert.equal(parseCountryPath('/sale'), null)

// intentHref never links a dead URL: intentCities must exactly match the
// cities whose cityPack carries buy/rent copy (single source of truth).
for (const cc of COUNTRY_IDS) {
  const withIntent = MARKETS[cc].citySlugs.filter((s) => {
    const pack = cityPack(cc, s)
    return !!pack?.buy && !!pack?.rent
  })
  assert.deepEqual([...MARKETS[cc].intentCities].sort(), [...withIntent].sort(), `intentCities drift: ${cc}`)
  for (const s of MARKETS[cc].intentCities) {
    assert.ok(MARKETS[cc].citySlugs.includes(s), `intentCities ⊆ citySlugs: ${cc}/${s}`)
  }
}

console.log(`country-copy.check: ${LAUNCHED.length} launched markets, ${ledes.length} unique pages ok`)
