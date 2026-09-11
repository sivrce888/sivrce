/**
 * Catalog integrity for the Berlin launch batch.
 * Run: npx tsx src/data/projects-new-berlin.check.ts
 */
import assert from 'node:assert/strict'
import { DEVELOPERS, PROJECTS } from './professionals'
import { NEW_DEVELOPERS_BERLIN, NEW_PROJECTS_BERLIN } from './projects-new-berlin'

const slugs = PROJECTS.map((p) => p.slug)
assert.equal(new Set(slugs).size, slugs.length, 'duplicate project slug')

const devSlugs = DEVELOPERS.map((d) => d.slug)
assert.equal(new Set(devSlugs).size, devSlugs.length, 'duplicate developer slug')

for (const p of NEW_PROJECTS_BERLIN) {
  assert.ok(slugs.includes(p.slug), `wired: ${p.slug}`)
  assert.ok(devSlugs.includes(p.developerSlug), `dev missing: ${p.developerSlug} (${p.slug})`)
  assert.equal(p.city, 'ბერლინი', `city: ${p.slug}`)
  assert.ok(/\d/.test(p.location), `street number: ${p.slug}`)
  assert.ok(p.img.startsWith('/images/') && p.img.endsWith('.webp'), `img: ${p.slug}`)
  assert.ok(
    p.coords.lat >= 52.3 && p.coords.lat <= 52.7 && p.coords.lng >= 13.0 && p.coords.lng <= 13.8,
    `berlin box: ${p.slug}`,
  )
  assert.ok(p.done >= 0 && p.done <= 100, `done: ${p.slug}`)
  assert.ok(p.flats > 0 && p.rating >= 4 && p.rating <= 5, `stats: ${p.slug}`)
  assert.ok(p.description.ka.length > 40 && p.description.en.length > 40, `copy: ${p.slug}`)
  assert.ok((p.description.de?.length ?? 0) > 40, `de copy: ${p.slug}`)
  assert.ok(p.sourceUrl?.startsWith('https://'), `sourceUrl: ${p.slug}`)
}

for (const d of NEW_DEVELOPERS_BERLIN) {
  assert.ok(devSlugs.includes(d.slug), `wired dev: ${d.slug}`)
  assert.equal(d.city, 'ბერლინი', `dev city: ${d.slug}`)
  assert.ok(d.description.ka.length > 40 && d.description.en.length > 40, `dev copy: ${d.slug}`)
  assert.ok((d.description.de?.length ?? 0) > 40, `dev de copy: ${d.slug}`)
}

const berlinProjects = PROJECTS.filter((p) => p.city === 'ბერლინი')
assert.ok(berlinProjects.length >= 17, `berlin catalog too thin: ${berlinProjects.length}`)
const berlinUC = berlinProjects.filter((p) => p.done < 100)
assert.ok(berlinUC.length >= 15, `berlin active too thin: ${berlinUC.length}`)

console.log(
  `projects-new-berlin: +${NEW_PROJECTS_BERLIN.length} projects / +${NEW_DEVELOPERS_BERLIN.length} devs, berlin ${berlinProjects.length} (${berlinUC.length} active) ✓`,
)
