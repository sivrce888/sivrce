/**
 * Sivrce Score from fields we actually have.
 * Missing data → lower score + confidence, not invented market facts.
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
