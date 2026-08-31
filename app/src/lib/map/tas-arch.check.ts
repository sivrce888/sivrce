/**
 * Self-check for TAS parsers (no network).
 * Run: npx tsx src/lib/map/tas-arch.check.ts
 */

import assert from 'node:assert/strict'
import {
  dwrUnquote,
  parseDocDetailDwr,
  parsePublicDocsDwr,
  pickTasShapesForPin,
  shapesFromWfsJson,
  tasFileDownloadUrl,
  tasPublicDocUrl,
  tasStatusRank,
  type TasArchShape,
} from './tas-arch'

assert.equal(dwrUnquote('\\u10D7\\u10D1'), 'თბ')
assert.equal(
  tasPublicDocUrl(1139083),
  'https://tas.ge/?p=publicpage&documentId=1139083',
)
assert.ok(tasFileDownloadUrl(5260091).includes('attachedFileId=5260091'))

const shapes = shapesFromWfsJson({
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [44.77, 41.74],
            [44.771, 41.74],
            [44.771, 41.741],
            [44.77, 41.741],
            [44.77, 41.74],
          ],
        ],
      },
      properties: {
        OBJ_ID: 99,
        ARCH_LR_ID: 1033,
        DOCUMENT_STATUS_ID: 11,
        DOCUMENT_STATUS_NAME: 'განუხილველი',
      },
    },
  ],
})
assert.equal(shapes.length, 1)
assert.equal(shapes[0]!.objId, 99)
assert.equal(shapes[0]!.archLrId, 1033)
assert.ok(shapes[0]!.ring.length >= 5)

const docs = parsePublicDocsDwr(`
dwr.engine.remote.handleCallback("2","0",{isSuccess:true,source:[{
documentId:1139083,documentNo:"AR11139083",address:"\\u10D7\\u10D1\\u10D8\\u10DA\\u10D8\\u10E1\\u10D8",
createDateStr:"01/01/2026",documentStatusId:3
}]});
`)
assert.equal(docs.length, 1)
assert.equal(docs[0]!.documentNo, 'AR11139083')
assert.equal(docs[0]!.address, 'თბილისი')
assert.equal(docs[0]!.documentId, 1139083)

const detail = parseDocDetailDwr(
  `
var s0={};s0.attachedFileId=5260091;s0.bucket=null;s0.fileName="mindobiloba.pdf";
dwr.engine.remote.handleCallback("1","0",{isSuccess:true,source:{documentId:1139083},
sources:[true,{document:{documentNo:"AR11139083",address:"x",documentStatusId:3,naprCadCode:"01.10.10.025.115"}}]});
`,
  1139083,
)
assert.ok(detail)
assert.equal(detail!.files.length, 1)
assert.equal(detail!.files[0]!.fileName, 'mindobiloba.pdf')
assert.equal(detail!.naprCadCode, '01.10.10.025.115')

assert.equal(tasStatusRank('თანხმობა'), 0)
assert.equal(tasStatusRank('უარყოფა'), 99)

const tower: TasArchShape = {
  objId: 1,
  archLrId: 1,
  statusId: 11,
  statusName: 'თანხმობა',
  ring: [
    [44.827, 41.675],
    [44.8274, 41.675],
    [44.8274, 41.6754],
    [44.827, 41.6754],
    [44.827, 41.675],
  ],
  lat: 41.6752,
  lng: 44.8272,
}
const twin: TasArchShape = {
  ...tower,
  objId: 2,
  lat: 41.6752,
  lng: 44.8272,
  statusName: 'განუხილველი',
}
const reject: TasArchShape = {
  ...tower,
  objId: 3,
  statusName: 'უარყოფა',
  lat: 41.6753,
  lng: 44.8273,
}
const picked = pickTasShapesForPin([twin, tower, reject], 41.67525, 44.8272)
assert.equal(picked.length, 1)
  assert.equal(picked[0]!.objId, 1)

const detailed: TasArchShape = {
  ...tower,
  objId: 9,
  lat: 41.67522,
  lng: 44.82722,
  ring: [
    [44.827, 41.675],
    [44.8271, 41.675],
    [44.8272, 41.67505],
    [44.8273, 41.6751],
    [44.8274, 41.6752],
    [44.82735, 41.67535],
    [44.8272, 41.6754],
    [44.82705, 41.67535],
    [44.827, 41.6752],
    [44.827, 41.675],
  ],
}
const preferPts = pickTasShapesForPin([tower, detailed], 41.67525, 44.8272)
assert.equal(preferPts[0]!.objId, 9)

const b2: TasArchShape = {
  objId: 4,
  archLrId: 1,
  statusId: 11,
  statusName: 'თანხმობა',
  ring: [
    [44.8276, 41.675],
    [44.828, 41.675],
    [44.828, 41.6754],
    [44.8276, 41.6754],
    [44.8276, 41.675],
  ],
  lat: 41.6752,
  lng: 44.8278,
}
const campus = pickTasShapesForPin([tower, b2], 41.67525, 44.8272, { campus: true })
assert.equal(campus.length, 2)

const site: TasArchShape = {
  ...tower,
  objId: 9,
  lat: 41.6752,
  lng: 44.8272,
  ring: [
    [44.826, 41.674],
    [44.8285, 41.674],
    [44.8285, 41.6765],
    [44.826, 41.6765],
    [44.826, 41.674],
  ],
}
const noGlue = pickTasShapesForPin([site, b2], 41.6752, 44.8272, { campus: true })
assert.equal(noGlue.length, 1)
assert.equal(noGlue[0]!.objId, 9)

console.log('tas-arch.check: ok')
