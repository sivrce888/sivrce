import { NextResponse, type NextRequest } from "next/server"

/**
 * Edge-level defense in depth for protected routes + locale-prefixed URLs
 * + multi-host routing (admin / api / cdn / app / analytics / images).
 *
 * Locale prefixes ("/en/search", "/ru/listing/…") rewrite to the unprefixed
 * app; the client i18n provider reads the prefix from the URL. ka stays
 * unprefixed (canonical default). ponytail: hreflang lives in the sitemap
 * only — head <link> tags would force the root layout dynamic. Upgrade path:
 * app/[lang] segment if we ever need server-rendered non-ka HTML.
 *
 * The authoritative role check still happens server-side in `requireAdmin()`
 * / `requireRole()` — those query the DB-backed session. Edge middleware
 * can't reach Prisma (Neon), so here we only verify session-cookie presence.
 *
 * ponytail: cookie-presence only. Upgrade path: JWT sessions if we need
 * real role checks at the edge.
 */

const SESSION_COOKIES = ["authjs.session-token", "__Secure-authjs.session-token"]

// Every supported locale except the default (ka). Keep in sync with LANGS in src/lib/i18n/context.ts.
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

  // Admin host: map / → /admin, /users → /admin/users (auth stays as-is).
  if (isAdminHost(host)) {
    const passthrough =
      pathname.startsWith("/admin") ||
      pathname.startsWith("/auth") ||
      pathname.startsWith("/api")
    const adminPath = passthrough
      ? pathname
      : pathname === "/"
        ? "/admin"
        : `/admin${pathname}`

    if (isProtected(adminPath)) {
      const hasSession = SESSION_COOKIES.some((c) => Boolean(req.cookies.get(c)?.value))
      if (!hasSession) {
        const url = req.nextUrl.clone()
        url.pathname = "/auth/signin"
        url.search = ""
        url.searchParams.set("callbackUrl", adminPath)
        return NextResponse.redirect(url)
      }
    }

    if (adminPath !== pathname) {
      const url = req.nextUrl.clone()
      url.pathname = adminPath
      return NextResponse.rewrite(url)
    }
    return NextResponse.next()
  }

  // Strip a locale prefix; everything below works on the real app path.
  const seg = pathname.split("/")[1] ?? ""
  const hasPrefix = LOCALE_PREFIXES.includes(seg)
  const stripped = hasPrefix ? pathname.slice(seg.length + 1) || "/" : pathname

  if (isProtected(stripped)) {
    const hasSession = SESSION_COOKIES.some((c) => Boolean(req.cookies.get(c)?.value))
    if (!hasSession) {
      const url = req.nextUrl.clone()
      url.pathname = "/auth/signin"
      url.search = ""
      url.searchParams.set("callbackUrl", stripped)
      return NextResponse.redirect(url)
    }
  }

  if (hasPrefix) {
    // Dedicated SSR pages for en/ru — don't rewrite them away:
    // the locale root and the programmatic SEO pages (/en/sale/…, /ru/tbilisi/…).
    // Keep SEO_ROOTS in sync with DEALS/CITIES in src/lib/seo-pages.ts.
    if (seg === "en" || seg === "ru") {
      if (stripped === "/") return NextResponse.next()
      const root = stripped.split("/")[1] ?? ""
      if (SEO_ROOTS.has(root)) return NextResponse.next()
    }
    const url = req.nextUrl.clone()
    url.pathname = stripped
    return NextResponse.rewrite(url)
  }
  return NextResponse.next()
}

// Deal + city roots that have physical en/ru SSR pages (see app/en/[...seo]).
const SEO_ROOTS = new Set(["sale", "rent", "daily", "pledge", "tbilisi", "batumi", "kutaisi"])

export const config = {
  // MUST include `/` — the catch-all group alone skips the apex path, which
  // broke admin.sivrce.ge → /admin. Skip only Next internals + file-like paths.
  matcher: [
    "/",
    "/((?!_next/static|_next/image|.*\\..*).*)",
  ],
}
