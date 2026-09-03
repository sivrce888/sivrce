import type { Metadata } from "next"

import DashboardShell from "@/components/dashboard/DashboardShell"
import EmptyState from "@/components/dashboard/EmptyState"
import LeadInbox from "@/components/dashboard/LeadInbox"
import { developerNav } from "@/components/developer-dashboard/nav"
import { db } from "@/lib/db"
import { requireRole, safeQuery } from "@/lib/guards"
import { inquiryWhere, listingOwnerWhere } from "@/lib/pro-leads"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "ლიდები",
  robots: { index: false },
}

export default async function DeveloperLeadsPage() {
  const user = await requireRole("developer", "/developer")

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
      nav={developerNav}
      title="დეველოპერის პანელი"
      subtitle="ლიდები"
      userLabel={user.name ?? user.email}
    >
      <h1 className="mb-5 text-[22px] font-black tracking-tight text-sv-ink">
        ლიდები
      </h1>

      {leads.length === 0 ? (
        <EmptyState
          title="ლიდები ჯერ არ გაქვს"
          body="მყიდველების მოთხოვნები შენს განცხადებებზე აქ გამოჩნდება. დაამატე გასაყიდი ბინა, რომ პირველი მოთხოვნები მიიღო."
          actionHref="/add-listing?deal=sale&propType=apartment"
          actionLabel="განცხადების დამატება"
        />
      ) : (
        <LeadInbox leads={leads} titles={titles} />
      )}
    </DashboardShell>
  )
}
