/**
 * Run: npx tsx src/lib/countries/de-berlin.check.ts
 * Validates the project→Bezirk join and derived stats before pages ship.
 */
import assert from 'node:assert/strict'
import { BERLIN_BEZIRKE } from '@/lib/countries/de'
import { BERLIN_ORTSTEILE } from '@/data/berlin-ortsteile'
import { NEW_PROJECTS_BERLIN } from '@/data/projects-new-berlin'
import { NEW_DEVELOPERS_BERLIN } from '@/data/projects-new-berlin'
import {
  bezirkBySlug,
  bezirkCenter,
  bezirkSlugOfProject,
  bezirkStats,
  developersOfBezirk,
  ortsteileOfBezirk,
} from '@/lib/countries/de-berlin'

// Every Bezirk resolves and has Ortsteile from the OSM table.
const bezirkSlugs = new Set(BERLIN_BEZIRKE.map((b) => b.slug))
assert.equal(BERLIN_BEZIRKE.length, 12)
for (const o of BERLIN_ORTSTEILE) {
  assert.ok(bezirkSlugs.has(o.bezirk), `ortsteil ${o.de} references unknown bezirk ${o.bezirk}`)
}
assert.equal(
  BERLIN_ORTSTEILE.length,
  new Set(BERLIN_ORTSTEILE.map((o) => o.slug)).size,
  'duplicate ortsteil slug',
)
assert.equal(BERLIN_ORTSTEILE.length, 96, 'Berlin has 96 official Ortsteile')

// Every catalog project joins onto a valid Bezirk; count the coords fallbacks.
let fallbacks = 0
const perBezirk = new Map<string, number>()
for (const p of NEW_PROJECTS_BERLIN) {
  const bez = bezirkSlugOfProject(p)
  assert.ok(bezirkSlugs.has(bez), `project ${p.slug} → unknown bezirk ${bez}`)
  perBezirk.set(bez, (perBezirk.get(bez) ?? 0) + 1)
  const byLabel =
    p.district &&
    (BERLIN_BEZIRKE.some((b) => b.ka === p.district) ||
      ['კროიცბერგი', 'პრენცლაუერ-ბერგი', 'ფრიდრიხსფელდე', 'შონებერგი', 'ტემპელჰოფი', 'ლიხტერფელდე', 'რაინიკენდორფი', 'შარლოტენბურგი'].includes(p.district))
  if (!byLabel) fallbacks++
}
// ponytail: coords fallback is the backstop, not the rule — raise the ceiling
// by adding ka labels to KA_ORTSTEIL_TO_BEZIRK when this climbs.
assert.ok(fallbacks <= NEW_PROJECTS_BERLIN.length * 0.2, `${fallbacks} projects fell back to nearest-ortsteil`)

// The join must be lossless: per-Bezirk counts sum to the catalog.
const total = [...perBezirk.values()].reduce((a, b) => a + b, 0)
assert.equal(total, NEW_PROJECTS_BERLIN.length, 'bezirk join lost or duplicated projects')
// Catalog currently reaches every Bezirk; tolerate trims down to 8 before
// someone ships a broken join that dumps everything into one bucket.
assert.ok(perBezirk.size >= 8, `join reached only ${perBezirk.size} Bezirke`)

// Stats stay consistent for every Bezirk, empty ones included.
for (const b of BERLIN_BEZIRKE) {
  const s = bezirkStats(b.slug)
  assert.ok(s.projects >= 0 && s.pipelineUnits >= 0 && s.ortsteile > 0, `stats ${b.slug}`)
  assert.ok(s.medianEurM2 === null || (s.medianEurM2 > 1000 && s.medianEurM2 < 30000), `median ${b.slug} ${s.medianEurM2}`)
  assert.ok(s.developers === developersOfBezirk(b.slug).length, `dev count ${b.slug}`)
  assert.ok(s.ortsteile === ortsteileOfBezirk(b.slug).length, `ortsteil count ${b.slug}`)
  const c = bezirkCenter(b.slug)
  assert.ok(c && c.lat > 52.3 && c.lat < 52.75 && c.lng > 13.0 && c.lng < 13.7, `center ${b.slug} outside Berlin`)
  assert.ok(bezirkBySlug(b.slug)?.de, `bezirk de label ${b.slug}`)
}

// Every developer referenced by a Berlin project exists in either batch.
import { NEW_DEVELOPERS_GERMANY } from '@/data/projects-new-germany'
const devSlugs = new Set([...NEW_DEVELOPERS_BERLIN, ...NEW_DEVELOPERS_GERMANY].map((d) => d.slug))
for (const p of NEW_PROJECTS_BERLIN) {
  assert.ok(devSlugs.has(p.developerSlug ?? ""), `project ${p.slug} references missing developer ${p.developerSlug}`)
}

console.log(
  `ok: ${NEW_PROJECTS_BERLIN.length} projects joined 12 Bezirke (${fallbacks} coords fallbacks), ` +
    `${[...perBezirk.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}:${v}`).join(' ')}`,
)
