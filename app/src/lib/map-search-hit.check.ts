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

const fat = mapSearchHit({
  ...{
    id: 'clx2',
    title: 'Fat',
    city: 'თბილისი',
    district: 'ვაკე',
    dealType: 'sale',
    propertyType: 'apartment',
    price: 1,
    currency: 'GEL',
    area: 80,
    rooms: 3,
    images: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
    createdAt: '2026-01-01T00:00:00.000Z',
    lat: 41.7,
    lng: 44.8,
  },
})
assert.equal(fat.images.length, 4)
assert.equal(fat.photoCount, 7)

const sliced = mapSearchHit({
  id: 'clx3',
  title: 'Sliced',
  city: 'თბილისი',
  district: 'ვაკე',
  dealType: 'sale',
  propertyType: 'apartment',
  price: 1,
  currency: 'GEL',
  area: 80,
  rooms: 3,
  images: ['a', 'b', 'c', 'd'],
  photoCount: 11,
  createdAt: '2026-01-01T00:00:00.000Z',
  lat: 41.7,
  lng: 44.8,
})
assert.equal(sliced.images.length, 4)
assert.equal(sliced.photoCount, 11)

console.log('map-search-hit: ok')
