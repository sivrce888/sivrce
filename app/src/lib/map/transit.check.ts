/**
 * Self-check: live transit overlay contracts (no network).
 * Run: npx tsx src/lib/map/transit.check.ts
 */
import assert from 'node:assert/strict'
import {
  LIVE_CATS,
  TRANSIT_CATS,
  TRANSIT_LITE_MAX,
  TRANSIT_LITE_MIN_ZOOM,
  TRANSIT_MAX,
  TRANSIT_MAX_SPAN,
  TRANSIT_MIN_ZOOM,
  dedupeStatic,
  isTransitCat,
  liveCatsFor,
  parseOverpass,
  parseTransitParams,
  transitFetchUrl,
  transitQuery,
  transitToGeoJSON,
  type OverpassEl,
} from './transit'
import { POI_CATEGORIES, POI_COLORS, POI_LABELS, POI_MIN_ZOOM } from './pois'

assert.deepEqual([...TRANSIT_CATS], ['bus', 'tram', 'rail'])
assert.ok(isTransitCat('bus') && !isTransitCat('metro') && !isTransitCat('x'))
for (const c of TRANSIT_CATS) assert.ok((POI_CATEGORIES as readonly string[]).includes(c), `poi cat: ${c}`)
for (const c of LIVE_CATS) assert.ok((POI_CATEGORIES as readonly string[]).includes(c), `live cat wired: ${c}`)
// Dense transit appears late — same anti-clutter contract as pharmacies.
assert.ok(POI_MIN_ZOOM.bus >= 13 && POI_MIN_ZOOM.tram >= 12 && POI_MIN_ZOOM.rail >= 11)
assert.ok(TRANSIT_MIN_ZOOM === 12 && TRANSIT_LITE_MIN_ZOOM === 13)
assert.ok(TRANSIT_MAX === 400 && TRANSIT_LITE_MAX === 150)

// Bbox validation (full Berlin bbox exceeds the per-request span — clients fetch viewport slices)
const berlin = parseTransitParams('13.3,52.5,13.5,52.6', 'bus,tram,rail')
assert.ok(berlin && berlin.cats.length === 3, 'berlin slice bbox + cats')
assert.equal(parseTransitParams('13.08,52.32,13.77,52.68', 'bus'), null, 'full-city span must chunk')
assert.deepEqual(parseTransitParams('13.08,52.32,13.4,52.6', 'bus,bus')?.cats, ['bus'], 'cats deduped')
assert.deepEqual(parseTransitParams('13.4,52.5,13.5,52.6', null)?.cats, ['bus'], 'default cat')
assert.equal(parseTransitParams(null, 'bus'), null, 'bbox required')
assert.equal(parseTransitParams('13.5,52.6,13.4,52.5', 'bus'), null, 'reversed bbox')
assert.equal(parseTransitParams('a,b,c,d', 'bus'), null, 'nan bbox')
assert.equal(parseTransitParams('4,46,16,56', 'bus'), null, 'germany-wide span rejected')
assert.deepEqual(parseTransitParams('13.4,52.5,13.5,52.6', 'metro,nope')?.cats, ['metro'], 'unknown cats dropped')
assert.equal(parseTransitParams('0,0,0,0', 'bus'), null, '(0,0) sentinel rejected')

// Overpass QL: bbox order south,west,north,east; every cat present
const q = transitQuery(['bus', 'tram', 'rail'], { w: 13.4, s: 52.5, e: 13.5, n: 52.6 })
assert.ok(q.includes('52.5,13.4,52.6,13.5'), 's,w,n,e order')
assert.ok(q.includes('"highway"="bus_stop"') && q.includes('"railway"="tram_stop"'), 'stop selectors')
assert.ok(q.includes('"railway"="station"') && q.includes('out center'), 'rail + center')
assert.ok(q.startsWith('[out:json]'), 'json out')

// Parse: nodes, way-center, dedupe, cat filter, cap, name fallback
const sample: { elements: OverpassEl[] } = {
  elements: [
    { type: 'node', id: 1, lat: 52.52, lon: 13.4, tags: { highway: 'bus_stop', name: 'Alexanderplatz' } },
    { type: 'node', id: 1, lat: 52.52, lon: 13.4, tags: { highway: 'bus_stop', name: 'dup' } },
    { type: 'node', id: 2, lat: 52.53, lon: 13.41, tags: { railway: 'tram_stop' } },
    { type: 'node', id: 3, lat: 52.54, lon: 13.42, tags: { railway: 'station', station: 'subway', name: 'U8' } },
    { type: 'node', id: 4, lat: 52.55, lon: 13.43, tags: { railway: 'halt', name: 'S Haltepunkt' } },
    { type: 'way', id: 5, center: { lat: 52.56, lon: 13.44 }, tags: { leisure: 'park', name: 'Tiergarten' } },
    { type: 'node', id: 6, lat: 52.57, lon: 13.45, tags: { amenity: 'café' } },
    { type: 'node', id: 7, tags: { highway: 'bus_stop' } },
    { type: 'node', id: 8, lat: 0, lon: 0, tags: { highway: 'bus_stop' } },
  ],
}
const stops = parseOverpass(sample, ['bus', 'tram', 'metro', 'rail', 'park'])
assert.equal(stops.length, 5, `parsed stops: ${stops.length}`)
assert.equal(stops[0]?.category, 'bus')
assert.equal(stops[0]?.name, 'Alexanderplatz')
assert.equal(stops[1]?.category, 'tram')
assert.equal(stops[1]?.name, null, 'unnamed stop keeps null name')
assert.equal(stops[2]?.category, 'metro', 'subway before rail')
assert.equal(stops[3]?.category, 'rail')
assert.equal(stops[4]?.category, 'park', 'way center resolves')
assert.ok(!stops.some((s) => s.name === 'dup'), 'element dedupe')
const busOnly = parseOverpass(sample, ['bus'])
assert.ok(busOnly.length === 1 && busOnly[0]?.category === 'bus', 'cat filter')
const capped = parseOverpass(sample, ['bus', 'tram', 'metro', 'rail', 'park'], 2)
assert.equal(capped.length, 2, 'server cap')
assert.equal(parseOverpass(null, ['bus']).length, 0, 'null json')

// GeoJSON mirrors the static-POI shape (client layers/clicks unchanged)
const fc = transitToGeoJSON(stops.slice(0, 2))
assert.equal(fc.type, 'FeatureCollection')
assert.equal(fc.features.length, 2)
const f0 = fc.features[0]
assert.equal(f0?.geometry.type, 'Point')
assert.equal(String(f0?.properties?.icon), 'sv-poi-bus')
assert.equal(String(f0?.properties?.color), POI_COLORS.bus)
assert.equal(String(f0?.properties?.label), POI_LABELS.bus)
assert.equal(String(fc.features[1]?.properties?.name), POI_LABELS.tram, 'null name falls back to label')
assert.ok(String(fc.features[0]?.properties?.id).startsWith('osm:'), 'stable osm id')

// Live coverage: Georgia keeps static amenities, transit goes live everywhere
const tbilisiAmen = liveCatsFor(41.7151, 44.8271, ['bus', 'pharmacy', 'metro'])
assert.deepEqual(tbilisiAmen, ['bus'], 'tbilisi: transit only, static covers rest')
const berlinLive = liveCatsFor(52.52, 13.405, ['bus', 'tram', 'rail', 'pharmacy', 'metro'])
assert.deepEqual(berlinLive, ['bus', 'tram', 'rail', 'pharmacy', 'metro'], 'berlin: everything live')
assert.deepEqual(liveCatsFor(NaN, 13.4, ['bus']), [], 'nan center')
assert.deepEqual(liveCatsFor(52.52, 13.405, ['landmark', 'nope' as never]), ['landmark'], 'unknown dropped')

// Fetch URL: rounded, sorted, span-gated
const url = transitFetchUrl({ w: 13.081234, s: 52.321234, e: 13.181234, n: 52.421234 }, ['rail', 'bus'])
assert.equal(url, '/api/transit?bbox=13.08123,52.32123,13.18123,52.42123&cats=bus,rail', 'rounded + sorted')
assert.equal(transitFetchUrl({ w: 4, s: 46, e: 16, n: 56 }, ['bus']), null, 'wide span refused')
assert.equal(transitFetchUrl({ w: 13.4, s: 52.5, e: 13.5, n: 52.6 }, []), null, 'empty cats refused')
assert.ok(TRANSIT_MAX_SPAN === 0.5)

// Shell dedupe: same-category ≤80 m dropped, others kept
const shellPins = [
  { lat: 52.5200, lng: 13.4050, category: 'metro' as const },
  { lat: 48.8566, lng: 2.3522, category: 'landmark' as const },
]
const fetched = [
  { id: 'osm:node/1', category: 'metro' as const, name: 'Same U-Bahn', lat: 52.5203, lng: 13.4052 },
  { id: 'osm:node/2', category: 'metro' as const, name: 'Far U-Bahn', lat: 52.5300, lng: 13.4200 },
  { id: 'osm:node/3', category: 'landmark' as const, name: 'Not Louvre', lat: 48.8584, lng: 2.2945 },
]
const keptStops = dedupeStatic(fetched, shellPins)
assert.equal(keptStops.length, 2, 'near-dup dropped, far + other-cat kept')
assert.ok(keptStops.every((s: { id: string }) => s.id !== 'osm:node/1'), 'colliding stop removed')
assert.deepEqual(dedupeStatic(fetched, []), fetched, 'no shell → passthrough')

console.log(`transit: ${stops.length} sample stops / ${LIVE_CATS.length} live cats ✓`)
