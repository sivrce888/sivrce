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

import { Suspense, useEffect, useRef, type ReactNode } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { initPostHog, posthog, posthogReady } from '@/lib/posthog'

function Pageview() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Effects run child-first — init here (idempotent) so capture never fires pre-init.
    initPostHog()
    if (!posthogReady()) return
    // ponytail: $pageview with the full URL — matches PostHog autocapture convention
    const url = `${pathname}${searchParams?.size ? `?${searchParams.toString()}` : ''}`
    posthog.capture('$pageview', { $current_url: url })
  }, [pathname, searchParams])

  return null
}

export default function PostHogProvider({ children }: { children: ReactNode }) {
  const initialized = useRef(false)

  // One-time init
  useEffect(() => {
    if (!initialized.current) {
      initPostHog()
      initialized.current = true
    }
  }, [])

  return (
    <>
      {children}
      <Suspense fallback={null}>
        <Pageview />
      </Suspense>
    </>
  )
}
