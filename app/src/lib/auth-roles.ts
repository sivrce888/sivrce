import type { UserRole } from "@/generated/prisma/client"

/** Roles a signed-in user may pick for themselves (admin is staff-only). */
export const SELF_SERVE_ROLES = [
  "buyer",
  "seller",
  "agent",
  "agency",
  "developer",
] as const satisfies readonly UserRole[]

export type SelfServeRole = (typeof SELF_SERVE_ROLES)[number]

export function isSelfServeRole(value: string): value is SelfServeRole {
  return (SELF_SERVE_ROLES as readonly string[]).includes(value)
}

export const ROLE_LABEL_KA: Record<SelfServeRole, { title: string; blurb: string }> = {
  buyer: { title: "მყიდველი", blurb: "ფავორიტები, ძიებები და ტურები" },
  seller: { title: "გამყიდველი", blurb: "განცხადებები და ლიდები" },
  agent: { title: "აგენტი", blurb: "პორტფოლიო, ტურები, კლიენტები" },
  agency: { title: "სააგენტო", blurb: "გუნდი, ანალიტიკა, ლიდები" },
  developer: { title: "დეველოპერი", blurb: "პროექტები და განცხადებები" },
}
