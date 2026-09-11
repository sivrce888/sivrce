/**
 * Self-check: Berlin tile binder contracts (no MapLibre runtime).
 * Run: npx tsx src/lib/map/berlin-tiles.check.ts
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { BERLIN_BBOX } from './berlin-gov'
import { BERLIN_TILE_BOUNDS, BERLIN_TILE_LAYER_IDS } from './berlin-tiles'

assert.ok(BERLIN_TILE_LAYER_IDS.includes('sv-alkis-extrude'))
assert.ok(BERLIN_TILE_LAYER_IDS.includes('sv-step-potential-circle'))
assert.deepEqual(BERLIN_TILE_BOUNDS, [
  BERLIN_BBOX.west,
  BERLIN_BBOX.south,
  BERLIN_BBOX.east,
  BERLIN_BBOX.north,
])

const src = readFileSync(join(process.cwd(), 'src/lib/map/berlin-tiles.ts'), 'utf8')
assert.ok(src.includes('/api/tiles/'))
assert.ok(src.includes('source-layer'))
assert.ok(src.includes('bounds: BERLIN_TILE_BOUNDS'))
assert.ok(src.includes('opts.lite'))
assert.ok(!src.includes('berlin-gov'), 'client binder must not import WFS fetchers')
assert.ok(!src.includes('buildings.ts'), 'must not pull heavy buildings corpus')
assert.ok(!/from ['\"]@\/data\//.test(src))
assert.ok(!src.includes('BRAND.violet') && !src.includes('C.violet'), 'violet fill banned')
assert.ok(src.includes('BRAND.colors') || src.includes('C.blue'))

const ingest = readFileSync(join(process.cwd(), 'scripts/ingest-alkis-buildings.ts'), 'utf8')
assert.ok(ingest.includes('INSERT INTO geo_features'), 'ALKIS ingest must dual-write MVT table')
assert.ok(ingest.includes('INSERT INTO osm_buildings'))

console.log('berlin-tiles: contracts ✓')
