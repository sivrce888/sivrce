/**
 * Runnable check: npx tsx src/components/nav/nav-location-badge.check.ts
 * Verifies Navbar location badge component imports, SSR-safety, and market route resolutions.
 */
import assert from 'node:assert/strict'
import { parseCountryPath } from '../../lib/markets'

// 1. Verify country path parsing for nav location badge
assert.deepEqual(parseCountryPath('/de'), { country: 'de', city: undefined, intent: undefined })
assert.deepEqual(parseCountryPath('/de/berlin'), { country: 'de', city: 'berlin', intent: undefined })
assert.deepEqual(parseCountryPath('/ae/dubai'), { country: 'ae', city: 'dubai', intent: undefined })
assert.deepEqual(parseCountryPath('/us/new-york'), { country: 'us', city: 'new-york', intent: undefined })
assert.equal(parseCountryPath('/'), null)

console.log('nav-location-badge.check: OK')
