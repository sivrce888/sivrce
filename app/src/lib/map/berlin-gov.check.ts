/**
 * Self-check for Berlin gov data (no network).
 * Run: npx tsx src/lib/map/berlin-gov.check.ts
 */

import assert from 'node:assert/strict'
import {
  alkisBuildingsFromFC,
  BERLIN_BBOX,
  BERLIN_SOURCES,
  inBerlin,
  pickAlkisParcelFromFC,
} from './berlin-gov'

assert.ok(inBerlin(52.52, 13.405))
assert.ok(inBerlin(52.4275, 13.573)) // Grünau BUWOG pin
assert.ok(!inBerlin(41.7151, 44.8271))
assert.ok(!inBerlin(52.52, 14.5))
assert.deepEqual(BERLIN_BBOX, { west: 13.08, south: 52.32, east: 13.77, north: 52.68 })

const fc = {
  features: [
    {
      id: 'flur.1',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [13.4, 52.52],
            [13.401, 52.52],
            [13.401, 52.521],
            [13.4, 52.521],
            [13.4, 52.52],
          ],
        ],
      },
      properties: { fsko: '060123-004-00123/045', afl: 1250 },
    },
    {
      id: 'flur.2',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [13.4, 52.52],
            [13.402, 52.52],
            [13.402, 52.522],
            [13.4, 52.522],
            [13.4, 52.52],
          ],
        ],
      },
      properties: { zae: '124', nen: '46', afl: 5000 },
    },
  ],
} as const
const parcel = pickAlkisParcelFromFC(fc as never)
assert.ok(parcel)
assert.equal(parcel!.kennzeichen, '060123-004-00123/045') // smallest area wins
assert.equal(parcel!.areaM2, 1250)
assert.equal(parcel!.source, 'alkis')
assert.ok(parcel!.ring.length >= 5)

const bld = {
  features: [
    {
      id: 'geb.9',
      geometry: {
        type: 'MultiPolygon',
        coordinates: [
          [
            [
              [13.41, 52.521],
              [13.411, 52.521],
              [13.411, 52.5215],
              [13.41, 52.5215],
              [13.41, 52.521],
            ],
          ],
        ],
      },
      properties: { nam: 'Test Haus', bezbwf: 'Wohngebäude' },
    },
  ],
} as const
const blds = alkisBuildingsFromFC(bld as never)
assert.equal(blds.length, 1)
assert.equal(blds[0]!.name, 'Test Haus')
assert.equal(blds[0]!.funktion, 'Wohngebäude')

assert.equal(pickAlkisParcelFromFC(null), null)
assert.deepEqual(alkisBuildingsFromFC({ features: [] }), [])

const keys = BERLIN_SOURCES.map((s) => s.key)
assert.equal(new Set(keys).size, keys.length, 'duplicate source key')
for (const s of BERLIN_SOURCES) {
  assert.ok(s.portal.startsWith('https://'), `portal: ${s.key}`)
  if (s.wfs) assert.ok(s.wfs.includes('gdi.berlin.de'), `wfs host: ${s.key}`)
}
assert.ok(BERLIN_SOURCES.some((s) => s.key === 'alkis-parcels' && s.wfs))
assert.ok(BERLIN_SOURCES.some((s) => s.key === 'alkis-buildings' && s.wfs))

console.log(`berlin-gov.check: ok (${BERLIN_SOURCES.length} sources)`)
