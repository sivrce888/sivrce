/**
 * SIVRCE — Sentry thin adapter.
 *
 * ponytail: two helpers — captureError for catching, setSentryUser for auth
 * context. Graceful: if Sentry isn't configured (no DSN), all calls are no-ops.
 *
 * Client-safe: these use the @sentry/nextjs package which handles both
 * client and server environments.
 */

import * as Sentry from '@sentry/nextjs'

const hasDsn =
  typeof process !== 'undefined' &&
  !!(process.env.NEXT_PUBLIC_SENTRY_DSN ?? process.env.SENTRY_DSN)

/**
 * Capture an error with optional context tags.
 * Safe to call from any component or server action — no-ops if Sentry isn't set up.
 */
export function captureError(
  error: unknown,
  context?: Record<string, string>,
): void {
  if (!hasDsn) return
  if (context) {
    Sentry.withScope((scope) => {
      scope.setTags(context)
      if (error instanceof Error) {
        Sentry.captureException(error)
      } else {
        Sentry.captureMessage(String(error), 'error')
      }
    })
  } else {
    if (error instanceof Error) {
      Sentry.captureException(error)
    } else {
      Sentry.captureMessage(String(error), 'error')
    }
  }
}

/**
 * Set the current user context for Sentry.
 * Call after login/identify to attach user info to error reports.
 */
export function setSentryUser(user: { id: string; email?: string }): void {
  if (!hasDsn) return
  Sentry.setUser({ id: user.id, email: user.email })
}
