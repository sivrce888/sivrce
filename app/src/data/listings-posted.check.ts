/**
 * Self-check: postedDaysAgo calendar math (ISO + YYYY-MM-DD, no NaN).
 * Run: npx tsx src/data/listings-posted.check.ts
 */
import assert from 'node:assert/strict'
import { postedDaysAgo, type Listing } from './listings'

const today = new Date(2026, 6, 20, 18, 0, 0) // Jul 20 local afternoon
assert.equal(postedDaysAgo({ postedAt: '2026-07-20' } as Listing, today), 0)
assert.equal(postedDaysAgo({ postedAt: '2026-07-20T12:57:47.212Z' } as Listing, today), 0)
assert.equal(postedDaysAgo({ postedAt: '2026-07-18' } as Listing, today), 2)
assert.equal(postedDaysAgo({ postedAt: 'not-a-date' } as Listing, today), 0)
assert.ok(!Number.isNaN(postedDaysAgo({ postedAt: '2026-07-20T12:57:47.212Z' } as Listing, today)))

console.log('listings-posted.check: ok')
