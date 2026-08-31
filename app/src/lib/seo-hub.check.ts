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

// Pledge × land: combo has no listings, so the mapper walks up the fallback
// chain and bottoms out at the /pledge hub (which DOES carry listings).
assert.equal(
  listingHubPath({ dealType: 'pledge', propType: 'land', city: 'თბილისი', district: 'ვაკე' }),
  '/pledge',
)

const dailySab = listingHubPath({
  dealType: 'daily',
  propType: 'apartment',
  city: 'თბილისი',
  district: 'საბურთალო',
})
assert.ok(dailySab?.startsWith('/daily'), 'daily saburtalo maps to a daily hub')
assert.ok(
  (listingHubAnchor({
    dealType: 'daily',
    propType: 'apartment',
    city: 'თბილისი',
    district: 'საბურთალო',
  }) ?? '').includes('დღიურად'),
  'daily saburtalo anchor keeps the query word',
)

console.log('seo-hub: 5/5 ✓')
