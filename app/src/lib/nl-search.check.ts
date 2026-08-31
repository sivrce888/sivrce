import assert from 'node:assert/strict'
import { mergeNl, nlHasStructure, nlToSearchPatch, parseNlQuery } from './nl-search'

const a = parseNlQuery('2 bedroom Vake apartment under 250k with parking')
assert.equal(a.district, 'ვაკე')
assert.equal(a.city, 'თბილისი')
assert.equal(a.rooms, 2)
assert.equal(a.propertyType, 'apartment')
assert.equal(a.maxPrice, 250000)
assert.ok(a.features?.includes('add.f.parking'))
assert.equal(nlHasStructure(a), true)
assert.equal(nlToSearchPatch(a).district, 'ვაკე')
assert.equal(nlToSearchPatch(a).feat, 'add.f.parking')
assert.equal(nlToSearchPatch(a).max, '250000')
assert.equal(nlToSearchPatch(a).q, undefined)

const b = parseNlQuery(
  'I want a bright 3-bedroom apartment in Vake under $300,000 with parking.',
)
assert.equal(b.district, 'ვაკე')
assert.equal(b.rooms, 3)
assert.equal(b.maxPrice, 300000)
assert.ok(b.features?.includes('add.f.parking'))
assert.ok(b.features?.includes('add.f.bright'))

const c = parseNlQuery('ვაკე')
assert.equal(c.district, 'ვაკე')
assert.equal(c.city, 'თბილისი')

const d = parseNlQuery('saburtalo 2 rooms')
assert.equal(d.district, 'საბურთალო')
assert.equal(d.rooms, 2)

assert.equal(parseNlQuery('ID 24316314').keywords, 'ID 24316314')
assert.equal(nlHasStructure(parseNlQuery('xyz')), false)

const merged = mergeNl(a, { maxPrice: 200000, features: ['add.f.elevator'] })
assert.equal(merged.maxPrice, 200000)
assert.ok(merged.features?.includes('add.f.parking'))
assert.ok(merged.features?.includes('add.f.elevator'))

const loggia = parseNlQuery('ბინა ლოჯით ვაკეში')
assert.ok(loggia.features?.includes('add.f.loggia'))
const garage = parseNlQuery('house with garage in Vake')
assert.ok(garage.features?.includes('add.f.garage'))
assert.ok(!garage.features?.includes('add.f.parking'))

console.log('ok: nl-search')
