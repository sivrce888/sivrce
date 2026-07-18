/**
 * Run: npx tsx src/lib/map/user-place.check.ts
 */
import assert from 'node:assert/strict'
import { cityBySlug, nearestMapCity, MAP_CITIES } from './user-place'
import { MAP_CENTER } from './buildings'

assert.equal(MAP_CITIES[0]!.slug, 'tbilisi')
assert.equal(cityBySlug('batumi')?.ka, 'ბათუმი')

const nearBatumi = nearestMapCity(41.62, 41.63)
assert.equal(nearBatumi?.slug, 'batumi')

const atTbilisi = nearestMapCity(MAP_CENTER.lat, MAP_CENTER.lng)
assert.equal(atTbilisi?.slug, 'tbilisi')

// Far outside Georgia — no snap
assert.equal(nearestMapCity(48.85, 2.35), null)

console.log('user-place.check: ok')
