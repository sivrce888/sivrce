'use client'

/**
 * SIVRCE — PostHog provider.
 *
 * Initializes posthog-js once (idempotent) and captures pageviews
 * on route changes. Wrap children at the layout level.
 *
 * Graceful: if NEXT_PUBLIC_POSTHOG_KEY is not set, this renders
 * children as-is with zero overhead.
 *
 * The route-hook reader lives in its own Suspense boundary below —
 * useSearchParams() suspends during static prerender; wrapping the
 * whole provider blanked the SSR shell of every page (SEO kill).
 */

import { Suspense, useEffect, useRef, useState, type ReactNode } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

function Pageview({ armed }: { armed: boolean }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!armed) return
    const url = `${pathname}${searchParams?.size ? `?${searchParams.toString()}` : ''}`
    void import('@/lib/posthog').then(({ posthog, posthogReady }) => {
      if (!posthogReady()) return
      posthog.capture('$pageview', { $current_url: url })
    })
  }, [armed, pathname, searchParams])

  return null
}

export default function PostHogProvider({ children }: { children: ReactNode }) {
  const initialized = useRef(false)
  const [armed, setArmed] = useState(false)

  useEffect(() => {
    const boot = () => {
      if (initialized.current) return
      initialized.current = true
      // ponytail: posthog-js stays out of the homepage JS until a real tap
      void import('@/lib/posthog').then(({ initPostHog }) => {
        initPostHog()
        setArmed(true)
      })
    }
    window.addEventListener("pointerdown", boot, { once: true, passive: true })
    window.addEventListener("keydown", boot, { once: true, passive: true })
    return () => {
      window.removeEventListener("pointerdown", boot)
      window.removeEventListener("keydown", boot)
    }
  }, [])

  return (
    <>
      {children}
      <Suspense fallback={null}>
        <Pageview armed={armed} />
      </Suspense>
    </>
  )
}
