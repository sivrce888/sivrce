/**
 * CSRF: same-origin enforcement for JSON mutation routes.
 *
 * Server actions are signed by Next and don't need this. The public JSON POST
 * routes (`/api/inquiries`, `/api/reviews`, `/api/reviews/[id]/helpful`) are
 * callable cross-site by default — `sameSite=lax` session cookies block most
 * cookie-auth CSRF but not unauthenticated bot POSTs, and not same-site
 * subdomain attacks. We require either:
 *   - `Sec-Fetch-Site: same-origin` (modern browsers), or
 *   - an `Origin`/`Referer` header whose host matches the deployment.
 *
 * ponytail: stdlib only; no CSRF token / double-submit cookie to manage. The
 * ceiling: very old browsers without Sec-Fetch-Site fall back to the
 * Origin/Referer check, which is still strict. Upgrade path: add a signed
 * double-submit token if we ever accept cookies from third-party embeds.
 */

const SAME_SITE = ["same-origin", "same-site", "none"] as const

function expectedHost(req: Request): string | null {
  // On Vercel the canonical host is in `x-forwarded-host`; locally it's `host`.
  return (
    req.headers.get("x-forwarded-host") ||
    req.headers.get("host")
  )
}

/** True iff `req` looks same-origin with the deployment it landed on. */
export function isSameOrigin(req: Request): boolean {
  const site = req.headers.get("sec-fetch-site")
  if (site && (SAME_SITE as readonly string[]).includes(site)) return true
  if (site === "cross-site") return false

  // Legacy / non-Fetch-Metadata fallback: compare Origin or Referer host.
  const origin = req.headers.get("origin") || req.headers.get("referer")
  const host = expectedHost(req)
  if (!origin || !host) {
    // No Origin AND no Sec-Fetch-Site → deny. Modern browsers always send one.
    return false
  }
  try {
    const { host: originHost } = new URL(origin)
    return originHost === host
  } catch {
    return false
  }
}
