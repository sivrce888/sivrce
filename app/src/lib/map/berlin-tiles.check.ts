/**
 * Self-check: Berlin tile binder contracts (no MapLibre runtime).
 * Run: npx tsx src/lib/map/berlin-tiles.check.ts
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { BERLIN_BBOX } from './berlin-gov'
import { BERLIN_TILE_BOUNDS, BERLIN_TILE_LAYER_IDS, berlinPickFromProps } from './berlin-tiles'

assert.ok(BERLIN_TILE_LAYER_IDS.includes('sv-alkis-extrude'))
assert.ok(BERLIN_TILE_LAYER_IDS.includes('sv-step-potential-circle'))
assert.ok(BERLIN_TILE_LAYER_IDS.includes('sv-parcel-fill'))
assert.ok(BERLIN_TILE_LAYER_IDS.includes('sv-bplan-fest-fill'))
assert.equal(BERLIN_TILE_LAYER_IDS[0], 'sv-alkis-extrude')
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
assert.ok(BERLIN_TILE_LAYER_IDS.includes('sv-step-konzept-fill'))
assert.ok(src.includes('mouseenter'))
assert.ok(!src.includes('berlin-gov'), 'client binder must not import WFS fetchers')
assert.ok(!src.includes('buildings.ts'), 'must not pull heavy buildings corpus')
assert.ok(!/from ['\"]@\/data\//.test(src))
assert.ok(!src.includes('BRAND.violet') && !src.includes('C.violet'), 'violet fill banned')
assert.ok(src.includes('BRAND.colors') || src.includes('C.blue'))

const ingest = readFileSync(join(process.cwd(), 'scripts/ingest-alkis-buildings.ts'), 'utf8')
assert.ok(ingest.includes('INSERT INTO geo_features'), 'ALKIS ingest must dual-write MVT table')
assert.ok(ingest.includes('INSERT INTO osm_buildings'))
assert.ok(!ingest.includes("COALESCE(NULLIF(x->>'heightM'"), 'must not invent height_m=12')

const fakeH = berlinPickFromProps({
  kind: 'alkis_building',
  id: '1',
  height: 12,
  height_source: 'default_12',
})
assert.equal(fakeH.height, null, 'invented 12 m must not surface as fact')
assert.equal(fakeH.source, 'alkis')

const realH = berlinPickFromProps({
  kind: 'alkis_building',
  id: '2',
  height: 18.5,
  height_source: 'hoh',
  floors: 5,
  funktion: 'Wohngebäude',
})
assert.equal(realH.height, 18.5)
assert.equal(realH.heightSource, 'hoh')
assert.equal(realH.floors, 5)

const plan = berlinPickFromProps({
  kind: 'bplan_festgesetzt',
  id: 'g1',
  name: '1-2b',
  status: 'In Kraft getreten',
  planart: 'Qualifizierter B-Plan',
  doc: 'https://mitte.gis-broker.de/bplaene/x.pdf',
})
assert.equal(plan.source, 'bplan')
assert.equal(plan.name, '1-2b')
assert.equal(plan.doc, 'https://mitte.gis-broker.de/bplaene/x.pdf')

const poisoned = berlinPickFromProps({
  kind: 'bplan_festgesetzt',
  id: 'x',
  doc: 'javascript:alert(1)',
})
assert.equal(poisoned.doc, null, 'tile PDF must pass official host allow-list')

const map3d = readFileSync(join(process.cwd(), 'src/components/map/Map3D.tsx'), 'utf8')
assert.ok(!map3d.includes("hit?.source === 'step'"), 'ALKIS/B-Plan clicks must open panel')
assert.ok(map3d.includes('pickBerlinFeature('))

const search = readFileSync(join(process.cwd(), 'src/components/search/SearchMapView.tsx'), 'utf8')
assert.ok(search.includes('pickBerlinFeature('))
assert.ok(search.includes('BerlinFeaturePanel'))

console.log('berlin-tiles: contracts ✓')
