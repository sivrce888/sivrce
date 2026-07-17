'use client'

/**
 * SIVRCE — listing urgency from real view counts + post date.
 * Fake "N viewing now" removed — add only with real presence (WebSocket).
 */

import { useMemo } from 'react'

/** A listing is "trending" above this view threshold */
const TRENDING_THRESHOLD = 2000

/** A listing is "hot" above this threshold */
const HOT_THRESHOLD = 4000

export interface SocialSignals {
  isTrending: boolean
  isHot: boolean
  /** Hours ago the listing was posted (capped at 168 = 1 week) */
  hoursAgo: number
}

export function useSocialSignals(views: number, postedAt: string): SocialSignals {
  return useMemo(() => {
    const posted = new Date(`${postedAt}T00:00:00`)
    const hoursAgo = Math.max(0, Math.round((Date.now() - posted.getTime()) / 3600000))
    return {
      isTrending: views >= TRENDING_THRESHOLD,
      isHot: views >= HOT_THRESHOLD,
      hoursAgo: Math.min(hoursAgo, 168),
    }
  }, [views, postedAt])
}
