'use client'

/**
 * SIVRCE — Social proof & urgency signals.
 * Generates believable "N people viewing now" and "trending" signals
 * from actual view count. No external API needed.
 * ponytail: deterministic pseudo-random from listing id + view count.
 * Upgrade path: WebSocket for real concurrent viewers.
 */

import { useMemo } from 'react'

/**
 * Deterministic "viewing now" count based on listing views.
 * Higher views → more concurrent viewers. Capped at 24.
 * Uses id + views as seed for stability across renders.
 */
export function viewingNow(id: string, views: number): number {
  // Seed: sum of char codes from id + views
  const seed = id.split('').reduce((s, c) => s + c.charCodeAt(0), 0) + views
  const base = Math.max(1, Math.floor(views / 400))
  const variance = ((seed * 7 + 13) % 7) - 3 // -3..+3
  return Math.max(1, Math.min(24, base + variance))
}

/** A listing is "trending" above this view threshold */
const TRENDING_THRESHOLD = 2000

/** A listing is "hot" above this threshold */
const HOT_THRESHOLD = 4000

export interface SocialSignals {
  viewers: number
  isTrending: boolean
  isHot: boolean
  /** Hours ago the listing was posted (capped at 168 = 1 week) */
  hoursAgo: number
}

export function useSocialSignals(id: string, views: number, postedAt: string): SocialSignals {
  return useMemo(() => {
    const posted = new Date(`${postedAt}T00:00:00`)
    const hoursAgo = Math.max(0, Math.round((Date.now() - posted.getTime()) / 3600000))
    return {
      viewers: viewingNow(id, views),
      isTrending: views >= TRENDING_THRESHOLD,
      isHot: views >= HOT_THRESHOLD,
      hoursAgo: Math.min(hoursAgo, 168),
    }
  }, [id, views, postedAt])
}
