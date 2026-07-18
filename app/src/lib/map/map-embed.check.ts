/**
 * Self-check: npx tsx src/lib/map/map-embed.check.ts
 * Covers MapEmbed readiness gates used by listing/developer/agent embeds.
 */
import assert from 'node:assert/strict'
import { parseCoords, cityCenter } from './geocode'
import { pickHighlightPolygon, snapPick } from './pick-building'

assert.ok(parseCoords(41.7151, 44.8271))
assert.equal(parseCoords(0, 0), null)
assert.equal(parseCoords(Number.NaN, 44), null)

const agentPin = cityCenter('თბილისი')
assert.ok(parseCoords(agentPin.lat, agentPin.lng))

const batumi = cityCenter('ბათუმი')
assert.ok(parseCoords(batumi.lat, batumi.lng))
assert.ok(Math.abs(batumi.lat - 41.64) < 0.1)

const fallback = pickHighlightPolygon(41.7151, 44.8271)
assert.equal(fallback.geometry.coordinates[0]!.length, 5)

assert.deepEqual(
  snapPick({ lat: 41.7, lng: 44.8 }, null),
  { lat: 41.7, lng: 44.8 },
)

console.log('map-embed.check: ok')
