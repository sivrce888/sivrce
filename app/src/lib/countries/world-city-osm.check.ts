/**
 * Self-check for the committed world city shell.
 * Run: npx --yes tsx src/lib/countries/world-city-osm.check.ts
 * Empty dataset = skip with a hint (fetch runs separately); present data must
 * be shape-true, capped, and resolvable to a boot shell.
 */

import assert from 'node:assert/strict'
import {
  CITY_OSM_COUNT,
  CITY_OSM_FETCHED_AT,
  cityShellFor,
  cityShellPlaces,
  cityShellSlugs,
} from './world-city-osm'
import { SHELL_HOOD_CAP, SHELL_LANDMARK_CAP, SHELL_METRO_CAP } from '@/lib/map/city-shell'

if (CITY_OSM_COUNT === 0) {
  console.log('world-city-osm empty — run scripts/fetch-world-city-osm.ts; skipping')
  process.exit(0)
}

assert.match(CITY_OSM_FETCHED_AT, /^\d{4}-\d{2}-\d{2}$/, 'fetchedAt is ISO date')
const slugs = cityShellSlugs()
assert.ok(slugs.length >= 500, `shell cities ≥500, got ${slugs.length}`)

const coordOk = (v: number) => Number.isFinite(v)
let checked = 0
let hoodRows = 0
let pinRows = 0
for (const slug of slugs) {
  const { hoods, pins } = cityShellPlaces(slug)
  hoodRows += hoods.length
  pinRows += pins.length
  assert.ok(hoods.length <= SHELL_HOOD_CAP, `${slug} hood cap`)
  assert.ok(pins.length <= SHELL_LANDMARK_CAP, `${slug} landmark cap`)
  if (checked >= 25) continue
  checked++
  for (const h of hoods) {
    assert.ok(h.n.length > 0 && h.n.length <= 60, `${slug} hood name`)
    assert.ok(coordOk(h.la) && coordOk(h.ln), `${slug} hood coords`)
  }
  for (const p of pins) {
    assert.equal(p.k, 'landmark', `${slug} pin kind`)
    assert.ok(p.n.length > 0, `${slug} pin name`)
    assert.ok(coordOk(p.la) && coordOk(p.ln), `${slug} pin coords`)
  }
}

// Boot shell: rows + metro enrichment + identity fields.
const sample = slugs.find((s) => cityShellPlaces(s).hoods.length > 0) ?? slugs[0]!
const shell = cityShellFor(sample)
assert.ok(shell, `shell resolves for ${sample}`)
assert.equal(shell!.slug, sample)
assert.ok(shell!.en.length > 0 && shell!.ka.length > 0 && shell!.cc.length === 2, 'identity fields')
assert.ok(shell!.pins.length <= SHELL_LANDMARK_CAP + SHELL_METRO_CAP, 'shell pin cap')
assert.ok(shell!.hoods.length <= SHELL_HOOD_CAP, 'shell hood cap')
assert.ok(shell!.pins.some((p) => p.k === 'metro') || cityShellPlaces(sample).pins.length > 0, 'pins present')

console.log(
  `world-city-osm ok: ${CITY_OSM_COUNT} places / ${slugs.length} cities ` +
    `(${hoodRows} hoods, ${pinRows} landmarks) fetched ${CITY_OSM_FETCHED_AT}`,
)
