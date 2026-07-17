"use server"

import { revalidatePath } from "next/cache"

import { ListingStatus, ListingTier } from "@/generated/prisma/enums"
import { logAdminAction } from "@/lib/admin/audit"
import { requireAdminAction } from "@/lib/admin/guard"
import { optInt, reqEnum, reqString } from "@/lib/admin/validate"
import { db } from "@/lib/db"

const TIERS = Object.values(ListingTier)
const STATUSES = Object.values(ListingStatus)

function revalidate(id: string) {
  revalidatePath("/admin/listings")
  revalidatePath(`/admin/listings/${id}`)
}

export async function toggleVerified(fd: FormData) {
  const session = await requireAdminAction()
  const id = reqString(fd, "id", 120)
  const before = await db.listing.findUniqueOrThrow({
    where: { id },
    select: { verified: true },
  })
  const after = { verified: !before.verified }
  await db.listing.update({ where: { id }, data: after })
  await logAdminAction(session, "listing.toggle_verified", "listing", id, { before, after })
  revalidate(id)
}

export async function setTier(fd: FormData) {
  const session = await requireAdminAction()
  const id = reqString(fd, "id", 120)
  const tier = reqEnum(fd, "tier", TIERS)
  const days = optInt(fd, "days", 1, 3650)
  const before = await db.listing.findUniqueOrThrow({
    where: { id },
    select: { tier: true, tierExpiresAt: true },
  })
  const tierExpiresAt = days === null ? null : new Date(Date.now() + days * 86_400_000)
  await db.listing.update({ where: { id }, data: { tier, tierExpiresAt } })
  await logAdminAction(session, "listing.set_tier", "listing", id, {
    before: { tier: before.tier, tierExpiresAt: before.tierExpiresAt },
    after: { tier, tierExpiresAt },
  })
  revalidate(id)
}

export async function setStatus(fd: FormData) {
  const session = await requireAdminAction()
  const id = reqString(fd, "id", 120)
  const status = reqEnum(fd, "status", STATUSES)
  const before = await db.listing.findUniqueOrThrow({
    where: { id },
    select: { status: true },
  })
  await db.listing.update({ where: { id }, data: { status } })
  await logAdminAction(session, "listing.set_status", "listing", id, {
    before: { status: before.status },
    after: { status },
  })
  revalidate(id)
}

export async function softDelete(fd: FormData) {
  const session = await requireAdminAction()
  const id = reqString(fd, "id", 120)
  const before = await db.listing.findUniqueOrThrow({
    where: { id },
    select: { deletedAt: true },
  })
  if (before.deletedAt) throw new Error("Listing is already deleted")
  const deletedAt = new Date()
  await db.listing.update({ where: { id }, data: { deletedAt } })
  await logAdminAction(session, "listing.soft_delete", "listing", id, {
    before: { deletedAt: null },
    after: { deletedAt },
  })
  revalidate(id)
}

export async function restore(fd: FormData) {
  const session = await requireAdminAction()
  const id = reqString(fd, "id", 120)
  const before = await db.listing.findUniqueOrThrow({
    where: { id },
    select: { deletedAt: true },
  })
  if (!before.deletedAt) throw new Error("Listing is not deleted")
  await db.listing.update({ where: { id }, data: { deletedAt: null } })
  await logAdminAction(session, "listing.restore", "listing", id, {
    before: { deletedAt: before.deletedAt },
    after: { deletedAt: null },
  })
  revalidate(id)
}

export async function adjustTrustScore(fd: FormData) {
  const session = await requireAdminAction()
  const id = reqString(fd, "id", 120)
  const delta = optInt(fd, "delta", -100, 100)
  if (delta === null || delta === 0) {
    throw new Error("Trust score delta must be a non-zero integer")
  }
  const before = await db.listing.findUniqueOrThrow({
    where: { id },
    select: { trustScore: true },
  })
  const trustScore = Math.min(100, Math.max(0, before.trustScore + delta))
  await db.listing.update({ where: { id }, data: { trustScore } })
  await logAdminAction(session, "listing.adjust_trust_score", "listing", id, {
    delta,
    before: { trustScore: before.trustScore },
    after: { trustScore },
  })
  revalidate(id)
}

export async function removeMedia(fd: FormData) {
  const session = await requireAdminAction()
  const id = reqString(fd, "id", 120)
  const mediaId = reqString(fd, "mediaId", 120)
  const media = await db.listingMedia.findFirst({
    where: { id: mediaId, listingId: id, deletedAt: null },
    select: { id: true, kind: true, isCover: true },
  })
  if (!media) throw new Error("Media not found for this listing")
  const deletedAt = new Date()
  await db.listingMedia.update({ where: { id: media.id }, data: { deletedAt } })
  await logAdminAction(session, "listing.remove_media", "listing", id, {
    mediaId: media.id,
    before: { deletedAt: null, kind: media.kind, isCover: media.isCover },
    after: { deletedAt },
  })
  revalidate(id)
}
