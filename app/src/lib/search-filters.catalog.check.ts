import assert from 'node:assert/strict'
import { Prisma } from '@/generated/prisma/client'
import { buildDbWhere, parseSearchParams } from './search-filters'

const w = buildDbWhere({ dealType: 'buy' })
const and = w.AND
assert.ok(Array.isArray(and), 'AND clause required')
assert.ok(
  and.some((c) => {
    const or = c.OR
    if (!Array.isArray(or)) return false
    const paths = or.map((o) => o.extendedFields as { path?: string[]; equals?: unknown } | undefined)
    const hasFalse = paths.some((p) => p?.path?.[0] === 'projectCatalog' && p.equals === false)
    const hasDbNull = paths.some((p) => p?.path?.[0] === 'projectCatalog' && p.equals === Prisma.DbNull)
    return hasFalse && hasDbNull
  }),
  'deal search must exclude projectCatalog (false | DbNull)',
)

const exact2 = parseSearchParams(new URLSearchParams('rooms=2&rmax=2'))
assert.equal(exact2.rooms, 2)
assert.equal(exact2.roomsMax, 2)
const exactWhere = buildDbWhere(exact2)
assert.equal((exactWhere.rooms as { gte?: number; lte?: number }).gte, 2)
assert.equal((exactWhere.rooms as { lte?: number }).lte, 2)

const beds2 = parseSearchParams(new URLSearchParams('beds=2&bmax=2'))
assert.equal(beds2.bedrooms, 2)
assert.equal(beds2.bedroomsMax, 2)
const bedsWhere = buildDbWhere(beds2)
assert.ok(Array.isArray(bedsWhere.AND) && bedsWhere.AND.some((c) => Array.isArray(c.OR)))

const diamond = parseSearchParams(new URLSearchParams('tier=diamond'))
assert.equal(diamond.tier, 'diamond')
assert.equal(parseSearchParams(new URLSearchParams('tier=standard')).tier, undefined)
assert.equal(parseSearchParams(new URLSearchParams('tier=junk')).tier, undefined)
const tw = buildDbWhere({ tier: 'diamond' })
assert.equal(tw.tier, 'diamond')
assert.ok(Array.isArray(tw.AND) && tw.AND.some((c) => Array.isArray(c.OR) && c.OR.some((o) => 'tierExpiresAt' in o)))

assert.equal(parseSearchParams(new URLSearchParams('type=villa')).propertyType, 'villa')
assert.equal(parseSearchParams(new URLSearchParams('propertyType=hotel')).propertyType, 'hotel')
assert.equal(parseSearchParams(new URLSearchParams('type=spaceship')).propertyType, undefined)
assert.equal(parseSearchParams(new URLSearchParams('type=apartment')).propertyType, 'apartment')
assert.deepEqual(
  parseSearchParams(new URLSearchParams('deal=daily&feat=add.f.partiesAllowed')).features,
  ['add.f.partiesAllowed'],
)
assert.equal(parseSearchParams(new URLSearchParams('deal=daily&feat=add.f.partiesAllowed')).dealType, 'daily')

console.log('search-filters.catalog: ok')
