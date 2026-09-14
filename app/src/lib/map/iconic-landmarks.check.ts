/**
 * Self-check: Berliner Fernsehturm massing (no MapLibre runtime).
 * Run: npx tsx src/lib/map/iconic-landmarks.check.ts
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  FERNSEHTURM,
  FERNSEHTURM_COLORS,
  ICONIC_LAYER_ID,
  ICONIC_SOURCE_ID,
  iconicHidePolygon,
  iconicKeepFarFilter,
  iconicLandmarksGeoJSON,
} from './iconic-landmarks'

const full = iconicLandmarksGeoJSON(false)
const lite = iconicLandmarksGeoJSON(true)

assert.equal(full.type, 'FeatureCollection')
assert.ok(full.features.length > lite.features.length, 'lite must drop sphere slices')
assert.ok(lite.features.length >= 8, 'lite still reads as shaft+kugel+mast')

const masses = full.features.filter((f) => f.properties?.kind === 'mass')
const labels = full.features.filter((f) => f.properties?.kind === 'label')
assert.equal(labels.length, 1)
assert.equal(labels[0]!.properties?.name, 'Fernsehturm')
assert.equal(labels[0]!.geometry.type, 'Point')

let tip = 0
let maxR = 0
let sphereR = 0
const colors = new Set<string>()
for (const f of masses) {
  const p = f.properties!
  assert.ok(p.top > p.base, 'disc top > base')
  assert.equal(f.geometry.type, 'Polygon')
  tip = Math.max(tip, Number(p.top))
  colors.add(String(p.color))
  const ring = (f.geometry as GeoJSON.Polygon).coordinates[0]!
  assert.ok(ring.length >= 17, 'closed ring')
  if (Number(p.base) >= 187 && Number(p.top) <= 221) {
    // Kugel band — radius from ring span at lat 52.52 ≈ 111320*cos
    let minLng = Infinity
    let maxLng = -Infinity
    for (const pt of ring) {
      minLng = Math.min(minLng, pt[0]!)
      maxLng = Math.max(maxLng, pt[0]!)
    }
    const r =
      ((maxLng - minLng) * 111_320 * Math.cos((FERNSEHTURM.lat * Math.PI) / 180)) / 2
    sphereR = Math.max(sphereR, r)
  }
  if (Number(p.base) < 20) {
    let minLng = Infinity
    let maxLng = -Infinity
    for (const pt of (f.geometry as GeoJSON.Polygon).coordinates[0]!) {
      minLng = Math.min(minLng, pt[0]!)
      maxLng = Math.max(maxLng, pt[0]!)
    }
    maxR = Math.max(maxR, ((maxLng - minLng) * 111_320 * Math.cos((FERNSEHTURM.lat * Math.PI) / 180)) / 2)
  }
}

assert.equal(tip, FERNSEHTURM.heightM, 'antenna tip 368 m')
assert.ok(Math.abs(sphereR - FERNSEHTURM.sphereR * FERNSEHTURM.mapR) < 0.8, `kugel radius ${sphereR}`)
assert.ok(colors.has(FERNSEHTURM_COLORS.window), 'amber window band')
assert.ok(colors.has(FERNSEHTURM_COLORS.shaft), 'concrete shaft')
assert.ok(colors.has(FERNSEHTURM_COLORS.beacon), 'aviation red mast')
assert.ok(maxR > FERNSEHTURM.shaftR * FERNSEHTURM.mapR, 'podium wider than shaft')

const hole = iconicHidePolygon()
const ring = hole.coordinates[0]!
assert.ok(ring.length >= 21)
const far = JSON.stringify(iconicKeepFarFilter(['!=', ['get', 'hide_3d'], true]))
assert.ok(far.includes('distance'))
assert.ok(far.includes('literal'))
assert.ok(far.includes(String(FERNSEHTURM.hideR)))
const [lng, lat] = (labels[0]!.geometry as GeoJSON.Point).coordinates
assert.equal(lng, FERNSEHTURM.lng)
assert.equal(lat, FERNSEHTURM.lat)

const src = readFileSync(join(process.cwd(), 'src/lib/map/iconic-landmarks.ts'), 'utf8')
assert.ok(!src.includes('buildings.ts'))
assert.ok(!src.includes('geocode.ts'))
assert.ok(!src.includes('three'))
assert.ok(!src.includes('gltf'))
assert.ok(src.includes('fill-extrusion'))
assert.ok(src.includes("['distance'"))
assert.ok(src.includes('iconicKeepFarFilter'))

const map3d = readFileSync(join(process.cwd(), 'src/components/map/Map3D.tsx'), 'utf8')
assert.ok(map3d.includes('bindIconicLandmarks('))
assert.ok(map3d.includes(ICONIC_LAYER_ID) || map3d.includes('ICONIC_LAYER_ID'))
assert.ok(map3d.includes(ICONIC_SOURCE_ID) || map3d.includes('KEEP_EXTRUDE'))

const search = readFileSync(join(process.cwd(), 'src/components/search/SearchMapView.tsx'), 'utf8')
assert.ok(search.includes('bindIconicLandmarks('))

const floors = readFileSync(join(process.cwd(), 'src/lib/map/floorLayers.ts'), 'utf8')
assert.ok(floors.includes('setIconicLandmarks3d('))
assert.ok(floors.includes('ICONIC_LAYER_ID'))

console.log('iconic-landmarks: fernsehturm ✓')
