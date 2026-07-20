import assert from 'node:assert/strict'
import { mapSearchHit } from './map-search-hit'

const hit = mapSearchHit({
  id: 'clx1',
  title: 'Test',
  city: 'თბილისი',
  district: 'ვაკე',
  dealType: 'sale',
  propertyType: 'apartment',
  price: 270000,
  currency: 'GEL',
  area: 80,
  rooms: 3,
  images: ['/images/p1.webp'],
  trustScore: 88,
  createdAt: '2026-01-01T00:00:00.000Z',
  lat: 41.7,
  lng: 44.8,
})

assert.equal(hit.id, 'clx1')
assert.equal(hit.propType, 'apartment')
assert.equal(hit.dealType, 'sale')
assert.ok(hit.priceGEL > 0)
assert.equal(hit.img, '/images/p1.webp')
assert.equal(hit.ai.score, 88)

console.log('map-search-hit: ok')
