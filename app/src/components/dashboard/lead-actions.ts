"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { getAgencyContext } from "@/components/agency-dashboard/data"
import { db } from "@/lib/db"
import { dashboardPathFor, requireUser, safeQuery } from "@/lib/guards"
import { canWorkLeads, inquiryWhere, isInquiryStatus, listingOwnerWhere } from "@/lib/pro-leads"

export async function setProLeadStatus(formData: FormData): Promise<void> {
  const user = await requireUser("/account")
  if (!canWorkLeads(user.role)) {
    redirect(dashboardPathFor(user.role))
  }

  const id = String(formData.get("id") ?? "").trim().slice(0, 120)
  const status = String(formData.get("status") ?? "").trim()
  if (!id || !isInquiryStatus(status)) return

  const ownerIds =
    user.role === "agency" ? (await getAgencyContext(user)).ownerIds : [user.id]
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
        where: { id, ...inquiryWhere(listingIds, user.email) },
        select: { id: true },
      }),
    null,
  )
  if (!lead) return

  await db.inquiry.update({ where: { id: lead.id }, data: { status } })
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
