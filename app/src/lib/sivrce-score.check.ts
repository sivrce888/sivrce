import assert from 'node:assert/strict'
import {
  sivrceScore,
  sivrceScoreReasons,
  buildingDnaScore,
  developerScore,
  calculateInvestmentMetrics,
} from './sivrce-score'

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

// Test Building DNA
const dna = buildingDnaScore({ hasPermit: true, hasFootprint: true, hasElevator: true, hasParking: true })
assert.ok(dna.score >= 80)
assert.equal(dna.factors.length, 4)

// Test Developer Score
const dev = developerScore({ completedProjects: 6, activeProjects: 2, hasVerifiedIdentity: true, onTimeDeliveryRatePct: 95 })
assert.equal(dev.tier, 'Diamond')
assert.ok(dev.score >= 85)

// Test Investment Metrics
const inv = calculateInvestmentMetrics({
  price: 90000,
  estimatedMonthlyRent: 750,
  areaSqm: 80,
  districtMedianPerSqm: 1250, // fair value = 100,000
})
assert.ok(inv.valueDifferencePct < 0) // priced below median
assert.ok(inv.grossYieldPct >= 9.0) // 9000/90000 = 10%
assert.ok(inv.investmentScore >= 80)

console.log('ok: sivrce-score')
