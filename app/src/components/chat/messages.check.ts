/**
 * Runnable check: npx tsx src/components/chat/messages.check.ts
 * Chat merge/format helpers — dedupe, optimistic reconcile, grouping, time.
 */
import assert from 'node:assert/strict'
import {
  clockLabel,
  dayKey,
  mergeMessages,
  sameGroup,
  timeAgo,
  type ChatMessage,
} from './messages'

let n = 0
function msg(p: Partial<ChatMessage> = {}): ChatMessage {
  const at = p.createdAt ?? new Date(Date.now() + n++ * 1000).toISOString()
  return {
    id: p.id ?? `m${n}`,
    roomId: 'r1',
    senderId: p.senderId ?? 'alice',
    content: p.content ?? 'hello',
    kind: p.kind ?? 'text',
    metadata: p.metadata ?? {},
    createdAt: at,
  }
}

// ——— mergeMessages: dedupe by id ———
const a = msg({ id: 'a' })
const b = msg({ id: 'b' })
assert.deepEqual(mergeMessages([a, b], [a]), [a, b])
assert.equal(mergeMessages([a], [{ ...b, id: 'a' }]).length, 1, 'duplicate id is dropped')

// ——— mergeMessages: optimistic reconcile via metadata.clientId ———
const temp: ChatMessage = { ...a, id: 'tmp_c1', clientId: 'c1', status: 'pending' }
const echoed = msg({ id: 'srv1', metadata: { clientId: 'c1' } })
const merged = mergeMessages([temp], [echoed])
assert.equal(merged.length, 1, 'temp replaced by server echo')
assert.equal(merged[0]!.id, 'srv1')
assert.equal(merged[0]!.clientId, undefined, 'clientId cleared with the temp slot')

// ——— mergeMessages: (createdAt, id) order survives out-of-order delivery ———
const early = msg({ id: 'zz', createdAt: '2026-01-01T00:00:00Z' })
const late = msg({ id: 'aa', createdAt: '2026-01-02T00:00:00Z' })
assert.deepEqual(mergeMessages([late], [early]).map((m) => m.id), ['zz', 'aa'])

// ——— sameGroup: same sender + text + <5 min ———
const t0 = msg({ senderId: 'me', createdAt: '2026-01-01T10:00:00Z' })
const t0plus1 = msg({ senderId: 'me', createdAt: '2026-01-01T10:01:00Z' })
const other = msg({ senderId: 'peer', createdAt: '2026-01-01T10:02:00Z' })
const far = msg({ senderId: 'me', createdAt: '2026-01-01T10:30:00Z' })
const image = msg({ senderId: 'me', kind: 'image', createdAt: '2026-01-01T10:00:30Z' })
assert.equal(sameGroup(t0, t0plus1), true)
assert.equal(sameGroup(t0, other), false)
assert.equal(sameGroup(t0, far), false)
assert.equal(sameGroup(t0, image), false)

// ——— day/time helpers ———
assert.equal(dayKey('2026-03-05T23:30:00'), dayKey('2026-03-05T06:00:00'))
assert.match(clockLabel('2026-01-01T09:05:00Z', 'ka'), /\d{1,2}:\d{2}/)
assert.equal(timeAgo(new Date(Date.now() - 30_000).toISOString()).unit, 'now')
assert.deepEqual(timeAgo(new Date(Date.now() - 5 * 60_000).toISOString()), { n: 5, unit: 'min' })
assert.equal(timeAgo(new Date(Date.now() - 3 * 3600_000).toISOString()).unit, 'hour')
assert.equal(timeAgo(new Date(Date.now() - 2 * 86_400_000).toISOString()).unit, 'day')

console.log('chat/messages.check.ts — all green')
