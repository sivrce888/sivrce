/**
 * Every local image a project card or detail gallery renders must exist in
 * public/ — a 404 hero is the single most visible trust break on a listing.
 * Also guards the split between the generated PROJECT_GALLERIES and the
 * hand-kept CURATED_GALLERIES: a slug in both means the mirror script and a
 * human are fighting over the same key.
 */
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { PROJECTS } from './professionals'
import { PROJECT_GALLERIES } from './project-galleries'
import { CURATED_GALLERIES } from './project-galleries-curated'
import { PROJECT_VIDEOS, PROJECT_FLOORPLANS, DEVELOPER_GALLERIES } from './project-media'
import { videoEmbedFor } from '../lib/listing-video'

const PUBLIC = path.join(process.cwd(), 'public')

const overlap = Object.keys(CURATED_GALLERIES).filter((s) => s in PROJECT_GALLERIES)
assert.deepEqual(overlap, [], `slug in both generated and curated galleries: ${overlap.join(', ')}`)

const missing: string[] = []
let checked = 0
for (const p of PROJECTS) {
  for (const src of [p.img, ...(p.gallery ?? [])]) {
    if (!src?.startsWith('/images/')) continue // remote/R2 assets are not ours to verify
    checked++
    if (!existsSync(path.join(PUBLIC, src.slice(1)))) missing.push(`${p.slug} → ${src}`)
  }
}
assert.deepEqual(missing.slice(0, 20), [], `${missing.length} project images missing from public/`)

// curated entries must actually be reachable through the catalog, not orphans
const slugs = new Set(PROJECTS.map((p) => p.slug))
const orphans = Object.keys(CURATED_GALLERIES).filter((s) => !slugs.has(s))
assert.deepEqual(orphans, [], `curated gallery for unknown project slug: ${orphans.join(', ')}`)

// a curated path must belong to its own slug — showing project A the photos of
// project B is the worst data lie a gallery can tell
const foreign = Object.entries(CURATED_GALLERIES).flatMap(([slug, photos]) =>
  photos.filter((src) => !src.startsWith(`/images/projects/${slug}-`)).map((src) => `${slug} → ${src}`),
)
assert.deepEqual(foreign.slice(0, 10), [], `${foreign.length} curated paths from another project: ${foreign.slice(0, 10).join(', ')}`)

// every shipped video must resolve to a real embed — a hallucinated YouTube ID
// (wrong length/charset) renders "Video unavailable" and torches trust
const badVideos = Object.entries(PROJECT_VIDEOS).filter(([, url]) => !videoEmbedFor(url))
assert.deepEqual(badVideos.slice(0, 10), [], `${badVideos.length} project videos with invalid IDs: ${badVideos.slice(0, 10).map(([s]) => s).join(', ')}`)

// developer galleries + floor plans ship as local paths — they must exist
const devMissing: string[] = []
for (const [slug, photos] of Object.entries(DEVELOPER_GALLERIES)) {
  for (const src of photos) if (!existsSync(path.join(PUBLIC, src.slice(1)))) devMissing.push(`${slug} → ${src}`)
}
for (const [slug, src] of Object.entries(PROJECT_FLOORPLANS)) {
  if (!existsSync(path.join(PUBLIC, src.slice(1)))) devMissing.push(`floorplan ${slug} → ${src}`)
}
assert.deepEqual(devMissing.slice(0, 20), [], `${devMissing.length} developer/floorplan images missing: ${devMissing.slice(0, 5).join(', ')}`)

console.log(`project-gallery-files.check: OK ✓ — ${checked} local images, ${Object.keys(PROJECT_VIDEOS).length} valid videos, ${Object.keys(DEVELOPER_GALLERIES).length} developer galleries across ${PROJECTS.length} projects`)
