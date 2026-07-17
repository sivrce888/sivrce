/**
 * Runnable self-check for map intelligence.
 * Run: npm run check:map
 */

import assert from 'node:assert/strict'
import {
  buildingFootprint,
  buildingsToGeoJSON,
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
} from './buildings'
import type { Listing } from '@/data/listings'
import type { Project } from '@/data/professionals'

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

const filtered = filterBuildings([...buildings, ...ghosts], 'sale', 'all')
assert.ok(filtered.some((b) => b.slug === 'chavchavadze-47'))
assert.ok(filtered.some((b) => b.status === 'construction'))

assert.equal(dealColor('sale'), '#2E6BFF')
assert.equal(dealColor('pledge'), '#16A34A')
const fc = buildingsToGeoJSON(buildings)
assert.equal(fc.features[0]!.geometry.type, 'Polygon')
assert.equal(buildingFootprint(41.7, 44.8).coordinates[0]!.length, 5)

console.log('map buildings check: ok')
