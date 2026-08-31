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
    // Cost lock: manual $pageview only; Sentry owns errors; no replay/flags/autocapture.
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: false,
    capture_exceptions: false,
    disable_session_recording: true,
    advanced_disable_feature_flags: true,
    advanced_disable_toolbar_metrics: true,
    rageclick: false,
    persistence: 'localStorage',
    person_profiles: 'identified_only',
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

/** True after initPostHog() successfully configured the client. */
export function posthogReady(): boolean {
  return initialized
}

/** Direct access to the posthog instance — use sparingly */
export { posthog }
