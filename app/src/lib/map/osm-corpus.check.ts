/**
 * Self-check for corpus ring parse (no network).
 * Run: npx tsx src/lib/map/osm-corpus.check.ts
 */

import assert from 'node:assert/strict'
import { corpusCityAt, parseCorpusRing } from './osm-corpus'

const ring = parseCorpusRing([
  [44.78, 41.71],
  [44.781, 41.71],
  [44.781, 41.711],
  [44.78, 41.711],
  [44.78, 41.71],
])
assert.ok(ring)
assert.equal(ring!.length, 5)
assert.equal(parseCorpusRing([[1]]), null)
assert.equal(corpusCityAt(41.715, 44.78), 'tbilisi')
assert.equal(corpusCityAt(41.64, 41.64), 'batumi')

console.log('osm-corpus.check: ok')
