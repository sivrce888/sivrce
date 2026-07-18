/**
 * Runnable check for auth role helpers.
 * Run: npx tsx src/lib/auth-roles.check.ts
 */
import {
  CONSUMER_ROLES,
  isSelfServeRole,
  PRO_ROLES,
  ROLE_LABEL_KA,
  SELF_SERVE_ROLES,
} from "./auth-roles"

assert(isSelfServeRole("buyer"))
assert(isSelfServeRole("developer"))
assert(!isSelfServeRole("admin"))
assert(!isSelfServeRole(""))
assert(SELF_SERVE_ROLES.length === 5)
assert(CONSUMER_ROLES.length === 2)
assert(PRO_ROLES.length === 3)
assert(CONSUMER_ROLES.every(isSelfServeRole))
assert(PRO_ROLES.every(isSelfServeRole))
for (const role of SELF_SERVE_ROLES) {
  assert(ROLE_LABEL_KA[role].title.length > 0)
}

console.log("auth-roles.check: ok")

function assert(cond: unknown, msg = "assert failed"): asserts cond {
  if (!cond) throw new Error(msg)
}
