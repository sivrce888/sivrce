/**
 * Runnable check: npx tsx src/data/world-countries.check.ts
 * ISO list gate — typo in a code silently drops a country from the OS.
 */
import assert from 'node:assert/strict'
import { ISO_COUNTRY_CODES } from './world-countries'

assert.equal(ISO_COUNTRY_CODES.length, 249, `ISO count drift: ${ISO_COUNTRY_CODES.length}`)
assert.equal(new Set(ISO_COUNTRY_CODES).size, 249, 'dup ISO code')
for (const cc of ISO_COUNTRY_CODES) {
  assert.match(cc, /^[A-Z]{2}$/, `bad code: ${cc}`)
}
const sorted = [...ISO_COUNTRY_CODES].sort()
assert.deepEqual([...ISO_COUNTRY_CODES], sorted, 'codes not sorted')
// Spot checks: commonly-confused assignments + every deep-market currency zone.
for (const cc of [
  'GE', 'DE', 'GB', 'CX', 'BQ', 'XK',
  'AE', 'FR', 'ES', 'IT', 'US', 'CA', 'TR', 'GR', 'CY', 'NL', 'PT', 'CH',
]) {
  if (cc === 'XK') {
    assert.ok(!ISO_COUNTRY_CODES.includes('XK' as never), 'XK is not ISO')
  } else {
    assert.ok(ISO_COUNTRY_CODES.includes(cc as never), `missing ISO code: ${cc}`)
  }
}

console.log(`world-countries.check: ${ISO_COUNTRY_CODES.length} ISO codes ok`)
