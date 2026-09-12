import {
  getVerificationBadge,
  detectPriceAnomaly,
  calculateDuplicateSimilarity,
  calculateSivrceTrustIndex,
  calculateListingTruthScore,
} from './truth-engine'

console.log('truth-engine.check: start')

// 1. Verification badge test
const factBadge = getVerificationBadge('FACT', true)
if (factBadge.badgeColor !== '#10B981' || !factBadge.verifiedIcon) {
  throw new Error(`Unexpected fact badge: ${JSON.stringify(factBadge)}`)
}

const estBadge = getVerificationBadge('ESTIMATE', false)
if (estBadge.state !== 'ESTIMATE' || estBadge.verifiedIcon) {
  throw new Error(`Unexpected estimate badge: ${JSON.stringify(estBadge)}`)
}

// 2. Anomaly detector test
const normal = detectPriceAnomaly(1200, 1100)
if (normal.isAnomaly) {
  throw new Error('Normal price should not be marked as anomaly')
}

const fakeLow = detectPriceAnomaly(200, 1100)
if (!fakeLow.isAnomaly) {
  throw new Error('200/sqm vs 1100/sqm median should be flagged as anomaly')
}

// 3. Duplicate similarity test
const sim = calculateDuplicateSimilarity(
  { lat: 41.715, lng: 44.785, area: 65, floor: 4, price: 95000 },
  { lat: 41.7151, lng: 44.7851, area: 65, floor: 4, price: 95000 }
)
if (sim.similarityScore < 80) {
  throw new Error(`Expected high duplicate similarity (>80), got ${sim.similarityScore}`)
}

// 4. Sivrce Trust Index test
const goldTrust = calculateSivrceTrustIndex({
  isCadastreVerified: true,
  cadastreCode: '01.10.15.002.014',
  hasTitleDeed: true,
  sellerType: 'DEVELOPER',
  isExclusiveListing: true,
})
if (goldTrust.tier !== 'VERIFIED_GOLD' || goldTrust.score < 85) {
  throw new Error(`Expected VERIFIED_GOLD status, got: ${JSON.stringify(goldTrust)}`)
}

const riskTrust = calculateSivrceTrustIndex({
  priceAnomaly: fakeLow,
  duplicateCount: 5,
})
if (riskTrust.tier !== 'HIGH_RISK' || riskTrust.score >= 40) {
  throw new Error(`Expected HIGH_RISK status, got: ${JSON.stringify(riskTrust)}`)
}

// 5. Listing truth summary test
const truthSummary = calculateListingTruthScore(true, true, '01.10.15.002.014', {
  hasTitleDeed: true,
  sellerType: 'DEVELOPER',
})
if (!truthSummary.isVerified || !truthSummary.isGold) {
  throw new Error(`Expected verified gold truth summary, got: ${JSON.stringify(truthSummary)}`)
}

console.log('truth-engine.check: OK ✓')


