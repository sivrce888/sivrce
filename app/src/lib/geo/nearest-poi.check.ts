/**
 * Runnable checks: nearest-poi constants + uuid + nearMetro where shape.
 * Run: npx tsx src/lib/geo/nearest-poi.check.ts
 */

import assert from "node:assert/strict"

import { METRO_MAX_CATCHMENT_M, METRO_NEAR_M, nearMetroWhere, poiUuid } from "@/lib/geo/nearest-poi-pure"
import { worldMetroSeedRows } from "@/lib/countries/world-metro-all"

assert.equal(METRO_NEAR_M, 800)
assert.equal(METRO_MAX_CATCHMENT_M, 2500)

const a = poiUuid("node/1")
const b = poiUuid("node/1")
const c = poiUuid("node/2")
assert.equal(a, b)
assert.notEqual(a, c)
assert.match(a, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)

const w = nearMetroWhere()
assert.ok(w.nearestPois)
assert.equal(
  (w.nearestPois as { some: { distanceM: { lte: number } } }).some.distanceM.lte,
  METRO_NEAR_M,
)

console.log("nearest-poi.check: ok")

// World-metro seed rows: full planet, stable ids, PostGIS-ready shape.
{
  const rows = worldMetroSeedRows()
  assert.ok(rows.length >= 15000, `world seed shrank: ${rows.length}`)
  assert.equal(new Set(rows.map((r) => r.id)).size, rows.length, 'dup seed id')
  const tbilisi = rows.filter((r) => JSON.parse(r.meta).city === 'tbilisi')
  assert.ok(tbilisi.length >= 20, 'tbilisi seed drift')
  for (const r of rows) {
    assert.ok(r.name.length > 0 && r.name.length <= 240, 'seed name bounds')
    assert.ok(Number.isFinite(r.lat + r.lng), 'seed coords')
    assert.match(r.id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
  }
  assert.equal(worldMetroSeedRows()[0]?.id, rows[0]?.id, 'seed ids unstable')
  console.log(`world-metro seed rows: ${rows.length} ok`)
}
