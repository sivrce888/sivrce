/**
 * Runnable check: npx tsx src/lib/chat-policy.check.ts
 * Chat trust policy — unsend window, presence buckets, block symmetry.
 */
import assert from 'node:assert/strict'
import {
  UNSEND_WINDOW_MS,
  canUnsend,
  iBlockedThem,
  isConversationBlocked,
  presenceOf,
} from './chat-policy'

const NOW = Date.parse('2026-09-17T12:00:00Z')
const ago = (ms: number) => new Date(NOW - ms).toISOString()

// ——— canUnsend: own, fresh, not already deleted ———
const mine = { senderId: 'me', createdAt: ago(60_000) }
assert.equal(canUnsend(mine, 'me', NOW), true)
assert.equal(canUnsend(mine, 'peer', NOW), false, 'only the author may unsend')
assert.equal(canUnsend(mine, '', NOW), false, 'signed-out never unsends')
assert.equal(
  canUnsend({ ...mine, deletedAt: ago(10) }, 'me', NOW),
  false,
  'already unsent stays unsent',
)
assert.equal(
  canUnsend({ senderId: 'me', createdAt: ago(UNSEND_WINDOW_MS - 1000) }, 'me', NOW),
  true,
  'inside the window',
)
assert.equal(
  canUnsend({ senderId: 'me', createdAt: ago(UNSEND_WINDOW_MS + 1000) }, 'me', NOW),
  false,
  'window closed — history cannot be rewritten later',
)
assert.equal(canUnsend({ senderId: 'me', createdAt: 'not-a-date' }, 'me', NOW), false)

// ——— presenceOf: heartbeat is 5-min throttled, so "now" tolerates one miss ———
assert.deepEqual(presenceOf(null, NOW), { state: 'unknown', n: 0 })
assert.deepEqual(presenceOf('nonsense', NOW), { state: 'unknown', n: 0 })
assert.equal(presenceOf(ago(0), NOW).state, 'online')
assert.equal(presenceOf(ago(6 * 60_000), NOW).state, 'online', 'one missed heartbeat is still online')
assert.deepEqual(presenceOf(ago(20 * 60_000), NOW), { state: 'min', n: 20 })
assert.deepEqual(presenceOf(ago(3 * 3600_000), NOW), { state: 'hour', n: 3 })
assert.deepEqual(presenceOf(ago(3 * 86_400_000), NOW), { state: 'day', n: 3 })
assert.deepEqual(
  presenceOf(ago(30 * 86_400_000), NOW),
  { state: 'unknown', n: 0 },
  'stale heartbeat renders nothing rather than a guess',
)
assert.equal(presenceOf(new Date(NOW + 60_000).toISOString(), NOW).state, 'online', 'clock skew')

// ——— blocks: stored one-way, enforced both ways ———
const blocks = [{ blockerId: 'alice', blockedId: 'bob' }]
assert.equal(isConversationBlocked(blocks, 'alice', 'bob'), true)
assert.equal(isConversationBlocked(blocks, 'bob', 'alice'), true, 'blocked side is frozen too')
assert.equal(isConversationBlocked(blocks, 'bob', 'carol'), false)
assert.equal(isConversationBlocked([], 'alice', 'bob'), false)
assert.equal(iBlockedThem(blocks, 'alice', 'bob'), true, 'alice can undo')
assert.equal(iBlockedThem(blocks, 'bob', 'alice'), false, 'bob cannot undo alice’s block')

console.log('chat-policy.check.ts — all green')
