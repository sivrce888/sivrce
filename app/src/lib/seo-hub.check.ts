/**
 * Runnable self-check for the listing→hub reverse mapper.
 * Run: npx tsx src/lib/seo-hub.check.ts
 */
import assert from 'node:assert/strict'
import { listingHubPath, listingHubAnchor } from './seo-pages'

// Vake apartment for sale → deepest real hub + matching <h1>
assert.equal(
  listingHubPath({ dealType: 'sale', propType: 'apartment', city: 'თბილისი', district: 'ვაკე' }),
  '/sale/apartments/tbilisi/vake',
)
assert.equal(
  listingHubAnchor({ dealType: 'sale', propType: 'apartment', city: 'თბილისი', district: 'ვაკე' }),
  'ბინები იყიდება ვაკეში',
)

// Unknown district → falls back to city hub
assert.equal(
  listingHubPath({ dealType: 'sale', propType: 'apartment', city: 'თბილისი', district: 'XXX' }),
  '/sale/apartments/tbilisi',
)

// Pledge × land combo with no listings → null (UI falls back to /search)
assert.equal(
  listingHubPath({ dealType: 'pledge', propType: 'land', city: 'თბილისი', district: 'ვაკე' }),
  null,
)
assert.equal(
  listingHubAnchor({ dealType: 'pledge', propType: 'land', city: 'თბილისი', district: 'ვაკე' }),
  null,
)

console.log('seo-hub: 4/4 ✓')
