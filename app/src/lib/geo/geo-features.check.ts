/**
 * Self-check: GeoJSON → WKT (no DB).
 * Run: npx tsx src/lib/geo/geo-features.check.ts
 */
import assert from 'node:assert/strict'
import { geoExternalId, geoJsonToWkt, ringToPolygon } from './geo-features'

const pt = geoJsonToWkt({ type: 'Point', coordinates: [13.4, 52.52] })
assert.equal(pt, 'POINT(13.4 52.52)')

const poly = geoJsonToWkt(
  ringToPolygon([
    [13.4, 52.52],
    [13.401, 52.52],
    [13.401, 52.521],
    [13.4, 52.521],
    [13.4, 52.52],
  ]),
)
assert.ok(poly?.startsWith('POLYGON(('))
assert.ok(poly?.includes('13.4 52.52'))

assert.equal(geoJsonToWkt({ type: 'LineString', coordinates: [[0, 0], [1, 1]] } as never), null)
assert.equal(geoExternalId('alkis:abc').length, 32)

console.log('geo-features: wkt/id ✓')
