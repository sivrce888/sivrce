'use client'

/**
 * SIVRCE — PostHog provider.
 *
 * Initializes posthog-js once (idempotent) and captures pageviews
 * on route changes. Wrap children at the layout level.
 *
 * Graceful: if NEXT_PUBLIC_POSTHOG_KEY is not set, this renders
 * children as-is with zero overhead.
 */

import { useEffect, useRef, type ReactNode } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { initPostHog, posthog } from '@/lib/posthog'

export default function PostHogProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const initialized = useRef(false)

  // One-time init
  useEffect(() => {
    if (!initialized.current) {
      initPostHog()
      initialized.current = true
    }
  }, [])

  // Pageview capture on route change
  useEffect(() => {
    if (!initialized.current) return
    // ponytail: $pageview with the full URL — matches PostHog autocapture convention
    const url = `${pathname}${searchParams?.size ? `?${searchParams.toString()}` : ''}`
    posthog.capture('$pageview', { $current_url: url })
  }, [pathname, searchParams])

  return <>{children}</>
}
