"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { getAgencyContext } from "@/components/agency-dashboard/data"
import { db } from "@/lib/db"
import { dashboardPathFor, requireUser, safeQuery, type SessionUser } from "@/lib/guards"
import { CLOSED_LEAD_STATUSES, isCrmLeadStatus } from "@/lib/admin/crm"
import { canWorkLeads, inquiryWhere, isInquiryStatus, listingOwnerWhere } from "@/lib/pro-leads"

function revalidateLeadInboxes(): void {
  revalidatePath("/agent")
  revalidatePath("/agent/leads")
  revalidatePath("/agent/analytics")
  revalidatePath("/agency")
  revalidatePath("/agency/leads")
  revalidatePath("/agency/analytics")
  revalidatePath("/seller")
  revalidatePath("/seller/leads")
  revalidatePath("/developer")
  revalidatePath("/developer/leads")
  revalidatePath("/developer/analytics")
}

/** Resolve who the pro acts for: an agency works its whole team's leads. */
async function leadOwnerIds(user: SessionUser): Promise<string[]> {
  return user.role === "agency" ? (await getAgencyContext(user)).ownerIds : [user.id]
}

export async function setProLeadStatus(formData: FormData): Promise<void> {
  const user = await requireUser("/account")
  if (!canWorkLeads(user.role)) {
    redirect(dashboardPathFor(user.role))
  }

  const id = String(formData.get("id") ?? "").trim().slice(0, 120)
  const status = String(formData.get("status") ?? "").trim()
  if (!id || !isInquiryStatus(status)) return

  const ownerIds = await leadOwnerIds(user)
  const listingIds = await safeQuery(
    () =>
      db.listing
        .findMany({
          where: listingOwnerWhere(ownerIds),
          select: { id: true },
        })
        .then((rows) => rows.map((r) => r.id)),
    [],
  )

  const lead = await safeQuery(
    () =>
      db.inquiry.findFirst({
        where: { id, ...inquiryWhere(listingIds, user.email, ownerIds) },
        select: { id: true },
      }),
    null,
  )
  if (!lead) return

  await db.inquiry.update({ where: { id: lead.id }, data: { status } })
  revalidateLeadInboxes()
}

/** A pro moves a CRM client they (or their agency team) were assigned. */
export async function setCrmClientStatus(formData: FormData): Promise<void> {
  const user = await requireUser("/account")
  if (!canWorkLeads(user.role)) redirect(dashboardPathFor(user.role))

  const id = String(formData.get("id") ?? "").trim().slice(0, 120)
  const status = String(formData.get("status") ?? "").trim()
  if (!id || !isCrmLeadStatus(status)) return

  const closing = CLOSED_LEAD_STATUSES.includes(status)
  // Scoped write: an id outside the caller's clients matches zero rows.
  await db.crmLead.updateMany({
    where: { id, agentId: { in: await leadOwnerIds(user) } },
    data: { status, closedAt: closing ? new Date() : null },
  })
  revalidateLeadInboxes()
}
