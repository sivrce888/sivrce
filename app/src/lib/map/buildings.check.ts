/**
 * Runnable self-check for map intelligence.
 * Run: npm run check:map
 */

import assert from 'node:assert/strict'
import {
  buildingFootprint,
  buildingsToGeoJSON,
  buildingsToPointsGeoJSON,
  catalogToCluster,
  clusterGeometry,
  clusterListingsToBuildings,
  clusterMinPriceGEL,
  dealColor,
  filterBuildings,
  findBuildingBySlug,
  findBuildingForListing,
  findNearestBuilding,
  mapHrefForListing,
  ghostFootprintHalfM,
  haversineM,
  listingBuildingNumber,
  parseBuildingNumber,
  parseStreet,
  projectsToConstructionBuildings,
  applyLiveProjectPins,
  mergeDbBuildings,
  ringBboxHalfM,
  ringCentroidDistM,
  footprintRingUsable,
  clusterRings,
  FOOTPRINT_MAX_PIN_M,
  FOOTPRINT_CAMPUS_MAX_PIN_M,
} from './buildings'
import { LISTINGS, type Listing } from '@/data/listings'
import { PROJECTS, type Project } from '@/data/professionals'
import { BUILDINGS, relatedBuildings } from '@/data/buildings'
import { STATUS_BRAND, CATEGORY_BRAND, DEAL_BRAND } from '@/lib/category-brand'
import { formatMapPin } from '@/lib/currency'
import footprintJson from '@/data/building-footprints.json'

const base = {
  img: '/x.webp',
  images: ['/x.webp'],
  priceUSD: 1,
  priceGEL: 1,
  perM2USD: 1,
  title: 't',
  city: 'თბილისი',
  district: 'ვაკე',
  propType: 'apartment' as const,
  rooms: 1,
  beds: 1,
  baths: 1,
  area: 40,
  floor: 2,
  totalFloors: 10,
  views: 1,
  badge: null,
  ai: { score: 80, label: 'ok' },
  features: [],
  description: '',
  postedAt: '2026-01-01',
  agent: { name: 'a', phone: '1', agency: 'b' },
  isNew: false,
}

const fixtures: Listing[] = [
  {
    ...base,
    id: 'a',
    address: 'ჭავჭავაძის 47, ვაკე, თბილისი',
    buildingNumber: '47',
    buildingSlug: 'chavchavadze-47',
    dealType: 'sale',
    coords: { lat: 41.711826, lng: 44.747685 },
  },
  {
    ...base,
    id: 'b',
    address: 'ჭავჭავაძის 47, ვაკე, თბილისი',
    buildingNumber: '47',
    buildingSlug: 'chavchavadze-47',
    dealType: 'rent',
    coords: { lat: 41.71183, lng: 44.74769 },
  },
  {
    ...base,
    id: 'c',
    address: 'პეკინის 12, საბურთალო, თბილისი',
    buildingSlug: 'pekin-12',
    dealType: 'daily',
    coords: { lat: 41.72079, lng: 44.77487 },
  },
  {
    ...base,
    id: 'd',
    address: 'აბაშიძის 34, ვაკე, თბილისი',
    buildingSlug: 'abashidze-34',
    dealType: 'pledge',
    coords: { lat: 41.70744, lng: 44.76569 },
  },
]

assert.equal(parseBuildingNumber('ჭავჭავაძის 47, ვაკე'), '47')
assert.equal(parseStreet('ჭავჭავაძის 47, ვაკე'), 'ჭავჭავაძის')
assert.equal(listingBuildingNumber(fixtures[2]!), '12')

const buildings = clusterListingsToBuildings(fixtures)
const tower = buildings.find((b) => b.slug === 'chavchavadze-47')
assert.ok(tower)
assert.equal(tower!.code, 'SV-TB-0007')
assert.equal(tower!.counts.sale, 1)
assert.equal(tower!.counts.rent, 1)
assert.equal(tower!.address.includes('ჭავჭავაძის'), true)

const pledgeB = buildings.find((b) => b.slug === 'abashidze-34')
assert.ok(pledgeB)
assert.equal(pledgeB!.counts.pledge, 1)

assert.ok(haversineM(41.7, 44.8, 41.7001, 44.8) < 20)

const near = findNearestBuilding(41.711826, 44.747685, buildings, 100)
assert.equal(near?.slug, 'chavchavadze-47')

assert.equal(findBuildingBySlug('axis-towers', buildings)?.code, 'SV-TB-0001')
assert.equal(findBuildingForListing('a', buildings)?.slug, 'chavchavadze-47')
assert.equal(findBuildingForListing('missing', buildings), null)
{
  const href = mapHrefForListing({
    id: 'a',
    buildingSlug: 'chavchavadze-47',
    coords: { lat: 41.711826, lng: 44.747685 },
    dealType: 'sale',
    floor: 4,
  })
  assert.ok(href.startsWith('/map?'))
  assert.ok(href.includes('building=chavchavadze-47'))
  assert.ok(href.includes('listing=a'))
  assert.ok(href.includes('deal=sale'))
  assert.ok(href.includes('floor=4'))
  assert.ok(href.includes('lat=41.711826'))
}

const projects = [
  {
    slug: 'ghost-tower',
    name: 'Ghost Tower',
    developerSlug: 'x',
    img: '/x.webp',
    location: 'ვაკე, თბილისი',
    city: 'თბილისი',
    priceFromM2: '$1',
    done: 40,
    finish: '2028 Q1',
    flats: 100,
    rating: 4,
    description: { ka: '', en: '', ru: '' },
    coords: { lat: 41.71, lng: 44.79 },
    floors: 20,
  },
] as Project[]

const ghosts = projectsToConstructionBuildings(projects)
assert.equal(ghosts.length, 1)
assert.equal(ghosts[0]!.status, 'construction')
assert.equal(ghosts[0]!.developerSlug, 'x')
assert.equal(ghosts[0]!.color, STATUS_BRAND.construction.hue)
assert.equal(ghosts[0]!.floors, 20)
assert.equal(ghosts[0]!.heightM, 20 * 3.15) // full planned height, not progress-scaled
assert.equal(
  String(buildingsToPointsGeoJSON(ghosts).features[0]!.properties?.priceLabel),
  `${ghosts[0]!.progress ?? 0}%`,
  'construction ghost mid-zoom shows progress %',
)
assert.equal(
  String(buildingsToPointsGeoJSON(ghosts).features[0]!.properties?.hue),
  STATUS_BRAND.construction.hue,
  'construction pin hue is STATUS sky only',
)
assert.equal(STATUS_BRAND.construction.hue, CATEGORY_BRAND.newProjects.hue) // sky blue
assert.notEqual(STATUS_BRAND.construction.hue, CATEGORY_BRAND.houses.hue)
assert.notEqual(STATUS_BRAND.construction.hue, CATEGORY_BRAND.land.hue)

// Ghost massing: elongated slab, sized by floors — not a 36 m cube.
assert.equal(ghostFootprintHalfM(18), Math.min(34, Math.max(16, 10 + 18 * 0.85)))
const ghostGeom = clusterGeometry(ghosts[0]!)
const ring0 = ghostGeom.coordinates[0]!
const w = Math.abs(ring0[1]![0]! - ring0[0]![0]!)
const h = Math.abs(ring0[2]![1]! - ring0[1]![1]!)
assert.ok(w / h > 1.4, 'ghost footprint should be E–W slab (aspect ~1.55)')

// Tiny OSM shed must not win over synthetic slab for construction ghosts.
const tinyRing: [number, number][] = [
  [44.8, 41.7],
  [44.80005, 41.7],
  [44.80005, 41.70005],
  [44.8, 41.70005],
  [44.8, 41.7],
]
assert.ok(ringBboxHalfM(tinyRing) < 14)
const shedGhost = clusterGeometry({
  ...ghosts[0]!,
  ring: tinyRing,
})
const shedW = Math.abs(shedGhost.coordinates[0]![1]![0]! - shedGhost.coordinates[0]![0]![0]!)
const shedH = Math.abs(shedGhost.coordinates[0]![2]![1]! - shedGhost.coordinates[0]![1]![1]!)
assert.ok(shedW / shedH > 1.4, 'tiny OSM ring should fall back to synthetic slab')

// 1-storey OSM tagged onto a 24-floor ghost must not become the massing.
{
  const shedHRing: [number, number][] = [
    [44.798, 41.722],
    [44.7984, 41.722],
    [44.7984, 41.7223],
    [44.798, 41.7223],
    [44.798, 41.722],
  ]
  assert.equal(
    footprintRingUsable(shedHRing, 41.72215, 44.7982, {
      ghost: true,
      floors: 24,
      osmHeightM: 3.1,
    }),
    false,
    'low OSM height vs planned floors',
  )
}

// Grand Avenue sits on the Dinamo/Dadiani factory lot — not Bendeliani/Gamsakhurdia.
{
  // ponytail: Tbilisi projects live in BUILDINGS now — assert catalog pin, not ghost.
  const gaCat = BUILDINGS.find((b) => b.slug === 'archi-grand-avenue')
  assert.ok(gaCat, 'grand avenue in catalog')
  assert.ok(haversineM(gaCat!.coords.lat, gaCat!.coords.lng, 41.72255, 44.7979) < 120, 'grand avenue pin not at factory')
  assert.ok(!gaCat!.address.includes('ვაკე'), 'grand avenue still labelled Vake')
  const ga = catalogToCluster(gaCat!, [])
  const gaRing = clusterGeometry(ga).coordinates[0]!
  assert.ok(ringBboxHalfM(gaRing) > 40, 'grand avenue massing is a shed')
  const dbId = clusterGeometry({ ...ga, id: 'bldg-archi-grand-avenue', slug: 'archi-grand-avenue' })
  assert.ok(ringBboxHalfM(dbId.coordinates[0]!) > 40, 'bldg- id missed footprint')
}

// Exact outline — L courtyard stays empty; no bbox spill past walls
const beliashL: [number, number][] = [
  [44.7786866, 41.7710191],
  [44.7788968, 41.7710105],
  [44.7789276, 41.7709574],
  [44.7789607, 41.7709359],
  [44.7789818, 41.7708368],
  [44.7789448, 41.7706696],
  [44.7789442, 41.7704598],
  [44.7783589, 41.770454],
  [44.7783619, 41.7706045],
  [44.7786881, 41.7706064],
  [44.7786872, 41.7708606],
  [44.7786866, 41.7710191],
]
const exact = clusterGeometry({
  ...ghosts[0]!,
  lat: 41.77075,
  lng: 44.77867,
  status: 'active',
  listings: [{ id: 'x' } as never],
  ring: beliashL,
})
assert.equal(exact.coordinates[0]!.length, beliashL.length, 'must keep exact OSM ring')
assert.deepEqual(exact.coordinates[0], beliashL)

// Far OSM neighbour block must not stick to the pin (km-scale mismatch).
const farRing: [number, number][] = [
  [44.81, 41.71],
  [44.811, 41.71],
  [44.811, 41.711],
  [44.81, 41.711],
  [44.81, 41.71],
]
assert.ok(ringCentroidDistM(farRing, ghosts[0]!.lat, ghosts[0]!.lng) > FOOTPRINT_MAX_PIN_M)
assert.equal(footprintRingUsable(farRing, ghosts[0]!.lat, ghosts[0]!.lng), false)
const farGeom = clusterGeometry({ ...ghosts[0]!, ring: farRing })
const farCx =
  (farGeom.coordinates[0]!.reduce((s, p) => s + p[0]!, 0) - farGeom.coordinates[0]![0]![0]!) /
  (farGeom.coordinates[0]!.length - 1)
assert.ok(
  Math.abs(farCx - ghosts[0]!.lng) < 0.001,
  'far OSM ring must fall back to synthetic at pin lng',
)

// Real Blox Mukhiani pin must sit in Mukhiani, not Digomi riverside.
const mukhiani = PROJECTS.find((p) => p.slug === 'blox-mukhiani')
assert.ok(mukhiani)
assert.ok(mukhiani!.coords.lat > 41.78 && mukhiani!.coords.lng > 44.81, 'blox-mukhiani coords outside Mukhiani')
assert.ok(mukhiani!.location.includes('გობრონიძ'), 'blox-mukhiani missing street address')

// ponytail: street+number coverage — was ~79/153; gate against sliding back to district labels.
{
  const withDigit = PROJECTS.filter((p) => /\d/.test(p.location)).length
  assert.ok(withDigit >= 120, `project street+number coverage too low: ${withDigit}/${PROJECTS.length}`)
}

// High-confidence street pins — fail if catalog drifts back to district centroids.
const pinAnchors: Record<string, { lat: number; lng: number; needle: string }> = {
  'archi-grand-avenue': { lat: 41.72255, lng: 44.7979, needle: 'დადიან' },
  'archi-central-park': { lat: 41.72129, lng: 44.74692, needle: 'Tamarashvili' },
  'white-square-mindeli': { lat: 41.72583, lng: 44.71215, needle: 'Dzotsi' },
  'one-batumi': { lat: 41.63537, lng: 41.61455, needle: 'Abuseridze' },
  'orbi-continental': { lat: 41.64892, lng: 41.62439, needle: 'Rustaveli' },
  'idea-panorama': { lat: 41.71883, lng: 44.7043, needle: 'Danelia' },
  'alto-by-real-palace': { lat: 41.79453, lng: 44.76627, needle: 'აბრაამ' },
  // 2026-07-20: was east-bank wrong pin 41.7549/44.7784
  'm2-highlight': { lat: 41.74852338, lng: 44.76985808, needle: 'ბაქრაძ' },
  'grada-saburtalo': { lat: 41.74733768, lng: 44.76877781, needle: 'გელოვან' },
}
for (const [slug, a] of Object.entries(pinAnchors)) {
  const p = PROJECTS.find((x) => x.slug === slug)
  assert.ok(p, `${slug} missing`)
  assert.ok(haversineM(p!.coords.lat, p!.coords.lng, a.lat, a.lng) < 80, `${slug} pin drifted`)
  assert.ok(p!.location.includes(a.needle), `${slug} address needle missing`)
}

// m² Highlight — two cylindrical extrusions (Block 11/12), not one riverbank slab
{
  const cat = BUILDINGS.find((b) => b.slug === 'm2-highlight')
  assert.ok(cat, 'm2-highlight in catalog')
  const twin = catalogToCluster(cat!, [])
  const twins = buildingsToGeoJSON([twin]).features
  assert.equal(twins.length, 2, 'm2-highlight must extrude 2 towers')
  assert.equal(clusterRings(twin).length, 2, 'm2-highlight clusterRings matches GeoJSON')
  assert.equal(twins[0]!.properties?.id, 'bldg-m2-highlight')
  assert.equal(twins[1]!.properties?.id, 'bldg-m2-highlight')
  assert.ok(Number(twins[0]!.properties?.height) > Number(twins[1]!.properties?.height), 'Block 11 taller')
}

// Live project pin updates address/dev — coords stay on OSM footprint (not a street geocode).
const axisCluster = buildings.find((b) => b.slug === 'axis-towers')
assert.ok(axisCluster)
const pinned = applyLiveProjectPins([axisCluster!], [
  {
    slug: 'axis-towers',
    name: 'Axis Towers',
    developerSlug: 'axis',
    img: '/x.webp',
    location: 'ჭავჭავაძის გამზ. 37, ვაკე, თბილისი',
    city: 'თბილისი',
    priceFromM2: '$1',
    done: 100,
    finish: '2018',
    flats: 150,
    rating: 4,
    description: { ka: '', en: '', ru: '' },
    coords: { lat: 41.7095, lng: 44.774 },
  },
])
assert.equal(pinned[0]!.lat, axisCluster!.lat)
assert.equal(pinned[0]!.lng, axisCluster!.lng)
assert.equal(pinned[0]!.address.includes('37'), true)
assert.equal(pinned[0]!.developerSlug, 'axis')

const dbMerged = mergeDbBuildings(
  [axisCluster!],
  [
    {
      ...axisCluster!,
      lat: 41.71,
      lng: 44.775,
      address: 'DB exact address 37',
      developerSlug: 'axis',
      developerName: 'აქსისი',
    },
  ],
)
assert.equal(dbMerged.length, 1)
assert.equal(dbMerged[0]!.lat, 41.71)
assert.equal(dbMerged[0]!.address, 'DB exact address 37')

const filtered = filterBuildings([...buildings, ...ghosts], 'sale', 'all')
assert.ok(filtered.some((b) => b.slug === 'chavchavadze-47'))
assert.ok(filtered.some((b) => b.status === 'construction'))

const rentOnly = filterBuildings([...buildings, ...ghosts], 'rent', 'all')
assert.ok(rentOnly.some((b) => b.slug === 'chavchavadze-47'))
assert.equal(
  rentOnly.filter((b) => b.status === 'construction' && b.listings.length === 0).length,
  0,
  'rent hides empty construction shells',
)
assert.equal(filterBuildings(ghosts, 'daily', 'all').length, 0)
assert.equal(filterBuildings(ghosts, 'pledge', 'all').length, 0)
assert.ok(filterBuildings(ghosts, 'sale', 'all').some((b) => b.status === 'construction'))
assert.ok(filterBuildings(ghosts, 'all', 'construction').every((b) => b.status === 'construction'))
assert.equal(filterBuildings(ghosts, 'all', 'active').length, 0)
assert.equal(filterBuildings(ghosts, 'all', 'completed').length, 0)

const rentPts = buildingsToPointsGeoJSON(buildings, 'rent')
const rentTower = rentPts.features.find((f) => f.properties?.slug === 'chavchavadze-47')
assert.equal(rentTower?.properties?.hue, DEAL_BRAND.rent)
assert.equal(clusterMinPriceGEL(tower!, 'rent'), fixtures[1]!.priceGEL)
assert.equal(clusterMinPriceGEL(tower!, 'sale'), fixtures[0]!.priceGEL)

assert.equal(dealColor('sale'), '#2E6BFF')
assert.equal(dealColor('pledge'), '#16A34A')
const fc = buildingsToGeoJSON(buildings)
assert.equal(fc.features[0]!.geometry.type, 'Polygon')
const pts = buildingsToPointsGeoJSON(buildings)
assert.equal(pts.features.length, buildings.length)
assert.equal(pts.features[0]!.geometry.type, 'Point')
assert.equal(buildingFootprint(41.7, 44.8).coordinates[0]!.length, 5)

// ——— 100% coverage gate on real data ———

const GEORGIA = { latMin: 40.5, latMax: 43.7, lngMin: 39.9, lngMax: 46.8 }

for (const l of LISTINGS) {
  const { lat, lng } = l.coords
  assert.ok(Number.isFinite(lat) && Number.isFinite(lng), `${l.id}: coords not finite`)
  assert.ok(Math.abs(lat) <= 90 && Math.abs(lng) <= 180, `${l.id}: coords out of range`)
  assert.ok(
    lat >= GEORGIA.latMin && lat <= GEORGIA.latMax && lng >= GEORGIA.lngMin && lng <= GEORGIA.lngMax,
    `${l.id}: coords outside Georgia`,
  )
  assert.ok(l.buildingSlug && l.buildingSlug.trim().length > 0, `${l.id}: missing buildingSlug`)
}

const withNumber = LISTINGS.filter((l) => listingBuildingNumber(l).trim().length > 0)
assert.ok(
  withNumber.length >= Math.ceil(LISTINGS.length * 0.9),
  `buildingNumber coverage ${withNumber.length}/${LISTINGS.length} below 90%`,
)

const realClusters = clusterListingsToBuildings(LISTINGS)
const clusteredIds = new Set(realClusters.flatMap((b) => b.listings.map((l) => l.id)))
for (const l of LISTINGS) assert.ok(clusteredIds.has(l.id), `${l.id}: dropped by clustering`)

const catalogProjectSlugs = new Set(
  BUILDINGS.map((b) => b.projectSlug).filter(Boolean) as string[],
)
catalogProjectSlugs.add('axis-towers-vake') // SEO alias — same catalog pin
// Every project must have valid coords + floors — pinning gate (active AND completed).
for (const p of PROJECTS) {
  assert.ok(
    Number.isFinite(p.coords.lat) &&
      Number.isFinite(p.coords.lng) &&
      Math.abs(p.coords.lat) <= 90 &&
      Math.abs(p.coords.lng) <= 180,
    `${p.slug}: invalid coords`,
  )
  // Effective floors: declared value, else the renderer's own derivation (capped).
  const effFloors = Math.min(100, p.floors ?? Math.max(8, Math.round(p.flats / 12)))
  assert.ok(Number.isFinite(effFloors) && effFloors > 0 && effFloors <= 100, `${p.slug}: bad floors`)
}
// Every project gets a deterministic {DEV}-{NN} code (e.g. M2-01, ARC-03).
import { projectCode } from '@/data/professionals'
const codeRe = /^[A-Z0-9]{2,3}-\d{2}$/
const seenCodes = new Set<string>()
for (const p of PROJECTS) {
  const code = projectCode(p)
  assert.ok(codeRe.test(code), `${p.slug}: bad project code "${code}"`)
  assert.ok(!seenCodes.has(code), `${p.slug}: duplicate project code ${code}`)
  seenCodes.add(code)
}
const pinableProjects = PROJECTS.filter(
  (p) =>
    Number.isFinite(p.coords.lat) &&
    Number.isFinite(p.coords.lng) &&
    Math.abs(p.coords.lat) <= 90 &&
    Math.abs(p.coords.lng) <= 180 &&
    !catalogProjectSlugs.has(p.slug),
)
const realGhosts = projectsToConstructionBuildings(PROJECTS)
assert.equal(realGhosts.length, pinableProjects.length, 'project pin count mismatch')
assert.deepEqual(
  realGhosts.map((g) => g.projectSlug).sort(),
  pinableProjects.map((p) => p.slug).sort(),
  'project pin set mismatch',
)
// Completed (done>=100) projects must surface as status='completed'
const completedProjects = PROJECTS.filter((p) => p.done >= 100 && !catalogProjectSlugs.has(p.slug))
const completedGhosts = realGhosts.filter((g) => g.status === 'completed')
assert.equal(
  completedGhosts.length,
  completedProjects.length,
  'completed-project ghost count mismatch',
)
for (const g of realGhosts) {
  assert.ok(g.code && codeRe.test(g.code), `${g.id}: missing/invalid code on cluster`)
}

assert.equal(new Set(BUILDINGS.map((b) => b.slug)).size, BUILDINGS.length, 'duplicate catalog slug')
assert.equal(new Set(BUILDINGS.map((b) => b.code)).size, BUILDINGS.length, 'duplicate catalog code')
assert.ok(
  BUILDINGS.filter((b) => b.city === 'თბილისი').length >= 100,
  'Tbilisi catalog too thin — projects should expand BUILDINGS',
)
assert.ok(BUILDINGS.every((b) => b.img.startsWith('/images/')), 'catalog img must be local')
assert.ok(BUILDINGS.every((b) => b.description.ka.length > 20), 'catalog needs ka description')

const gradaPark = BUILDINGS.find((b) => b.slug === 'grada-park')
assert.ok(gradaPark, 'grada-park in catalog')
assert.equal(gradaPark!.district, 'საბურთალო')
assert.equal(gradaPark!.ubani, 'დიდი დიღომი')

const yorkVista = BUILDINGS.find((b) => b.slug === 'york-vista-garden')
assert.equal(yorkVista?.district, 'მთაწმინდა')

const officialRaions = new Set([
  'გლდანი', 'დიდუბე', 'ვაკე', 'ისანი', 'კრწანისი',
  'მთაწმინდა', 'ნაძალადევი', 'საბურთალო', 'სამგორი', 'ჩუღურეთი',
])
const tbilisiRaionMiss = BUILDINGS.filter(
  (b) => b.city === 'თბილისი' && !officialRaions.has(b.district),
)
assert.ok(
  tbilisiRaionMiss.length <= 8,
  `non-raion districts: ${tbilisiRaionMiss.map((b) => b.district + '/' + b.slug).join(', ')}`,
)

const axisTowers = BUILDINGS.find((b) => b.slug === 'axis-towers')
assert.ok(axisTowers, 'axis-towers in catalog')
assert.equal(axisTowers!.district, 'ვაკე')
assert.notEqual(axisTowers!.ubani, 'ლისი') // "ლისი" is a substring of "თბილისი"

const tbilisi = BUILDINGS.filter((b) => b.city === 'თბილისი')
assert.ok(
  tbilisi.filter((b) => b.ubani).length >= 20,
  'Tbilisi ubani coverage too thin',
)
assert.ok(
  tbilisi.every((b) => b.floors >= 1 && Number.isFinite(b.coords.lat)),
  'Tbilisi buildings need floors + coords',
)
assert.ok(relatedBuildings('axis-towers').length >= 3, 'related buildings for axis')

const mergedFc = buildingsToGeoJSON([...realClusters, ...realGhosts])
for (const f of mergedFc.features) {
  assert.ok(Number(f.properties?.height) > 0, `${String(f.id)}: height must be > 0`)
  assert.equal(f.geometry.type, 'Polygon', `${String(f.id)}: not a polygon`)
  const ring = (f.geometry as GeoJSON.Polygon).coordinates[0]!
  assert.ok(ring.length >= 5, `${String(f.id)}: ring needs >= 5 points`)
  const first = ring[0]!
  const last = ring[ring.length - 1]!
  assert.ok(first[0] === last[0] && first[1] === last[1], `${String(f.id)}: ring not closed`)
  for (const [lng, lat] of ring) {
    assert.ok(
      lat >= GEORGIA.latMin && lat <= GEORGIA.latMax && lng >= GEORGIA.lngMin && lng <= GEORGIA.lngMax,
      `${String(f.id)}: ring point outside Georgia`,
    )
  }
}

// ——— real OSM footprint gate ———

const fpData = footprintJson.footprints as unknown as Record<
  string,
  { ring?: [number, number][]; parts?: { ring: [number, number][] }[] } | null
>
for (const [id, fp] of Object.entries(fpData)) {
  if (!fp) continue
  const rings = fp.parts?.map((p) => p.ring) ?? (fp.ring ? [fp.ring] : [])
  assert.ok(rings.length >= 1, `${id}: footprint needs ring or parts`)
  for (const ring of rings) {
    assert.ok(ring.length >= 5, `${id}: footprint ring needs >= 5 points`)
    const first = ring[0]!
    const last = ring[ring.length - 1]!
    assert.ok(first[0] === last[0] && first[1] === last[1], `${id}: footprint ring not closed`)
  }
}

// Every catalog building must have a footprint key (ring | parts | explicit null).
for (const b of BUILDINGS) {
  assert.ok(
    `bldg-${b.slug}` in fpData,
    `missing footprint key bldg-${b.slug}`,
  )
}
const catalogWithRing = BUILDINGS.filter((b) => {
  const fp = fpData[`bldg-${b.slug}`]
  return !!(fp?.ring || fp?.parts?.length)
}).length
assert.ok(
  catalogWithRing >= 6,
  `catalog usable rings ${catalogWithRing}/${BUILDINGS.length} below floor`,
)

// Committed rings must sit on their pin — stale OSM after pin moves = null, not a km-off shed.
{
  const catalogProjects = new Set(BUILDINGS.map((b) => b.projectSlug).filter(Boolean))
  for (const b of BUILDINGS) {
    const fp = fpData[`bldg-${b.slug}`]
    if (!fp) continue
    const rings = fp.parts?.map((x) => x.ring) ?? (fp.ring ? [fp.ring] : [])
    const maxM = fp.parts?.length ? FOOTPRINT_CAMPUS_MAX_PIN_M : FOOTPRINT_MAX_PIN_M
    for (const ring of rings) {
      const d = ringCentroidDistM(ring, b.coords.lat, b.coords.lng)
      assert.ok(
        d <= maxM,
        `bldg-${b.slug}: footprint ${Math.round(d)}m from pin (max ${maxM})`,
      )
    }
  }
  for (const p of PROJECTS) {
    if (p.done >= 100 || catalogProjects.has(p.slug)) continue
    const fp = fpData[`dev-${p.slug}`]
    if (!fp) continue
    const rings = fp.parts?.map((x) => x.ring) ?? (fp.ring ? [fp.ring] : [])
    const maxM = fp.parts?.length ? FOOTPRINT_CAMPUS_MAX_PIN_M : FOOTPRINT_MAX_PIN_M
    for (const ring of rings) {
      const d = ringCentroidDistM(ring, p.coords.lat, p.coords.lng)
      assert.ok(
        d <= maxM,
        `dev-${p.slug}: footprint ${Math.round(d)}m from pin (max ${maxM})`,
      )
    }
  }
}

const sakeniP = PROJECTS.find((p) => p.slug === 'biograpi-sakeni')
assert.ok(sakeniP)
assert.ok(
  haversineM(sakeniP!.coords.lat, sakeniP!.coords.lng, 41.72737673, 44.76061168) < 25,
  'sakeni pin must sit on the building, not the avenue geocode',
)
const sakeniFp = fpData['bldg-biograpi-sakeni'] ?? fpData['dev-biograpi-sakeni']
assert.ok(sakeniFp?.ring && sakeniFp.ring.length >= 6)
assert.ok(
  ringBboxHalfM(sakeniFp.ring!) > 40,
  'sakeni uses the real lot outline, not a synthetic slab',
)
const sakeniCat = BUILDINGS.find((b) => b.slug === 'biograpi-sakeni')
assert.ok(sakeniCat, 'sakeni in catalog')
assert.ok((sakeniCat.floors ?? 0) >= 35, 'sakeni floors')
const sakeniCluster = catalogToCluster(sakeniCat!, [])
assert.ok(
  haversineM(sakeniCluster.lat, sakeniCluster.lng, 41.72737673, 44.76061168) < 25,
  'sakeni 3D massing pin must match the building centroid',
)
assert.ok(
  (sakeniCluster.heightM ?? 0) >= 35 * 3.15 - 0.01,
  'sakeni extrudes full 35 floors',
)

const orbiM = PROJECTS.find((p) => p.slug === 'orbi-marjanishvili')
assert.ok(orbiM!.coords.lng > 44.2, 'orbi-marjanishvili must stay in Tbilisi')
const sportCity = PROJECTS.find((p) => p.slug === 'sport-city-batumi')
assert.ok(sportCity)
assert.ok(sportCity!.coords.lng < 42.2, 'sport-city-batumi must stay in Batumi')

// a known multi-point real footprint must flow into the GeoJSON
const vazhaFeature = mergedFc.features.find((f) => f.id === 'bldg-vazha-pshavela-50')
assert.ok(vazhaFeature, 'vazha-pshavela-50 missing from GeoJSON')
assert.ok(
  (vazhaFeature!.geometry as GeoJSON.Polygon).coordinates[0]!.length > 5,
  'real footprint not used in GeoJSON',
)

// ——— floor stack gate ———

import {
  FLOOR_STACKS_ON,
  buildingFloorCount,
  buildingFloors,
  buildingShowsFloorStack,
  floorTooltipKa,
  floorsToGeoJSON,
} from './floors'

const towerCount = buildingFloorCount(tower!)
assert.ok(towerCount >= Math.max(...fixtures.filter((l) => l.buildingSlug === 'chavchavadze-47').map((l) => l.floor)), 'floor count below listing floor')
assert.equal(
  buildingShowsFloorStack(tower!),
  false,
  'secondary multi-unit without inventory stays solid',
)
assert.equal(
  buildingShowsFloorStack({
    ...tower!,
    inventory: undefined,
    status: 'active',
    listings: tower!.listings.slice(0, 1),
    floors: 2,
    heightM: 24,
  }),
  false,
  'active without inventory stays solid',
)
assert.equal(buildingShowsFloorStack(ghosts[0]!), FLOOR_STACKS_ON, 'construction ghost opens floor stack when stacks enabled')

const towerFloors = buildingFloors(tower!, 'all')
assert.equal(towerFloors.length, towerCount)
assert.equal(towerFloors.reduce((s, f) => s + f.available, 0), 2, 'both tower listings land on floors')

const saleOnly = buildingFloors(tower!, 'sale')
assert.equal(saleOnly.reduce((s, f) => s + f.available, 0), 1, 'deal filter respected per floor')

const ffc = floorsToGeoJSON(tower!)
assert.equal(ffc.features.length, towerCount)
for (const [i, f] of ffc.features.entries()) {
  const p = f.properties!
  assert.ok(p.base < p.top, `floor ${i}: base >= top`)
  assert.equal(p.floor, i + 1)
  const ring = (f.geometry as GeoJSON.Polygon).coordinates[0]!
  assert.ok(ring.length >= 5, `floor ${i}: ring needs >= 5 points`)
}
const lastTop = ffc.features[ffc.features.length - 1]!.properties!.top as number
assert.ok(Math.abs(lastTop - tower!.heightM) < 0.001, 'stack top must equal building height')

const ghostFc = floorsToGeoJSON(ghosts[0]!)
assert.equal(ghostFc.features.every((f) => f.properties!.ghost === true), true)
assert.equal(floorTooltipKa({ n: 3, available: 0, minPriceGEL: null }, { ghost: true, progress: 40, showPrice: false }).lines[0], 'მშენებარე · 40%')
assert.equal(floorTooltipKa({ n: 5, available: 2, minPriceGEL: 120000 }, { ghost: false, showPrice: true }).lines.length, 2)
assert.equal(floorTooltipKa({ n: 5, available: 2, minPriceGEL: 120000 }, { ghost: false, showPrice: false }).lines.length, 1, 'price hidden when deals are mixed')

// ——— admin floor inventory gate (BuildingFloor rows win over listing-derived stacks) ———

const inventoryTower: typeof tower = {
  ...tower!,
  inventory: [
    { n: 1, available: 3, sale: 2, rent: 1, daily: 0, pledge: 0, minPricePerSqm: 2500 },
    { n: 2, available: 0, sale: 0, rent: 0, daily: 0, pledge: 0, minPricePerSqm: null },
    { n: 3, available: 4, sale: 1, rent: 2, daily: 1, pledge: 0, minPricePerSqm: 3100 },
  ],
}
assert.equal(buildingFloorCount(inventoryTower!), 3, 'inventory defines the stack height')
const invAll = buildingFloors(inventoryTower!, 'all')
assert.deepEqual(invAll.map((f) => f.available), [3, 0, 4], 'inventory availability used as-is')
assert.equal(buildingFloors(inventoryTower!, 'rent')[2]!.available, 2, 'deal filter reads per-deal inventory counts')
assert.equal(invAll[0]!.minPriceGEL, null, 'inventory price is per m², not a total')
const invTip = floorTooltipKa(invAll[0]!, { ghost: false, showPrice: true })
assert.equal(invTip.lines.length, 2)
assert.ok(invTip.lines[1]!.includes('/მ²-დან'), 'inventory tooltip shows ₾/m²')
assert.equal(floorsToGeoJSON(inventoryTower!).features.length, 3, 'inventory stack renders all floors')
assert.equal(buildingShowsFloorStack(inventoryTower!), FLOOR_STACKS_ON, 'inventory development opens floor stack when stacks enabled')

// ——— merge gate: shadowed DB rows donate floor inventory to static clusters ———

const dbShadow: typeof tower = {
  ...tower!,
  id: 'bldg-shadow',
  label: 'DB shadow copy',
  inventory: [{ n: 1, available: 7, sale: 5, rent: 2, daily: 0, pledge: 0, minPricePerSqm: 2900 }],
}
const merged = mergeDbBuildings([tower!], [dbShadow!])
assert.equal(merged.length, 1, 'shadowed db row must not duplicate the building')
assert.equal(merged[0]!.label, tower!.label, 'static catalog keeps its curated meta')
assert.equal(merged[0]!.inventory?.[0]?.available, 7, 'static cluster adopts DB floor inventory')
const dbOnly = mergeDbBuildings([tower!], [{ ...dbShadow!, slug: 'db-only-tower' }])
assert.equal(dbOnly.length, 2, 'db-only buildings are appended')
assert.equal(mergeDbBuildings([tower!], [])[0], tower!, 'no db rows → identity')

// Human names on map GeoJSON (not SV-TB codes as primary label)
// Catalog listings must sit on the building, not a km-off street geocode.
for (const cat of BUILDINGS) {
  for (const l of LISTINGS.filter((x) => x.buildingSlug === cat.slug)) {
    const m = haversineM(l.coords.lat, l.coords.lng, cat.coords.lat, cat.coords.lng)
    assert.ok(m < 150, `${l.id}: ${Math.round(m)}m from ${cat.slug} pin`)
  }
}

const axisVake = PROJECTS.find((p) => p.slug === 'axis-towers-vake')
const axisLive = PROJECTS.find((p) => p.slug === 'axis-towers')
assert.ok(axisVake && axisLive)
assert.ok(
  haversineM(axisVake!.coords.lat, axisVake!.coords.lng, axisLive!.coords.lat, axisLive!.coords.lng) < 40,
  'axis-towers-vake must share Axis Towers pin',
)

const axis = BUILDINGS.find((b) => b.slug === 'axis-towers')
assert.ok(axis, 'axis-towers in catalog')
const axisFc = buildingsToGeoJSON([
  {
    id: 'axis-towers',
    label: axis!.name,
    code: axis!.code,
    address: axis!.address,
    buildingNumber: '37',
    district: axis!.district,
    city: axis!.city,
    lat: axis!.coords.lat,
    lng: axis!.coords.lng,
    color: '#2E6BFF',
    heightM: 80,
    counts: { sale: 1, rent: 0, daily: 0, pledge: 0 },
    dominant: 'sale',
    status: 'active',
    listings: [],
  },
])
assert.equal(axisFc.features[0]!.properties!.label, 'აქსის თაუერსი')
assert.equal(axisFc.features[0]!.properties!.code, axis!.code)
assert.match(String(axisFc.features[0]!.properties!.hue), /^#[0-9A-Fa-f]{6}$/)
const onlyBuild = filterBuildings(
  projectsToConstructionBuildings(PROJECTS),
  'all',
  'construction',
)
assert.ok(onlyBuild.length > 0, 'construction filter returns ghosts')
assert.ok(onlyBuild.every((b) => b.status === 'construction'))
assert.ok(onlyBuild.every((b) => b.label.length > 0 && !/^SV-TB-/.test(b.label)))

import { GEORGIA_BORDER, GEORGIA_HALO_KM, GEORGIA_HOLE, GEORGIA_MASK_FC, GEORGIA_MAX_BOUNDS, MAP_CENTER, MAP_MIN_ZOOM } from './buildings'
assert.equal(MAP_MIN_ZOOM, 7)
assert.equal(GEORGIA_HALO_KM, 50)
assert.ok(GEORGIA_MAX_BOUNDS[0][0] < GEORGIA_MAX_BOUNDS[1][0])
assert.ok(GEORGIA_MAX_BOUNDS[0][1] < GEORGIA_MAX_BOUNDS[1][1])
assert.ok(MAP_CENTER.lng > GEORGIA_MAX_BOUNDS[0][0] && MAP_CENTER.lng < GEORGIA_MAX_BOUNDS[1][0])
assert.ok(MAP_CENTER.lat > GEORGIA_MAX_BOUNDS[0][1] && MAP_CENTER.lat < GEORGIA_MAX_BOUNDS[1][1])

function pip(lng: number, lat: number, ring: [number, number][]): boolean {
  let ok = false
  for (let i = 0; i < ring.length - 1; i++) {
    const [x1, y1] = ring[i]!
    const [x2, y2] = ring[i + 1]!
    if (y1 > lat !== y2 > lat && lng < ((x2 - x1) * (lat - y1)) / (y2 - y1) + x1) ok = !ok
  }
  return ok
}
assert.ok(pip(MAP_CENTER.lng, MAP_CENTER.lat, GEORGIA_HOLE), 'Tbilisi in Georgia hole')
assert.ok(pip(41.6367, 41.6168, GEORGIA_HOLE), 'Batumi in Georgia hole')
assert.ok(pip(41.55, 41.52, GEORGIA_HOLE), 'Sarpi in Georgia hole')
assert.ok(pip(41.67, 42.15, GEORGIA_HOLE), 'Poti in Georgia hole')
assert.ok(pip(42.73, 43.05, GEORGIA_HOLE), 'Mestia in Georgia hole')
assert.ok(!pip(41.42, 41.4, GEORGIA_BORDER), 'Hopa (TR) outside border')
assert.ok(pip(41.42, 41.4, GEORGIA_HOLE), 'Hopa (TR) in 50km halo')
assert.ok(pip(41.5, 41.73, GEORGIA_HOLE), 'nearshore west of Batumi in halo')
assert.ok(pip(39.88, 43.46, GEORGIA_HOLE), 'Sochi-sea nearshore in halo')
assert.ok(!pip(44.51, 40.18, GEORGIA_HOLE), 'Yerevan outside hole')
assert.ok(!pip(38.4, 43.5, GEORGIA_HOLE), 'deep Black Sea outside halo')
assert.equal(GEORGIA_MASK_FC.features[0]?.geometry.type, 'Polygon')
assert.equal((GEORGIA_MASK_FC.features[0]?.geometry as GeoJSON.Polygon).coordinates.length, 2)
assert.equal((GEORGIA_MASK_FC.features[0]?.geometry as GeoJSON.Polygon).coordinates[1], GEORGIA_HOLE)
{
  const box = (ring: [number, number][]) => {
    let w = 180, s = 90, e = -180, n = -90
    for (const [lng, lat] of ring) {
      if (lng < w) w = lng
      if (lng > e) e = lng
      if (lat < s) s = lat
      if (lat > n) n = lat
    }
    return { w, s, e, n }
  }
  const b = box(GEORGIA_BORDER)
  const h = box(GEORGIA_HOLE)
  assert.ok(h.w < b.w && h.e > b.e && h.s < b.s && h.n > b.n, 'halo expands bbox')
  assert.ok((b.w - h.w) * 82 > 45 && (h.e - b.e) * 82 > 45, 'halo ≥45km E-W')
  assert.ok((b.s - h.s) * 111 > 45 && (h.n - b.n) * 111 > 45, 'halo ≥45km N-S')
  assert.ok(h.w > GEORGIA_MAX_BOUNDS[0][0] && h.s > GEORGIA_MAX_BOUNDS[0][1])
  assert.ok(h.e < GEORGIA_MAX_BOUNDS[1][0] && h.n < GEORGIA_MAX_BOUNDS[1][1])
}

for (const b of [...realClusters, ...realGhosts]) {
  const fc = floorsToGeoJSON(b)
  assert.equal(fc.features.length, buildingFloorCount(b), `${b.id}: floor feature count mismatch`)
  for (const l of b.listings) {
    assert.ok(l.floor >= 0, `${b.id}/${l.id}: negative floor`) // 0 = ground/land → drawn as floor 1
  }
}

// ——— neighborhood layer gate ———
import { neighborhoodsToGeoJSON } from './buildings'
import { NEIGHBORHOODS } from '@/data/neighborhoods'
import { TBILISI_DISTRICT_LABELS } from '@/data/district-labels'

const nbhFc = neighborhoodsToGeoJSON()
const expectedNbh = TBILISI_DISTRICT_LABELS.length + NEIGHBORHOODS.filter((n) => n.cityKey !== 'თბილისი').length
assert.equal(nbhFc.features.length, expectedNbh, 'neighborhood feature count mismatch')
assert.ok(nbhFc.features.length >= 60, 'district label sheet too thin')
// OSM place centroids — fail if labels drift off-district again (Δ≈500m).
const NBH_ANCHORS: Record<string, [number, number]> = Object.fromEntries(
  TBILISI_DISTRICT_LABELS.map((d) => [d.slug, [d.coords.lat, d.coords.lng] as [number, number]]),
)
const nbhSeen = new Set<string>()
for (const f of nbhFc.features) {
  const p = f.properties ?? {}
  const id = String(p.id)
  const slug = String(p.slug)
  assert.ok(id.startsWith('nbh-'), `${id}: bad neighborhood id prefix`)
  assert.ok(!nbhSeen.has(id), `${id}: duplicate neighborhood id`)
  nbhSeen.add(id)
  assert.equal(f.geometry.type, 'Point', `${id}: not a point`)
  const [lng, lat] = (f.geometry as GeoJSON.Point).coordinates
  assert.ok(
    lat >= GEORGIA.latMin && lat <= GEORGIA.latMax && lng >= GEORGIA.lngMin && lng <= GEORGIA.lngMax,
    `${id}: point outside Georgia`,
  )
  const anchor = NBH_ANCHORS[slug]
  if (anchor) {
    const [alat, alng] = anchor
    const m = Math.hypot((lat - alat) * 111_000, (lng - alng) * 111_000 * 0.75)
    assert.ok(m < 500, `${id}: label ${m.toFixed(0)}m from OSM centroid (max 500)`)
  }
  if (p.hasGuide === true) {
    for (const k of ['transport', 'schools', 'green', 'safety', 'nightlife'] as const) {
      const v = Number(p[k])
      assert.ok(v >= 1 && v <= 10, `${id}: ${k} score ${v} out of [1,10]`)
    }
    assert.ok(Number(p.avgPriceM2USD) > 0, `${id}: missing avgPriceM2USD`)
  }
}

// ——— Tbilisi raion borders (map fill) ———
import TBILISI_RAIONS from '@/data/tbilisi-raions.json'
assert.equal(TBILISI_RAIONS.features.length, 10, 'expected 10 official raions')
for (const f of TBILISI_RAIONS.features) {
  const slug = String(f.properties?.slug)
  assert.ok(slug, 'raion missing slug')
  assert.ok(
    f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon',
    `${slug}: not a polygon`,
  )
}

console.log('map buildings check: ok')

// ——— Compact price labels for mid-zoom pills ———
assert.equal(formatMapPin(185_000, 'GEL'), '185კ₾')
assert.equal(formatMapPin(1_200_000, 'GEL'), '1.2მლნ₾')
assert.equal(formatMapPin(85_000, 'USD', 2.7), '$31k')
{
  const pts = buildingsToPointsGeoJSON(clusterListingsToBuildings(LISTINGS).slice(0, 5))
  for (const f of pts.features) {
    const label = String(f.properties?.priceLabel ?? '')
    if ((f.properties?.total as number) > 0) {
      assert.ok(label.length > 0, `cluster ${f.id} missing priceLabel`)
    }
  }
}
