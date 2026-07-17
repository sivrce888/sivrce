import { NextResponse, type NextRequest } from "next/server"

/**
 * Edge-level defense in depth for protected routes + locale-prefixed URLs.
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

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  )
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

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
    // Dedicated SSR homes for en/ru — don't rewrite the locale root away.
    if (stripped === "/" && (seg === "en" || seg === "ru")) {
      return NextResponse.next()
    }
    const url = req.nextUrl.clone()
    url.pathname = stripped
    return NextResponse.rewrite(url)
  }
  return NextResponse.next()
}

export const config = {
  // All pages, excluding api, _next internals, and file-like paths (sw.js, icons, sitemap.xml…).
  matcher: ["/((?!api|_next|.*\\..*).*)"],
}
