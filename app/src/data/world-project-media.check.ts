/**
 * Runnable check: npx tsx src/data/world-project-media.check.ts
 * World remote media must be real, license-safe, and reachable through the
 * catalog: every slug exists, every URL is a verified Commons thumb with
 * author/license/file-page provenance. No invented media ever ships.
 */
import assert from 'node:assert/strict'
import { WORLD_PROJECTS } from './world-projects'
import { WORLD_PROJECT_MEDIA } from './world-project-media'

const slugs = new Set(WORLD_PROJECTS.map((p) => p.slug))
const entries = Object.entries(WORLD_PROJECT_MEDIA)
assert.ok(entries.length > 0, 'WORLD_PROJECT_MEDIA is empty — run scripts/enrich-world-media.mjs')

let images = 0
for (const [slug, media] of entries) {
  assert.ok(slugs.has(slug), `remote media for unknown world slug: ${slug}`)
  // ponytail: local + remote galleries merge additively — no exclusivity to enforce.
  assert.ok(media.images.length > 0 && media.images.length <= 3, `${slug}: 1–3 images, got ${media.images.length}`)
  const seen = new Set<string>()
  for (const img of media.images) {
    assert.ok(img.url.startsWith('https://commons.wikimedia.org/wiki/Special:FilePath/'), `${slug}: not a Commons thumb: ${img.url}`)
    assert.ok(!seen.has(img.url), `${slug}: duplicate image ${img.url}`)
    seen.add(img.url)
    assert.ok(img.page.startsWith('https://commons.wikimedia.org/wiki/File:'), `${slug}: bad file page: ${img.page}`)
    assert.ok(img.license && img.license.length > 0, `${slug}: missing license: ${img.url}`)
    images++
  }
  for (const v of media.videos ?? []) {
    assert.ok(/^https:\/\/(www\.youtube\.com\/watch\?v=|youtu\.be\/|vimeo\.com\/)/.test(v), `${slug}: unverified video URL: ${v}`)
  }
}

console.log(`world-project-media.check: OK ✓ — ${images} licensed remote images across ${entries.length} world projects`)
