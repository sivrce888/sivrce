/**
 * Sentry client-side config — errors only, minimal bill.
 * ponytail: traces 0 in prod. Session replay off; error replay 1%.
 */

import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  tracesSampleRate: process.env.NODE_ENV === "production" ? 0 : 1.0,
  profilesSampleRate: 0,
  maxBreadcrumbs: 20,
  // Session replay is the Sentry bill. Error-only snippets stay tiny.
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: process.env.NODE_ENV === "production" ? 0.01 : 0.1,

  sendDefaultPii: false,
  enableLogs: false,

  ignoreErrors: [
    "ResizeObserver loop",
    "Non-Error promise rejection",
    "AbortError",
    "Load failed",
    "Failed to fetch",
    "NetworkError",
    "ChunkLoadError",
  ],

  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
})
