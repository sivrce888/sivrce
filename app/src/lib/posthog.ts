'use client'

/**
 * SIVRCE — PostHog analytics adapter (thin).
 *
 * ponytail: singleton init via posthog-js; no PostHogProvider component needed
 * — just import `usePostHog()` in any client component. Init happens once
 * in PostHogProvider (src/components/PostHogProvider.tsx).
 *
 * Graceful degradation: if NEXT_PUBLIC_POSTHOG_KEY is missing, all calls are
 * no-ops. Nothing breaks, nothing logs — the app runs fine without PostHog.
 */

import posthog from 'posthog-js'
import { useCallback } from 'react'

let initialized = false

export function initPostHog(): void {
  if (initialized) return

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  if (!key) return // ponytail: no key → skip silently

  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com',
    // ponytail: capture unhandled exceptions via PostHog error tracking
    capture_exceptions: true,
    // ponytail: session replay — 10% of sessions, 100% of error sessions
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: '[data-ph-mask]',
    },
  })

  initialized = true
}

export function usePostHog() {
  const capture = useCallback(
    (eventName: string, properties?: Record<string, unknown>) => {
      if (!initialized) return // ponytail: no-op when PostHog isn't configured
      posthog.capture(eventName, properties)
    },
    [],
  )

  const identify = useCallback(
    (distinctId: string, properties?: Record<string, unknown>) => {
      if (!initialized) return
      posthog.identify(distinctId, properties)
    },
    [],
  )

  const reset = useCallback(() => {
    if (!initialized) return
    posthog.reset()
  }, [])

  return { capture, identify, reset }
}

/** Direct access to the posthog instance — use sparingly */
export { posthog }
