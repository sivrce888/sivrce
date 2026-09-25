/**
 * Derives missing/junk district values for GE projects into
 * src/data/project-districts.gen.json — merged into PROJECTS in
 * professionals.ts via withDistrictOverride.
 *
 * Derivation order: Tbilisi raion polygon hit from project coords
 * (tbilisi-raions.json, OSM) → catalog district named in the location blob
 * (district-canon aliases) → canonicalized current value. Unresolvable junk
 * (city-as-district, street/lane names) is cleared — never invented.
 *
 * Re-run after new project ingests: tsx scripts/derive-project-districts.ts
 * Locked by src/data/georgia-locations.check.ts.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { PROJECTS } from '../src/data/professionals'
import { GEO_CITIES, geoDistrictsOf } from '../src/data/georgia-locations'
import { canonicalizeDistrict } from '../src/lib/district-canon'
import raions from '../src/data/tbilisi-raions.json'

type Ring = [number, number][]

function inRing(ring: Ring, lng: number, lat: number): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]!
    const [xj, yj] = ring[j]!
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

function tbilisiRaion(lat: number, lng: number): string | undefined {
  for (const f of raions.features) {
    const ring = (f.geometry.coordinates as unknown as Ring[])[0]
    if (ring && inRing(ring, lng, lat)) return f.properties.name
  }
  return undefined
}

const GE_CITIES = new Set(GEO_CITIES)
const resolves = (d: string, city: string) => geoDistrictsOf(city).includes(d)

const GEN_URL = new URL('../src/data/project-districts.gen.json', import.meta.url)
// ponytail: PROJECTS already merges this file via withDistrictOverride, so
// resolved rows skip derivation — start from the previous overrides or a
// re-run silently wipes them.
const out: Record<string, string> = existsSync(GEN_URL)
  ? (JSON.parse(readFileSync(GEN_URL, 'utf8')) as Record<string, string>)
  : {}
let derived = 0
let cleared = 0
for (const p of PROJECTS) {
  if (!GE_CITIES.has(p.city)) continue
  const cur = p.district?.trim() ?? ''
  if (cur && resolves(cur, p.city)) continue

  let next: string | undefined
  if (p.city === 'თბილისი') next = tbilisiRaion(p.coords.lat, p.coords.lng)
  if (!next) {
    for (const part of p.location.split(',').map((s) => s.trim()).filter(Boolean)) {
      const canon = canonicalizeDistrict(part, p.city)
      if (canon && resolves(canon, p.city)) {
        next = canon
        break
      }
    }
  }
  if (next === undefined && cur) {
    const canon = canonicalizeDistrict(cur, p.city)
    next = canon && resolves(canon, p.city) ? canon : ''
  }
  if (next === undefined || next === cur) continue
  out[p.slug] = next
  if (next === '') cleared++
  else derived++
}

writeFileSync(GEN_URL, JSON.stringify(out, null, 1) + '\n')
console.log(
  `derive-project-districts: ${derived} derived, ${cleared} cleared, ${Object.keys(out).length} overrides written`,
)
