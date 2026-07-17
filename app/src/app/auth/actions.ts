"use server"

import { redirect } from "next/navigation"

import { isSelfServeRole } from "@/lib/auth-roles"
import { db } from "@/lib/db"
import { dashboardPathFor, requireUser } from "@/lib/guards"

/**
 * Self-serve role pick after Google signup (or from settings).
 * Admin role is never assignable here — staff only via /admin/users.
 */
export async function chooseSelfRole(formData: FormData) {
  const user = await requireUser("/auth/onboarding")
  if (user.role === "admin") redirect("/admin")

  const raw = String(formData.get("role") ?? "")
  if (!isSelfServeRole(raw)) {
    throw new Error("Invalid role")
  }

  if (user.role !== raw) {
    await db.user.update({ where: { id: user.id }, data: { role: raw } })
  }

  redirect(dashboardPathFor(raw))
}
