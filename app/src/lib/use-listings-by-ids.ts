'use client'

import { useEffect, useState } from 'react'
import type { Listing } from '@/data/listings'
import { mapSearchHit } from '@/lib/map-search-hit'

/**
 * Resolve listing IDs via /api/search?ids= (DB order preserved).
 * ponytail: localStorage favorites/compare store ids only — this is the live hydrate.
 */
export function useListingsByIds(ids: string[]): {
  items: Listing[]
  loading: boolean
} {
  const key = ids.join(',')
  const [fetched, setFetched] = useState<{ key: string; items: Listing[] }>({
    key: '',
    items: [],
  })

  useEffect(() => {
    if (!key) return
    let alive = true
    fetch(`/api/search?ids=${encodeURIComponent(key)}`)
      .then((r) => r.json())
      .then((j) => {
        if (!alive) return
        const items =
          j.ok && Array.isArray(j.hits)
            ? (j.hits as Record<string, unknown>[]).map(mapSearchHit)
            : []
        setFetched({ key, items })
      })
      .catch(() => {
        if (alive) setFetched({ key, items: [] })
      })
    return () => {
      alive = false
    }
  }, [key])

  if (!key) return { items: [], loading: false }
  if (fetched.key !== key) return { items: [], loading: true }
  return { items: fetched.items, loading: false }
}
