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

assert(cdnAllows("/logo/x.svg"), "cdn logo")
assert(cdnAllows("/images/p1.webp"), "cdn images")
assert(!cdnAllows("/"), "cdn blocks /")
assert(!cdnAllows("/admin"), "cdn blocks /admin")

console.log("middleware.hosts.check: ok")
