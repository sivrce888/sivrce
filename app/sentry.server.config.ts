/**
 * Sentry server-side config.
 * ponytail: 1% traces in prod. Profiling/cron monitoring only if paged.
 */

import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  tracesSampleRate: process.env.NODE_ENV === "production" ? 0 : 1.0,
  sendDefaultPii: false,
  enableLogs: false,

  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
})
