import assert from 'node:assert/strict'
import { buildDbWhere } from './search-filters'

const w = buildDbWhere({ dealType: 'buy' })
const and = w.AND
assert.ok(Array.isArray(and), 'AND clause required')
assert.ok(
  and.some(
    (c) =>
      c.NOT &&
      typeof c.NOT === 'object' &&
      'extendedFields' in c.NOT &&
      (c.NOT as { extendedFields?: { path?: string[]; equals?: unknown } }).extendedFields
        ?.path?.[0] === 'projectCatalog' &&
      (c.NOT as { extendedFields?: { equals?: unknown } }).extendedFields?.equals === true,
  ),
  'deal search must exclude projectCatalog',
)

console.log('search-filters.catalog: ok')
