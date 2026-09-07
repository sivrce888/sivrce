/**
 * Self-check: cadastre parcel helpers (no network).
 * Run: npx tsx src/lib/map/cadastre.check.ts
 */
import assert from 'node:assert/strict'
import {
  cadastralFromExtended,
  closedRing,
  parcelAreaM2,
  parcelsFC,
  statusPaint,
  type CadastreParcel,
} from './cadastre'

// closedRing closes unclosed rings and keeps closed ones
assert.deepEqual(closedRing([[0, 0], [1, 0], [1, 1]]), [[0, 0], [1, 0], [1, 1], [0, 0]])
assert.deepEqual(closedRing([[0, 0], [1, 0], [1, 1], [0, 0]]), [[0, 0], [1, 0], [1, 1], [0, 0]])

// rejects degenerate rings
assert.equal(closedRing([[0, 0], [1, 1]]), null)
assert.equal(closedRing(undefined), null)
assert.equal(closedRing([[0, 0]]), null)

// 0.001° × 0.001° square near Tbilisi ≈ 111.2 m × 83 m
const square: [number, number][] = [
  [44.8, 41.7],
  [44.801, 41.7],
  [44.801, 41.701],
  [44.8, 41.701],
]
const area = parcelAreaM2(square)
assert.ok(area !== null && area > 8800 && area < 9700, `area ${area}`)
assert.equal(parcelAreaM2([[0, 0], [1, 1]]), null)

// FC drops invalid parcels, marks selection
const parcels: CadastreParcel[] = [
  { code: '01.10.01.001.001', ring: square, lat: 41.7005, lng: 44.8005, status: 'active' },
  { code: 'bad', ring: [[0, 0]], lat: 0, lng: 0, status: 'sold' },
]
const fc = parcelsFC(parcels, '01.10.01.001.001')
assert.equal(fc.features.length, 1)
assert.equal(fc.features[0].properties?.selected, true)
assert.equal(fc.features[0].properties?.status, 'active')

// every status paints from locked tokens
for (const s of ['active', 'sold', 'pending', 'expired', 'withdrawn'] as const) {
  const { fill, line } = statusPaint(s)
  assert.ok(fill.startsWith('#') && line.startsWith('#'), `paint ${s}`)
}

// extendedFields.cadastral shapes
assert.equal(cadastralFromExtended('01.10.01.001.001'), '01.10.01.001.001')
assert.equal(cadastralFromExtended({ code: ' 01 ' }), '01')
assert.equal(cadastralFromExtended(null), null)
assert.equal(cadastralFromExtended({ code: 42 }), null)

console.log('cadastre.check: ok')
