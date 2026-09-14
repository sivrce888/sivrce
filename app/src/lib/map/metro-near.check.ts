/**
 * Runnable check: tsx src/lib/map/metro-near.check.ts
 *
 * metro-near is the client-safe nearest-metro plane. Two things must hold:
 *   1. it agrees with the POI corpus it replaced (same station, same distance),
 *   2. nothing on the client path imports lib/map/pois, which drags the 869 KB
 *      georgia-pois.json into the browser.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { METRO_STATIONS as CURATED } from '@/data/tbilisi-metro'
import { MAP_POIS } from './pois'
import { nearestMetro, metroMeters } from './metro-near'

// ——— 1. station parity with the OSM corpus ———
const poiMetro = MAP_POIS.filter((p) => p.category === 'metro')
assert.ok(poiMetro.length >= 22, `expected ≥22 OSM metro nodes, got ${poiMetro.length}`)

// Every curated station sits on its OSM node (Sadguris Moedani = twin nodes averaged).
for (const s of CURATED) {
  const twins = poiMetro.filter((p) => p.name === s.ka || p.name.startsWith(`${s.ka}-`))
  assert.ok(twins.length > 0, `curated station "${s.ka}" has no OSM node`)
  const lat = twins.reduce((a, p) => a + p.lat, 0) / twins.length
  const lng = twins.reduce((a, p) => a + p.lng, 0) / twins.length
  const dm = Math.hypot((lat - s.lat) * 111_320, (lng - s.lng) * 83_000)
  assert.ok(dm < 60, `curated "${s.ka}" is ${Math.round(dm)} m off its OSM node`)
}

// ——— 2. resolution behaviour over Tbilisi ———
// Freedom Square is on top of a station; Rustaveli is one stop away.
const freedom = nearestMetro(41.6934, 44.8015)
assert.ok(freedom && freedom.meters < 500, `Freedom Square should be <500 m from a station`)
assert.ok(freedom!.walkMin >= 1, 'walkMin is at least 1')
assert.equal(metroMeters(41.6934, 44.8015), freedom!.meters)

// Far outside the catchment → no chip, sentinel meters.
assert.equal(nearestMetro(41.65, 41.64), null, 'Batumi has no metro chip')
assert.equal(metroMeters(41.65, 41.64), 999_999)
assert.equal(nearestMetro(Number.NaN, 44.8), null, 'NaN coords are rejected')

// Every curated station resolves to itself within a block.
for (const s of CURATED) {
  const hit = nearestMetro(s.lat, s.lng)
  assert.ok(hit, `no metro resolved at "${s.ka}"`)
  assert.ok(hit!.meters < 900, `"${s.ka}" resolved ${hit!.meters} m away`)
}

// ——— 3. bundle lock ———
const hook = readFileSync(new URL('../../components/use-nearest-metro.ts', import.meta.url), 'utf8')
assert.ok(
  !/['"]@\/lib\/map\/pois['"]/.test(hook),
  'use-nearest-metro must lazy-import metro-near, never lib/map/pois (869 KB JSON)',
)
assert.ok(/@\/lib\/map\/metro-near/.test(hook), 'use-nearest-metro must lazy-import metro-near')

const near = readFileSync(new URL('./metro-near.ts', import.meta.url), 'utf8')
assert.ok(
  !/from\s+['"](?:@\/data\/georgia-pois\.json|@\/lib\/map\/pois|\.\/pois)['"]/.test(near),
  'metro-near must stay off the POI corpus',
)

console.log(`metro-near.check: ok — ${CURATED.length} stations, ${poiMetro.length} OSM nodes`)
