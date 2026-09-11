/**
 * Runnable check: npx tsx src/lib/geo-market.check.ts
 */
import assert from 'node:assert/strict'
import { COUNTRY_IDS, countryBasePath, intentHref } from './markets'
import {
  GEO_COOKIE,
  GEO_LAUNCH,
  geoHomePath,
  geoLaunchTarget,
  isCrawler,
  isGeoLaunch,
  marketCenter,
  marketFromIso,
} from './geo-market'

assert.equal(GEO_COOKIE, 'sv-geo-v2')
assert.equal(marketFromIso('DE'), 'de')
assert.equal(marketFromIso('ae'), 'ae')
assert.equal(marketFromIso('GE'), 'ge')
assert.equal(marketFromIso('FR'), 'fr')
assert.equal(marketFromIso('GB'), 'gb')
assert.equal(marketFromIso('US'), 'us')
assert.equal(marketFromIso(null), null)
assert.equal(isGeoLaunch('de'), true)
assert.equal(isGeoLaunch('fr'), true)
assert.equal(isGeoLaunch('ge'), false)
assert.equal(geoHomePath('de'), '/de')
assert.equal(geoHomePath('ae'), '/ae')
assert.equal(geoHomePath('gb'), '/gb')
assert.equal(geoHomePath('de', 'Berlin'), '/de/berlin')
assert.equal(geoHomePath('de', 'berlin'), '/de/berlin')
assert.equal(geoHomePath('de', 'Köln'), '/de/cologne')
assert.equal(geoHomePath('de', 'M%C3%BCnchen'), '/de/munich')
assert.equal(geoHomePath('us', 'New%20York'), '/us/new-york')
assert.equal(geoHomePath('de', 'Tbilisi'), '/de')
assert.equal(geoHomePath('fr', 'Lyon'), '/fr/lyon')
assert.equal(geoHomePath('ae', 'nowhere'), '/ae')
assert.equal(marketCenter('de').slug, 'berlin')
assert.equal(marketCenter('ae').slug, 'dubai')
assert.equal(marketCenter('fr').slug, 'paris')
assert.equal(marketCenter('ge').slug, 'tbilisi')
assert.ok(Math.abs(marketCenter('de').lat - 52.52) < 0.01)
assert.ok(marketCenter('ae').lng > 50)
assert.deepEqual([...GEO_LAUNCH], [...COUNTRY_IDS])

assert.equal(geoLaunchTarget({ crawler: true, iso: 'DE' }), 'hub')
assert.equal(geoLaunchTarget({ worldwide: true, iso: 'DE' }), 'hub')
assert.equal(geoLaunchTarget({ cookie: 'global', iso: 'DE' }), 'hub')
assert.equal(geoLaunchTarget({ cookie: 'de' }), 'de')
assert.equal(geoLaunchTarget({ cookie: 'ge' }), 'ge')
assert.equal(geoLaunchTarget({ iso: 'DE' }), 'de')
assert.equal(geoLaunchTarget({ iso: 'GE' }), 'ge')
assert.equal(geoLaunchTarget({ iso: 'FR' }), 'fr')
assert.equal(geoLaunchTarget({ iso: 'XX' }), 'hub')
assert.equal(geoLaunchTarget({}), 'hub')
assert.equal(isCrawler('Mozilla/5.0 (compatible; Googlebot/2.1)'), true)
assert.equal(isCrawler('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0)'), false)

// locale-prefixed country roots survive a hop (preview /en/de, .com /de/de)
assert.equal(countryBasePath('de', '/de'), '/de')
assert.equal(countryBasePath('de', '/de/berlin'), '/de')
assert.equal(countryBasePath('de', '/en/de/berlin'), '/en/de')
assert.equal(countryBasePath('de', '/de/de/berlin/buy'), '/de/de')
assert.equal(countryBasePath('de', '/ar/de'), '/ar/de')
// no false positive: /deals is not the /de country root
assert.equal(countryBasePath('de', '/en/deals'), '/de')
assert.equal(intentHref('de', 'berlin', 'buy', 'en', '/en/de/berlin'), '/en/de/berlin/buy')
assert.equal(intentHref('de', 'berlin', 'rent', 'de', '/de/de'), '/de/de/berlin/rent')
assert.equal(intentHref('de', 'berlin', 'buy', 'de'), '/de/de/berlin/buy')
assert.equal(intentHref('de', 'berlin', 'buy', 'en'), '/de/berlin/buy')

console.log('geo-market.check: ok')
