import assert from 'node:assert/strict'
import {
  BERLIN_CENTER,
  GEORGIA_MASK_MAXZOOM,
  GEORGIA_MAX_BOUNDS,
  GERMANY_MAX_BOUNDS,
  MAP_CENTER,
  inGeorgia,
  inGermany,
  inServiceArea,
  mapMaxBoundsFor,
  parseCoords,
} from './map-geo'
import {
  mapFiltersToSearchHref,
  mapHrefForListing,
  parseMapDeal,
  parseMapKind,
} from './map-href'

assert.equal(inGeorgia(MAP_CENTER.lat, MAP_CENTER.lng), true)
assert.equal(inGeorgia(0, 0), false)
assert.deepEqual(parseCoords(MAP_CENTER.lat, MAP_CENTER.lng), MAP_CENTER)
assert.equal(parseCoords(0, 0), null)
assert.ok(GEORGIA_MAX_BOUNDS[0][0] < GEORGIA_MAX_BOUNDS[1][0])
assert.equal(GEORGIA_MASK_MAXZOOM, 8)

// DE market: Berlin in service area, Paris out; clamp follows boot center.
assert.equal(inGermany(BERLIN_CENTER.lat, BERLIN_CENTER.lng), true)
assert.equal(inGermany(MAP_CENTER.lat, MAP_CENTER.lng), false)
assert.equal(inServiceArea(BERLIN_CENTER.lat, BERLIN_CENTER.lng), true)
assert.equal(inServiceArea(48.8566, 2.3522), false)
assert.deepEqual(parseCoords(BERLIN_CENTER.lat, BERLIN_CENTER.lng), { ...BERLIN_CENTER })
assert.equal(mapMaxBoundsFor(BERLIN_CENTER.lat, BERLIN_CENTER.lng), GERMANY_MAX_BOUNDS)
assert.equal(mapMaxBoundsFor(MAP_CENTER.lat, MAP_CENTER.lng), GEORGIA_MAX_BOUNDS)

assert.equal(parseMapDeal('sale'), 'sale')
assert.equal(parseMapDeal('nope'), 'all')
assert.equal(parseMapKind('apartment'), 'apartment')
assert.equal(parseMapKind('nope'), 'all')
assert.equal(mapFiltersToSearchHref('sale', 'apartment'), '/search?deal=sale&type=apartment')
assert.ok(mapHrefForListing({ id: 'x', coords: { lat: 41.7, lng: 44.8 } }).startsWith('/map?'))

console.log('map-geo: bbox + href split ✓')
