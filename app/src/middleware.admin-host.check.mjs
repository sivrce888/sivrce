/**
 * Runnable check for admin-host path mapping (mirrors middleware logic).
 * Run: node src/middleware.admin-host.check.mjs
 */
function mapAdminPath(pathname) {
  const passthrough =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api")
  if (passthrough) return pathname
  return pathname === "/" ? "/admin" : `/admin${pathname}`
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg)
}

assert(mapAdminPath("/") === "/admin", "/")
assert(mapAdminPath("/users") === "/admin/users", "/users")
assert(mapAdminPath("/admin") === "/admin", "/admin")
assert(mapAdminPath("/auth/signin") === "/auth/signin", "/auth")
assert(mapAdminPath("/api/health") === "/api/health", "/api")
console.log("middleware.admin-host.check: ok")
