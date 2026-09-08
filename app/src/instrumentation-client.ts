/**
 * Runs before hydration (Next instrumentation-client).
 *
 * BotID client — protects phone reveal + lead form + CV upload from scrapers.
 * MUST live in src/: with a src dir, Next ignores a root-level
 * instrumentation-client.ts (that shadowing is what broke the reveal 2026-07→09).
 * @see https://vercel.com/docs/botid/get-started
 */
import { initBotId } from 'botid/client/core'

// Sentry errors-only, idle-deferred off the load critical path — same trade
// as the tap-gated PostHog init. No DSN → the SDK chunk is never fetched.
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  const kick = () => void import("../sentry.client.init")
  if (typeof requestIdleCallback === "function") {
    requestIdleCallback(kick, { timeout: 5000 })
  } else {
    setTimeout(kick, 3000)
  }
}

initBotId({
  protect: [
    { path: '/api/listings/*/phone', method: 'POST' },
    { path: '/api/inquiries', method: 'POST' },
    { path: '/api/careers/cv', method: 'POST' },
  ],
})

/**
 * React 19.2 logs a dev-only error whenever it client-creates any executable
 * <script> — e.g. next-themes' pre-hydration theme script and our layouts'
 * lite-boot during soft navigations across root layouts. Those scripts are
 * SSR-only by design: lite-boot gates first paint on full loads and
 * next-themes re-applies the theme via effects, so nothing relies on
 * client-created script execution. Filter exactly that false positive;
 * keep everything else loud. ponytail: revisit if React ships an opt-out.
 */
if (process.env.NODE_ENV === "development") {
  const origError = console.error.bind(console)
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === "string" &&
      args[0].includes("Encountered a script tag while rendering React component")
    ) {
      return
    }
    origError(...args)
  }
}
