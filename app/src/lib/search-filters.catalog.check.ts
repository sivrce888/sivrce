import assert from 'node:assert/strict'
import { Prisma } from '@/generated/prisma/client'
import { buildDbWhere } from './search-filters'

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

console.log('search-filters.catalog: ok')
