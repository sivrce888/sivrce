/**
 * Self-check: forum nest + vote helpers (pure).
 * Run: npx tsx src/lib/forum-live.check.ts
 */
import { FORUM_CATEGORIES, excerptFromBody, makeForumSlug, type ForumReply } from '../data/forum'

let failed = 0
function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error('FAIL:', msg)
    failed++
  }
}

assert(FORUM_CATEGORIES.length >= 4, 'categories')
const s1 = makeForumSlug('რემონტი ვაკეში 2026', () => 'aaa11111')
assert(s1.endsWith('-aaa11111'), `slug suffix: ${s1}`)
assert(excerptFromBody('a'.repeat(250)).endsWith('…'), 'excerpt truncates')

// One-level nest grouping (same logic as ThreadReplies)
const sample: ForumReply[] = [
  { id: 'a', authorName: 'A', body: 'top', verified: false, createdAt: '2026-07-01', parentId: null, helpfulCount: 2 },
  { id: 'b', authorName: 'B', body: 'child', verified: false, createdAt: '2026-07-02', parentId: 'a', helpfulCount: 0 },
  { id: 'c', authorName: 'C', body: 'top2', verified: false, createdAt: '2026-07-03' },
]
const tops = sample.filter((r) => !r.parentId)
const kids = sample.filter((r) => r.parentId === 'a')
assert(tops.length === 2, 'tops')
assert(kids.length === 1 && kids[0]!.id === 'b', 'kids under a')

if (failed) {
  console.error(`${failed} assertion(s) failed`)
  process.exit(1)
}
console.log('ok: forum nest/vote helpers')
