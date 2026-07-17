"use server"

import { revalidatePath } from "next/cache"

import { logAdminAction } from "@/lib/admin/audit"
import { requireAdminAction } from "@/lib/admin/guard"
import { reqString } from "@/lib/admin/validate"
import { db } from "@/lib/db"

export async function toggleReviewVerified(fd: FormData): Promise<void> {
  const session = await requireAdminAction()
  const id = reqString(fd, "id", 120)
  const before = await db.review.findUnique({
    where: { id },
    select: { verified: true },
  })
  if (!before) throw new Error("Review not found")
  await db.review.update({
    where: { id },
    data: { verified: !before.verified },
  })
  await logAdminAction(session, "content.review.toggle_verified", "Review", id, {
    before: { verified: before.verified },
    after: { verified: !before.verified },
  })
  revalidatePath("/admin/content/reviews")
}

export async function deleteReview(fd: FormData): Promise<void> {
  const session = await requireAdminAction()
  const id = reqString(fd, "id", 120)
  const before = await db.review.findUnique({
    where: { id },
    select: { targetType: true, targetId: true, authorName: true },
  })
  if (!before) throw new Error("Review not found")
  await db.review.update({
    where: { id },
    data: { deletedAt: new Date() },
  })
  await logAdminAction(session, "content.review.soft_delete", "Review", id, {
    before,
    after: { deletedAt: "now" },
  })
  revalidatePath("/admin/content/reviews")
}
