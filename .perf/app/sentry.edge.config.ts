/**
 * Sentry edge runtime config.
 * ponytail: edge-compatible subset. No file I/O integrations.
 */

import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  tracesSampleRate: 0.05, // lower on edge — middleware runs on every request

  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
})
