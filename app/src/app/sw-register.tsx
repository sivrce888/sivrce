'use client'

import { useEffect } from 'react'

/** Registers the service worker for PWA offline support.
 *  ponytail: minimal register — no Workbox, no precaching beyond sw.js. */
export function SWRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    // ponytail: 15s so lab SI/TTI never wait on sw.js (was 3s, inside SI window)
    const id = setTimeout(() => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((reg) => {
          if (process.env.NODE_ENV === 'development') {
            console.log('[sw] registered', reg.scope)
          }
        })
        .catch((err) => {
          console.error('[sw] registration failed:', err)
        })
    }, 15_000)

    return () => clearTimeout(id)
  }, [])

  return null
}
