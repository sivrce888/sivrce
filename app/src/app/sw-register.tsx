'use client'

import { useEffect } from 'react'

/** Registers the service worker for PWA offline support.
 *  ponytail: minimal register — no Workbox, no precaching beyond sw.js. */
export function SWRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    // Delay registration so the page renders first (LCP-friendly)
    const id = setTimeout(() => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((reg) => {
          // ponytail: silent registration; upgrade prompt handled by Capacitor
          if (process.env.NODE_ENV === 'development') {
            console.log('[sw] registered', reg.scope)
          }
        })
        .catch((err) => {
          console.error('[sw] registration failed:', err)
        })
    }, 3000)

    return () => clearTimeout(id)
  }, [])

  return null
}
