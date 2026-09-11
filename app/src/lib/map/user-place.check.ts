/**
 * Run: npx tsx src/lib/map/user-place.check.ts
 */
import assert from 'node:assert/strict'
import { cityBySlug, cityByName, nearestMapCity, MAP_CITIES, placeFromIp, slugsForMarket } from './user-place'
import { MAP_CENTER } from '@/lib/map/map-geo'

assert.equal(MAP_CITIES[0]!.slug, 'tbilisi')
assert.equal(cityBySlug('batumi')?.ka, 'ბათუმი')
assert.equal(cityBySlug('dubai')?.cc, 'AE')
assert.equal(cityByName('Berlin')?.slug, 'berlin')
assert.equal(cityByName('tiflis')?.slug, 'tbilisi')

const nearBatumi = nearestMapCity(41.62, 41.63)
assert.equal(nearBatumi?.slug, 'batumi')

const atTbilisi = nearestMapCity(MAP_CENTER.lat, MAP_CENTER.lng)
assert.equal(atTbilisi?.slug, 'tbilisi')

assert.equal(nearestMapCity(52.52, 13.405)?.slug, 'berlin')
assert.equal(nearestMapCity(48.8566, 2.3522)?.slug, 'paris')
assert.equal(nearestMapCity(-41.3, 174.8), null)

const paris = placeFromIp(48.8566, 2.3522, 'Paris')
assert.equal(paris?.slug, 'paris')
assert.ok(Math.abs((paris?.lat ?? 0) - 48.8566) < 0.001)
assert.equal(placeFromIp(0, 0, 'Berlin')?.slug, 'berlin')
assert.equal(placeFromIp(0, 0, 'Paris')?.slug, 'paris')

assert.ok(slugsForMarket('de')?.has('berlin'))
assert.equal(slugsForMarket('de')?.has('tbilisi'), false)
assert.equal(slugsForMarket('global'), undefined)

console.log('user-place.check: ok')
