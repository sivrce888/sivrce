/**
 * Sentry edge runtime config.
 * ponytail: edge-compatible subset. 1% traces — middleware volume is high.
 */

import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  tracesSampleRate: process.env.NODE_ENV === "production" ? 0 : 1.0,
  sendDefaultPii: false,

  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
})
