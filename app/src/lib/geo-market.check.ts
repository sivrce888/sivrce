/**
 * Runnable check: npx tsx src/lib/geo-market.check.ts
 */
import assert from 'node:assert/strict'
import { COUNTRY_IDS } from './markets'
import {
  GEO_COOKIE,
  GEO_LAUNCH,
  geoHomePath,
  isGeoLaunch,
  marketCenter,
  marketFromIso,
} from './geo-market'

assert.equal(GEO_COOKIE, 'sv-geo-market')
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
assert.equal(marketCenter('de').slug, 'berlin')
assert.equal(marketCenter('ae').slug, 'dubai')
assert.equal(marketCenter('fr').slug, 'paris')
assert.equal(marketCenter('ge').slug, 'tbilisi')
assert.ok(Math.abs(marketCenter('de').lat - 52.52) < 0.01)
assert.ok(marketCenter('ae').lng > 50)
assert.deepEqual([...GEO_LAUNCH], [...COUNTRY_IDS])

console.log('geo-market.check: ok')
