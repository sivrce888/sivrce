/**
 * Self-check: npm run check:geocode
 */
import assert from 'node:assert/strict'
import { cityCenter, inGeorgia, parseCoords } from './geocode'
import { corpusIdentity, corpusCell } from './corpus'

assert.equal(inGeorgia(41.7151, 44.8271), true)
assert.equal(inGeorgia(0, 0), false)
assert.equal(inGeorgia(48.8566, 2.3522), false)

assert.deepEqual(parseCoords(41.7, 44.8), { lat: 41.7, lng: 44.8 })
assert.equal(parseCoords(99, 44.8), null)
assert.equal(parseCoords('41', 44), null)

const tb = cityCenter('თბილისი')
assert.ok(Math.abs(tb.lat - 41.7151) < 0.01)

const a = corpusIdentity(41.7151, 44.8271, 'თბილისი')
const b = corpusIdentity(41.7151, 44.8271, 'თბილისი')
assert.equal(a.code, b.code)
assert.equal(a.slug, b.slug)
assert.match(a.code, /^SV-TB-[0-9A-F]{4}$/)

const c = corpusCell(41.7151, 44.8271)
const near = corpusIdentity(41.7151 + 0.0001, 44.8271, 'თბილისი')
const far = corpusIdentity(41.7151 + 0.01, 44.8271, 'თბილისი')
assert.equal(near.cellLat, c.cellLat)
assert.notEqual(far.code, a.code)

console.log('geocode + corpus checks ok')
