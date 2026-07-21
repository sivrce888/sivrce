/**
 * Self-check: forum seed integrity.
 * Run: npx tsx src/data/forum.check.ts
 */
import { FORUM_CATEGORIES, FORUM_THREADS, excerptFromBody, getThread, makeForumSlug, relatedThreads } from './forum'

let failed = 0
function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error('FAIL:', msg)
    failed++
  }
}

assert(FORUM_THREADS.length >= 3, 'need at least 3 threads for homepage teaser')
assert(FORUM_CATEGORIES.length >= 4, 'categories')
const slugs = new Set<string>()
for (const t of FORUM_THREADS) {
  assert(!!t.slug && !!t.title && !!t.body, `thread missing fields: ${t.slug}`)
  assert(!slugs.has(t.slug), `duplicate slug: ${t.slug}`)
  slugs.add(t.slug)
  assert(t.replies.length >= 1, `${t.slug} needs ≥1 reply`)
  assert(getThread(t.slug)?.slug === t.slug, `getThread(${t.slug})`)
}
assert(relatedThreads(FORUM_THREADS[0]!).length >= 0, 'relatedThreads runs')
assert(makeForumSlug('test', () => 'x').endsWith('-x'), 'makeForumSlug')
assert(excerptFromBody('hi').length === 2, 'excerptFromBody')

if (failed) {
  console.error(`${failed} assertion(s) failed`)
  process.exit(1)
}
console.log(`ok: ${FORUM_THREADS.length} forum threads`)
