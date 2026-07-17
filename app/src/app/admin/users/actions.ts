"use server"

import { revalidatePath } from "next/cache"

import { UserRole } from "@/generated/prisma/enums"
import { logAdminAction } from "@/lib/admin/audit"
import { requireAdminAction } from "@/lib/admin/guard"
import { optInt, reqEnum, reqString } from "@/lib/admin/validate"
import { db } from "@/lib/db"

export async function setUserRole(fd: FormData) {
  const session = await requireAdminAction()
  const id = reqString(fd, "id", 120)
  const role = reqEnum(fd, "role", Object.values(UserRole))
  if (id === session.user.id) throw new Error("You cannot change your own role")

  const before = await db.user.findUnique({ where: { id }, select: { role: true } })
  if (!before) throw new Error("User not found")
  if (before.role === role) return

  await db.user.update({ where: { id }, data: { role } })
  await logAdminAction(session, "user.set_role", "user", id, {
    from: before.role,
    to: role,
  })
  revalidatePath("/admin/users")
  revalidatePath(`/admin/users/${id}`)
}

export async function setUserTrustScore(fd: FormData) {
  const session = await requireAdminAction()
  const id = reqString(fd, "id", 120)
  const score = optInt(fd, "trustScore", 0, 100)
  if (score === null) throw new Error("Missing field: trustScore")

  const before = await db.user.findUnique({ where: { id }, select: { trustScore: true } })
  if (!before) throw new Error("User not found")
  if (before.trustScore === score) return

  await db.user.update({ where: { id }, data: { trustScore: score } })
  await logAdminAction(session, "user.set_trust_score", "user", id, {
    from: before.trustScore,
    to: score,
  })
  revalidatePath("/admin/users")
  revalidatePath(`/admin/users/${id}`)
}
