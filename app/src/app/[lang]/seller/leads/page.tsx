import type { Metadata } from "next"

import DashboardShell from "@/components/dashboard/DashboardShell"
import EmptyState from "@/components/dashboard/EmptyState"
import LeadInbox from "@/components/dashboard/LeadInbox"
import { sellerNav } from "@/components/seller-dashboard/nav"
import { db } from "@/lib/db"
import { requireRole, safeQuery } from "@/lib/guards"
import { inquiryWhere, listingOwnerWhere } from "@/lib/pro-leads"
import { isRentFocus, panelTitle } from "@/lib/workspace"
import { readPersona } from "@/lib/workspace-cookie"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "ლიდები · გამყიდველი",
  robots: { index: false },
}

export default async function SellerLeadsPage() {
  const user = await requireRole("seller", "/seller")
  const persona = await readPersona(user.role)
  const seeker = isRentFocus(persona) ? "დამქირავებელი" : "მყიდველი"

  // ponytail: sellers share Inquiry model (no seller CRM); ceiling = CrmLead when seller CRM ships
  const listingRows = await safeQuery(
    () =>
      db.listing.findMany({
        where: listingOwnerWhere([user.id]),
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
        take: 50,
      }),
    [],
  )

  return (
    <DashboardShell
      nav={sellerNav}
      title={panelTitle(persona)}
      subtitle="ლიდები"
      userLabel={user.name ?? user.email}
    >
      <h2 className="mb-6 text-[18px] font-extrabold tracking-tight text-sv-ink">
        ყველა ლიდი ({leads.length})
      </h2>

      {leads.length === 0 ? (
        <EmptyState
          title="ლიდები ჯერ არ გყავს"
          body={`ახალი მოთხოვნები აქ გამოჩნდება, როცა ${seeker} დაინტერესდება შენი განცხადებით.`}
          actionHref="/add-listing"
          actionLabel="განცხადების დამატება"
        />
      ) : (
        <LeadInbox leads={leads} titles={titles} />
      )}
    </DashboardShell>
  )
}
