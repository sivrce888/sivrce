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

const diamond = parseSearchParams(new URLSearchParams('tier=diamond'))
assert.equal(diamond.tier, 'diamond')
assert.equal(parseSearchParams(new URLSearchParams('tier=standard')).tier, undefined)
assert.equal(parseSearchParams(new URLSearchParams('tier=junk')).tier, undefined)
const tw = buildDbWhere({ tier: 'diamond' })
assert.equal(tw.tier, 'diamond')
assert.ok(Array.isArray(tw.AND) && tw.AND.some((c) => Array.isArray(c.OR) && c.OR.some((o) => 'tierExpiresAt' in o)))

console.log('search-filters.catalog: ok')
