/**
 * Self-check: forum slug/excerpt helpers (no DB).
 * Run: npx tsx src/data/forum.check.ts && npx tsx src/lib/forum-live.check.ts
 */
import { FORUM_CATEGORIES, excerptFromBody, makeForumSlug } from '../data/forum'

let failed = 0
function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error('FAIL:', msg)
    failed++
  }
}

assert(FORUM_CATEGORIES.length >= 4, 'categories')
const s1 = makeForumSlug('რემონტი ვაკეში 2026', () => 'aaa11111')
const s2 = makeForumSlug('რემონტი ვაკეში 2026', () => 'bbb22222')
assert(s1 !== s2, 'slug uniqueness suffix')
assert(s1.endsWith('-aaa11111'), `slug suffix: ${s1}`)
assert(excerptFromBody('a'.repeat(250)).endsWith('…'), 'excerpt truncates')
assert(excerptFromBody('short').length === 5, 'short excerpt')

if (failed) {
  console.error(`${failed} assertion(s) failed`)
  process.exit(1)
}
console.log('ok: forum-live helpers')
