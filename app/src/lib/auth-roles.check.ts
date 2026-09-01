/**
 * Runnable check for auth role helpers.
 * Run: npx tsx src/lib/auth-roles.check.ts
 */
import {
  CONSUMER_ROLES,
  isSelfServeRole,
  isProRole,
  parseRoleIntent,
  profileSetupPathFor,
  PRO_ROLES,
  ROLE_LABEL_KA,
  roleOnboardingHref,
  roleSignupHref,
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
assert(isProRole("agent"))
assert(!isProRole("buyer"))
assert(parseRoleIntent("agent") === "agent")
assert(parseRoleIntent("admin") === null)
assert(roleOnboardingHref("agent") === "/auth/onboarding?intent=agent")
assert(roleOnboardingHref() === "/auth/onboarding")
assert(roleSignupHref("agent").includes(encodeURIComponent("/auth/onboarding?intent=agent")))
assert(profileSetupPathFor("agent") === "/agent/profile")
assert(profileSetupPathFor("buyer") === null)
for (const role of SELF_SERVE_ROLES) {
  assert(ROLE_LABEL_KA[role].title.length > 0)
}

console.log("auth-roles.check: ok")

function assert(cond: unknown, msg = "assert failed"): asserts cond {
  if (!cond) throw new Error(msg)
}
