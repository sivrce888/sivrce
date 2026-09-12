/**
 * Sivrce Score & Transparent Multi-Dimensional Intelligence Engine.
 *
 * Provides defensible, transparent scoring across properties, buildings, developers,
 * agents, and investments. Missing data yields lower scores and confidence ratings,
 * never fabricated market facts.
 */

import type { PriceScaleBand } from '@/lib/price-scale'
import type { DictKey } from '@/lib/i18n/core'

export type ScoreReasonId =
  | 'verified'
  | 'photos'
  | 'value'
  | 'amenities'
  | 'incomplete'
  | 'permit'
  | 'footprint'

const REASON_KEY: Record<ScoreReasonId, DictKey> = {
  verified: 'detail.scoreVerified',
  photos: 'detail.scorePhotos',
  value: 'detail.scoreValue',
  amenities: 'detail.scoreAmenities',
  incomplete: 'detail.scoreIncomplete',
  permit: 'detail.scorePermit',
  footprint: 'detail.scoreFootprint',
}

export function scoreReasonKey(id: ScoreReasonId): DictKey {
  return REASON_KEY[id]
}

export type SivrceScoreInput = {
  verified?: boolean
  photos: number
  features: number
  band?: PriceScaleBand | null
  hasCoords?: boolean
  /** TAS / architecture public permit docs found for site. */
  hasPermit?: boolean
  /** OSM/corpus/NAPR building or parcel ring. */
  hasFootprint?: boolean
}

export function sivrceScore(input: SivrceScoreInput): {
  score: number
  ids: ScoreReasonId[]
  confidence: number
} {
  const ids: ScoreReasonId[] = []
  let score = 48
  let confidence = 35

  if (input.verified) {
    ids.push('verified')
    score += 14
    confidence += 20
  }
  if (input.photos >= 5) {
    ids.push('photos')
    score += 12
    confidence += 15
  } else if (input.photos >= 2) {
    score += 6
    confidence += 5
  }
  if (input.band === 'low' || input.band === 'mediumLow') {
    ids.push('value')
    score += 12
    confidence += 15
  } else if (input.band === 'average') {
    score += 4
  } else if (input.band === 'aboveAverage' || input.band === 'high') {
    score -= 4
  }
  if (input.features >= 3) {
    ids.push('amenities')
    score += 8
    confidence += 10
  } else if (input.features >= 1) {
    score += 3
  }
  if (input.hasCoords) {
    score += 5
    confidence += 5
  }
  if (input.hasFootprint) {
    ids.push('footprint')
    score += 6
    confidence += 8
  }
  if (input.hasPermit) {
    ids.push('permit')
    score += 7
    confidence += 10
  }
  if (input.photos < 2 || input.features === 0) {
    ids.push('incomplete')
    score -= 12
    confidence -= 15
  }

  return {
    score: Math.min(98, Math.max(28, Math.round(score))),
    ids,
    confidence: Math.min(95, Math.max(20, confidence)),
  }
}

/** @deprecated use sivrceScore — kept for call sites that only need reasons. */
export function sivrceScoreReasons(input: SivrceScoreInput) {
  const { ids, confidence } = sivrceScore(input)
  return { ids, confidence }
}

/* ── Extended Multi-Dimensional Intelligence Scores ── */

export interface BuildingDnaInput {
  constructionYear?: number
  hasPermit?: boolean
  hasFootprint?: boolean
  amenitiesCount?: number
  hasElevator?: boolean
  hasParking?: boolean
  energyClass?: 'A+' | 'A' | 'B' | 'C' | 'D' | 'E'
}

export function buildingDnaScore(input: BuildingDnaInput): {
  score: number
  factors: { nameEn: string; nameKa: string; points: number }[]
} {
  let score = 50
  const factors: { nameEn: string; nameKa: string; points: number }[] = []

  if (input.hasPermit) {
    score += 15
    factors.push({ nameEn: 'Verified Permits & Architecture', nameKa: 'დამოწმებული ნებართვები', points: 15 })
  }
  if (input.hasFootprint) {
    score += 10
    factors.push({ nameEn: 'Official Cadastral Footprint', nameKa: 'საკადასტრო კონტური', points: 10 })
  }
  if (input.hasElevator) {
    score += 8
    factors.push({ nameEn: 'Elevator Infrastructure', nameKa: 'ლიფტი', points: 8 })
  }
  if (input.hasParking) {
    score += 10
    factors.push({ nameEn: 'Dedicated Parking', nameKa: 'ავტოსადგომი', points: 10 })
  }
  if (input.constructionYear && input.constructionYear >= 2018) {
    score += 7
    factors.push({ nameEn: 'Modern Construction (2018+)', nameKa: 'თანამედროვე მშენებლობა', points: 7 })
  }

  return {
    score: Math.min(99, Math.max(30, Math.round(score))),
    factors,
  }
}

export interface DeveloperScoreInput {
  completedProjects: number
  activeProjects: number
  hasVerifiedIdentity: boolean
  onTimeDeliveryRatePct?: number // e.g. 95
  yearsInMarket?: number
}

export function developerScore(input: DeveloperScoreInput): {
  score: number
  tier: 'Diamond' | 'Gold' | 'Verified' | 'Standard'
  factors: string[]
} {
  let score = 45
  const factors: string[] = []

  if (input.hasVerifiedIdentity) {
    score += 20
    factors.push('Verified Legal Identity')
  }
  if (input.completedProjects >= 5) {
    score += 15
    factors.push('Established Portfolio (5+ Completed Projects)')
  } else if (input.completedProjects >= 1) {
    score += 8
    factors.push('Completed Development Track Record')
  }
  if (input.onTimeDeliveryRatePct && input.onTimeDeliveryRatePct >= 90) {
    score += 12
    factors.push(`High On-Time Delivery Rate (${input.onTimeDeliveryRatePct}%)`)
  }
  if (input.yearsInMarket && input.yearsInMarket >= 5) {
    score += 8
    factors.push(`${input.yearsInMarket}+ Years Market Experience`)
  }

  const finalScore = Math.min(99, Math.max(30, Math.round(score)))
  let tier: 'Diamond' | 'Gold' | 'Verified' | 'Standard' = 'Standard'
  if (finalScore >= 85) tier = 'Diamond'
  else if (finalScore >= 75) tier = 'Gold'
  else if (finalScore >= 60) tier = 'Verified'

  return { score: finalScore, tier, factors }
}

export interface InvestmentScoreInput {
  price: number
  estimatedMonthlyRent: number
  areaSqm: number
  districtMedianPerSqm: number
  projectedAnnualAppreciationPct?: number // e.g. 5.5
}

export interface InvestmentMetrics {
  investmentScore: number
  fairValuePrice: number
  valueDifferencePct: number // e.g. -8.5 means 8.5% below fair value
  grossYieldPct: number // e.g. 8.2%
  cashflowMonthlyEst: number
  factors: { labelEn: string; labelKa: string; impact: 'positive' | 'neutral' | 'negative' }[]
}

export function calculateInvestmentMetrics(input: InvestmentScoreInput): InvestmentMetrics {
  const fairValuePrice = Math.round(input.areaSqm * input.districtMedianPerSqm)
  const valueDifferencePct = Math.round(((input.price - fairValuePrice) / fairValuePrice) * 100)
  const annualRent = input.estimatedMonthlyRent * 12
  const grossYieldPct = Math.round((annualRent / input.price) * 1000) / 10

  let score = 50
  const factors: { labelEn: string; labelKa: string; impact: 'positive' | 'neutral' | 'negative' }[] = []

  // Yield component
  if (grossYieldPct >= 8.5) {
    score += 25
    factors.push({ labelEn: `High Gross Rental Yield (${grossYieldPct}%)`, labelKa: `მაღალი მომგებიანობა (${grossYieldPct}%)`, impact: 'positive' })
  } else if (grossYieldPct >= 6.0) {
    score += 15
    factors.push({ labelEn: `Solid Gross Yield (${grossYieldPct}%)`, labelKa: `სტაბილური მომგებიანობა (${grossYieldPct}%)`, impact: 'positive' })
  } else {
    score += 5
    factors.push({ labelEn: `Moderate Yield (${grossYieldPct}%)`, labelKa: `ზომიერი მომგებიანობა (${grossYieldPct}%)`, impact: 'neutral' })
  }

  // Value difference component
  if (valueDifferencePct <= -7) {
    score += 20
    factors.push({ labelEn: `Priced ${Math.abs(valueDifferencePct)}% Below District Median`, labelKa: `საბაზრო ფასზე ${Math.abs(valueDifferencePct)}%-ით დაბალი`, impact: 'positive' })
  } else if (valueDifferencePct >= 10) {
    score -= 10
    factors.push({ labelEn: `Priced ${valueDifferencePct}% Above District Median`, labelKa: `საბაზრო ფასზე ${valueDifferencePct}%-ით მაღალი`, impact: 'negative' })
  }

  return {
    investmentScore: Math.min(99, Math.max(30, Math.round(score))),
    fairValuePrice,
    valueDifferencePct,
    grossYieldPct,
    cashflowMonthlyEst: Math.round(input.estimatedMonthlyRent * 0.85), // Net approx after upkeep
    factors,
  }
}
