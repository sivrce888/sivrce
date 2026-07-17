import { NextResponse, type NextRequest } from "next/server"

/**
 * Edge-level defense in depth for protected routes.
 *
 * The authoritative role check still happens server-side in `requireAdmin()`
 * (admin/layout.tsx) and `requireRole()` (role dashboards) — those query the
 * DB-backed session. Edge middleware can't reach Prisma (Neon), so here we
 * only verify session-cookie presence. This blocks the cheapest attacks
 * (anonymous scraping, scanner probing /admin) at the edge before the
 * request warms a lambda. Auth is never weakened — absence of cookie always
 * means no session.
 *
 * ponytail: cookie-presence only. Upgrade path: switch session strategy to
 * JWT (or add an HTTP-session adapter) if we ever need real role checks at
 * the edge.
 */

// NextAuth v5 database-session cookie names. Auth.js @auth/core sets the
// secure variant as `__Secure-authjs.session-token` (dot after __Secure).
const SESSION_COOKIES = ["authjs.session-token", "__Secure-authjs.session-token"]

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/")
  if (!isAdmin) return NextResponse.next()

  // Cookie presence is enough to let the request reach the server-side role
  // check in requireAdmin(). Absence always means no session.
  const hasSession = SESSION_COOKIES.some(
    (c) => Boolean(req.cookies.get(c)?.value),
  )
  if (hasSession) return NextResponse.next()

  const url = req.nextUrl.clone()
  url.pathname = "/api/auth/signin"
  url.searchParams.set("callbackUrl", pathname)
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
}
