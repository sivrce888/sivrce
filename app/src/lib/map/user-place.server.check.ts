/**
 * Run: npx tsx src/lib/map/user-place.server.check.ts
 * Server plane gate — full GeoNames corpus, suburb-pruned, metro-snap wins.
 */
import assert from 'node:assert/strict'
import { MAP_CITIES_ALL, cityByName, cityBySlug, nearestMapCity, placeFromIp } from './user-place.server'
import { MAP_CITIES } from './user-place'

assert.ok(MAP_CITIES_ALL.length >= 20000, `corpus shrank to ${MAP_CITIES_ALL.length}`)
assert.ok(MAP_CITIES_ALL.length > MAP_CITIES.length, 'gen corpus missing')
assert.equal(new Set(MAP_CITIES_ALL.map((c) => c.slug)).size, MAP_CITIES_ALL.length, 'dup slug')
assert.equal(MAP_CITIES_ALL[0]!.slug, 'tbilisi', 'inventory must stay first')

// Suburb prune: Wellington CBD snaps to Wellington, not a pruned borough.
assert.equal(nearestMapCity(-41.2865, 174.7762)?.slug, 'wellington')
assert.equal(nearestMapCity(1.3521, 103.8198)?.slug, 'singapore')
assert.equal(nearestMapCity(52.52, 13.405)?.slug, 'berlin')

assert.equal(cityByName('Chitungwiza')?.cc, 'ZW', 'small-city lookup')
assert.equal(cityBySlug('karori'), null, 'suburb survived prune')
assert.equal(cityBySlug('wellington')?.cc, 'NZ', 'slug clash must keep the bigger city')
assert.equal(placeFromIp(-41.2865, 174.7762)?.slug, 'wellington')

console.log(`user-place.server.check: ok (${MAP_CITIES_ALL.length} cities)`)
