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

/**
 * ServiceProviderReview has no deletedAt/verified columns, so moderation here
 * is a hard delete; provider rating aggregates are recomputed in the same
 * transaction so the directory never shows stale scores.
 */
export async function deleteServiceProviderReview(fd: FormData): Promise<void> {
  const session = await requireAdminAction()
  const id = reqString(fd, "id", 120)
  const before = await db.serviceProviderReview.findUnique({
    where: { id },
    select: { providerId: true, rating: true },
  })
  if (!before) throw new Error("Review not found")
  await db.$transaction(async (tx) => {
    await tx.serviceProviderReview.delete({ where: { id } })
    const agg = await tx.serviceProviderReview.aggregate({
      where: { providerId: before.providerId },
      _avg: { rating: true },
      _count: { _all: true },
    })
    await tx.serviceProvider.update({
      where: { id: before.providerId },
      data: { rating: agg._avg.rating ?? 0, reviewCount: agg._count._all },
    })
  })
  await logAdminAction(session, "content.provider_review.delete", "ServiceProviderReview", id, {
    before,
    after: { deleted: true },
  })
  revalidatePath("/admin/content/reviews")
}
