/**
 * Self-check: DB (admin CMS) → public BlogPost mapping (pure).
 * Run: npx tsx src/data/blog.check.ts
 */
import assert from 'node:assert/strict'
import { BLOG_POSTS, dbPostToBlogPost } from './blog'

const row = {
  slug: 'test-post',
  titleKa: 'ქართული სათაური',
  titleEn: null,
  excerptKa: null,
  excerptEn: null,
  bodyKa: Array(500).fill('სიტყვა').join(' '),
  tags: ['ბაზარი'],
  featuredImage: null,
  publishedAt: new Date('2026-09-01T12:00:00+04:00'),
  createdAt: new Date('2026-08-30T12:00:00+04:00'),
  updatedAt: new Date('2026-09-02T12:00:00+04:00'),
}

const p = dbPostToBlogPost(row, null)
assert.equal(p.slug, 'test-post')
assert.equal(p.title, row.titleKa)
assert.equal(p.enTitle, '', 'missing en title stays empty')
assert.ok(p.excerpt.length <= 160, 'excerpt falls back to body slice ≤160')
assert.ok(p.cover.startsWith('/images/'), 'cover falls back to default brand image')
assert.equal(p.author, 'sivrce რედაქცია', 'author falls back to editorial')
assert.equal(p.publishedAt, '2026-09-01', 'publishedAt date-only')
assert.equal(p.updatedAt, '2026-09-02', 'updatedAt date-only')
assert.ok(p.readingMinutes >= 1, 'readingMinutes floors at 1')

// Static seed integrity: unique slugs, required fields, the mapper overrides by slug.
const slugs = new Set(BLOG_POSTS.map((x) => x.slug))
assert.equal(slugs.size, BLOG_POSTS.length, 'seed slugs unique')
assert.ok(BLOG_POSTS.every((x) => x.title && x.excerpt && x.body && x.cover && x.author))

// Named author wins over fallback.
assert.equal(dbPostToBlogPost(row, 'Luka B.').author, 'Luka B.')

console.log('ok: blog db→public mapping + seed integrity')
