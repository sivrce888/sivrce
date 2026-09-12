'use client'

import { useEffect } from 'react'
import {
  GEO_COOKIE,
  geoHomePath,
  isCrawler,
  isGeoLaunch,
  marketFromIso,
} from '@/lib/geo-market'

const MISS = 'sv-geo-v2-miss'

function cookieVal(): string | null {
  const row = document.cookie.split('; ').find((c) => c.startsWith(`${GEO_COOKIE}=`))
  return row ? decodeURIComponent(row.slice(GEO_COOKIE.length + 1)) : null
}

function markMiss(): void {
  try {
    sessionStorage.setItem(MISS, '1')
  } catch {
    /* private mode */
  }
}

/**
 * Backup when the edge 302 missed (no IP header, preview, stale cookie).
 * Cookie `global` = explicit worldwide directory. Crawlers skipped.
 */
export default function GeoGate() {
  useEffect(() => {
    if (new URLSearchParams(window.location.search).has('worldwide')) return
    if (isCrawler(navigator.userAgent)) return
    try {
      if (sessionStorage.getItem(MISS) === '1') return
    } catch {
      /* private mode */
    }
    const val = cookieVal()
    if (val === 'global') return
    // Cookie already picked a market — proxy 302s production. Do not
    // flash-bounce the hub after paint (preview / client nav to /).
    if (val === 'ge' || isGeoLaunch(val)) return

    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/geo')
        if (!res.ok || cancelled) return
        const data = (await res.json()) as {
          ok: boolean
          slug?: string
          country?: string | null
          cc?: string
        }
        if (cancelled) return
        if (!data.ok) {
          markMiss()
          return
        }
        const m = marketFromIso(data.country || data.cc)
        const host = window.location.hostname
        const com = host === 'sivrce.com' || host === 'www.sivrce.com'
        if (m === 'ge') {
          if (com) window.location.replace('/ge')
          else markMiss()
          return
        }
        if (!m || !isGeoLaunch(m)) {
          markMiss()
          return
        }
        const dest = geoHomePath(m, data.slug ?? null)
        const href = com ? dest : `/en${dest}`
        if (
          window.location.pathname === href ||
          window.location.pathname.startsWith(`${href}/`)
        ) {
          return
        }
        window.location.replace(href)
      } catch {
        markMiss()
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])
  return null
}
