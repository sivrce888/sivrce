/**
 * SIVRCE — Sentry thin adapter.
 *
 * Browser-only, lazy: a static `import * as Sentry` here put the whole 3 MB
 * server SDK into the SSR layer (via global-error) even with no DSN. The
 * `typeof window` guard is compiled to a constant on the server, so the import
 * is dead code there and no server chunk is emitted. Server errors are
 * reported by onRequestError in src/instrumentation.ts.
 * Graceful: if Sentry isn't configured (no DSN), calls are no-ops.
 */

const hasDsn =
  typeof process !== 'undefined' &&
  !!(process.env.NEXT_PUBLIC_SENTRY_DSN ?? process.env.SENTRY_DSN)

/**
 * Capture an error with optional context tags.
 * Client components only (no-op on the server and without a DSN).
 */
export function captureError(
  error: unknown,
  context?: Record<string, string>,
): void {
  if (typeof window === 'undefined' || !hasDsn) return
  void import('@sentry/nextjs')
    .then((Sentry) =>
      Sentry.withScope((scope) => {
        if (context) scope.setTags(context)
        if (error instanceof Error) Sentry.captureException(error)
        else Sentry.captureMessage(String(error), 'error')
      }),
    )
    .catch(() => {}) // reporting must never throw inside an error boundary
}
