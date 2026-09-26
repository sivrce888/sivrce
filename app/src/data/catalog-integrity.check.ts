/**
 * Catalog reference-integrity gate — the static dev/project/building catalog
 * (professionals.ts, buildings.ts) must never ship a broken reference:
 * dangling developer/project slugs, duplicate slugs, junk GE districts,
 * out-of-country GE coords or a non-https/unknown-slug source link.
 *
 * Complements the geo/location checks (georgia-locations, district-canon) —
 * this one owns entity references, not geography vocabulary.
 * Locked by prebuild; regenerate source links via scripts/derive-project-sources.ts.
 */
import assert from 'node:assert/strict'
import { PROJECTS, DEVELOPERS } from './professionals'
import { BUILDINGS } from './buildings'
import { GEO_CITIES } from './georgia-locations'
import { canonicalizeDistrict } from '../lib/district-canon'
import PROJECT_SOURCES from './project-sources.gen.json'

const GE = new Set(GEO_CITIES)

// Slugs are the catalog's only key — duplicates would silently shadow rows.
const devSlugs = new Set<string>()
for (const d of DEVELOPERS) {
  assert.ok(!devSlugs.has(d.slug), `duplicate developer slug: ${d.slug}`)
  devSlugs.add(d.slug)
}

const projSlugs = new Set<string>()
for (const p of PROJECTS) {
  assert.ok(!projSlugs.has(p.slug), `duplicate project slug: ${p.slug}`)
  projSlugs.add(p.slug)
}

const bldSlugs = new Set<string>()
for (const b of BUILDINGS) {
  assert.ok(!bldSlugs.has(b.slug), `duplicate building slug: ${b.slug}`)
  bldSlugs.add(b.slug)
}

// Every developer/project reference must resolve — a dangling slug renders
// nothing and lies to the user about attribution.
for (const p of PROJECTS) {
  assert.ok(
    !p.developerSlug || devSlugs.has(p.developerSlug),
    `project ${p.slug} points at missing developer ${p.developerSlug}`,
  )
}
for (const b of BUILDINGS) {
  assert.ok(
    !b.developerSlug || devSlugs.has(b.developerSlug),
    `building ${b.slug} points at missing developer ${b.developerSlug}`,
  )
  assert.ok(
    !b.projectSlug || projSlugs.has(b.projectSlug),
    `building ${b.slug} points at missing project ${b.projectSlug}`,
  )
}

// GE rows: district must be canonical (or absent — never junk), coords in Georgia.
for (const p of PROJECTS) {
  if (!GE.has(p.city)) continue
  assert.ok(
    !p.district || canonicalizeDistrict(p.district, p.city),
    `project ${p.slug}: non-canonical GE district ${JSON.stringify(p.district)}`,
  )
  const { lat, lng } = p.coords
  assert.ok(
    lat >= 40.9 && lat <= 43.6 && lng >= 39.9 && lng <= 46.8,
    `project ${p.slug}: coords outside Georgia (${lat}, ${lng})`,
  )
}

// Source links: https only, and every generated crosswalk entry must resolve.
const httpsUrl = (slug: string, url: string) =>
  assert.ok(url.startsWith('https://'), `project ${slug}: non-https sourceUrl ${url}`)
for (const p of PROJECTS) if (p.sourceUrl) httpsUrl(p.slug, p.sourceUrl)
const sources = PROJECT_SOURCES as Record<string, string>
for (const [slug, url] of Object.entries(sources)) {
  assert.ok(projSlugs.has(slug), `project-sources.gen.json: unknown project slug ${slug}`)
  httpsUrl(slug, url)
}

console.log(`catalog-integrity: ok (${PROJECTS.length} projects, ${DEVELOPERS.length} developers, ${BUILDINGS.length} buildings, ${Object.keys(sources).length} source links)`)
