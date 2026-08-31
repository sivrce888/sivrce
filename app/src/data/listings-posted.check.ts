/**
 * Self-check: postedDaysAgo calendar math (ISO + YYYY-MM-DD, no NaN).
 * Run: npx tsx src/data/listings-posted.check.ts
 */
import assert from 'node:assert/strict'
import { postedDaysAgo, stayCount, stayLine, type Listing } from './listings'

const today = new Date(2026, 6, 20, 18, 0, 0) // Jul 20 local afternoon
assert.equal(postedDaysAgo({ postedAt: '2026-07-20' } as Listing, today), 0)
assert.equal(postedDaysAgo({ postedAt: '2026-07-20T12:57:47.212Z' } as Listing, today), 0)
assert.equal(postedDaysAgo({ postedAt: '2026-07-18' } as Listing, today), 2)
assert.equal(postedDaysAgo({ postedAt: 'not-a-date' } as Listing, today), 0)
assert.ok(!Number.isNaN(postedDaysAgo({ postedAt: '2026-07-20T12:57:47.212Z' } as Listing, today)))

assert.deepEqual(stayCount({ rooms: 3, beds: 2 }), {
  n: 2, rooms: 3, labelKey: 'spec.beds', kind: 'beds',
})
assert.deepEqual(stayCount({ rooms: 2, beds: 0 }), {
  n: 2, rooms: 2, labelKey: 'spec.rooms', kind: 'rooms',
})
assert.equal(stayCount({ rooms: 1, beds: 2 }).n, 2)
const t = (k: 'spec.rooms' | 'spec.beds') => (k === 'spec.beds' ? 'საძინებელი' : 'ოთახები სულ')
assert.equal(stayLine({ rooms: 3, beds: 2 }, t), '2 საძინებელი · 3 ოთახები სულ')
assert.equal(stayLine({ rooms: 2, beds: 0 }, t), '2 ოთახები სულ')
assert.equal(stayLine({ rooms: 0, beds: 0 }, t), '')

console.log('listings-posted.check: ok')
