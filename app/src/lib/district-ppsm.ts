'use client'

import { useEffect, useState } from 'react'

/**
 * District → live sale-market $/m² average (MarketSnapshot-backed), shared by
 * every ListingCard via one module-level fetch. Undefined until loaded —
 * cards render without the price-position chip, then upgrade after hydration.
 * ponytail: one JSON map for all cards; per-card queries would be N times the
 * work for the same number. Upgrade path: fold into /api/search payload if
 * the extra request ever shows in RUM.
 */
let cache: Promise<Record<string, number>> | null = null

export function useDistrictPpsm(): Record<string, number> | undefined {
  const [map, setMap] = useState<Record<string, number> | undefined>(undefined)
  useEffect(() => {
    if (!cache) {
      cache = fetch('/api/market/district-ppsm')
        .then((r) => (r.ok ? r.json() : {}))
        .catch(() => ({}))
    }
    cache.then(setMap)
  }, [])
  return map
}
