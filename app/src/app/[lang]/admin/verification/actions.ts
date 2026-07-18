"use server"

import { revalidatePath } from "next/cache"

import { logAdminAction } from "@/lib/admin/audit"
import { requireAdminAction } from "@/lib/admin/guard"
import { reqString } from "@/lib/admin/validate"
import { db } from "@/lib/db"

/**
 * subjectType/verificationType are plain strings in the schema (no enum) —
 * the pipeline recognizes these three profile subjects. Constants live in
 * page.tsx: a "use server" file may only export async functions.
 */

/**
 * Flip the verified flag on the matching profile. Only AgentProfile and
 * AgencyProfile carry `verified` — DeveloperProfile has no flag in the
 * schema, so those requests only record the decision. updateMany avoids
 * throwing on dangling subjectIds.
 */
async function setSubjectVerified(subjectType: string, subjectId: string, verified: boolean) {
  if (subjectType === "agent") {
    const r = await db.agentProfile.updateMany({ where: { id: subjectId }, data: { verified } })
    return r.count > 0
  }
  if (subjectType === "agency") {
    const r = await db.agencyProfile.updateMany({ where: { id: subjectId }, data: { verified } })
    return r.count > 0
  }
  return false
}

export async function approveVerificationRequest(fd: FormData) {
  const session = await requireAdminAction()
  const id = reqString(fd, "id", 120)
  const before = await db.verificationRequest.findUniqueOrThrow({
    where: { id },
    select: { status: true, subjectType: true, subjectId: true },
  })
  if (before.status !== "pending") {
    throw new Error(`A request in status "${before.status}" can no longer be reviewed`)
  }
  const now = new Date()
  await db.verificationRequest.update({
    where: { id },
    data: { status: "approved", reviewedBy: session.user.id, reviewedAt: now, rejectionReason: null },
  })
  await db.verificationAuditLog.create({
    data: {
      verificationRequestId: id,
      actorId: session.user.id,
      fromStatus: before.status,
      toStatus: "approved",
    },
  })
  const flagged = await setSubjectVerified(before.subjectType, before.subjectId, true)
  await logAdminAction(session, "verification.approve", "verification_request", id, {
    before: { status: before.status },
    after: { status: "approved", subjectType: before.subjectType, subjectId: before.subjectId, profileFlagged: flagged },
  })
  revalidatePath("/admin/verification")
}

export async function rejectVerificationRequest(fd: FormData) {
  const session = await requireAdminAction()
  const id = reqString(fd, "id", 120)
  const reason = reqString(fd, "reason", 2000)
  const before = await db.verificationRequest.findUniqueOrThrow({
    where: { id },
    select: { status: true, subjectType: true, subjectId: true },
  })
  if (before.status !== "pending") {
    throw new Error(`A request in status "${before.status}" can no longer be reviewed`)
  }
  const now = new Date()
  await db.verificationRequest.update({
    where: { id },
    data: { status: "rejected", reviewedBy: session.user.id, reviewedAt: now, rejectionReason: reason },
  })
  await db.verificationAuditLog.create({
    data: {
      verificationRequestId: id,
      actorId: session.user.id,
      fromStatus: before.status,
      toStatus: "rejected",
      note: reason,
    },
  })
  const flagged = await setSubjectVerified(before.subjectType, before.subjectId, false)
  await logAdminAction(session, "verification.reject", "verification_request", id, {
    before: { status: before.status },
    after: { status: "rejected", reason, subjectType: before.subjectType, subjectId: before.subjectId, profileFlagged: flagged },
  })
  revalidatePath("/admin/verification")
}
