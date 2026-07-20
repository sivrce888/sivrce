import assert from 'node:assert/strict'
import type { Listing } from '@/data/listings'
import { aggregateBuildingDealCounts } from './building-inventory'

const fixtures = [
  { buildingSlug: 'a', dealType: 'sale' },
  { buildingSlug: 'a', dealType: 'sale' },
  { buildingSlug: 'a', dealType: 'rent' },
  { buildingSlug: 'b', dealType: 'daily' },
  { dealType: 'pledge' },
] as Listing[]

const counts = aggregateBuildingDealCounts(fixtures)
assert.deepEqual(counts.a, { sale: 2, rent: 1, daily: 0, pledge: 0 })
assert.deepEqual(counts.b, { sale: 0, rent: 0, daily: 1, pledge: 0 })
assert.equal(counts.c, undefined)

console.log('building-inventory: ok')
