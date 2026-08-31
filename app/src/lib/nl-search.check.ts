import assert from 'node:assert/strict'
import { mergeNl, nlHasStructure, nlToSearchPatch, parseNlQuery } from './nl-search'

const a = parseNlQuery('2 bedroom Vake apartment under 250k with parking')
assert.equal(a.district, 'ვაკე')
assert.equal(a.city, 'თბილისი')
assert.equal(a.bedrooms, 2)
assert.equal(a.rooms, undefined)
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
assert.equal(b.bedrooms, 3)
assert.equal(b.rooms, undefined)
assert.equal(b.maxPrice, 300000)
assert.ok(b.features?.includes('add.f.parking'))
assert.ok(b.features?.includes('add.f.bright'))

const c = parseNlQuery('ვაკე')
assert.equal(c.district, 'ვაკე')
assert.equal(c.city, 'თბილისი')

const d = parseNlQuery('saburtalo 2 rooms')
assert.equal(d.district, 'საბურთალო')
assert.equal(d.rooms, 2)
assert.equal(nlToSearchPatch(a).beds, '2')
assert.equal(nlToSearchPatch(d).rooms, '2')
const kaBeds = parseNlQuery('2 საძინებელი ბათუმი დღიურად')
assert.equal(kaBeds.bedrooms, 2)
assert.equal(kaBeds.dealType, 'daily')
const kaRooms = parseNlQuery('3 ოთახიანი ვაკე')
assert.equal(kaRooms.rooms, 3)
assert.equal(kaRooms.bedrooms, undefined)

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

assert.equal(parseNlQuery('აგარაკი ვაკე').propertyType, 'villa')
assert.equal(parseNlQuery('სასტუმრო ბათუმი').propertyType, 'hotel')
assert.equal(parseNlQuery('კერძო სახლი თბილისი').propertyType, 'house')
assert.equal(nlToSearchPatch(parseNlQuery('აგარაკი ვაკე')).type, 'villa')

const partyKa = parseNlQuery('წვეულების სახლი თბილისი')
assert.equal(partyKa.dealType, 'daily')
assert.equal(partyKa.propertyType, undefined)
assert.ok(partyKa.features?.includes('add.f.partiesAllowed'))
assert.equal(nlToSearchPatch(partyKa).deal, 'daily')
assert.equal(nlToSearchPatch(partyKa).feat, 'add.f.partiesAllowed')
assert.equal(nlToSearchPatch(partyKa).type, undefined)

const birthday = parseNlQuery('birthday party house Batumi')
assert.equal(birthday.dealType, 'daily')
assert.ok(birthday.features?.includes('add.f.partiesAllowed'))
assert.equal(birthday.city, 'ბათუმი')

const eventKa = parseNlQuery('ივენთის სახლი ბადაბა')
assert.ok(eventKa.features?.includes('add.f.partiesAllowed'))
assert.equal(eventKa.dealType, 'daily')

assert.equal(parseNlQuery('გირავდება ბინა ვაკე').dealType, 'pledge')
assert.equal(nlToSearchPatch(parseNlQuery('გირავდება ბინა ვაკე')).deal, 'pledge')
assert.equal(parseNlQuery('pledge apartment Vake').dealType, 'pledge')

console.log('ok: nl-search')
