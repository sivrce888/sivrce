'use client'

/**
 * SIVRCE — PostHog analytics adapter (thin).
 *
 * ponytail: posthog-js is DYNAMICALLY imported inside initPostHog so no page
 * bundle ever carries it — the TDDDG §25 consent gate in PostHogProvider
 * controls when the chunk loads at all. Consumers import usePostHog() and
 * their calls no-op (cheaply, without the SDK) until init completes.
 *
 * Graceful degradation: if NEXT_PUBLIC_POSTHOG_KEY is missing, all calls are
 * no-ops. Nothing breaks, nothing logs — the app runs fine without PostHog.
 */

import { useCallback } from 'react'

type PostHogJs = typeof import('posthog-js').default

let ph: PostHogJs | null = null
let initStarted = false

export async function initPostHog(): Promise<void> {
  if (initStarted) return
  initStarted = true

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  if (!key) return // ponytail: no key → skip silently

  const { default: posthog } = await import('posthog-js')
  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com',
    // Cost lock: manual $pageview only; Sentry owns errors; no replay/flags/autocapture.
    autocapture: false,
    // Web vitals come from rum-telemetry's own observers (free, plus deviceTier).
    // Leaving this on made posthog-js download web-vitals-with-attribution.js and
    // collect LCP/CLS a second time.
    capture_performance: false,
    capture_pageview: false,
    capture_pageleave: false,
    capture_exceptions: false,
    disable_session_recording: true,
    advanced_disable_feature_flags: true,
    advanced_disable_toolbar_metrics: true,
    rageclick: false,
    persistence: 'localStorage',
    person_profiles: 'identified_only',
    disable_surveys: true,
  })
  ph = posthog
}

export function usePostHog() {
  const capture = useCallback(
    (eventName: string, properties?: Record<string, unknown>) => {
      ph?.capture(eventName, properties) // no-op until consent-gated init completes
    },
    [],
  )

  return { capture }
}

/** True after initPostHog() successfully configured the client. */
export function posthogReady(): boolean {
  return ph !== null
}
