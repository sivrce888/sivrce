import assert from 'node:assert/strict'
import { parseSearchParams } from './search-filters'

const sp = new URLSearchParams({
  west: '44.7',
  south: '41.6',
  east: '44.9',
  north: '41.8',
  deal: 'sale',
})
const f = parseSearchParams(sp)
assert.ok(f.bbox)
assert.equal(f.bbox!.west, 44.7)
assert.equal(f.bbox!.north, 41.8)
assert.equal(f.dealType, 'buy')

const bad = parseSearchParams(new URLSearchParams({ west: '50', east: '40', south: '1', north: '2' }))
assert.equal(bad.bbox, undefined)

console.log('search-bbox: ok')
