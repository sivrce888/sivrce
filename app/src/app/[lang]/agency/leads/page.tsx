import type { Metadata } from "next"

import { getAgencyContext } from "@/components/agency-dashboard/data"
import { AGENCY_NAV } from "@/components/agency-dashboard/nav"
import DashboardShell from "@/components/dashboard/DashboardShell"
import EmptyState from "@/components/dashboard/EmptyState"
import LeadInbox from "@/components/dashboard/LeadInbox"
import { db } from "@/lib/db"
import { requireRole, safeQuery } from "@/lib/guards"
import { inquiryWhere, listingOwnerWhere } from "@/lib/pro-leads"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "სააგენტოს ლიდები",
  robots: { index: false },
}

export default async function AgencyLeadsPage() {
  const user = await requireRole("agency", "/agency")
  const { ownerIds } = await getAgencyContext(user)

  const listingRows = await safeQuery(
    () =>
      db.listing.findMany({
        where: listingOwnerWhere(ownerIds),
        select: { id: true, title: true },
      }),
    [],
  )
  const listingIds = listingRows.map((l) => l.id)
  const titles = Object.fromEntries(listingRows.map((l) => [l.id, l.title]))

  const leads = await safeQuery(
    () =>
      db.inquiry.findMany({
        where: inquiryWhere(listingIds, user.email),
        orderBy: { createdAt: "desc" },
        take: 120,
      }),
    [],
  )

  return (
    <DashboardShell
      nav={AGENCY_NAV}
      title="სააგენტოს პანელი"
      subtitle="ლიდები"
      userLabel={user.name ?? user.email}
    >
      {leads.length === 0 ? (
        <EmptyState
          title="ლიდები ჯერ არ არის"
          body="ახალი მოთხოვნები აქ გამოჩნდება მათი შემოსვლისთანავე. ზარი და WhatsApp — ერთი შეხებით."
        />
      ) : (
        <LeadInbox leads={leads} titles={titles} layout="board" />
      )}
    </DashboardShell>
  )
}
