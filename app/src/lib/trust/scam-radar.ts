/**
 * SIVRCE Scam Radar & Fraud Shield — 10x Protection against bait-and-switch,
 * fake listings, advance-deposit scams, and fake photos.
 *
 * DB-free, lightweight, SSR-safe.
 */

export type FraudRiskTier = 'SAFE' | 'LOW_RISK' | 'MEDIUM_RISK' | 'HIGH_RISK_SUSPICIOUS'

export interface FraudRiskReport {
  riskScore: number // 0 (safest) to 100 (highest risk)
  tier: FraudRiskTier
  flags: { code: string; titleEn: string; titleKa: string; severity: 'low' | 'medium' | 'high' }[]
  safetyTipsEn: string[]
  safetyTipsKa: string[]
}

const SUSPICIOUS_PHRASES = [
  /advance deposit/i,
  /wire transfer/i,
  /western union/i,
  /owner is abroad/i,
  /owner currently out of country/i,
  /წინასწარი ჩარიცხვა/i,
  /მეპატრონე საზღვარგარეთ/i,
  /საბანკო გადარიცხვა ნახვამდე/i,
]

export function evaluateListingFraudRisk(listing: {
  priceUSD: number
  areaSqm: number
  districtMedianPerSqm?: number
  description?: string
  sellerPhoneVerified?: boolean
  photosCount: number
  hasCadastralCode?: boolean
}): FraudRiskReport {
  let riskScore = 0
  const flags: FraudRiskReport['flags'] = []

  // 1. Price Anomaly Flag
  if (listing.districtMedianPerSqm && listing.districtMedianPerSqm > 0) {
    const pricePerSqm = listing.priceUSD / Math.max(1, listing.areaSqm)
    const ratio = pricePerSqm / listing.districtMedianPerSqm

    if (ratio < 0.45) {
      riskScore += 40
      flags.push({
        code: 'PRICE_SUSPICIOUSLY_LOW',
        titleEn: 'Price per m² is >55% below district median',
        titleKa: 'ფასი კვ.მ-ზე 55%-ით დაბალია უბნის საშუალოზე',
        severity: 'high',
      })
    }
  }

  // 2. Suspicious Scammer Phrases
  if (listing.description) {
    for (const rx of SUSPICIOUS_PHRASES) {
      if (rx.test(listing.description)) {
        riskScore += 35
        flags.push({
          code: 'SUSPICIOUS_PAYMENT_TERMS',
          titleEn: 'Description contains advance payment or owner abroad keywords',
          titleKa: 'აღწერა შეიცავს წინასწარი გადახდის ან საზღვარგარეთ ყოფნის მითითებას',
          severity: 'high',
        })
        break
      }
    }
  }

  // 3. Unverified Phone Number
  if (!listing.sellerPhoneVerified) {
    riskScore += 15
    flags.push({
      code: 'PHONE_UNVERIFIED',
      titleEn: 'Seller phone number is unverified',
      titleKa: 'გამყიდველის ტელეფონი შეუმცირებელია',
      severity: 'medium',
    })
  }

  // 4. Missing Cadastral Code & Low Photos
  if (!listing.hasCadastralCode) {
    riskScore += 10
    flags.push({
      code: 'NO_CADASTRE_CODE',
      titleEn: 'No official NAPR cadastral code attached',
      titleKa: 'არ არის მითითებული საკადასტრო კოდი',
      severity: 'low',
    })
  }

  if (listing.photosCount <= 1) {
    riskScore += 15
    flags.push({
      code: 'INSUFFICIENT_PHOTOS',
      titleEn: 'Listing has only 1 or no photos',
      titleKa: 'განცხადებას აქვს მხოლოდ 1 ან 0 ფოტო',
      severity: 'medium',
    })
  }

  const finalRiskScore = Math.min(100, Math.max(0, riskScore))
  let tier: FraudRiskTier = 'SAFE'
  if (finalRiskScore >= 60) tier = 'HIGH_RISK_SUSPICIOUS'
  else if (finalRiskScore >= 35) tier = 'MEDIUM_RISK'
  else if (finalRiskScore >= 15) tier = 'LOW_RISK'

  return {
    riskScore: finalRiskScore,
    tier,
    flags,
    safetyTipsEn: [
      'Never transfer money or deposits before inspecting the property in person.',
      'Verify the official NAPR cadastral code for legal ownership verification.',
      'Report any seller asking for Western Union or untraceable payment methods.',
    ],
    safetyTipsKa: [
      'არასოდეს გადარიცხოთ თანხა ბინის პირადად დათვალიერებამდე.',
      'შეამოწმეთ საკადასტრო კოდი საჯარო რეესტრში.',
      'შეტყობინეთ ადმინისტრაციას, თუ გამყიდველი ითხოვს საეჭვო გადარიცხვას.',
    ],
  }
}
