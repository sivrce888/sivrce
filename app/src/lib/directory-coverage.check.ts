/**
 * Runnable check: npx tsx src/lib/directory-coverage.check.ts
 *
 * SIVRCE — directory coverage gate. Every developer / project / building a
 * user can search for must be reachable (page + sitemap) with a contact
 * path, real media and geo. Fails the build on structural rot; prints
 * richness stats (contact %, gallery %) as crawlable console output.
 *
 * DB-free by design: asserts the static corpus (DB rows merge over it at
 * runtime via directory-live, validated by import-korter.check.ts). Importing
 * directory-live here would construct the Prisma pool and crash prebuild
 * without DATABASE_URL — the two trivial predicates below mirror it.
 * ponytail: one file, zero deps; ceiling is live-DB spot checks in the
 * admin intel center, not in the build chain.
 */
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { DEVELOPERS, PROJECTS } from "../data/professionals"
import { NEIGHBORHOODS } from "../data/neighborhoods"

// Mirrors isPlaceholderImg / isValidCoords in lib/directory-live.ts (db-coupled).
const isRealImg = (s: string | undefined): boolean =>
  !!s && (!s.startsWith("/images/") || s.startsWith("/images/projects/"))
const hasCoords = (lat: unknown, lng: unknown): boolean =>
  typeof lat === "number" &&
  typeof lng === "number" &&
  Number.isFinite(lat) &&
  Number.isFinite(lng) &&
  !(Math.abs(lat) < 0.01 && Math.abs(lng) < 0.01)

// ── Developers: resolvable slugs, reachable + contactable ──
assert.ok(DEVELOPERS.length >= 150, `developer corpus shrank to ${DEVELOPERS.length}`)
assert.equal(new Set(DEVELOPERS.map((d) => d.slug)).size, DEVELOPERS.length, "dup developer slug")
for (const d of DEVELOPERS) {
  assert.ok(d.slug && d.name.en && d.city, `developer missing identity: ${d.slug}`)
}
const contactable = DEVELOPERS.filter((d) => d.phone || d.website || d.ownerId).length
assert.ok(
  contactable / DEVELOPERS.length >= 0.85,
  `only ${contactable}/${DEVELOPERS.length} developers have a contact path`,
)

// ── Projects: media + geo + resolvable developer link ──
assert.ok(PROJECTS.length >= 400, `project corpus shrank to ${PROJECTS.length}`)
assert.equal(new Set(PROJECTS.map((p) => p.slug)).size, PROJECTS.length, "dup project slug")
const devSlugs = new Set(DEVELOPERS.map((d) => d.slug))
for (const p of PROJECTS) {
  assert.ok(p.slug && p.name && p.city, `project missing identity: ${p.slug}`)
  assert.ok(hasCoords(p.coords?.lat, p.coords?.lng), `project lost geo: ${p.slug}`)
  assert.ok(!p.developerSlug || devSlugs.has(p.developerSlug), `dangling developer: ${p.slug}`)
}
const realImgs = PROJECTS.filter((p) => isRealImg(p.img)).length
assert.ok(realImgs / PROJECTS.length >= 0.95, `only ${realImgs}/${PROJECTS.length} projects have renders`)

// ── Neighborhood guides: every guide links districts + pin + hero ──
for (const n of NEIGHBORHOODS) {
  assert.ok(n.districts.length > 0, `guide without districts: ${n.slug}`)
  assert.ok(hasCoords(n.coords.lat, n.coords.lng), `guide without coords: ${n.slug}`)
  assert.ok(n.img, `guide without hero: ${n.slug}`)
}

// ── Wiring: sitemap + entity pages consume the live corpus + intel surface ──
const root = process.cwd()
const read = (rel: string): string => readFileSync(join(root, rel), "utf8")
const sitemap = read("src/app/sitemap.ts")
for (const need of ["developersLive", "projectsLive", "/developers/${", "/projects/${"]) {
  assert.ok(sitemap.includes(need), `sitemap.ts missing ${need}`)
}
const projectPage = read("src/app/[lang]/projects/[slug]/page.tsx")
for (const need of ["PlaceContext", "SourcesSection", "projectsLiveByDeveloper", "getLiveProject"]) {
  assert.ok(projectPage.includes(need), `project page missing ${need}`)
}
const devPage = read("src/app/[lang]/developers/[slug]/page.tsx")
for (const need of ["PlaceContext", "projectsLiveByDeveloper", "getLiveDeveloper"]) {
  assert.ok(devPage.includes(need), `developer page missing ${need}`)
}

console.log(
  `directory-coverage: ${DEVELOPERS.length} devs (${contactable} contactable), ` +
    `${PROJECTS.length} projects (${realImgs} renders, ${PROJECTS.filter((p) => p.gallery?.length).length} galleries), ` +
    `${NEIGHBORHOODS.length} guides ✓`,
)
