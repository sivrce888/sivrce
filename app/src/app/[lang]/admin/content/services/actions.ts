"use server"

import { revalidatePath } from "next/cache"

import { logAdminAction } from "@/lib/admin/audit"
import { requireAdminAction } from "@/lib/admin/guard"
import { reqString } from "@/lib/admin/validate"
import { db } from "@/lib/db"

export async function toggleProviderVerified(fd: FormData) {
  const session = await requireAdminAction()
  const id = reqString(fd, "id", 120)
  const before = await db.serviceProvider.findUniqueOrThrow({
    where: { id },
    select: { verified: true },
  })
  const verified = !before.verified
  await db.serviceProvider.update({ where: { id }, data: { verified } })
  await logAdminAction(session, "content.provider.toggle_verified", "service_provider", id, {
    before: { verified: before.verified },
    after: { verified },
  })
  revalidatePath("/admin/content/services")
}

export async function toggleProviderActive(fd: FormData) {
  const session = await requireAdminAction()
  const id = reqString(fd, "id", 120)
  const before = await db.serviceProvider.findUniqueOrThrow({
    where: { id },
    select: { isActive: true },
  })
  const isActive = !before.isActive
  await db.serviceProvider.update({ where: { id }, data: { isActive } })
  await logAdminAction(session, "content.provider.toggle_active", "service_provider", id, {
    before: { isActive: before.isActive },
    after: { isActive },
  })
  revalidatePath("/admin/content/services")
}

export async function softDeleteProvider(fd: FormData) {
  const session = await requireAdminAction()
  const id = reqString(fd, "id", 120)
  const before = await db.serviceProvider.findUniqueOrThrow({
    where: { id },
    select: { deletedAt: true },
  })
  if (before.deletedAt) throw new Error("Provider is already deleted")
  const deletedAt = new Date()
  await db.serviceProvider.update({ where: { id }, data: { deletedAt } })
  await logAdminAction(session, "content.provider.soft_delete", "service_provider", id, {
    before: { deletedAt: null },
    after: { deletedAt },
  })
  revalidatePath("/admin/content/services")
}
