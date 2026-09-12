/**
 * Runnable check: npx tsx src/lib/search-filters.check.ts
 * Market-scope boundary: launched ISO scopes /api/search; absent/'all'/garbage
 * = worldwide. Product UI always sends the market ISO (.ge → GE, .com → all).
 */
import assert from 'node:assert/strict'

import { buildDbWhere, parseSearchParams } from '@/lib/search-filters'
import { meiliCountryClause } from '@/lib/search'

const sp = (q: string) => new URLSearchParams(q)

assert.equal(parseSearchParams(sp('')).country, undefined)
assert.equal(parseSearchParams(sp('country=all')).country, undefined)
assert.equal(parseSearchParams(sp('country=GE')).country, 'GE')
assert.equal(parseSearchParams(sp('country=DE')).country, 'DE')
assert.equal(parseSearchParams(sp('country=AE')).country, 'AE', 'launched market ISO must scope')
assert.equal(parseSearchParams(sp('country=JP')).country, 'JP')
assert.equal(parseSearchParams(sp('country=XX')).country, undefined, 'garbage ISO is ignored, not scoped')
assert.equal(parseSearchParams(sp('country=ge')).country, undefined, 'lowercase garbage is ignored')

assert.equal(meiliCountryClause('GE'), '(country = "GE" OR country NOT EXISTS)')
assert.equal(meiliCountryClause('AE'), 'country = "AE"')
assert.equal(meiliCountryClause('DE'), 'country = "DE"')
assert.equal(meiliCountryClause('U"A'), 'country = "U\\"A"', 'ISO is escaped into the filter string')

assert.equal(buildDbWhere(parseSearchParams(sp('country=AE'))).country, 'AE')
assert.equal(buildDbWhere(parseSearchParams(sp(''))).country, undefined)
assert.equal(buildDbWhere(parseSearchParams(sp('country=all'))).country, undefined)

const tbilisiWhere = buildDbWhere(parseSearchParams(sp('city=Tbilisi'))).city
assert.ok(tbilisiWhere && typeof tbilisiWhere === 'object' && 'in' in tbilisiWhere)
assert.ok((tbilisiWhere.in as string[]).includes('თბილისი'), 'English Tbilisi must match ka rows')
assert.ok((tbilisiWhere.in as string[]).includes('Tbilisi'))
const kaWhere = buildDbWhere(parseSearchParams(sp('city=თბილისი'))).city
assert.ok(kaWhere && typeof kaWhere === 'object' && 'in' in kaWhere)
assert.equal((kaWhere.in as string[]).includes('თბილისი'), true)

console.log('search-filters.check: ok')
