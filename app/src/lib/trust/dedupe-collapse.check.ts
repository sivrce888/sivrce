/**
 * Runnable check: npx tsx src/lib/trust/dedupe-collapse.check.ts
 */
import assert from 'node:assert/strict'
import { collapseHits } from './dedupe-collapse'

const h = (id: string, verified = false, createdAt = '2026-01-01') => ({ id, verified, createdAt })

// No membership → passthrough, order kept.
assert.deepEqual(collapseHits([h('a'), h('b')], new Map()).hits.map((x) => x.id), ['a', 'b'])
assert.equal(collapseHits([h('a')], new Map()).merged, 0)

// Same cluster on page → verified survivor, rest merged.
{
  const r = collapseHits(
    [h('a'), h('b', true, '2026-03-01'), h('c')],
    new Map([
      ['a', { clusterId: 'k', memberCount: 3 }],
      ['b', { clusterId: 'k', memberCount: 3 }],
      ['c', { clusterId: 'k', memberCount: 3 }],
    ]),
  )
  assert.deepEqual(r.hits.map((x) => x.id), ['b'])
  assert.equal(r.hits[0]?.dupeCount, 3)
  assert.equal(r.merged, 2)
}

// All unverified → oldest wins (mirrors pickRepresentative).
{
  const r = collapseHits(
    [h('a', false, '2026-02-01'), h('b', false, '2026-01-01')],
    new Map([
      ['a', { clusterId: 'k', memberCount: 2 }],
      ['b', { clusterId: 'k', memberCount: 2 }],
    ]),
  )
  assert.deepEqual(r.hits.map((x) => x.id), ['b'])
}

// Lone on-page member of a bigger cluster → kept, truthful chip count.
{
  const r = collapseHits([h('a'), h('z')], new Map([['a', { clusterId: 'k', memberCount: 4 }]]))
  assert.deepEqual(r.hits.map((x) => x.id), ['a', 'z'])
  assert.equal(r.hits[0]?.dupeCount, 4)
  assert.equal(r.hits[1]?.dupeCount, undefined)
  assert.equal(r.merged, 0)
}

// Singleton cluster (memberCount 1) → no chip, no merge.
{
  const r = collapseHits([h('a')], new Map([['a', { clusterId: 'k', memberCount: 1 }]]))
  assert.equal(r.hits.length, 1)
  assert.equal(r.hits[0]?.dupeCount, undefined)
}

// Distinct clusters collapse independently; order stable.
{
  const r = collapseHits(
    [h('a'), h('b'), h('c'), h('d')],
    new Map([
      ['a', { clusterId: 'k1', memberCount: 2 }],
      ['b', { clusterId: 'k2', memberCount: 2 }],
      ['c', { clusterId: 'k1', memberCount: 2 }],
      ['d', { clusterId: 'k2', memberCount: 2 }],
    ]),
  )
  assert.deepEqual(r.hits.map((x) => x.id), ['a', 'b'])
  assert.equal(r.merged, 2)
}

console.log('dedupe-collapse.check: ok')
