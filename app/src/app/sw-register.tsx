'use client'

import { useEffect } from 'react'

import { isNative } from '@/lib/native'

/** Registers the service worker for PWA offline support.
 *  ponytail: minimal register — no Workbox, no precaching beyond sw.js.
 *  The Capacitor shell skips it: the remote site's SW is useless (and flaky)
 *  inside WKWebView/AndroidWebView. */
export function SWRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return
    if (isNative()) return

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
          // Offline caching is progressive enhancement: private windows,
          // embedded webviews and locked-down corporate profiles all refuse to
          // register a worker, and none of that is a fault the user can act on.
          // Nothing downstream depends on it, so it stays out of their console.
          if (process.env.NODE_ENV === 'development') {
            console.warn('[sw] registration skipped:', err)
          }
        })
    }, 15_000)

    return () => clearTimeout(id)
  }, [])

  return null
}
