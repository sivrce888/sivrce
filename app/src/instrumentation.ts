/**
 * Server/edge observability via native Next instrumentation — no
 * withSentryConfig wrapper. All SDK imports stay dynamic: with no DSN the
 * SDK never loads, so cold starts and RAM stay untouched. ponytail: when
 * Sentry goes live and sourcemaps matter, upgrade path is withSentryConfig.
 */
import type * as Sentry from "@sentry/nextjs"

export async function register() {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return
  if (process.env.NEXT_RUNTIME === "edge") await import("../sentry.edge.config")
  else await import("../sentry.server.config")
}

export async function onRequestError(
  ...args: Parameters<typeof Sentry.captureRequestError>
) {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return
  const { captureRequestError } = await import("@sentry/nextjs")
  captureRequestError(...args)
}
