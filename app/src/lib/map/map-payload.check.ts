/**
 * The map payload is public, CDN-cached and thousands of rows wide. This check
 * fails the build if a field creeps back into it — gallery/features are bytes
 * on every phone, and `agent` would publish phone numbers in one scrapeable
 * document. It also pins the two fields that keep pin links off a 308.
 */
import assert from 'node:assert/strict'

import { rowToMapListing } from '@/lib/map/db-buildings'

const row = {
  id: 'l1',
  publicId: 10_000_042,
  country: 'DE',
  title: 'Altbau am Park',
  dealType: 'buy',
  propertyType: 'apartment',
  price: 100,
  currency: 'USD',
  pricePerSqm: 1.25,
  rooms: 3,
  bedrooms: 2,
  bathrooms: 1,
  area: 80,
  floor: 4,
  totalFloors: 7,
  city: 'Berlin',
  district: 'Mitte',
  address: 'Torstrasse 1',
  lat: 52.52,
  lng: 13.405,
  images: ['/a.webp', '/b.webp', '/c.webp'],
  features: [],
  views: 0,
  trustScore: 0,
  tier: 'standard',
  tierExpiresAt: null,
  extendedFields: null,
  agent: {},
  createdAt: new Date('2026-09-01T00:00:00Z'),
  listingLocation: null,
}

const pin = rowToMapListing(row)
const keys = new Set(Object.keys(pin))

for (const banned of ['agent', 'images', 'features', 'views', 'ai', 'description', 'trustScore']) {
  assert.equal(keys.has(banned), false, `map payload must not carry ${banned}`)
}
// Canonical listing URL needs both, or every pin click costs a redirect.
assert.equal(pin.publicId, 10_000_042)
assert.equal(pin.country, 'DE')
// One card image, never the gallery.
assert.equal(pin.img, '/a.webp')
// USD rows are converted once, server-side — the map speaks GEL.
assert.equal(pin.priceGEL, 270)
assert.equal(pin.dealType, 'sale')
assert.equal(pin.postedAt, '2026-09-01')
assert.deepEqual(pin.coords, { lat: 52.52, lng: 13.405 })

console.log('map-payload: pin projection stays slim ✓')
