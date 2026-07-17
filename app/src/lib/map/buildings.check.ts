/**
 * Runnable self-check for building clustering.
 * Run: npm run check:map
 */

import assert from 'node:assert/strict'
import {
  buildingFootprint,
  buildingsToGeoJSON,
  clusterListingsToBuildings,
  dealColor,
} from './buildings'
import type { Listing } from '@/data/listings'

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
    address: 'ჩავჭავაძის 47, ვაკე',
    dealType: 'sale',
    coords: { lat: 41.7055, lng: 44.7708 },
  },
  {
    ...base,
    id: 'b',
    address: 'ჩავჭავაძის 47, ვაკე',
    dealType: 'rent',
    coords: { lat: 41.70552, lng: 44.77081 }, // same cell
  },
  {
    ...base,
    id: 'c',
    address: 'პეკინის 12, საბურთალო',
    dealType: 'daily',
    coords: { lat: 41.7225, lng: 44.7619 }, // other cell
  },
]

const buildings = clusterListingsToBuildings(fixtures)
assert.equal(buildings.length, 2, 'two buildings expected')
const tower = buildings.find((b) => b.listings.some((l) => l.id === 'a'))
assert.ok(tower)
assert.equal(tower!.counts.sale, 1)
assert.equal(tower!.counts.rent, 1)
assert.equal(tower!.counts.daily, 0)
assert.equal(tower!.listings.length, 2)
assert.equal(dealColor('sale'), '#2E6BFF')
assert.equal(dealColor('rent'), '#7C3AED')
assert.equal(dealColor('daily'), '#E11D48')

const fc = buildingsToGeoJSON(buildings)
assert.equal(fc.features.length, 2)
assert.equal(fc.features[0]!.geometry.type, 'Polygon')

const fp = buildingFootprint(41.7, 44.8)
assert.equal(fp.coordinates[0]!.length, 5)

console.log('map buildings check: ok')
