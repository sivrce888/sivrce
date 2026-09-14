import { redirect } from "next/navigation"

import { auth } from "@/auth"
import { dbAvailable } from "@/lib/db"
import type { UserRole } from "@/generated/prisma/client"

export interface SessionUser {
  id: string
  email: string
  name: string | null
  role: UserRole
  avatarStyle: number | null
  avatarColor: string | null
  avatarIcon: string | null
}

/** Current signed-in user, or null. Never throws. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth()
  const u = session?.user
  if (!u?.id || !u.email) return null
  return {
    id: u.id,
    email: u.email,
    name: u.name ?? null,
    role: u.role ?? "buyer",
    avatarStyle: u.avatarStyle ?? null,
    avatarColor: u.avatarColor ?? null,
    avatarIcon: u.avatarIcon ?? null,
  }
}

/** Signed-in user or redirect to /auth/signin. */
export async function requireUser(callbackUrl = "/dashboard"): Promise<SessionUser> {
  const user = await getSessionUser()
  if (!user) redirect(`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`)
  return user
}

/** Role area home for a given user. */
export function dashboardPathFor(role: UserRole): string {
  switch (role) {
    case "admin":
      // Staff tools live at /admin (and admin.sivrce.ge). Site "dashboard"
      // should open the seller panel so listing owners aren't trapped in admin.
      return "/seller"
    case "agency":
      return "/agency"
    case "agent":
      return "/agent"
    case "developer":
      return "/developer"
    case "seller":
      return "/seller"
    default:
      return "/account"
  }
}

/**
 * User with one of `roles`, or redirect: signed-out → signin, wrong role →
 * their own dashboard area. All role dashboards gate through this.
 */
export async function requireRole(
  roles: UserRole | UserRole[],
  areaPath: string,
): Promise<SessionUser> {
  const user = await requireUser(areaPath)
  const allowed = Array.isArray(roles) ? roles : [roles]
  // Admins may open any role area for support/moderation.
  if (!allowed.includes(user.role) && user.role !== "admin") {
    redirect(dashboardPathFor(user.role))
  }
  return user
}

/**
 * How long a public render may wait on one query before taking the fallback.
 * Reachable-but-slow is the dangerous case the breaker can't see: the
 * developer/project rails OR together up to 24 `extendedFields->projectSlug`
 * JSON predicates, which seq-scan listings and pushed those prerenders past
 * Next's 180s page budget. Static catalogs are the designed fallback, so a
 * bounded wait is strictly better than a hung function (and a hung Vercel bill).
 *
 * Upgrade path: index the JSON attribution
 * (`CREATE INDEX ON listings ((extended_fields->>'projectSlug'))`) and this
 * ceiling stops mattering.
 */
const QUERY_DEADLINE_MS = 8_000

/**
 * Run a DB query, returning `fallback` when the DB is unreachable, the query
 * throws, or it outruns `deadlineMs`. The query itself is not cancelled —
 * only the caller's wait is bounded.
 */
export async function safeQuery<T>(
  fn: () => Promise<T>,
  fallback: T,
  deadlineMs: number = QUERY_DEADLINE_MS,
): Promise<T> {
  // Circuit breaker: skip instantly during a known outage (DB down).
  if (!(await dbAvailable())) return fallback
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      fn().catch(() => fallback),
      new Promise<T>((resolve) => {
        timer = setTimeout(() => resolve(fallback), deadlineMs)
      }),
    ])
  } finally {
    clearTimeout(timer)
  }
}
