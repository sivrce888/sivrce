import assert from 'node:assert/strict'
import { nearMetroApproxBoxes, nearMetroFilter } from './nearest-poi-pure'

const boxes = nearMetroApproxBoxes()
assert.ok(boxes.length >= 10, 'expected Tbilisi metro stations')
const first = boxes[0] as { AND: Array<{ lat?: { gte: number; lte: number } }> }
assert.ok(first.AND?.[0]?.lat?.gte != null)
assert.ok(first.AND[0].lat.lte > first.AND[0].lat.gte)

const f = nearMetroFilter()
assert.ok(Array.isArray((f as { OR: unknown[] }).OR))
assert.ok(((f as { OR: unknown[] }).OR).length === boxes.length + 1)

console.log('near-metro-filter: ok')
