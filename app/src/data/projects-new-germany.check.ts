/**
 * Catalog integrity for the Germany expansion (beyond Berlin).
 * Run: npx tsx src/data/projects-new-germany.check.ts
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { DEVELOPERS, PROJECTS } from './professionals'
import { NEW_DEVELOPERS_GERMANY, NEW_PROJECTS_GERMANY } from './projects-new-germany'
import { ON_REQUEST } from '../lib/directory-seo-lite'
import { MARKETS } from '../lib/markets'
import { DE_CITIES as DE_CITY_ROWS } from '../lib/countries/de'

// Renders wired by withDERenders must exist on disk — a catalog regen without
// scripts/gen-project-renders.ts would otherwise 404 every DE gallery.
for (const p of PROJECTS) {
  for (const src of p.gallery ?? []) {
    assert.ok(fs.existsSync(path.join(process.cwd(), 'public', src)), `render file: ${src}`)
  }
}

// Launch-city ka names derive from the market registry (no hardcoded drift);
// developers may sit in extra Ruhr metros (Gelsenkirchen) outside the 16.
const LAUNCH_CITIES = DE_CITY_ROWS.filter((c) => MARKETS.de.citySlugs.includes(c.slug)).map((c) => c.ka)
const DE_CITIES = [...LAUNCH_CITIES, 'გელზენკირხენი']
const devSlugs = DEVELOPERS.map((d) => d.slug)

for (const d of NEW_DEVELOPERS_GERMANY) {
  assert.ok(devSlugs.includes(d.slug), `wired dev: ${d.slug}`)
  assert.ok(DE_CITIES.includes(d.city), `de city: ${d.slug}`)
  assert.ok(d.description.ka.length > 40 && d.description.en.length > 40, `dev copy: ${d.slug}`)
  assert.ok((d.description.de?.length ?? 0) > 40, `dev de copy: ${d.slug}`)
  assert.ok(d.website?.startsWith('https://'), `official site: ${d.slug}`)
  // Never a placeholder phone — unpublished is '' (UI hides it).
  assert.ok(!d.phone?.includes('000000'), `fake phone: ${d.slug}`)
}

// Unpublished price is exactly the shared marker — UI translates it per locale
// (priceFromLabel); a stray '' or other placeholder would leak raw. Global:
// every catalog (Tbilisi, Batumi, Berlin, …) obeys the same marker contract.
for (const p of PROJECTS) {
  assert.ok(
    p.priceFromM2 === '' || /\d/.test(p.priceFromM2) || p.priceFromM2 === ON_REQUEST,
    `priceFromM2 marker: ${p.slug}`,
  )
}

for (const p of NEW_PROJECTS_GERMANY) {
  // Landmark/masterplan rows without an attributable developer (Project docs)
  // must carry provenance instead — never a dev-less, source-less row.
  if (p.developerSlug === undefined) {
    assert.ok(p.sourceUrl?.startsWith('https://'), `dev-less row needs sourceUrl: ${p.slug}`)
  } else {
    assert.ok(devSlugs.includes(p.developerSlug), `dev missing: ${p.developerSlug} (${p.slug})`)
  }
  assert.ok(DE_CITIES.includes(p.city), `de city: ${p.slug}`)
  assert.ok(/\d/.test(p.location), `street/postal number: ${p.slug}`)
  assert.ok(p.img.startsWith('/images/') && p.img.endsWith('.webp'), `img: ${p.slug}`)
  // Germany bounding box (DE city anchors, not survey pins).
  assert.ok(p.coords.lat >= 47.2 && p.coords.lat <= 55.2 && p.coords.lng >= 5.8 && p.coords.lng <= 15.2, `de box: ${p.slug}`)
  assert.ok(p.done >= 0 && p.done <= 100, `done: ${p.slug}`)
  assert.ok(p.flats > 0 && p.rating >= 4 && p.rating <= 5, `stats: ${p.slug}`)
  assert.ok(p.description.ka.length > 40 && p.description.en.length > 40, `copy: ${p.slug}`)
  assert.ok((p.description.de?.length ?? 0) > 40, `de copy: ${p.slug}`)
  assert.ok(p.sourceUrl?.startsWith('https://'), `sourceUrl: ${p.slug}`)
}

const slugs = PROJECTS.map((p) => p.slug)
assert.equal(new Set(slugs).size, slugs.length, 'duplicate project slug')
assert.equal(new Set(DEVELOPERS.map((d) => d.slug)).size, DEVELOPERS.length, 'duplicate developer slug')

for (const city of DE_CITIES) {
  const n = PROJECTS.filter((p) => p.city === city).length
  assert.ok(n >= (city === 'ბერლინი' ? 17 : 0), `catalog ${city}: ${n}`)
}
const deCities = PROJECTS.filter((p) => DE_CITIES.includes(p.city) && p.city !== 'ბერლინი')
assert.ok(deCities.length >= 4, `germany-wide too thin: ${deCities.length}`)

console.log(
  `projects-new-germany: +${NEW_DEVELOPERS_GERMANY.length} devs / +${NEW_PROJECTS_GERMANY.length} projects, DE cities covered: ${[...new Set(NEW_PROJECTS_GERMANY.map((p) => p.city))].length} ✓`,
)
