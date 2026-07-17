import { redirect } from "next/navigation"

import { auth } from "@/auth"

/**
 * Admin trust boundary — every /admin page, layout and server action MUST
 * pass through one of these. Role lives on the session (see auth.ts
 * callbacks), so this never hits the DB.
 */
export async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/api/auth/signin?callbackUrl=/admin")
  }
  if (session.user.role !== "admin") {
    redirect("/")
  }
  return session
}

/** Variant for server actions: throws instead of redirecting. */
export async function requireAdminAction() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "admin") {
    throw new Error("Forbidden: admin role required")
  }
  return session
}
