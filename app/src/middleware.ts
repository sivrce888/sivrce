import { NextResponse, type NextRequest } from "next/server"

/**
 * Edge-level defense in depth for protected routes + locale routing
 * + multi-host routing (admin / api / cdn / app / analytics / images).
 *
 * Route-based i18n: every public page lives under app/[lang]. ka is the
 * canonical default and stays URL-unprefixed — this middleware INTERNALLY
 * rewrites "/" → "/ka" and "/x" → "/ka/x" for non-locale first segments
 * (api/auth/_next/file-like excluded by the passthrough below and the
 * matcher). Prefixed locales ("/en/search") resolve natively; an explicit
 * "/ka/…" URL 308s to its unprefixed canonical form. The [lang] layout
 * validates the locale and 404s invalid prefixes.
 *
 * The authoritative role check still happens server-side in `requireAdmin()`
 * / `requireRole()` — those query the DB-backed session. Edge middleware
 * can't reach Prisma, so here we only verify session-cookie presence.
 *
 * ponytail: cookie-presence only (JWT sessions). Role checks stay in
 * requireAdmin/requireRole against the DB-backed user row.
 */

const SESSION_COOKIES = ["authjs.session-token", "__Secure-authjs.session-token"]

// Every supported locale except the default (ka). Keep in sync with LANGS in src/lib/i18n/core.ts.
const LOCALE_PREFIXES = ["en", "ru", "he", "ar", "tr", "uk", "hy", "az"]

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

const APEX = "https://sivrce.ge"

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  )
}

/** Strip one leading locale prefix (any of the 9) so checks run on the app path. */
function stripLocale(pathname: string): string {
  const seg = pathname.split("/")[1] ?? ""
  if (seg === "ka" || LOCALE_PREFIXES.includes(seg)) {
    return pathname.slice(seg.length + 1) || "/"
  }
  return pathname
}

function hasSession(req: NextRequest): boolean {
  return SESSION_COOKIES.some((c) => Boolean(req.cookies.get(c)?.value))
}

function signinRedirect(req: NextRequest, callbackUrl: string): NextResponse {
  const url = req.nextUrl.clone()
  url.pathname = "/auth/signin"
  url.search = ""
  url.searchParams.set("callbackUrl", callbackUrl)
  return NextResponse.redirect(url)
}

function hostName(req: NextRequest): string {
  // Prefer x-forwarded-host (Vercel / Cloudflare) then Host.
  const raw =
    req.headers.get("x-forwarded-host") ||
    req.headers.get("host") ||
    ""
  return raw.split(",")[0]!.trim().split(":")[0]!.toLowerCase()
}

function isAdminHost(host: string): boolean {
  return host === "admin.sivrce.ge" || host === "admin.localhost"
}

function isCdnHost(host: string): boolean {
  return host === "cdn.sivrce.ge" || host === "images.sivrce.ge"
}

function isApiHost(host: string): boolean {
  return host === "api.sivrce.ge" || host === "api.localhost"
}

function isRedirectHost(host: string): boolean {
  return host === "app.sivrce.ge" || host === "analytics.sivrce.ge"
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const host = hostName(req)

  // app / analytics → apex (single product surface).
  if (isRedirectHost(host)) {
    return NextResponse.redirect(new URL(pathname + req.nextUrl.search, APEX), 308)
  }

  // CDN / images: static assets only; everything else → apex.
  if (isCdnHost(host)) {
    const staticOk =
      pathname.startsWith("/images/") ||
      pathname.startsWith("/icons/") ||
      pathname.startsWith("/logo/") ||
      pathname.startsWith("/_next/static/") ||
      pathname === "/favicon.ico" ||
      pathname === "/robots.txt" ||
      pathname === "/manifest.webmanifest"
    if (!staticOk) {
      return NextResponse.redirect(
        new URL(pathname + req.nextUrl.search, APEX),
        308,
      )
    }
    const res = NextResponse.next()
    res.headers.set(
      "Cache-Control",
      "public, max-age=31536000, immutable",
    )
    return res
  }

  // api.sivrce.ge → /api/* (same deployment).
  if (isApiHost(host)) {
    if (pathname === "/api" || pathname.startsWith("/api/")) {
      return NextResponse.next()
    }
    const url = req.nextUrl.clone()
    url.pathname =
      pathname === "/" ? "/api" : `/api${pathname.startsWith("/") ? pathname : `/${pathname}`}`
    return NextResponse.rewrite(url)
  }

  // Admin host: map / → /ka/admin, /users → /ka/admin/users (auth stays as-is).
  if (isAdminHost(host)) {
    if (pathname.startsWith("/auth") || pathname.startsWith("/api")) {
      return NextResponse.next()
    }
    const bare = stripLocale(pathname)
    const adminPath = bare === "/" ? "/admin" : bare.startsWith("/admin") ? bare : `/admin${bare}`

    if (isProtected(adminPath) && !hasSession(req)) {
      return signinRedirect(req, adminPath)
    }

    const url = req.nextUrl.clone()
    url.pathname = `/ka${adminPath}`
    return NextResponse.rewrite(url)
  }

  // Canonical ka is unprefixed: an explicit /ka/… URL redirects to its clean form.
  const seg = pathname.split("/")[1] ?? ""
  if (seg === "ka") {
    const url = req.nextUrl.clone()
    url.pathname = pathname.slice(3) || "/"
    return NextResponse.redirect(url, 308)
  }

  // Everything below works on the locale-stripped app path (as before).
  const bare = stripLocale(pathname)

  if (isProtected(bare) && !hasSession(req)) {
    return signinRedirect(req, bare)
  }

  // Prefixed locales resolve through the app/[lang] segment natively.
  if (LOCALE_PREFIXES.includes(seg)) {
    return NextResponse.next()
  }

  // Route handlers + auth flows stay at the root, unprefixed.
  if (pathname === "/api" || pathname.startsWith("/api/") || pathname === "/auth" || pathname.startsWith("/auth/")) {
    return NextResponse.next()
  }

  // ka-injection: unprefixed app URLs serve the ka segment internally;
  // the external URL stays clean and canonical.
  const url = req.nextUrl.clone()
  url.pathname = `/ka${pathname === "/" ? "" : pathname}`
  return NextResponse.rewrite(url)
}

export const config = {
  // MUST include `/` — the catch-all group alone skips the apex path, which
  // broke admin.sivrce.ge → /admin. Skip only Next internals + file-like paths.
  matcher: [
    "/",
    "/((?!_next/static|_next/image|.*\\..*).*)",
  ],
}
