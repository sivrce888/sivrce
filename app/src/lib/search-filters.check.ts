/**
 * Runnable check: npx tsx src/lib/search-filters.check.ts
 * Market-scope boundary: any launched market ISO scopes /api/search; garbage
 * falls back to the GE catalog default — never a worldwide leak.
 */
import assert from 'node:assert/strict'

import { buildDbWhere, parseSearchParams } from '@/lib/search-filters'
import { meiliCountryClause } from '@/lib/search'

const sp = (q: string) => new URLSearchParams(q)

assert.equal(parseSearchParams(sp('')).country, 'GE')
assert.equal(parseSearchParams(sp('country=all')).country, undefined)
assert.equal(parseSearchParams(sp('country=GE')).country, 'GE')
assert.equal(parseSearchParams(sp('country=DE')).country, 'DE')
assert.equal(parseSearchParams(sp('country=AE')).country, 'AE', 'launched market ISO must scope')
assert.equal(parseSearchParams(sp('country=JP')).country, 'JP')
assert.equal(parseSearchParams(sp('country=XX')).country, 'GE', 'garbage ISO falls back to GE')
assert.equal(parseSearchParams(sp('country=ge')).country, 'GE', 'lowercase garbage falls back to GE')

assert.equal(meiliCountryClause('GE'), '(country = "GE" OR country NOT EXISTS)')
assert.equal(meiliCountryClause('AE'), 'country = "AE"')
assert.equal(meiliCountryClause('DE'), 'country = "DE"')
assert.equal(meiliCountryClause('U"A'), 'country = "U\\"A"', 'ISO is escaped into the filter string')

assert.equal(buildDbWhere(parseSearchParams(sp('country=AE'))).country, 'AE')
assert.equal(buildDbWhere(parseSearchParams(sp(''))).country, 'GE')
assert.equal(buildDbWhere(parseSearchParams(sp('country=all'))).country, undefined)

console.log('search-filters.check: ok')
