/**
 * Runnable check: npx tsx src/lib/search-filters.check.ts
 * Market-scope boundary: launched ISO scopes /api/search; absent/'all'/garbage
 * = worldwide. Product UI always sends the market ISO (.ge → GE, .com → all).
 */
import assert from 'node:assert/strict'

import { buildDbWhere, parseSearchParams } from '@/lib/search-filters'
import { meiliCountryClause } from '@/lib/search'
import { LUXURY_FLOOR_USD, luxuryRules } from '@/lib/luxury'

const sp = (q: string) => new URLSearchParams(q)

assert.equal(parseSearchParams(sp('')).country, undefined)
assert.equal(parseSearchParams(sp('country=all')).country, undefined)
assert.equal(parseSearchParams(sp('country=GE')).country, 'GE')
assert.equal(parseSearchParams(sp('country=DE')).country, 'DE')
assert.equal(parseSearchParams(sp('country=AE')).country, 'AE', 'launched market ISO must scope')
assert.equal(parseSearchParams(sp('country=JP')).country, 'JP')
assert.equal(parseSearchParams(sp('country=ge')).country, 'GE', 'lowercase valid ISO is normalized to uppercase')
assert.equal(parseSearchParams(sp('country=invalid')).country, undefined, 'garbage text is ignored')

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

// Luxury = derived segment: residential + price ≥ market floor per deal.
assert.equal(parseSearchParams(sp('life=luxury')).luxury, true)
assert.equal(parseSearchParams(sp('life=quiet')).luxury, undefined, 'other lifestyles never trigger luxury')
assert.deepEqual(luxuryRules('GE', 'buy'), [{ ge: true, deals: ['buy', 'mortgage'], minUsd: LUXURY_FLOOR_USD.GE.buy }])
assert.equal(luxuryRules('DE', 'rent')[0]!.minUsd, LUXURY_FLOOR_USD.default.rent, 'non-GE markets use the global floor')
assert.equal(luxuryRules(undefined, undefined).length, 6, 'worldwide × all deals = 2 markets × 3 deals')
{
  const w = buildDbWhere(parseSearchParams(sp('life=luxury&country=GE&deal=sale')))
  assert.deepEqual(w.propertyType, { in: ['apartment', 'house', 'villa'] }, 'luxury never lists land/commercial')
  const rule = (w.AND as { OR?: { currency?: string; price?: { gte: number } }[] }[])
    .flatMap((c) => c.OR ?? [])
    .find((r) => 'OR' in r) as unknown as { OR: { currency: string; price: { gte: number } }[] }
  const gel = rule.OR.find((o) => o.currency === 'GEL')!.price.gte
  assert.ok(gel > LUXURY_FLOOR_USD.GE.buy * 2, 'GEL floor converts from USD, not 1:1')
  const land = buildDbWhere(parseSearchParams(sp('life=luxury&type=land')))
  assert.deepEqual(land.id, { in: ['__none__'] }, 'luxury + land = empty, never unfiltered')
}

console.log('search-filters.check: ok')
