/**
 * Self-check: npm run check:geocode
 */
import assert from 'node:assert/strict'
import {
  cityCenter,
  formatGeocodeAddress,
  inGeorgia,
  matchCityKa,
  parseCoords,
  scoreNominatimRow,
  splitStreetHouse,
  normalizeDistrict,
} from './geocode'
import { corpusIdentity, corpusCell } from './corpus'
import {
  geometryRing,
  pickHighlightPolygon,
  ringCentroid,
  snapPick,
} from './pick-building'

assert.equal(inGeorgia(41.7151, 44.8271), true)
assert.equal(inGeorgia(0, 0), false)
assert.equal(inGeorgia(48.8566, 2.3522), false)

assert.deepEqual(parseCoords(41.7, 44.8), { lat: 41.7, lng: 44.8 })
assert.equal(parseCoords(99, 44.8), null)
assert.equal(parseCoords('41', 44), null)

const tb = cityCenter('თბილისი')
// Freedom Square — add-listing / city pin default
assert.ok(Math.abs(tb.lat - 41.69365) < 0.01)
assert.ok(Math.abs(tb.lng - 44.80115) < 0.01)

assert.equal(matchCityKa('Tbilisi'), 'თბილისი')
assert.equal(matchCityKa('თბილისი'), 'თბილისი')
assert.equal(matchCityKa('batumi'), 'ბათუმი')

assert.deepEqual(splitStreetHouse('ილია ჭავჭავაძის გამზირი 47'), {
  street: 'ილია ჭავჭავაძის გამზირი',
  houseNo: '47',
})
assert.deepEqual(splitStreetHouse('Pekin 12ა'), {
  street: 'Pekin',
  houseNo: '12ა',
})

assert.equal(
  formatGeocodeAddress({
    street: 'ჭავჭავაძის',
    houseNo: '47',
    district: 'ვაკე',
    city: 'თბილისი',
    label: 'fallback',
  }),
  'ჭავჭავაძის 47, ვაკე, თბილისი',
)
assert.equal(
  formatGeocodeAddress({ label: 'only label' }),
  'only label',
)

assert.equal(
  normalizeDistrict({ neighbourhood: 'ვაკე', suburb: 'ვაკის რაიონი' }),
  'ვაკე',
)
assert.equal(normalizeDistrict({ suburb: 'ვაკის რაიონი' }), 'ვაკე')
// Digomi: catalog ubani (quarter) beats rayon neighbourhood.
assert.equal(
  normalizeDistrict({
    neighbourhood: 'დიდუბის რაიონი',
    quarter: 'დიღმის მასივი',
  }),
  'დიღმის მასივი',
)

const a = corpusIdentity(41.7151, 44.8271, 'თბილისი')
const b = corpusIdentity(41.7151, 44.8271, 'თბილისი')
assert.equal(a.code, b.code)
assert.equal(a.slug, b.slug)
assert.match(a.code, /^SV-TB-[0-9A-F]{4}$/)

const c = corpusCell(41.7151, 44.8271)
const near = corpusIdentity(41.7151 + 0.0001, 44.8271, 'თბილისი')
const far = corpusIdentity(41.7151 + 0.01, 44.8271, 'თბილისი')
assert.equal(near.cellLat, c.cellLat)
assert.notEqual(far.code, a.code)

// Building apartments beats cafe amenity at same address (live Nominatim pattern).
const cafe = scoreNominatimRow({
  lat: '41.7',
  lon: '44.8',
  class: 'amenity',
  type: 'cafe',
  address: { house_number: '47' },
  importance: 0.2,
})
const bldg = scoreNominatimRow({
  lat: '41.7',
  lon: '44.8',
  class: 'building',
  type: 'apartments',
  addresstype: 'building',
  address: { house_number: '47' },
  importance: 0.05,
})
assert.ok(bldg > cafe, `building ${bldg} should beat cafe ${cafe}`)

assert.ok(
  scoreNominatimRow({
    lat: '41.7',
    lon: '44.8',
    type: 'house',
    address: { house_number: '47' },
    importance: 0.2,
  }) >
    scoreNominatimRow({
      lat: '41.7',
      lon: '44.8',
      class: 'highway',
      type: 'residential',
      importance: 0.5,
    }),
)

const ring: [number, number][] = [
  [44.77, 41.70],
  [44.78, 41.70],
  [44.78, 41.71],
  [44.77, 41.71],
  [44.77, 41.70],
]
const mid = ringCentroid(ring)
assert.ok(Math.abs(mid.lng - 44.775) < 0.001)
assert.ok(Math.abs(mid.lat - 41.705) < 0.001)

assert.ok(geometryRing({ type: 'Polygon', coordinates: [ring] }))
assert.equal(geometryRing({ type: 'Point', coordinates: [44.77, 41.7] }), null)

const poly = pickHighlightPolygon(41.7, 44.77)
assert.equal(poly.geometry.type, 'Polygon')
assert.equal(poly.geometry.coordinates[0]!.length, 5)

const snapped = snapPick(
  { lat: 41.701, lng: 44.771 },
  { type: 'Polygon', coordinates: [ring] },
)
assert.ok(Math.abs(snapped.lat - mid.lat) < 0.001)

// Exact house № beats highway/bus_stop at same query.
assert.ok(
  scoreNominatimRow(
    {
      lat: '41.77',
      lon: '44.78',
      class: 'building',
      type: 'apartments',
      address: { house_number: '68' },
      importance: 0.01,
    },
    '68',
  ) >
    scoreNominatimRow(
      {
        lat: '41.77',
        lon: '44.78',
        class: 'highway',
        type: 'bus_stop',
        importance: 0.5,
      },
      '68',
    ),
)

// API route footgun reminder: Number(null)===0 is finite — reverse must gate on param presence.
assert.equal(Number(null), 0)
assert.equal(Number.isFinite(Number(null)), true)

console.log('geocode + corpus + pick-building checks ok')
