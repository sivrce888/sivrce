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
