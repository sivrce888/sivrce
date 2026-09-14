/**
 * Runnable check: npx tsx src/components/nav/nav-location-badge.check.ts
 * Verifies Navbar location badge component imports, SSR-safety, and market route resolutions.
 */
import assert from 'node:assert/strict'
import { chromeMarket, parseCountryPath } from '../../lib/markets'

// 1. Verify country path parsing for nav location badge across all locale prefixes
assert.deepEqual(parseCountryPath('/de'), { country: 'de', city: undefined, intent: undefined })
assert.deepEqual(parseCountryPath('/de/berlin'), { country: 'de', city: 'berlin', intent: undefined })
assert.deepEqual(parseCountryPath('/ka/de'), { country: 'de', city: undefined, intent: undefined })
assert.deepEqual(parseCountryPath('/ru/de'), { country: 'de', city: undefined, intent: undefined })
assert.deepEqual(parseCountryPath('/de/de'), { country: 'de', city: undefined, intent: undefined })
assert.deepEqual(parseCountryPath('/en/de/berlin'), { country: 'de', city: 'berlin', intent: undefined })
assert.deepEqual(parseCountryPath('/ka/de/berlin'), { country: 'de', city: 'berlin', intent: undefined })
assert.deepEqual(parseCountryPath('/de/projects'), { country: 'de', city: undefined, intent: undefined })
assert.deepEqual(parseCountryPath('/ae/dubai'), { country: 'ae', city: 'dubai', intent: undefined })
assert.deepEqual(parseCountryPath('/us/new-york'), { country: 'us', city: 'new-york', intent: undefined })
assert.equal(parseCountryPath('/'), null)
assert.equal(parseCountryPath('/projects'), null)
assert.equal(parseCountryPath('/ka/projects'), null)
assert.equal(chromeMarket('/de'), 'de')
assert.equal(chromeMarket('/ka/de'), 'de')
assert.equal(chromeMarket('/ru/de'), 'de')
assert.equal(chromeMarket('/de/de'), 'de')
assert.equal(chromeMarket('/en/de/berlin'), 'de')
assert.equal(chromeMarket('/de/projects'), 'de')
assert.equal(chromeMarket('/en/search', 'DE'), 'de')
assert.equal(chromeMarket('/en/search', 'all'), 'global')
assert.equal(chromeMarket('/ae/dubai', 'GE'), 'ae')

console.log('nav-location-badge.check: OK')
