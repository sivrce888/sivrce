import { redirect } from "next/navigation"

import { auth } from "@/auth"
import type { UserRole } from "@/generated/prisma/client"

export interface SessionUser {
  id: string
  email: string
  name: string | null
  role: UserRole
}

/** Current signed-in user, or null. Never throws. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth()
  const u = session?.user
  if (!u?.id || !u.email) return null
  return { id: u.id, email: u.email, name: u.name ?? null, role: u.role ?? "buyer" }
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
      return "/admin"
    case "agency":
      return "/agency"
    case "agent":
      return "/agent"
    case "developer":
      return "/developer"
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

/** Run a DB query, returning `fallback` when the DB is unreachable. */
export async function safeQuery<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn()
  } catch {
    return fallback
  }
}
