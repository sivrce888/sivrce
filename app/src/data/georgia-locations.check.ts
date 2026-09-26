/**
 * Runnable check: tsx src/data/georgia-locations.check.ts
 *
 * LocationPicker (client) reads districts from this catalog instead of
 * data/listings, which kept the ~1.1 MB LISTINGS array out of the browser
 * bundle. That swap is only safe while the catalog is a superset of every
 * district our inventory actually uses — this check is that lock.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { LISTINGS, districtsOf } from './listings'
import { GEO_ALL_PLACES, GEO_CITIES, GEO_MUNICIPALITIES, geoDistrictsOf, geoMuniSeat } from './georgia-locations'
import { PROJECTS } from './professionals'
import { BUILDINGS } from './buildings'
import { CITIES, DISTRICTS } from '../lib/directory-seo-lite'
import { NEIGHBORHOODS } from './neighborhoods'

assert.ok(GEO_CITIES.length > 50, `expected a real city catalog, got ${GEO_CITIES.length}`)
assert.ok(GEO_ALL_PLACES.length >= GEO_CITIES.length)

// ——— superset lock: every district reachable from inventory is in the catalog ———
const cities = new Set(LISTINGS.filter((l) => !l.country || l.country === 'GE').map((l) => l.city))
for (const city of [undefined, ...cities]) {
  const geo = geoDistrictsOf(city)
  const missing = districtsOf(city).filter((d) => !geo.includes(d))
  assert.deepEqual(
    missing,
    [],
    `${city ?? '(all cities)'}: districts missing from georgia-locations.json — ` +
      `add them there or LocationPicker silently drops them`,
  )
}

// ——— reverse locks: every registry may only reference catalog districts ———
// Filters/display join on the catalog ka name; an unresolvable district is a
// silent drop for users. Missing district is fine ("not publicly verified");
// a present-but-unresolvable one is not.
const GE_CITIES = new Set(GEO_CITIES)
const inCatalog = (d: string, city: string) => geoDistrictsOf(city).includes(d)

const projectFails = PROJECTS.filter(
  (p) => GE_CITIES.has(p.city) && p.district && !inCatalog(p.district, p.city),
)
assert.deepEqual(
  projectFails.map((p) => `${p.slug}: '${p.district}'`),
  [],
  'projects with districts outside georgia-locations.json — ' +
    're-run scripts/derive-project-districts.ts or extend district-canon ALIAS',
)

const buildingFails = BUILDINGS.filter(
  (b) => geoDistrictsOf(b.city).length > 0 && b.district && !inCatalog(b.district, b.city),
)
assert.deepEqual(
  buildingFails.map((b) => `${b.slug}: '${b.district}'`),
  [],
  'buildings with districts outside georgia-locations.json — ' +
    'fix the source project or the placeFrom derivation',
)

// SEO district pages (GE markets) must resolve, else they render empty shells.
const cityKaBySlug = new Map(CITIES.map((c) => [c.slug, c.ka] as const))
const seoFails = DISTRICTS.filter((d) => {
  const cka = cityKaBySlug.get(d.citySlug)
  return cka !== undefined && GE_CITIES.has(cka) && !inCatalog(d.ka, cka) && d.ka !== cka
})
assert.deepEqual(
  seoFails.map((d) => `${d.citySlug}/${d.slug}: '${d.ka}'`),
  [],
  'directory-seo DISTRICTS pointing outside georgia-locations.json',
)

// Neighborhood guides link their listings by these district values.
const hoodFails = NEIGHBORHOODS.filter((n) => {
  if (!GE_CITIES.has(n.cityKey)) return false
  const valid = new Set([n.cityKey, ...geoDistrictsOf(n.cityKey)])
  return n.districts.some((d) => !valid.has(d))
})
assert.deepEqual(
  hoodFails.map((n) => n.slug),
  [],
  'neighborhood guides referencing non-catalog districts',
)

// ——— bundle lock ———
const picker = readFileSync(
  new URL('../components/search/LocationPicker.tsx', import.meta.url),
  'utf8',
)
assert.ok(
  !/from\s+['"]@\/data\/listings['"]/.test(picker.replace(/import\s+type[^\n]*\n/g, '')),
  'LocationPicker must not value-import @/data/listings (ships the catalog to the browser)',
)

console.log(
  `georgia-locations.check: ok — ${GEO_CITIES.length} cities, ${geoDistrictsOf().length} districts`,
)

// Municipality → seat city (nominative) for non-ka labels.
{
  assert.equal(geoMuniSeat('აბაშის მუნიციპალიტეტი'), 'აბაშა')
  assert.equal(geoMuniSeat('ახალციხის მუნიციპალიტეტი'), 'ახალციხე')
  assert.equal(geoMuniSeat('გარდაბნის მუნიციპალიტეტი'), 'გარდაბანი')
  assert.equal(geoMuniSeat('საგარეჯოს მუნიციპალიტეტი'), 'საგარეჯო')
  assert.equal(geoMuniSeat('თბილისი'), null)
  const unresolved = GEO_MUNICIPALITIES.filter((m) => /მუნიციპალიტეტი$|რაიონი$/.test(m) && !geoMuniSeat(m))
  assert.deepEqual(unresolved, [], 'every municipality resolves to its seat city')
}
