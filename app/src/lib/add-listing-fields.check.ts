import assert from 'node:assert/strict'
import {
  DEALS_FOR,
  dealLabelKey,
  fieldsFor,
  conditionsFor,
  statusesFor,
  projectsFor,
  floorTypesFor,
} from './add-listing-fields'

assert.deepEqual([...DEALS_FOR.land], ['sale', 'rent', 'pledge'])
assert.ok(!DEALS_FOR.land.includes('daily'))
assert.equal(dealLabelKey('rent', 'land'), 'add.deal.lease')
assert.equal(dealLabelKey('rent', 'apartment'), 'add.deal.rent')

const landSale = fieldsFor('land', 'sale')
assert.equal(landSale.rooms, false)
assert.equal(landSale.condition, false)
assert.equal(landSale.areaHa, true)
assert.equal(landSale.floor, false)
assert.equal(landSale.project, false)

const landLease = fieldsFor('land', 'rent')
assert.equal(landLease.rentPeriod, false)
assert.equal(landLease.exchange, false)

const aptRent = fieldsFor('apartment', 'rent')
assert.equal(aptRent.rentPeriod, true)
assert.equal(aptRent.rentType, true)
assert.equal(aptRent.floor, true)
assert.equal(aptRent.project, true)
assert.equal(aptRent.floorType, true)
assert.equal(aptRent.kitchen, true)
assert.ok(projectsFor('apartment').length >= 10)
assert.equal(projectsFor('land').length, 0)
assert.equal(floorTypesFor('apartment').length, 3)

const daily = fieldsFor('apartment', 'daily')
assert.equal(daily.guests, true)
assert.equal(conditionsFor('apartment', 'daily').length, 3)
assert.ok(conditionsFor('apartment', 'sale').length > 3)

assert.ok(statusesFor('land').some((k) => k.includes('land.')))
assert.ok(statusesFor('commercial').some((k) => k.includes('comm.')))
assert.deepEqual([...statusesFor('hotel')], ['add.status.construction', 'add.status.completed'])

const house = fieldsFor('house', 'sale')
assert.equal(house.yard, true)
assert.equal(house.project, false)
assert.equal(house.kitchen, true)

console.log('add-listing-fields: ok')
