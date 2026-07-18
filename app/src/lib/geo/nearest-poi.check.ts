/**
 * Runnable checks: nearest-poi constants + uuid + nearMetro where shape.
 * Run: npx tsx src/lib/geo/nearest-poi.check.ts
 */

import assert from "node:assert/strict"

import { METRO_MAX_CATCHMENT_M, METRO_NEAR_M, nearMetroWhere, poiUuid } from "@/lib/geo/nearest-poi-pure"

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
