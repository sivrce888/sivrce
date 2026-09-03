"use server"

/**
 * Self-serve verification request — the missing creator for the admin
 * VerificationRequest pipeline (admin/verification already approves/rejects
 * and flips the profile `verified` flag on decision).
 */

import { revalidatePath } from "next/cache"

import { db } from "@/lib/db"
import { requireRole } from "@/lib/guards"

const SUBJECTS = ["agent", "agency", "developer"] as const
type Subject = (typeof SUBJECTS)[number]

/** Dashboard paths this action may revalidate (hidden-field allowlist). */
const RETURN_TO: Record<Subject, string> = {
  agent: "/agent/profile",
  agency: "/agency/profile",
  developer: "/developer/profile",
}

function isSubject(v: string): v is Subject {
  return (SUBJECTS as readonly string[]).includes(v)
}

export async function requestProfileVerification(formData: FormData): Promise<void> {
  const subjectType = String(formData.get("subjectType") ?? "")
  const subjectId = String(formData.get("subjectId") ?? "").slice(0, 120)
  if (!isSubject(subjectType) || !subjectId) return

  const user = await requireRole(subjectType, RETURN_TO[subjectType])

  // Ownership check — the profile must belong to the caller.
  const owned =
    subjectType === "agent"
      ? await db.agentProfile.findFirst({
          where: { id: subjectId, ownerId: user.id, deletedAt: null },
          select: { id: true },
        })
      : subjectType === "agency"
        ? await db.agencyProfile.findFirst({
            where: { id: subjectId, ownerId: user.id, deletedAt: null },
            select: { id: true },
          })
        : await db.developerProfile.findFirst({
            where: { id: subjectId, ownerId: user.id, deletedAt: null },
            select: { id: true },
          })
  if (!owned) return

  // One live request per subject — a re-submit after rejection is allowed.
  const existing = await db.verificationRequest.findFirst({
    where: { subjectType, subjectId, status: "pending", deletedAt: null },
    select: { id: true },
  })
  if (existing) return

  await db.verificationRequest.create({
    data: { subjectType, subjectId, verificationType: "manual" },
  })

  revalidatePath(RETURN_TO[subjectType])
}
