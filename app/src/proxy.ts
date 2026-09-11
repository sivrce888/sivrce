import { NextResponse, type NextRequest } from "next/server"

import { normalizeSource, REF_COOKIE, REF_COOKIE_MAX_AGE } from "@/lib/attribution"
import { decideHost } from "@/lib/host-redirect"
import {
  GEO_COOKIE,
  GEO_COOKIE_MAX_AGE,
  geoHomePath,
  geoLaunchTarget,
  isCrawler,
  isGeoLaunch,
} from "@/lib/geo-market"
import { GE_ORIGIN, MARKET_HEADER, hostKind, isOwnHost, safeRedirectUrl } from "@/lib/site-host"

/**
 * Edge-level defense in depth for protected routes + locale routing
 * + multi-host routing (admin / api / cdn / app / analytics / images)
 * + country paths on sivrce.com (/de /ae /fr /es /it /gb /us /ca /tr;
 *   /uae→/ae, /uk→/gb). Georgia catalog on .com still 308s to sivrce.ge.
 *
 * Route-based i18n: every public page lives under app/[lang]. ka is the
 * canonical default and stays URL-unprefixed — this proxy INTERNALLY
 * rewrites "/" → "/ka" and "/x" → "/ka/x" for non-locale first segments.
 * Host disambiguation: sivrce.ge/de = German locale; sivrce.com/de = Germany.
 *
 * ponytail: cookie-presence only (JWT sessions). Role checks stay in
 * requireAdmin/requireRole against the DB-backed user row.
 */

const SESSION_COOKIES = ["authjs.session-token", "__Secure-authjs.session-token"]

// Every supported locale except the default (ka). Keep in sync with LANGS in src/lib/i18n/core.ts.
const LOCALE_PREFIXES = ["en", "ru", "he", "ar", "tr", "uk", "hy", "az", "de"]

const PROTECTED_PREFIXES = [
  "/admin",
  "/api/admin",
  "/seller",
  "/agent",
  "/agency",
  "/developer",
  "/settings",
  "/dashboard",
  "/auth/onboarding",
]

const APEX = GE_ORIGIN

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  )
}

/** Strip one leading locale prefix (any of the 10) so checks run on the app path. */
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

function isRootPassthrough(pathname: string): boolean {
  return (
    pathname === "/api" ||
    pathname.startsWith("/api/") ||
    pathname === "/auth" ||
    pathname.startsWith("/auth/") ||
    pathname === "/llms.txt" ||
    pathname === "/llms-full.txt" ||
    pathname === "/a8f3c91e2b7d4e6a9c1f0d5b8e4a7c2d.txt" ||
    pathname.startsWith("/.well-known/")
  )
}

function refFrom(req: NextRequest): string {
  const q = req.nextUrl.searchParams
  const campaign = q.get("utm_source") ?? q.get("ref")
  if (campaign) return normalizeSource(campaign)
  try {
    const host = new URL(req.headers.get("referer") ?? "").hostname
    if (host && !isOwnHost(host)) {
      return normalizeSource(host)
    }
  } catch {
    /* no/invalid referer */
  }
  return "direct"
}

function isPreviewReq(host: string): boolean {
  const kind = hostKind(host, process.env.VERCEL_ENV)
  return kind === "preview" || process.env.VERCEL_ENV === "preview"
}

function pass(req: NextRequest, res: NextResponse, preview = false): NextResponse {
  if (!req.cookies.get(REF_COOKIE)?.value) {
    res.cookies.set(REF_COOKIE, refFrom(req), {
      maxAge: REF_COOKIE_MAX_AGE,
      sameSite: "lax",
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    })
  }
  if (req.nextUrl.searchParams.get("cmsPreview") === "1" || preview) {
    res.headers.set("x-cms-preview", "1")
    res.headers.set("X-Robots-Tag", "noindex, nofollow")
  }
  return res
}

function stampMarket(req: NextRequest, market: string): Headers {
  const headers = new Headers(req.headers)
  headers.set(MARKET_HEADER, market)
  return headers
}

function geoCookieOpts(): { maxAge: number; path: string; sameSite: "lax"; secure: boolean } {
  return {
    maxAge: GEO_COOKIE_MAX_AGE,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  }
}

function rememberGeo(
  req: NextRequest,
  res: NextResponse,
  market: string,
  stickyGlobal = false,
): NextResponse {
  // ponytail: never sticky-hub on a missed IP — that trapped humans on the
  // directory. `global` only from ?worldwide=1. Ceiling: travelers keep last
  // country until they pick another; upgrade: TTL by ISO change.
  if (market === "global" && !stickyGlobal) return res
  if (!isGeoLaunch(market) && market !== "global" && market !== "ge") return res
  if (req.cookies.get(GEO_COOKIE)?.value === market) return res
  res.cookies.set(GEO_COOKIE, market, geoCookieOpts())
  return res
}

function isComHomePath(pathname: string): boolean {
  return pathname === "/" || pathname === "/en"
}

function isMapPath(pathname: string): boolean {
  return (
    pathname === "/map" ||
    pathname.startsWith("/map/") ||
    pathname === "/en/map" ||
    pathname.startsWith("/en/map/")
  )
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const host = hostName(req)
  const seg = pathname.split("/")[1] ?? ""
  const preview = isPreviewReq(host)

  if (isRedirectHost(host)) {
    return NextResponse.redirect(new URL(pathname + req.nextUrl.search, APEX), 308)
  }

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

  if (isApiHost(host)) {
    if (pathname === "/api" || pathname.startsWith("/api/")) {
      return NextResponse.next()
    }
    const url = req.nextUrl.clone()
    url.pathname =
      pathname === "/" ? "/api" : `/api${pathname.startsWith("/") ? pathname : `/${pathname}`}`
    return NextResponse.rewrite(url)
  }

  if (isAdminHost(host)) {
    if (pathname.startsWith("/auth")) {
      return NextResponse.next()
    }
    if (pathname.startsWith("/api")) {
      if (pathname.startsWith("/api/admin") && !hasSession(req)) {
        return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 })
      }
      return NextResponse.next()
    }
    if (req.nextUrl.searchParams.get("cmsPreview") === "1") {
      if (LOCALE_PREFIXES.includes(seg) || seg === "ka") {
        return pass(req, NextResponse.next(), preview)
      }
      const pub = req.nextUrl.clone()
      pub.pathname = `/ka${pathname === "/" ? "" : pathname}`
      return pass(req, NextResponse.rewrite(pub), preview)
    }
    const bare = stripLocale(pathname)
    const adminPath = bare === "/" ? "/admin" : bare.startsWith("/admin") ? bare : `/admin${bare}`

    if (isProtected(adminPath) && !hasSession(req)) {
      const cb = req.nextUrl.search ? `${adminPath}${req.nextUrl.search}` : adminPath
      return signinRedirect(req, cb)
    }

    const url = req.nextUrl.clone()
    url.pathname = `/ka${adminPath}`
    return NextResponse.rewrite(url)
  }

  let market = "ge"
  if (!isRootPassthrough(pathname)) {
    const decision = decideHost({
      host,
      pathname,
      vercelEnv: process.env.VERCEL_ENV,
    })
    if (decision.type === "redirect") {
      if (decision.origin === "same") {
        const url = req.nextUrl.clone()
        url.pathname = decision.pathname
        return NextResponse.redirect(url, 308)
      }
      const dest = safeRedirectUrl(decision.origin, decision.pathname, req.nextUrl.search)
      if (!dest) {
        return NextResponse.redirect(new URL("/", APEX), 308)
      }
      return NextResponse.redirect(dest, 308)
    }
    if (decision.type === "rewrite") {
      let nextMarket = decision.market
      // sivrce.com/ : crawlers + worldwide keep the directory; humans 302 to market.
      if (nextMarket === "global" && isComHomePath(pathname) && !preview) {
        const worldwide = req.nextUrl.searchParams.has("worldwide")
        const target = geoLaunchTarget({
          cookie: req.cookies.get(GEO_COOKIE)?.value,
          iso: req.headers.get("x-vercel-ip-country") || req.headers.get("cf-ipcountry"),
          worldwide,
          crawler: isCrawler(req.headers.get("user-agent")),
        })
        if (worldwide) {
          const dest = req.nextUrl.clone()
          dest.searchParams.delete("worldwide")
          return rememberGeo(req, NextResponse.redirect(dest, 302), "global", true)
        }
        if (target === "ge") {
          const dest = safeRedirectUrl(GE_ORIGIN, "/", req.nextUrl.search)
          if (!dest) return NextResponse.redirect(new URL("/", GE_ORIGIN), 302)
          return rememberGeo(req, NextResponse.redirect(dest, 302), "ge")
        }
        if (target !== "hub") {
          const url = req.nextUrl.clone()
          url.pathname = geoHomePath(
            target,
            req.headers.get("x-vercel-ip-city") || req.headers.get("cf-ipcity"),
          )
          return rememberGeo(req, NextResponse.redirect(url, 302), target)
        }
      }
      if (nextMarket === "global" && isMapPath(pathname)) {
        const cook = req.cookies.get(GEO_COOKIE)?.value
        if (isGeoLaunch(cook)) nextMarket = cook
      }
      const url = req.nextUrl.clone()
      url.pathname = decision.pathname
      return rememberGeo(
        req,
        pass(
          req,
          NextResponse.rewrite(url, { request: { headers: stampMarket(req, nextMarket) } }),
          preview,
        ),
        nextMarket,
      )
    }
    market = decision.market
  }

  if (seg === "ka") {
    const url = req.nextUrl.clone()
    url.pathname = pathname.slice(3) || "/"
    return NextResponse.redirect(url, 308)
  }

  const bare = stripLocale(pathname)

  if (isProtected(bare) && !hasSession(req)) {
    const cb = req.nextUrl.search ? `${bare}${req.nextUrl.search}` : bare
    return signinRedirect(req, cb)
  }

  if (LOCALE_PREFIXES.includes(seg)) {
    const headers = stampMarket(req, market)
    return rememberGeo(req, pass(req, NextResponse.next({ request: { headers } }), preview), market)
  }

  if (isRootPassthrough(pathname)) {
    return NextResponse.next()
  }

  const url = req.nextUrl.clone()
  url.pathname = `/ka${pathname === "/" ? "" : pathname}`
  return rememberGeo(
    req,
    pass(
      req,
      NextResponse.rewrite(url, { request: { headers: stampMarket(req, market) } }),
      preview,
    ),
    market,
  )
}

export const config = {
  matcher: [
    "/",
    "/((?!_next/static|_next/image|.*\\..*).*)",
  ],
}
