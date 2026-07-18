import assert from 'node:assert/strict'
import {
  DEALS_FOR,
  dealLabelKey,
  fieldsFor,
  conditionsFor,
  statusesFor,
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

const landLease = fieldsFor('land', 'rent')
assert.equal(landLease.rentPeriod, false)
assert.equal(landLease.exchange, false)

const aptRent = fieldsFor('apartment', 'rent')
assert.equal(aptRent.rentPeriod, true)
assert.equal(aptRent.rentType, true)
assert.equal(aptRent.floor, true)

const daily = fieldsFor('apartment', 'daily')
assert.equal(daily.guests, true)
assert.equal(conditionsFor('apartment', 'daily').length, 3)
assert.ok(conditionsFor('apartment', 'sale').length > 3)

assert.ok(statusesFor('land').some((k) => k.includes('land.')))
assert.ok(statusesFor('commercial').some((k) => k.includes('comm.')))
assert.deepEqual([...statusesFor('hotel')], ['add.status.construction', 'add.status.completed'])

const house = fieldsFor('house', 'sale')
assert.equal(house.yard, true)
assert.equal(house.floor, false)
assert.equal(house.totalFloors, true)

assert.equal(fieldsFor('apartment', 'daily').guests, true)
assert.equal(fieldsFor('land', 'sale').rooms, false)

// price helper: total GEL → USD (same math as form)
const USD_GEL = 2.7
const toUsd = (entered: number, cur: 'USD' | 'GEL', mode: 'total' | 'm2', area: number) => {
  const total = mode === 'm2' && area > 0 ? entered * area : entered
  return cur === 'GEL' ? Math.round(total / USD_GEL) : Math.round(total)
}
assert.equal(toUsd(2700, 'GEL', 'total', 100), 1000)
assert.equal(toUsd(10, 'USD', 'm2', 74), 740)

console.log('add-listing-fields: ok')
