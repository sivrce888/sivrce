/**
 * Self-check for NAPR parcel parsers (no network).
 * Run: npx tsx src/lib/map/napr-parcel.check.ts
 */

import assert from 'node:assert/strict'
import {
  naprRingsToOuter,
  naprUniqDigits,
  pickNaprParcelFromResults,
} from './napr-parcel'

assert.equal(naprUniqDigits('01.10.10.025.115'), '011010025115')
assert.equal(naprUniqDigits('011010025115'), '011010025115')
assert.equal(naprUniqDigits('05.28.25.001'), '052825001')
assert.equal(naprUniqDigits('052825001'), '052825001')
assert.equal(naprUniqDigits('55512'), null)

const square = [
  [44.77, 41.74],
  [44.771, 41.74],
  [44.771, 41.741],
  [44.77, 41.741],
  [44.77, 41.74],
]
const hole = [
  [44.7702, 41.7402],
  [44.7704, 41.7402],
  [44.7704, 41.7404],
  [44.7702, 41.7404],
  [44.7702, 41.7402],
]
const outer = naprRingsToOuter([square, hole])
assert.ok(outer)
assert.equal(outer!.length, 5)
assert.equal(outer![0]![0], 44.77)

const big = pickNaprParcelFromResults([
  {
    attributes: { UNIQ_CODE: '011010025999', 'SHAPE.AREA': 5000 },
    geometry: {
      rings: [
        [
          [44.77, 41.74],
          [44.772, 41.74],
          [44.772, 41.742],
          [44.77, 41.742],
          [44.77, 41.74],
        ],
      ],
    },
  },
  {
    attributes: { UNIQ_CODE: '011010025115', 'SHAPE.AREA': 1200 },
    geometry: { rings: [square] },
  },
])
assert.ok(big)
assert.equal(big!.uniqCode, '011010025115')
assert.ok(big!.lat > 41.74 && big!.lat < 41.741)

console.log('napr-parcel.check: ok')
