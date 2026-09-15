import assert from 'node:assert/strict'
import {
  COUNTRY_IDS,
  COUNTRY_ALIAS,
  MARKETS,
  GLOBAL_MARKET,
  isCountryPath,
  countryFromPath,
  isCountryAlias,
  isComPageSeg,
  countryBasePath,
  intentHref,
  isPathCountry,
  countryIsoForMarket,
  marketFromIso,
  listingOrigin,
  listingCanonicalPath,
  MARKET_COUNTRY_ISOS,
  findCountryByCity,
  countryCitySet,
  isCountryCity,
  countryHref,
  intentToDeal,
  canonicalIntent,
  parseCountryPath,
  chromeMarket,
  COM_ORIGIN,
  GE_ORIGIN,
  type PathCountryId,
} from './markets'

console.log('markets.check: starting validation...')

// PathCountryId type check & isPathCountry validator
const sampleCountryId: PathCountryId = 'de'
assert.equal(isPathCountry(sampleCountryId), true)
assert.equal(isPathCountry('invalid-xyz'), false)


// 1. Structural assertions on COUNTRY_IDS & MARKETS
assert.ok(COUNTRY_IDS.length >= 70, `Expected >= 70 countries, got ${COUNTRY_IDS.length}`)
const countrySet = new Set(COUNTRY_IDS)
assert.equal(countrySet.size, COUNTRY_IDS.length, 'COUNTRY_IDS must have unique elements')

// Georgia root check
assert.equal(MARKETS.ge.id, 'ge')
assert.equal(MARKETS.ge.canonicalOrigin, GE_ORIGIN)
assert.equal(MARKETS.ge.currency, 'GEL')

// Every path country must exist in MARKETS and have valid attributes
for (const cid of COUNTRY_IDS) {
  const m = MARKETS[cid]
  assert.ok(m, `MARKETS missing entry for ${cid}`)
  assert.equal(m.id, cid)
  assert.equal(m.canonicalOrigin, COM_ORIGIN)
  assert.equal(m.pathPrefix, `/${cid}`)
  assert.ok(m.currency, `${cid} missing currency`)
  assert.ok(m.locale, `${cid} missing locale`)
  assert.ok(m.defaultCitySlug, `${cid} missing defaultCitySlug`)
  assert.ok(m.citySlugs.length > 0, `${cid} citySlugs should not be empty`)
  assert.ok(
    m.citySlugs.includes(m.defaultCitySlug),
    `${cid} defaultCitySlug (${m.defaultCitySlug}) must be present in citySlugs`,
  )
  for (const intentCity of m.intentCities) {
    assert.ok(
      m.citySlugs.includes(intentCity),
      `${cid} intentCity (${intentCity}) must be present in citySlugs`,
    )
  }
}

// 2. Global market
assert.equal(GLOBAL_MARKET.id, 'global')
assert.equal(GLOBAL_MARKET.currency, 'USD')
assert.equal(GLOBAL_MARKET.canonicalOrigin, COM_ORIGIN)

// 3. Path detection & parsing
assert.equal(isCountryPath('/de'), true)
assert.equal(isCountryPath('/de/berlin'), true)
assert.equal(isCountryPath('/de/berlin/buy'), true)
assert.equal(isCountryPath('/georgia'), false)
assert.equal(isCountryPath('/about'), false)

assert.equal(countryFromPath('/de/berlin'), 'de')
assert.equal(countryFromPath('/ae/dubai/rent'), 'ae')
assert.equal(countryFromPath('/unknown/path'), null)

// 4. Aliases and Com Pages
assert.equal(isCountryAlias('uae'), true)
assert.equal(isCountryAlias('uk'), true)
assert.equal(isCountryAlias('us'), false)
assert.equal(COUNTRY_ALIAS.uae, 'ae')
assert.equal(COUNTRY_ALIAS.uk, 'gb')

assert.equal(isComPageSeg('about'), true)
assert.equal(isComPageSeg('listing'), true)
assert.equal(isComPageSeg('non-existent'), false)

// 5. countryBasePath
assert.equal(countryBasePath('de', '/de/berlin'), '/de')
assert.equal(countryBasePath('de', '/en/de/berlin'), '/en/de')
assert.equal(countryBasePath('de', '/de/de/berlin'), '/de/de')
assert.equal(countryBasePath('ae', '/ar/ae/dubai'), '/ar/ae')

// 6. intentHref logic
assert.equal(intentHref('de', 'berlin', 'buy'), '/de/berlin/buy')
assert.equal(intentHref('de', 'berlin', 'rent'), '/de/berlin/rent')
// Non-intent city falls back to city hub
assert.equal(intentHref('de', 'bonn', 'buy'), '/de/bonn')
// German locale with DE
assert.equal(intentHref('de', 'berlin', 'buy', 'de'), '/de/de/berlin/buy')

// 7. ISO and Market conversions
assert.equal(countryIsoForMarket('global'), undefined)
assert.equal(countryIsoForMarket('ge'), 'GE')
assert.equal(countryIsoForMarket('de'), 'DE')
assert.equal(countryIsoForMarket('ae'), 'AE')

assert.equal(marketFromIso('GE'), 'ge')
assert.equal(marketFromIso('DE'), 'de')
assert.equal(marketFromIso('ae'), 'ae')
assert.equal(marketFromIso(''), null)
assert.equal(marketFromIso(null), null)
assert.equal(marketFromIso('UNKNOWN_ISO'), null)

assert.ok(MARKET_COUNTRY_ISOS.has('GE'))
assert.ok(MARKET_COUNTRY_ISOS.has('DE'))
assert.ok(MARKET_COUNTRY_ISOS.has('AE'))
assert.ok(MARKET_COUNTRY_ISOS.has('US'))

// 8. Reverse lookup by city
assert.equal(findCountryByCity('berlin'), 'de')
assert.equal(findCountryByCity('dubai'), 'ae')
assert.equal(findCountryByCity('tokyo'), 'jp')
assert.equal(findCountryByCity('paris'), 'fr')
assert.equal(findCountryByCity('unknown-city-slug-xyz'), null)

assert.ok(isCountryCity('de', 'berlin'))
assert.ok(countryCitySet('de').has('hamburg'))
assert.ok(!isCountryCity('de', 'paris'))

// 9. Links & Paths
assert.equal(countryHref('de'), '/de')
assert.equal(countryHref('de', 'berlin'), '/de/berlin')
assert.equal(countryHref('de', '/berlin'), '/de/berlin')

assert.equal(listingOrigin('GE'), GE_ORIGIN)
assert.equal(listingOrigin('DE'), COM_ORIGIN)
assert.equal(listingCanonicalPath('/listing/123', 'GE'), '/listing/123')
assert.equal(listingCanonicalPath('/listing/123', 'DE'), '/en/listing/123')

// 10. Intents
assert.equal(intentToDeal('buy'), 'sale')
assert.equal(intentToDeal('sale'), 'sale')
assert.equal(intentToDeal('rent'), 'rent')
assert.equal(intentToDeal('other'), null)

assert.equal(canonicalIntent('buy'), 'buy')
assert.equal(canonicalIntent('sale'), 'buy')
assert.equal(canonicalIntent('rent'), 'rent')
assert.equal(canonicalIntent('other'), null)

// 11. parseCountryPath & chromeMarket
const p1 = parseCountryPath('/de/berlin/buy')
assert.deepEqual(p1, { country: 'de', city: 'berlin', intent: 'buy' })

const p2 = parseCountryPath('/en/de/hamburg')
assert.deepEqual(p2, { country: 'de', city: 'hamburg', intent: undefined })

const p3 = parseCountryPath('/about')
assert.equal(p3, null)

assert.equal(chromeMarket('/de/berlin'), 'de')
assert.equal(chromeMarket('/search', 'DE'), 'de')
assert.equal(chromeMarket('/search', 'ALL'), 'global')
assert.equal(chromeMarket('/'), 'ge')

console.log('markets.check: all assertions passed ✓')
