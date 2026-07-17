/**
 * Runnable check for auth role helpers.
 * Run: npx tsx src/lib/auth-roles.check.ts
 */
import { isSelfServeRole, SELF_SERVE_ROLES, ROLE_LABEL_KA } from "./auth-roles"

assert(isSelfServeRole("buyer"))
assert(isSelfServeRole("developer"))
assert(!isSelfServeRole("admin"))
assert(!isSelfServeRole(""))
assert(SELF_SERVE_ROLES.length === 5)
for (const role of SELF_SERVE_ROLES) {
  assert(ROLE_LABEL_KA[role].title.length > 0)
}

console.log("auth-roles.check: ok")

function assert(cond: unknown, msg = "assert failed"): asserts cond {
  if (!cond) throw new Error(msg)
}
