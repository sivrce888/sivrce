import { evaluateListingFraudRisk } from './scam-radar'

console.log('scam-radar.check: start')

// Safe listing test
const safe = evaluateListingFraudRisk({
  priceUSD: 120000,
  areaSqm: 65,
  districtMedianPerSqm: 1800,
  sellerPhoneVerified: true,
  photosCount: 8,
  hasCadastralCode: true,
})
if (safe.tier !== 'SAFE' || safe.riskScore > 10) {
  throw new Error(`Expected SAFE listing, got ${safe.tier} (${safe.riskScore})`)
}

// Suspicious listing test
const scam = evaluateListingFraudRisk({
  priceUSD: 20000, // 300/sqm vs 1800 median
  areaSqm: 65,
  districtMedianPerSqm: 1800,
  description: 'Owner is abroad, wire transfer deposit before viewing',
  sellerPhoneVerified: false,
  photosCount: 1,
  hasCadastralCode: false,
})
if (scam.tier !== 'HIGH_RISK_SUSPICIOUS' || scam.riskScore < 70) {
  throw new Error(`Expected HIGH_RISK_SUSPICIOUS, got ${scam.tier} (${scam.riskScore})`)
}
if (scam.flags.length < 3) throw new Error('Expected at least 3 fraud risk flags')

console.log('scam-radar.check: OK ✓')
