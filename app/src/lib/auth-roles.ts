/**
 * Roles a user may self-assign. Admin is staff-only (ADMIN_EMAILS / /admin/users).
 *
 * Signup does NOT pick a role — everyone starts as buyer. Seller auto-upgrades
 * on first listing publish. Pro roles live in /settings only.
 */
import type { UserRole } from "@/generated/prisma/client"

export const SELF_SERVE_ROLES = [
  "buyer",
  "seller",
  "agent",
  "agency",
  "developer",
] as const satisfies readonly UserRole[]

export type SelfServeRole = (typeof SELF_SERVE_ROLES)[number]

/** Everyday accounts. Seller also auto-upgrades on first listing. */
export const CONSUMER_ROLES = ["buyer", "seller"] as const satisfies readonly SelfServeRole[]

/** Pro accounts — settings only, never forced at signup. */
export const PRO_ROLES = ["agent", "agency", "developer"] as const satisfies readonly SelfServeRole[]

export function isSelfServeRole(value: string): value is SelfServeRole {
  return (SELF_SERVE_ROLES as readonly string[]).includes(value)
}

export function isProRole(role: SelfServeRole): role is (typeof PRO_ROLES)[number] {
  return (PRO_ROLES as readonly string[]).includes(role)
}

/** `?intent=agent` from signup CTAs — invalid values ignored. */
export function parseRoleIntent(raw: string | null | undefined): SelfServeRole | null {
  const v = String(raw ?? "").trim()
  return isSelfServeRole(v) ? v : null
}

export function roleOnboardingHref(intent?: SelfServeRole | null): string {
  return intent ? `/auth/onboarding?intent=${intent}` : "/auth/onboarding"
}

/** Signup that lands on the role screen. Logged-in users bounce straight through. */
export function roleSignupHref(intent?: SelfServeRole | null): string {
  return `/auth/signup?callbackUrl=${encodeURIComponent(roleOnboardingHref(intent))}`
}

/** First-run profile setup after choosing a pro role. */
export function profileSetupPathFor(role: SelfServeRole): string | null {
  switch (role) {
    case "agent":
      return "/agent/profile"
    case "agency":
      return "/agency/profile"
    case "developer":
      return "/developer/profile"
    default:
      return null
  }
}

export const ROLE_LABEL_KA: Record<SelfServeRole, { title: string; blurb: string }> = {
  buyer: { title: "მყიდველი", blurb: "ძიება, ფავორიტები და ტურები" },
  seller: { title: "გამყიდველი", blurb: "განცხადებები და ლიდები" },
  agent: { title: "აგენტი", blurb: "პორტფოლიო, ტურები, კლიენტები" },
  agency: { title: "სააგენტო", blurb: "გუნდი, ანალიტიკა, ლიდები" },
  developer: { title: "დეველოპერი", blurb: "პროექტები და განცხადებები" },
}
