/**
 * SIVRCE — Server-side Sentry registration hook.
 *
 * Loads the correct Sentry config for the current runtime (Node.js or Edge).
 * Also exports onRequestError to capture unhandled server request errors.
 *
 * ponytail: requires @sentry/nextjs >= 8.28.0 for onRequestError.
 */

import * as Sentry from '@sentry/nextjs'

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}

export const onRequestError = Sentry.captureRequestError
