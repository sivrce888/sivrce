"use server"

import { revalidatePath } from "next/cache"

import { logAdminAction } from "@/lib/admin/audit"
import { requireAdminAction } from "@/lib/admin/guard"
import { reqString } from "@/lib/admin/validate"
import { db } from "@/lib/db"

export async function softDeleteThread(fd: FormData) {
  const session = await requireAdminAction()
  const id = reqString(fd, "id", 120)
  const before = await db.forumThread.findUniqueOrThrow({
    where: { id },
    select: { deletedAt: true },
  })
  if (before.deletedAt) throw new Error("Thread is already deleted")
  const deletedAt = new Date()
  await db.forumThread.update({ where: { id }, data: { deletedAt } })
  await logAdminAction(session, "content.forum.soft_delete", "forum_thread", id, {
    before: { deletedAt: null },
    after: { deletedAt },
  })
  revalidatePath("/admin/content/forum")
}

export async function restoreThread(fd: FormData) {
  const session = await requireAdminAction()
  const id = reqString(fd, "id", 120)
  const before = await db.forumThread.findUniqueOrThrow({
    where: { id },
    select: { deletedAt: true },
  })
  if (!before.deletedAt) throw new Error("Thread is not deleted")
  await db.forumThread.update({ where: { id }, data: { deletedAt: null } })
  await logAdminAction(session, "content.forum.restore", "forum_thread", id, {
    before: { deletedAt: before.deletedAt },
    after: { deletedAt: null },
  })
  revalidatePath("/admin/content/forum")
}
