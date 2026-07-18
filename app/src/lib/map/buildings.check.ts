/**
 * Runnable self-check for map intelligence.
 * Run: npm run check:map
 */

import assert from 'node:assert/strict'
import {
  buildingFootprint,
  buildingsToGeoJSON,
  buildingsToPointsGeoJSON,
  clusterListingsToBuildings,
  dealColor,
  filterBuildings,
  findBuildingBySlug,
  findNearestBuilding,
  haversineM,
  listingBuildingNumber,
  parseBuildingNumber,
  parseStreet,
  projectsToConstructionBuildings,
  applyLiveProjectPins,
  mergeDbBuildings,
} from './buildings'
import { LISTINGS, type Listing } from '@/data/listings'
import { PROJECTS, type Project } from '@/data/professionals'
import { BUILDINGS } from '@/data/buildings'
import { STATUS_BRAND, CATEGORY_BRAND } from '@/lib/category-brand'
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
    address: 'ჩავჭავაძის 47, ვაკე, თბილისი',
    buildingNumber: '47',
    buildingSlug: 'chavchavadze-47',
    dealType: 'sale',
    coords: { lat: 41.7055, lng: 44.7708 },
  },
  {
    ...base,
    id: 'b',
    address: 'ჩავჭავაძის 47, ვაკე, თბილისი',
    buildingNumber: '47',
    buildingSlug: 'chavchavadze-47',
    dealType: 'rent',
    coords: { lat: 41.70552, lng: 44.77081 },
  },
  {
    ...base,
    id: 'c',
    address: 'პეკინის 12, საბურთალო, თბილისი',
    buildingSlug: 'pekin-12',
    dealType: 'daily',
    coords: { lat: 41.7225, lng: 44.7619 },
  },
  {
    ...base,
    id: 'd',
    address: 'აბაშიძის 34, ვაკე, თბილისი',
    buildingSlug: 'abashidze-34',
    dealType: 'pledge',
    coords: { lat: 41.7078, lng: 44.7644 },
  },
]

assert.equal(parseBuildingNumber('ჩავჭავაძის 47, ვაკე'), '47')
assert.equal(parseStreet('ჩავჭავაძის 47, ვაკე'), 'ჩავჭავაძის')
assert.equal(listingBuildingNumber(fixtures[2]!), '12')

const buildings = clusterListingsToBuildings(fixtures)
const tower = buildings.find((b) => b.slug === 'chavchavadze-47')
assert.ok(tower)
assert.equal(tower!.code, 'SV-TB-0007')
assert.equal(tower!.counts.sale, 1)
assert.equal(tower!.counts.rent, 1)
assert.equal(tower!.address.includes('ჩავჭავაძის'), true)

const pledgeB = buildings.find((b) => b.slug === 'abashidze-34')
assert.ok(pledgeB)
assert.equal(pledgeB!.counts.pledge, 1)

assert.ok(haversineM(41.7, 44.8, 41.7001, 44.8) < 20)

const near = findNearestBuilding(41.7055, 44.7708, buildings, 100)
assert.equal(near?.slug, 'chavchavadze-47')

assert.equal(findBuildingBySlug('axis-towers', buildings)?.code, 'SV-TB-0001')

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
assert.equal(STATUS_BRAND.construction.hue, CATEGORY_BRAND.newProjects.hue) // sky blue
assert.notEqual(STATUS_BRAND.construction.hue, CATEGORY_BRAND.houses.hue)
assert.notEqual(STATUS_BRAND.construction.hue, CATEGORY_BRAND.land.hue)

// Live project pin must move catalog building to exact address/coords.
const axisCluster = buildings.find((b) => b.slug === 'axis-towers')
assert.ok(axisCluster)
const pinned = applyLiveProjectPins([axisCluster!], [
  {
    slug: 'axis-towers-vake',
    name: 'Axis Towers',
    developerSlug: 'axis',
    img: '/x.webp',
    location: 'ჩავჭავაძის გამზ. 37, ვაკე, თბილისი',
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
assert.equal(pinned[0]!.lat, 41.7095)
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
// Every project must have valid coords + floors — pinning gate (active AND completed).
for (const p of PROJECTS) {
  assert.ok(
    Number.isFinite(p.coords.lat) &&
      Number.isFinite(p.coords.lng) &&
      Math.abs(p.coords.lat) <= 90 &&
      Math.abs(p.coords.lng) <= 180,
    `${p.slug}: invalid coords`,
  )
  // Effective floors: declared value, else the renderer's own derivation.
  const effFloors = p.floors ?? Math.max(8, Math.round(p.flats / 12))
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
  { ring: [number, number][] } | null
>
for (const [id, fp] of Object.entries(fpData)) {
  if (!fp) continue
  assert.ok(fp.ring.length >= 5, `${id}: footprint ring needs >= 5 points`)
  const first = fp.ring[0]!
  const last = fp.ring[fp.ring.length - 1]!
  assert.ok(first[0] === last[0] && first[1] === last[1], `${id}: footprint ring not closed`)
}

const catalogWithFp = BUILDINGS.filter((b) => fpData[`bldg-${b.slug}`]).length
assert.ok(
  catalogWithFp >= Math.ceil(BUILDINGS.length * 0.7),
  `catalog footprint coverage ${catalogWithFp}/${BUILDINGS.length} below 70%`,
)
// a known multi-point real footprint must flow into the GeoJSON
const vazhaFeature = mergedFc.features.find((f) => f.id === 'bldg-vazha-pshavela-50')
assert.ok(vazhaFeature, 'vazha-pshavela-50 missing from GeoJSON')
assert.ok(
  (vazhaFeature!.geometry as GeoJSON.Polygon).coordinates[0]!.length > 5,
  'real footprint not used in GeoJSON',
)

// ——— floor stack gate ———

import {
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
assert.equal(buildingShowsFloorStack(ghosts[0]!), true, 'construction ghost opens floor stack')

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
assert.equal(buildingShowsFloorStack(inventoryTower!), true, 'inventory development opens floor stack')

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

import { GEORGIA_MAX_BOUNDS, MAP_CENTER, MAP_MIN_ZOOM } from './buildings'
assert.equal(MAP_MIN_ZOOM, 7)
assert.ok(GEORGIA_MAX_BOUNDS[0][0] < GEORGIA_MAX_BOUNDS[1][0])
assert.ok(GEORGIA_MAX_BOUNDS[0][1] < GEORGIA_MAX_BOUNDS[1][1])
assert.ok(MAP_CENTER.lng > GEORGIA_MAX_BOUNDS[0][0] && MAP_CENTER.lng < GEORGIA_MAX_BOUNDS[1][0])
assert.ok(MAP_CENTER.lat > GEORGIA_MAX_BOUNDS[0][1] && MAP_CENTER.lat < GEORGIA_MAX_BOUNDS[1][1])

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

const nbhFc = neighborhoodsToGeoJSON()
assert.equal(nbhFc.features.length, NEIGHBORHOODS.length, 'neighborhood feature count mismatch')
assert.equal(nbhFc.features.length, 16, 'neighborhood count drifted from 16')
const nbhSeen = new Set<string>()
for (const f of nbhFc.features) {
  const p = f.properties ?? {}
  const id = String(p.id)
  assert.ok(id.startsWith('nbh-'), `${id}: bad neighborhood id prefix`)
  assert.ok(!nbhSeen.has(id), `${id}: duplicate neighborhood id`)
  nbhSeen.add(id)
  assert.equal(f.geometry.type, 'Point', `${id}: not a point`)
  const [lng, lat] = (f.geometry as GeoJSON.Point).coordinates
  assert.ok(
    lat >= GEORGIA.latMin && lat <= GEORGIA.latMax && lng >= GEORGIA.lngMin && lng <= GEORGIA.lngMax,
    `${id}: point outside Georgia`,
  )
  for (const k of ['transport', 'schools', 'green', 'safety', 'nightlife'] as const) {
    const v = Number(p[k])
    assert.ok(v >= 1 && v <= 10, `${id}: ${k} score ${v} out of [1,10]`)
  }
  assert.ok(Number(p.avgPriceM2USD) > 0, `${id}: missing avgPriceM2USD`)
}

console.log('map buildings check: ok')
