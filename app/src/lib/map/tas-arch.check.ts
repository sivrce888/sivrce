/**
 * Self-check for TAS parsers (no network).
 * Run: npx tsx src/lib/map/tas-arch.check.ts
 */

import assert from 'node:assert/strict'
import {
  dwrUnquote,
  parseDocDetailDwr,
  parsePublicDocsDwr,
  shapesFromWfsJson,
  tasFileDownloadUrl,
  tasPublicDocUrl,
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

console.log('tas-arch.check: ok')
