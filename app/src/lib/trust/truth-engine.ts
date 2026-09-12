/**
 * SIVRCE Truth Engine — Provenance, verification states, duplicate reconciliation,
 * and data integrity classification.
 *
 * Core Moat Directive: Never hallucinate property facts, never claim unverified items
 * are verified, and provide transparent data provenance across all entities.
 */

export type FactState = 'FACT' | 'ESTIMATE' | 'PREDICTION' | 'UGC' | 'UNVERIFIED'

export interface ProvenanceRecord<T = unknown> {
  value: T
  state: FactState
  source: string
  confidence: number // 0 to 100
  verified: boolean
  updatedAt: string
  disclaimer?: string
}

export interface VerificationBadge {
  state: FactState
  labelEn: string
  labelKa: string
  badgeColor: string
  verifiedIcon: boolean
}

/** Classify verification badge aesthetics and copy for UI & AI output */
export function getVerificationBadge(state: FactState, verified = false): VerificationBadge {
  if (verified || state === 'FACT') {
    return {
      state: 'FACT',
      labelEn: 'Verified Fact',
      labelKa: 'დამოწმებული ფაქტი',
      badgeColor: '#10B981', // Emerald green
      verifiedIcon: true,
    }
  }

  switch (state) {
    case 'ESTIMATE':
      return {
        state: 'ESTIMATE',
        labelEn: 'Sivrce Model Estimate',
        labelKa: 'სივრცის შეფასება',
        badgeColor: '#3B82F6', // Sapphire blue
        verifiedIcon: false,
      }
    case 'PREDICTION':
      return {
        state: 'PREDICTION',
        labelEn: 'Market Forecast',
        labelKa: 'ბაზრის პროგნოზი',
        badgeColor: '#8B5CF6', // Purple
        verifiedIcon: false,
      }
    case 'UGC':
      return {
        state: 'UGC',
        labelEn: 'User Submission',
        labelKa: 'მომხმარებლის მონაცემი',
        badgeColor: '#F59E0B', // Amber
        verifiedIcon: false,
      }
    case 'UNVERIFIED':
    default:
      return {
        state: 'UNVERIFIED',
        labelEn: 'Unverified Data',
        labelKa: 'შეუმოწმებელი',
        badgeColor: '#9CA3AF', // Gray
        verifiedIcon: false,
      }
  }
}

export interface PriceAnomalyResult {
  isAnomaly: boolean
  deviationPct: number
  expectedRange: { min: number; max: number }
  reason?: string
}

/** Detect if a price per sqm deviates suspiciously from district market median */
export function detectPriceAnomaly(
  pricePerSqm: number,
  districtMedianPerSqm: number
): PriceAnomalyResult {
  if (!districtMedianPerSqm || districtMedianPerSqm <= 0) {
    return { isAnomaly: false, deviationPct: 0, expectedRange: { min: 0, max: 0 } }
  }

  const ratio = pricePerSqm / districtMedianPerSqm
  const minExpected = Math.round(districtMedianPerSqm * 0.45)
  const maxExpected = Math.round(districtMedianPerSqm * 2.8)

  if (ratio < 0.45) {
    return {
      isAnomaly: true,
      deviationPct: Math.round((ratio - 1) * 100),
      expectedRange: { min: minExpected, max: maxExpected },
      reason: 'Price significantly below market median (potential fake/fraud signal)',
    }
  }

  if (ratio > 2.8) {
    return {
      isAnomaly: true,
      deviationPct: Math.round((ratio - 1) * 100),
      expectedRange: { min: minExpected, max: maxExpected },
      reason: 'Price significantly above market median (potential luxury or data entry error)',
    }
  }

  return {
    isAnomaly: false,
    deviationPct: Math.round((ratio - 1) * 100),
    expectedRange: { min: minExpected, max: maxExpected },
  }
}

export interface DuplicateMatch {
  listingIdA: string
  listingIdB: string
  similarityScore: number // 0 to 100
  reasons: string[]
}

/** Detect duplicate listings based on area, floor, location proximity, and price similarity */
export function calculateDuplicateSimilarity(
  a: { lat: number; lng: number; area: number; floor?: number; price: number },
  b: { lat: number; lng: number; area: number; floor?: number; price: number }
): { similarityScore: number; reasons: string[] } {
  const reasons: string[] = []
  let score = 0

  // 1. Proximity check (~50m threshold)
  const dLat = Math.abs(a.lat - b.lat)
  const dLng = Math.abs(a.lng - b.lng)
  const approxDistMeters = Math.sqrt(dLat * dLat + dLng * dLng) * 111000

  if (approxDistMeters < 30) {
    score += 40
    reasons.push('Same precise geolocation pin (<30m)')
  } else if (approxDistMeters < 100) {
    score += 20
    reasons.push('Nearby coordinates (<100m)')
  }

  // 2. Area match
  const areaDiff = Math.abs(a.area - b.area)
  if (areaDiff <= 0.5) {
    score += 30
    reasons.push('Exact floor area match')
  } else if (areaDiff <= 2.0) {
    score += 15
    reasons.push('Similar floor area (±2m²)')
  }

  // 3. Floor match
  if (a.floor !== undefined && b.floor !== undefined && a.floor === b.floor && a.floor > 0) {
    score += 20
    reasons.push(`Identical building floor (${a.floor})`)
  }

  // 4. Price similarity
  const priceRatio = Math.min(a.price, b.price) / Math.max(a.price, b.price)
  if (priceRatio > 0.95) {
    score += 10
    reasons.push('Price match within 5%')
  }

  return { similarityScore: Math.min(100, score), reasons }
}

export interface SivrceTrustScoreResult {
  score: number // 0 to 100
  tier: 'VERIFIED_GOLD' | 'TRUSTED' | 'STANDARD' | 'UNVERIFIED' | 'HIGH_RISK'
  badgeLabelEn: string
  badgeLabelKa: string
  factors: { factor: string; scoreDelta: number }[]
}

/** Calculate unified Sivrce Trust Index (0-100) combining cadastre, provenance, and price sanity */
export function calculateSivrceTrustIndex(input: {
  isCadastreVerified?: boolean
  cadastreCode?: string
  hasTitleDeed?: boolean
  priceAnomaly?: PriceAnomalyResult
  duplicateCount?: number
  isExclusiveListing?: boolean
  sellerType?: 'DEVELOPER' | 'AGENCY' | 'OWNER' | 'UNKNOWN'
}): SivrceTrustScoreResult {
  let score = 50 // Base score for standard unverified listing
  const factors: { factor: string; scoreDelta: number }[] = []

  // Cadastre public registry check (+25 points)
  if (input.isCadastreVerified || (input.cadastreCode && input.cadastreCode.length > 5)) {
    score += 25
    factors.push({ factor: 'Official Cadastre Public Registry Verified', scoreDelta: 25 })
  }

  // Title deed verification (+15 points)
  if (input.hasTitleDeed) {
    score += 15
    factors.push({ factor: 'Ownership Document Verified', scoreDelta: 15 })
  }

  // Direct developer / verified agent (+10 points)
  if (input.sellerType === 'DEVELOPER') {
    score += 10
    factors.push({ factor: 'Official Developer Listing', scoreDelta: 10 })
  } else if (input.sellerType === 'AGENCY') {
    score += 5
    factors.push({ factor: 'Verified Partner Agency', scoreDelta: 5 })
  }

  // Exclusive listing (+5 points)
  if (input.isExclusiveListing) {
    score += 5
    factors.push({ factor: 'Exclusive Single Source Listing', scoreDelta: 5 })
  }

  // Deductions: Price anomaly (-30 points)
  if (input.priceAnomaly?.isAnomaly) {
    score -= 30
    factors.push({ factor: 'Price Anomaly Warning', scoreDelta: -30 })
  }

  // Deductions: Duplicate proliferation (-15 points)
  if (input.duplicateCount && input.duplicateCount > 3) {
    score -= 15
    factors.push({ factor: `Proliferated Duplicates (${input.duplicateCount} copies)`, scoreDelta: -15 })
  }

  const finalScore = Math.max(0, Math.min(100, score))
  let tier: SivrceTrustScoreResult['tier'] = 'STANDARD'
  let badgeLabelEn = 'Standard Listing'
  let badgeLabelKa = 'სტანდარტული განცხადება'

  if (finalScore >= 85) {
    tier = 'VERIFIED_GOLD'
    badgeLabelEn = 'Verified Gold'
    badgeLabelKa = 'დამოწმებული ოქროს სტატუსი'
  } else if (finalScore >= 70) {
    tier = 'TRUSTED'
    badgeLabelEn = 'Trusted Listing'
    badgeLabelKa = 'სანდო განცხადება'
  } else if (finalScore < 40) {
    tier = 'HIGH_RISK'
    badgeLabelEn = 'High Risk Warning'
    badgeLabelKa = 'მაღალი რისკის გაფრთხილება'
  }

  return {
    score: finalScore,
    tier,
    badgeLabelEn,
    badgeLabelKa,
    factors,
  }
}

export interface ListingTruthSummary {
  score: number
  isGold: boolean
  isVerified: boolean
  badge: VerificationBadge
}

/** Summarize real-time truth score for compact listing card display */
export function calculateListingTruthScore(
  isVerified?: boolean,
  isCadastreVerified?: boolean,
  cadastreCode?: string,
  options?: { hasTitleDeed?: boolean; sellerType?: 'DEVELOPER' | 'AGENCY' | 'OWNER' | 'UNKNOWN' }
): ListingTruthSummary {
  const verified = Boolean(isVerified || isCadastreVerified || (cadastreCode && cadastreCode.length > 5))
  const trust = calculateSivrceTrustIndex({
    isCadastreVerified,
    cadastreCode,
    hasTitleDeed: options?.hasTitleDeed,
    sellerType: options?.sellerType,
  })

  return {
    score: trust.score,
    isGold: trust.tier === 'VERIFIED_GOLD',
    isVerified: verified,
    badge: getVerificationBadge(verified ? 'FACT' : 'UNVERIFIED', verified),
  }
}


