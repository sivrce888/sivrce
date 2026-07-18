"use server"

import { createHash } from "node:crypto"

import { revalidatePath } from "next/cache"

import {
  ComplaintStatus,
  ListingStatus,
  ModerationDecision,
  ModerationQueueStatus,
  ShadowBanScope,
} from "@/generated/prisma/enums"
import type { Prisma } from "@/generated/prisma/client"
import { logAdminAction } from "@/lib/admin/audit"
import { requireAdminAction } from "@/lib/admin/guard"
import { BLOCKLIST_KINDS } from "@/lib/admin/moderation"
import { optString, reqEnum, reqString } from "@/lib/admin/validate"
import { db } from "@/lib/db"
import { unattributeListing } from "@/lib/map/attribution"

const DECISIONS = Object.values(ModerationDecision)
const COMPLAINT_STATUSES = Object.values(ComplaintStatus)
const SHADOW_BAN_SCOPES = Object.values(ShadowBanScope)

/** Decision → resulting queue status. */
const DECISION_STATUS: Record<ModerationDecision, ModerationQueueStatus> = {
  approve: ModerationQueueStatus.approved,
  no_action: ModerationQueueStatus.approved,
  reject: ModerationQueueStatus.rejected,
  hide: ModerationQueueStatus.rejected,
  delete: ModerationQueueStatus.rejected,
  warn_user: ModerationQueueStatus.in_review,
  suspend_user: ModerationQueueStatus.in_review,
  escalate: ModerationQueueStatus.in_review,
}

export async function decideQueueItem(fd: FormData) {
  const session = await requireAdminAction()
  const id = reqString(fd, "id", 120)
  const decision = reqEnum(fd, "decision", DECISIONS)
  const notes = optString(fd, "notes", 2000)
  const before = await db.moderationQueue.findUniqueOrThrow({
    where: { id },
    select: { status: true, subjectKind: true, subjectId: true, subjectUserId: true },
  })
  const status = DECISION_STATUS[decision]
  const reviewedAt = new Date()
  // Enforcement writes — a decision must actually land on its subject.
  const enforce: Prisma.PrismaPromise<unknown>[] = []
  if (decision === "hide" || decision === "delete") {
    if (before.subjectKind === "listing") {
      enforce.push(
        db.listing.update({
          where: { id: before.subjectId },
          data:
            decision === "hide"
              ? { status: ListingStatus.withdrawn }
              : { deletedAt: reviewedAt },
        }),
      )
    } else if (before.subjectKind === "review") {
      enforce.push(
        db.review.update({
          where: { id: before.subjectId },
          data:
            decision === "hide"
              ? { status: "hidden", verified: false }
              : { deletedAt: reviewedAt },
        }),
      )
    }
  } else if (decision === "suspend_user") {
    const userId = before.subjectKind === "user" ? before.subjectId : before.subjectUserId
    if (userId) {
      // Dedupe: at most one active shadow ban per user.
      const existing = await db.shadowBan.findFirst({
        where: { userId, active: true },
        select: { id: true },
      })
      if (!existing) {
        enforce.push(
          db.shadowBan.create({
            data: {
              userId,
              reason: notes ?? "Suspended via moderation queue decision",
              scope: ShadowBanScope.all,
              bannedById: session.user.id,
            },
          }),
        )
      }
    }
  }
  await db.$transaction([
    ...enforce,
    db.moderationQueue.update({
      where: { id },
      data: { status, decision, decisionNotes: notes, reviewedAt, reviewedById: session.user.id },
    }),
    db.moderationAction.create({
      data: {
        moderatorId: session.user.id,
        subjectKind: before.subjectKind,
        subjectId: before.subjectId,
        action: decision,
        reason: notes,
        relatedModerationQueueId: id,
      },
    }),
  ])
  // Hidden/deleted listings leave the floor inventory (sold → unavailable).
  if ((decision === "hide" || decision === "delete") && before.subjectKind === "listing") {
    await unattributeListing(before.subjectId)
  }
  await logAdminAction(session, "moderation.decide", "moderation_queue", id, {
    before: { status: before.status },
    after: { status, decision },
  })
  revalidatePath("/admin/moderation")
}

export async function assignComplaint(fd: FormData) {
  const session = await requireAdminAction()
  const id = reqString(fd, "id", 120)
  const before = await db.complaint.findUniqueOrThrow({
    where: { id },
    select: { status: true, assignedToId: true },
  })
  const status =
    before.status === ComplaintStatus.open ? ComplaintStatus.under_review : before.status
  const assignedAt = new Date()
  await db.complaint.update({
    where: { id },
    data: { assignedToId: session.user.id, assignedAt, status },
  })
  await logAdminAction(session, "moderation.complaint_assign", "complaint", id, {
    before: { status: before.status, assignedToId: before.assignedToId },
    after: { status, assignedToId: session.user.id },
  })
  revalidatePath("/admin/moderation")
}

export async function setComplaintStatus(fd: FormData) {
  const session = await requireAdminAction()
  const id = reqString(fd, "id", 120)
  const status = reqEnum(fd, "status", COMPLAINT_STATUSES)
  const resolution = optString(fd, "resolution", 2000)
  const before = await db.complaint.findUniqueOrThrow({
    where: { id },
    select: { status: true },
  })
  const closing = status === ComplaintStatus.resolved || status === ComplaintStatus.dismissed
  await db.complaint.update({
    where: { id },
    data: {
      status,
      ...(closing ? { resolvedAt: new Date(), resolvedById: session.user.id, resolution } : {}),
    },
  })
  await logAdminAction(session, "moderation.complaint_status", "complaint", id, {
    before: { status: before.status },
    after: { status, resolution },
  })
  revalidatePath("/admin/moderation")
}

export async function resolveFraudSignal(fd: FormData) {
  const session = await requireAdminAction()
  const idRaw = reqString(fd, "id", 30)
  if (!/^\d+$/.test(idRaw)) throw new Error("Invalid field: id")
  const resolution = optString(fd, "resolution", 2000)
  await db.fraudSignal.update({
    where: { id: BigInt(idRaw) },
    data: { isActive: false, resolvedAt: new Date(), resolvedById: session.user.id, resolution },
  })
  await logAdminAction(session, "moderation.resolve_fraud", "fraud_signal", idRaw, {
    before: { isActive: true },
    after: { isActive: false, resolution },
  })
  revalidatePath("/admin/moderation")
}

export async function createShadowBan(fd: FormData) {
  const session = await requireAdminAction()
  const userId = reqString(fd, "userId", 120)
  const reason = reqString(fd, "reason", 2000)
  const scope = reqEnum(fd, "scope", SHADOW_BAN_SCOPES)
  const existing = await db.shadowBan.findFirst({
    where: { userId, active: true },
    select: { id: true },
  })
  if (existing) throw new Error("An active shadow ban already exists for this user")
  const ban = await db.shadowBan.create({
    data: { userId, reason, scope, bannedById: session.user.id },
    select: { id: true },
  })
  await logAdminAction(session, "moderation.create_ban", "shadow_ban", ban.id, {
    after: { userId, scope, reason },
  })
  revalidatePath("/admin/moderation")
}

export async function liftShadowBan(fd: FormData) {
  const session = await requireAdminAction()
  const id = reqString(fd, "id", 120)
  const before = await db.shadowBan.findUniqueOrThrow({
    where: { id },
    select: { active: true },
  })
  if (!before.active) throw new Error("Shadow ban is not active")
  const liftedAt = new Date()
  await db.shadowBan.update({
    where: { id },
    data: { active: false, liftedAt, liftedById: session.user.id },
  })
  await logAdminAction(session, "moderation.lift_ban", "shadow_ban", id, {
    before: { active: true },
    after: { active: false, liftedAt },
  })
  revalidatePath("/admin/moderation")
}

export async function addBlocklistEntry(fd: FormData) {
  const session = await requireAdminAction()
  const kind = reqEnum(fd, "kind", BLOCKLIST_KINDS)
  const value = reqString(fd, "value", 240)
  const reason = optString(fd, "reason", 2000)
  const blockedById = session.user.id
  // Emails are stored as sha256 hashes — the platform never keeps the raw address.
  const key =
    kind === "email"
      ? createHash("sha256").update(value.toLowerCase()).digest("hex")
      : value
  if (kind === "phone") {
    await db.blocklistPhone.upsert({
      where: { phone: key },
      create: { phone: key, reason, blockedById },
      update: { reason, blockedById },
    })
  } else if (kind === "email") {
    await db.blocklistEmail.upsert({
      where: { emailHash: key },
      create: { emailHash: key, reason, blockedById },
      update: { reason, blockedById },
    })
  } else if (kind === "ip") {
    await db.blocklistIp.upsert({
      where: { ipAddress: key },
      create: { ipAddress: key, reason, blockedById },
      update: { reason, blockedById },
    })
  } else {
    await db.blocklistDevice.upsert({
      where: { deviceFingerprint: key },
      create: { deviceFingerprint: key, reason, blockedById },
      update: { reason, blockedById },
    })
  }
  await logAdminAction(session, "moderation.blocklist_add", `blocklist_${kind}`, key, {
    after: { reason },
  })
  revalidatePath("/admin/moderation")
}

export async function removeBlocklistEntry(fd: FormData) {
  const session = await requireAdminAction()
  const kind = reqEnum(fd, "kind", BLOCKLIST_KINDS)
  // For emails the posted value is the stored hash, not the raw address.
  const key = reqString(fd, "value", 240)
  if (kind === "phone") {
    await db.blocklistPhone.delete({ where: { phone: key } })
  } else if (kind === "email") {
    await db.blocklistEmail.delete({ where: { emailHash: key } })
  } else if (kind === "ip") {
    await db.blocklistIp.delete({ where: { ipAddress: key } })
  } else {
    await db.blocklistDevice.delete({ where: { deviceFingerprint: key } })
  }
  await logAdminAction(session, "moderation.blocklist_remove", `blocklist_${kind}`, key, {
    before: { blocked: true },
    after: { blocked: false },
  })
  revalidatePath("/admin/moderation")
}
