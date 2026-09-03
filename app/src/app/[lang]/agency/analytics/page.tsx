import type { Metadata } from "next"
import { CalendarCheck, Eye, MessagesSquare, TrendingUp } from "lucide-react"

import BarRow from "@/components/agency-dashboard/BarRow"
import { getAgencyContext } from "@/components/agency-dashboard/data"
import { AGENCY_NAV, LISTING_STATUS_LABELS } from "@/components/agency-dashboard/nav"
import DashboardShell from "@/components/dashboard/DashboardShell"
import EmptyState from "@/components/dashboard/EmptyState"
import StatCard from "@/components/dashboard/StatCard"
import { db } from "@/lib/db"
import { requireRole, safeQuery } from "@/lib/guards"
import {
  INQUIRY_STATUS_KA,
  INQUIRY_STATUSES,
  inquiryWhere,
  listingOwnerWhere,
} from "@/lib/pro-leads"
import type { ListingStatus } from "@/generated/prisma/client"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "სააგენტოს ანალიტიკა",
  robots: { index: false },
}

const LISTING_STATUS_ORDER: ListingStatus[] = ["active", "pending", "sold", "expired", "withdrawn"]

export default async function AgencyAnalyticsPage() {
  const user = await requireRole("agency", "/agency")
  const { ownerIds } = await getAgencyContext(user)

  const listings = await safeQuery(
    () =>
      db.listing.findMany({
        where: listingOwnerWhere(ownerIds),
        select: { id: true, views: true, status: true },
      }),
    [],
  )
  const ids = listings.map((l) => l.id)
  const totalViews = listings.reduce((sum, l) => sum + l.views, 0)
  const listingCounts = new Map<string, number>()
  for (const l of listings) listingCounts.set(l.status, (listingCounts.get(l.status) ?? 0) + 1)
  const maxListings = Math.max(0, ...listingCounts.values())

  const leadGroups = await safeQuery(
    () =>
      db.inquiry.groupBy({
        by: ["status"],
        where: inquiryWhere(ids, user.email),
        _count: { _all: true },
      }),
    [],
  )
  const leadCounts = new Map(leadGroups.map((g) => [g.status, g._count._all]))
  const totalLeads = leadGroups.reduce((sum, g) => sum + g._count._all, 0)
  const maxLeads = Math.max(0, ...leadGroups.map((g) => g._count._all))
  const conversion = totalViews > 0 ? Math.round((totalLeads / totalViews) * 1000) / 10 : 0

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const upcomingTours = await safeQuery(
    () =>
      db.propertyTour.count({
        where: {
          listing: { ownerId: { in: ownerIds }, deletedAt: null },
          tourDate: { gte: today },
          status: { in: ["pending", "confirmed"] },
        },
      }),
    0,
  )

  return (
    <DashboardShell
      nav={AGENCY_NAV}
      title="სააგენტოს პანელი"
      subtitle="ანალიტიკა"
      userLabel={user.name ?? user.email}
    >
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="ნახვები" value={totalViews} hint="გუნდის პორტფოლიო" icon={<Eye size={18} />} />
        <StatCard label="ლიდები" value={totalLeads} hint="მოთხოვნები" icon={<MessagesSquare size={18} />} />
        <StatCard
          label="კონვერსია"
          value={`${conversion}%`}
          hint="ლიდი / ნახვა"
          icon={<TrendingUp size={18} />}
        />
        <StatCard label="ვიზიტები" value={upcomingTours} icon={<CalendarCheck size={18} />} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-card border border-sv-ink/[0.06] bg-sv-surface p-6 shadow-card">
          <h2 className="text-[15px] font-extrabold text-sv-ink">ლიდები სტატუსით</h2>
          {totalLeads === 0 ? (
            <div className="mt-4">
              <EmptyState
                title="ჯერ არ არის საკმარისი მონაცემი"
                body="როცა მყიდველები დაგიკავშირდებიან, აქ გამოჩნდება განაწილება."
              />
            </div>
          ) : (
            <div className="mt-4 flex flex-col gap-2.5">
              {INQUIRY_STATUSES.map((status) => (
                <BarRow
                  key={status}
                  label={INQUIRY_STATUS_KA[status]}
                  count={leadCounts.get(status) ?? 0}
                  max={maxLeads}
                />
              ))}
            </div>
          )}
        </section>

        <section className="rounded-card border border-sv-ink/[0.06] bg-sv-surface p-6 shadow-card">
          <h2 className="text-[15px] font-extrabold text-sv-ink">განცხადებები სტატუსით</h2>
          <div className="mt-4 flex flex-col gap-2.5">
            {LISTING_STATUS_ORDER.map((status) => (
              <BarRow
                key={status}
                label={LISTING_STATUS_LABELS[status]}
                count={listingCounts.get(status) ?? 0}
                max={maxListings}
              />
            ))}
          </div>
        </section>
      </div>
    </DashboardShell>
  )
}
