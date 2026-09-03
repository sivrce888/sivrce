"use server"

import { revalidatePath } from "next/cache"

import { db } from "@/lib/db"
import { requireRole, safeQuery } from "@/lib/guards"

const LEAD_STATUSES = new Set(["new", "contacted", "qualified", "closed"])

export async function setDeveloperLeadStatus(formData: FormData): Promise<void> {
  const user = await requireRole("developer", "/developer/leads")
  const id = String(formData.get("id") ?? "").trim().slice(0, 120)
  const status = String(formData.get("status") ?? "").trim()
  if (!id || !LEAD_STATUSES.has(status)) return

  const listingIds = await safeQuery(
    () =>
      db.listing
        .findMany({ where: { ownerId: user.id, deletedAt: null }, select: { id: true } })
        .then((rows) => rows.map((r) => r.id)),
    [],
  )

  const lead = await safeQuery(
    () =>
      db.inquiry.findFirst({
        where: {
          id,
          deletedAt: null,
          OR: [{ listingId: { in: listingIds } }, { agentEmail: user.email }],
        },
        select: { id: true },
      }),
    null,
  )
  if (!lead) return

  await db.inquiry.update({ where: { id: lead.id }, data: { status } })
  revalidatePath("/developer/leads")
  revalidatePath("/developer")
  revalidatePath("/developer/analytics")
}
