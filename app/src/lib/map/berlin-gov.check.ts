/**
 * Self-check for Berlin gov data (no network).
 * Run: npx tsx src/lib/map/berlin-gov.check.ts
 */

import assert from 'node:assert/strict'
import {
  alkisBuildingsFromFC,
  alkisHeightM,
  alkisParcelsFromFC,
  BERLIN_BBOX,
  BERLIN_SOURCES,
  BPLAN_LAYERS,
  BPLAN_WFS,
  bplanFeaturesFromFC,
  inBerlin,
  officialBplanPdf,
  pickAlkisParcelFromFC,
  STEP_LAYERS,
  STEP_WFS,
  stepFeaturesFromFC,
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
assert.equal(blds[0]!.floors, null)
assert.equal(blds[0]!.heightM, null)

const h1 = alkisHeightM({ aog: 5, hoh: null })
assert.equal(h1.floors, 5)
assert.equal(h1.heightM, 15)
assert.equal(h1.heightSource, 'aog_x3')
const h2 = alkisHeightM({ aog: 5, hoh: 18.5 })
assert.equal(h2.heightM, 18.5)
assert.equal(h2.heightSource, 'hoh')

const parcels = alkisParcelsFromFC(fc as never)
assert.equal(parcels.length, 2)
assert.equal(parcels[0]!.kennzeichen, '060123-004-00123/045')

assert.equal(pickAlkisParcelFromFC(null), null)
assert.deepEqual(alkisBuildingsFromFC({ features: [] }), [])
assert.deepEqual(alkisParcelsFromFC({ features: [] }), [])

const keys = BERLIN_SOURCES.map((s) => s.key)
assert.equal(new Set(keys).size, keys.length, 'duplicate source key')
for (const s of BERLIN_SOURCES) {
  assert.ok(s.portal.startsWith('https://'), `portal: ${s.key}`)
  if (s.wfs) assert.ok(s.wfs.includes('gdi.berlin.de'), `wfs host: ${s.key}`)
}
assert.ok(BERLIN_SOURCES.some((s) => s.key === 'alkis-parcels' && s.wfs))
assert.ok(BERLIN_SOURCES.some((s) => s.key === 'alkis-buildings' && s.wfs))
assert.ok(BERLIN_SOURCES.some((s) => s.key === 'step-wohnen-2040' && s.wfs === STEP_WFS))
assert.ok(STEP_LAYERS.potential.includes('h_step_wo_2040_wobau_fertig'))
assert.ok(STEP_WFS.includes('step_wo_2040'))
assert.ok(BERLIN_SOURCES.some((s) => s.key === 'bplaene' && s.wfs === BPLAN_WFS && s.typeName === BPLAN_LAYERS.festgesetzt))
assert.equal(BPLAN_LAYERS.festgesetzt, 'bplan:b_bp_fs')
assert.equal(BPLAN_LAYERS.verfahren, 'bplan:a_bp_iv')
assert.ok(!Object.values(BPLAN_LAYERS).some((t) => t.includes('c_bp_ak')), 'repealed B-Plan layer must stay out')

assert.equal(officialBplanPdf('https://mitte.gis-broker.de/bplaene/0100002b.pdf'), 'https://mitte.gis-broker.de/bplaene/0100002b.pdf')
assert.equal(officialBplanPdf('https://fbinter.stadt-berlin.de/x.pdf'), 'https://fbinter.stadt-berlin.de/x.pdf')
assert.equal(officialBplanPdf('javascript:alert(1)'), null)
assert.equal(officialBplanPdf('https://evil.example/x.pdf'), null)
assert.equal(officialBplanPdf('http://mitte.gis-broker.de/x.pdf'), null)

const bpFc = {
  features: [
    {
      id: 'bp.1',
      geometry: {
        type: 'Polygon',
        coordinates: [[[13.4, 52.52], [13.41, 52.52], [13.41, 52.53], [13.4, 52.53], [13.4, 52.52]]],
      },
      properties: {
        gisid: 'g1',
        planname: '1-2b',
        planartname: 'Qualifizierter B-Plan',
        bp_rechtsstand: 'In Kraft getreten',
        bezirk: '01 - Mitte',
        inhalt: 'Kerngebiet',
        scan_www: 'https://mitte.gis-broker.de/bplaene/x.pdf',
      },
    },
  ],
} as const
const bps = bplanFeaturesFromFC(bpFc as never, 'festgesetzt')
assert.equal(bps.length, 1)
assert.equal(bps[0]!.name, '1-2b')
assert.equal(bps[0]!.props.status, 'In Kraft getreten')
assert.equal(bps[0]!.props.doc, 'https://mitte.gis-broker.de/bplaene/x.pdf')
assert.deepEqual(bplanFeaturesFromFC({ features: [] }, 'verfahren'), [])

const stepFc = {
  features: [
    {
      id: 'S1',
      geometry: { type: 'Point', coordinates: [13.4, 52.52] },
      properties: { gisid: 'S1', bez: 'Test Potential', we_kat: '200 - 499 Wohneinheiten', leg_fertig: 'Im Bau' },
    },
  ],
} as const
const step = stepFeaturesFromFC(stepFc as never, 'potential')
assert.equal(step.length, 1)
assert.equal(step[0]!.name, 'Test Potential')
assert.equal(step[0]!.props.we_kat, '200 - 499 Wohneinheiten')

console.log(`berlin-gov.check: ok (${BERLIN_SOURCES.length} sources)`)
