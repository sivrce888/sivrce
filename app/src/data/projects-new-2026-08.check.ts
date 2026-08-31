/**
 * Catalog integrity for the 2026-08 new-build batch.
 * Run: npx tsx src/data/projects-new-2026-08.check.ts
 */
import assert from 'node:assert/strict'
import { DEVELOPERS, PROJECTS } from './professionals'
import { NEW_DEVELOPERS_2026_08, NEW_PROJECTS_2026_08 } from './projects-new-2026-08'
import footprintJson from './building-footprints.json'

const slugs = PROJECTS.map((p) => p.slug)
assert.equal(new Set(slugs).size, slugs.length, 'duplicate project slug')

const devSlugs = DEVELOPERS.map((d) => d.slug)
assert.equal(new Set(devSlugs).size, devSlugs.length, 'duplicate developer slug')

for (const p of NEW_PROJECTS_2026_08) {
  assert.ok(slugs.includes(p.slug), `wired: ${p.slug}`)
  assert.ok(devSlugs.includes(p.developerSlug), `dev missing: ${p.developerSlug} (${p.slug})`)
  assert.ok(/\d/.test(p.location), `street number: ${p.slug}`)
  assert.ok(p.img.startsWith('/images/projects/') && p.img.endsWith('.webp'), `img: ${p.slug}`)
  assert.ok(Number.isFinite(p.coords.lat) && Number.isFinite(p.coords.lng), `coords: ${p.slug}`)
  assert.ok(p.done >= 0 && p.done <= 100, `done: ${p.slug}`)
  assert.ok(p.description.ka.length > 40 && p.description.en.length > 40, `copy: ${p.slug}`)
}

for (const d of NEW_DEVELOPERS_2026_08) {
  assert.ok(devSlugs.includes(d.slug), `wired dev: ${d.slug}`)
}

const fps = footprintJson.footprints as Record<
  string,
  { ring?: unknown[]; parts?: unknown[] } | null
>
/** Official outline miss — square until NAPR CadRepGeo is up / OSM has the shell. */
const TAS_PENDING = new Set([
  'harmonica-green-cape',
  'dreamland-oasis',
  'swissotel-beach-resort-kobuleti',
])

for (const p of NEW_PROJECTS_2026_08) {
  const a = fps[`bldg-${p.slug}`]
  const b = fps[`dev-${p.slug}`]
  const fp = [a, b].find((x) => x && ((x.ring && x.ring.length >= 5) || (x.parts && x.parts.length >= 1)))
  assert.ok(`bldg-${p.slug}` in fps || `dev-${p.slug}` in fps, `footprint key ${p.slug}`)
  if (p.city === 'თბილისი' && !TAS_PENDING.has(p.slug)) {
    assert.ok(fp, `Tbilisi ${p.slug} missing footprint`)
  }
}

const uc = PROJECTS.filter((p) => p.done < 100)
assert.ok(uc.length >= 255, `under-construction too thin: ${uc.length}`)
assert.ok(PROJECTS.length >= 310, `catalog too thin: ${PROJECTS.length}`)

console.log(`projects-new-2026-08: +${NEW_PROJECTS_2026_08.length} projects, catalog ${PROJECTS.length}, UC ${uc.length} ✓`)
