/**
 * Post-response work that must actually finish (alerts, reindex, lead sync).
 *
 * A bare `void promise` in a route handler is not guaranteed to run on
 * Vercel: once the response is sent the function can be frozen, silently
 * dropping saved-search alerts, search reindexes and IndexNow pings.
 * `after()` hands the work to the platform's waitUntil, so the instance
 * stays alive until it settles — and the response ships first.
 *
 * Outside a request scope (cron scripts, tsx checks) `after` throws; fall
 * back to a detached promise there. Errors are logged, never thrown.
 */

import { after } from "next/server"

export function background(label: string, task: () => Promise<unknown>): void {
  const run = () =>
    task().catch((e: unknown) =>
      console.error(`[background] ${label}:`, e instanceof Error ? e.message : e),
    )
  try {
    after(run)
  } catch {
    void run()
  }
}
