/**
 * Sentry client-side config — error monitoring + Web Vitals.
 * ponytail: default config. Tune sample rates when traffic grows.
 */

import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: false,
    }),
  ],

  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
})
