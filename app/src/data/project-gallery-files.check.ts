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

console.log(`project-gallery-files.check: OK ✓ — ${checked} local images resolved across ${PROJECTS.length} projects`)
