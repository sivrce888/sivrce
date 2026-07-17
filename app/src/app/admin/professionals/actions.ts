"use server"

import { revalidatePath } from "next/cache"

import { logAdminAction } from "@/lib/admin/audit"
import { requireAdminAction } from "@/lib/admin/guard"
import { reqEnum, reqString } from "@/lib/admin/validate"
import { db } from "@/lib/db"

const VERIFIABLE_KINDS = ["agents", "agencies"] as const
const KINDS = [...VERIFIABLE_KINDS, "developers", "projects"] as const

export type ProfessionalKind = (typeof KINDS)[number]

/** verify/unverify — only AgentProfile and AgencyProfile have `verified`. */
export async function setProfessionalVerified(fd: FormData) {
  const session = await requireAdminAction()
  const kind = reqEnum(fd, "kind", VERIFIABLE_KINDS)
  const id = reqString(fd, "id", 120)
  const next = reqEnum(fd, "verified", ["true", "false"] as const) === "true"

  const res =
    kind === "agents"
      ? await db.agentProfile.updateMany({
          where: { id, deletedAt: null, verified: !next },
          data: { verified: next },
        })
      : await db.agencyProfile.updateMany({
          where: { id, deletedAt: null, verified: !next },
          data: { verified: next },
        })
  if (res.count === 0) throw new Error("Record not found or already in that state")

  await logAdminAction(session, `professional.${next ? "verify" : "unverify"}`, kind, id, {
    from: !next,
    to: next,
  })
  revalidatePath("/admin/professionals")
}

async function setDeleted(
  kind: ProfessionalKind,
  id: string,
  deletedAt: Date | null,
): Promise<number> {
  const when = deletedAt ?? null
  switch (kind) {
    case "agents":
      return (
        await db.agentProfile.updateMany({
          where: { id, deletedAt: when ? null : { not: null } },
          data: { deletedAt: when },
        })
      ).count
    case "agencies":
      return (
        await db.agencyProfile.updateMany({
          where: { id, deletedAt: when ? null : { not: null } },
          data: { deletedAt: when },
        })
      ).count
    case "developers":
      return (
        await db.developerProfile.updateMany({
          where: { id, deletedAt: when ? null : { not: null } },
          data: { deletedAt: when },
        })
      ).count
    case "projects":
      return (
        await db.projectDirectory.updateMany({
          where: { id, deletedAt: when ? null : { not: null } },
          data: { deletedAt: when },
        })
      ).count
  }
}

export async function softDeleteProfessional(fd: FormData) {
  const session = await requireAdminAction()
  const kind = reqEnum(fd, "kind", KINDS)
  const id = reqString(fd, "id", 120)

  const count = await setDeleted(kind, id, new Date())
  if (count === 0) throw new Error("Record not found or already deleted")

  await logAdminAction(session, "professional.soft_delete", kind, id, {
    from: "active",
    to: "deleted",
  })
  revalidatePath("/admin/professionals")
}

export async function restoreProfessional(fd: FormData) {
  const session = await requireAdminAction()
  const kind = reqEnum(fd, "kind", KINDS)
  const id = reqString(fd, "id", 120)

  const count = await setDeleted(kind, id, null)
  if (count === 0) throw new Error("Record not found or not deleted")

  await logAdminAction(session, "professional.restore", kind, id, {
    from: "deleted",
    to: "active",
  })
  revalidatePath("/admin/professionals")
}
