import assert from 'node:assert/strict'
import { sivrceScore, sivrceScoreReasons } from './sivrce-score'

const thin = sivrceScore({ photos: 0, features: 0 })
assert.ok(thin.ids.includes('incomplete'))
assert.ok(thin.confidence < 50)
assert.ok(thin.score < 50)

const full = sivrceScore({
  verified: true,
  photos: 8,
  features: 5,
  band: 'low',
  hasCoords: true,
  hasFootprint: true,
  hasPermit: true,
})
assert.ok(full.ids.includes('verified'))
assert.ok(full.ids.includes('value'))
assert.ok(full.ids.includes('permit'))
assert.ok(full.ids.includes('footprint'))
assert.ok(full.confidence >= 80)
assert.ok(full.score >= 85)
assert.ok(!full.ids.includes('incomplete'))

const legacy = sivrceScoreReasons({ photos: 3, features: 2 })
assert.equal(legacy.ids.length, sivrceScore({ photos: 3, features: 2 }).ids.length)

console.log('ok: sivrce-score')
