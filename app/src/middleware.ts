import { NextResponse, type NextRequest } from "next/server"

/**
 * Edge-level defense in depth for protected routes.
 *
 * The authoritative role check still happens server-side in `requireAdmin()`
 * / `requireRole()` — those query the DB-backed session. Edge middleware
 * can't reach Prisma (Neon), so here we only verify session-cookie presence.
 *
 * ponytail: cookie-presence only. Upgrade path: JWT sessions if we need
 * real role checks at the edge.
 */

const SESSION_COOKIES = ["authjs.session-token", "__Secure-authjs.session-token"]

const PROTECTED_PREFIXES = [
  "/admin",
  "/seller",
  "/agent",
  "/agency",
  "/developer",
  "/settings",
  "/dashboard",
  "/auth/onboarding",
]

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  )
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (!isProtected(pathname)) return NextResponse.next()

  const hasSession = SESSION_COOKIES.some((c) => Boolean(req.cookies.get(c)?.value))
  if (hasSession) return NextResponse.next()

  const url = req.nextUrl.clone()
  url.pathname = "/auth/signin"
  url.searchParams.set("callbackUrl", pathname)
  return NextResponse.redirect(url)
}

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/seller",
    "/seller/:path*",
    "/agent",
    "/agent/:path*",
    "/agency",
    "/agency/:path*",
    "/developer",
    "/developer/:path*",
    "/settings",
    "/settings/:path*",
    "/dashboard",
    "/dashboard/:path*",
    "/auth/onboarding",
  ],
}
