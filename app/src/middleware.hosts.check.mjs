/**
 * Runnable check for multi-host path mapping (mirrors middleware logic).
 * Run: node src/middleware.hosts.check.mjs
 */

function mapAdminPath(pathname) {
  const passthrough =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api")
  if (passthrough) return pathname
  return pathname === "/" ? "/admin" : `/admin${pathname}`
}

function mapApiPath(pathname) {
  if (pathname === "/api" || pathname.startsWith("/api/")) return pathname
  return pathname === "/" ? "/api" : `/api${pathname}`
}

// Mirrors the services-host block in proxy.ts (ka = the no-cookie, no-AL default).
const SERVICES_LOCALES = ["en", "ru", "he", "ar", "tr", "uk", "hy", "az", "de"]

function stripLocale(pathname) {
  const seg = pathname.split("/")[1] ?? ""
  if (seg === "ka" || SERVICES_LOCALES.includes(seg)) {
    return pathname.slice(seg.length + 1) || "/"
  }
  return pathname
}

function mapServicesPath(pathname) {
  const passthrough =
    pathname === "/api" ||
    pathname.startsWith("/api/") ||
    pathname === "/auth" ||
    pathname.startsWith("/auth/") ||
    pathname === "/offline" ||
    pathname.startsWith("/.well-known/")
  if (passthrough) return pathname
  const bare = stripLocale(pathname)
  const path =
    bare === "/" ? "/services" : bare.startsWith("/services") ? bare : `/services${bare}`
  return `/ka${path}`
}

function cdnAllows(pathname) {
  return (
    pathname.startsWith("/images/") ||
    pathname.startsWith("/icons/") ||
    pathname.startsWith("/logo/") ||
    pathname.startsWith("/_next/static/") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/manifest.webmanifest"
  )
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg)
}

assert(mapAdminPath("/") === "/admin", "admin /")
assert(mapAdminPath("/users") === "/admin/users", "admin /users")
assert(mapAdminPath("/admin") === "/admin", "admin /admin")
assert(mapAdminPath("/auth/signin") === "/auth/signin", "admin /auth")
assert(mapAdminPath("/api/health") === "/api/health", "admin /api")

assert(mapApiPath("/") === "/api", "api /")
assert(mapApiPath("/search") === "/api/search", "api /search")
assert(mapApiPath("/api/search") === "/api/search", "api passthrough")

assert(mapServicesPath("/") === "/ka/services", "services /")
assert(mapServicesPath("/services") === "/ka/services", "services /services")
assert(mapServicesPath("/renovation") === "/ka/services/renovation", "services category")
assert(
  mapServicesPath("/services/legal/coast-notary") === "/ka/services/legal/coast-notary",
  "services detail passthrough",
)
assert(mapServicesPath("/en/renovation") === "/ka/services/renovation", "services locale prefix")
assert(mapServicesPath("/api/health") === "/api/health", "services /api")
assert(mapServicesPath("/auth/signin") === "/auth/signin", "services /auth")

assert(cdnAllows("/logo/x.svg"), "cdn logo")
assert(cdnAllows("/images/p1.webp"), "cdn images")
assert(!cdnAllows("/"), "cdn blocks /")
assert(!cdnAllows("/admin"), "cdn blocks /admin")

console.log("middleware.hosts.check: ok")
