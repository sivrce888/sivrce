/**
 * Runnable check: npx tsx src/components/chat/messages.check.ts
 * Chat merge/format helpers — dedupe, optimistic reconcile, grouping, time.
 */
import assert from 'node:assert/strict'
import {
  chatLeadTarget,
  clockLabel,
  dayKey,
  mergeMessages,
  parseChatDraft,
  sameGroup,
  splitLinks,
  timeAgo,
  unreadDividerIndex,
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

// ——— mergeMessages: a re-sent row replaces in place (unsend tombstone) ———
const live = msg({ id: 'd1', content: 'wrong price 1000' })
const tomb = { ...live, content: '', deletedAt: '2026-09-17T12:00:00Z' }
const afterUnsend = mergeMessages([live], [tomb])
assert.equal(afterUnsend.length, 1, 'tombstone replaces, never duplicates')
assert.equal(afterUnsend[0]!.content, '')
assert.equal(afterUnsend[0]!.deletedAt, '2026-09-17T12:00:00Z')

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

// ——— splitLinks: plain text, links, mixed runs ———
assert.deepEqual(splitLinks('no links here'), [{ text: 'no links here' }])
assert.deepEqual(splitLinks('see https://sivrce.ge/l/abc now'), [
  { text: 'see ' },
  { text: 'https://sivrce.ge/l/abc', href: 'https://sivrce.ge/l/abc' },
  { text: ' now' },
])
assert.deepEqual(splitLinks('a http://x.io b https://y.io c'), [
  { text: 'a ' },
  { text: 'http://x.io', href: 'http://x.io' },
  { text: ' b ' },
  { text: 'https://y.io', href: 'https://y.io' },
  { text: ' c' },
])
assert.deepEqual(
  splitLinks('javascript:alert(1) ftp://x'),
  [{ text: 'javascript:alert(1) ftp://x' }],
  'only http(s) linkifies',
)
assert.deepEqual(splitLinks(''), [{ text: '' }])

// ——— parseChatDraft: listing-scoped, capped, junk-safe ———
assert.equal(parseChatDraft(null, 'l1'), null)
assert.equal(parseChatDraft('{', 'l1'), null)
assert.equal(parseChatDraft(JSON.stringify({ listingId: 'l2', text: 'hi there friend' }), 'l1'), null)
assert.equal(parseChatDraft(JSON.stringify({ listingId: 'l1', text: '   ' }), 'l1'), null)
assert.equal(
  parseChatDraft(JSON.stringify({ listingId: 'l1', text: '  hello owner  ' }), 'l1'),
  'hello owner',
)
assert.equal(parseChatDraft(JSON.stringify({ listingId: 'l1', text: 'x'.repeat(2500) }), 'l1')?.length, 2000)

// ——— unreadDividerIndex: where "New messages" goes ———
const read = '2026-01-01T10:00:00Z'
const thread: ChatMessage[] = [
  msg({ id: 'u1', senderId: 'peer', createdAt: '2026-01-01T09:00:00Z' }),
  msg({ id: 'u2', senderId: 'peer', createdAt: '2026-01-01T11:00:00Z' }),
  msg({ id: 'u3', senderId: 'peer', createdAt: '2026-01-01T11:05:00Z' }),
]
assert.equal(unreadDividerIndex(thread, read, 'me'), 1, 'first message past the read mark')
assert.equal(unreadDividerIndex(thread, null, 'me'), -1, 'never read = no divider')
assert.equal(unreadDividerIndex(thread, 'garbage', 'me'), -1)
assert.equal(
  unreadDividerIndex(thread, '2026-01-01T23:00:00Z', 'me'),
  -1,
  'all read = no divider',
)
assert.equal(
  unreadDividerIndex(
    [msg({ id: 'm1', senderId: 'me', createdAt: '2026-01-01T11:00:00Z' })],
    read,
    'me',
  ),
  -1,
  'my own message never opens an unread run',
)


// chatLeadTarget — the launcher pitches the page's own lead form.
assert.deepEqual(chatLeadTarget('/ka/listing/100234/vake-2-otaxiani'), { type: 'listing', id: '100234' })
assert.deepEqual(chatLeadTarget('/en/projects/m2-vake'), { type: 'project', id: 'm2-vake' })
assert.deepEqual(chatLeadTarget('/ka/services/movers/fast-move'), { type: 'service', id: 'fast-move' })
assert.deepEqual(chatLeadTarget('/ge/ka/agencies/%E1%83%90'), { type: 'agency', id: 'ა' })
assert.equal(chatLeadTarget('/ka/services/movers'), null) // category index, no slug
assert.equal(chatLeadTarget('/ka/agents'), null)
assert.equal(chatLeadTarget('/ka/seller/listings'), null) // plural dashboard ≠ detail
assert.equal(chatLeadTarget('/ka/agent/listings'), null)
assert.equal(chatLeadTarget('/ka/listing/%E0%A4%A'), null) // malformed escape
assert.equal(chatLeadTarget(null), null)

console.log('chat/messages.check.ts — all green')
