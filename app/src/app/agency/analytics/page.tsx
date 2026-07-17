import type { Metadata } from "next"
import { Clock, MessagesSquare, TrendingUp } from "lucide-react"

import BarRow from "@/components/agency-dashboard/BarRow"
import { getAgencyContext } from "@/components/agency-dashboard/data"
import {
  AGENCY_NAV,
  LEAD_STATUS_LABELS,
  LEAD_STATUS_ORDER,
  LISTING_STATUS_LABELS,
} from "@/components/agency-dashboard/nav"
import DashboardShell from "@/components/dashboard/DashboardShell"
import StatCard from "@/components/dashboard/StatCard"
import { db } from "@/lib/db"
import { requireRole, safeQuery } from "@/lib/guards"
import type { CrmLeadStatus, ListingStatus } from "@/generated/prisma/client"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "სააგენტოს ანალიტიკა",
  robots: { index: false },
}

const LISTING_STATUS_ORDER: ListingStatus[] = ["active", "pending", "sold", "expired", "withdrawn"]

export default async function AgencyAnalyticsPage() {
  const user = await requireRole("agency", "/agency")
  const { profile, ownerIds } = await getAgencyContext(user)
  const leadGroups = await safeQuery(
    () =>
      db.crmLead.groupBy({
        by: ["status"],
        where: { agentId: { in: ownerIds } },
        _count: { _all: true },
      }),
    [] as { status: CrmLeadStatus; _count: { _all: number } }[],
  )
  const listingGroups = await safeQuery(
    () =>
      db.listing.groupBy({
        by: ["status"],
        where: { ownerId: { in: ownerIds }, deletedAt: null },
        _count: { _all: true },
      }),
    [] as { status: ListingStatus; _count: { _all: number } }[],
  )
  const leadCounts = new Map(leadGroups.map((g) => [g.status, g._count._all]))
  const listingCounts = new Map(listingGroups.map((g) => [g.status, g._count._all]))
  const maxLeads = Math.max(0, ...leadGroups.map((g) => g._count._all))
  const maxListings = Math.max(0, ...listingGroups.map((g) => g._count._all))

  return (
    <DashboardShell
      nav={AGENCY_NAV}
      title="სააგენტოს პანელი"
      subtitle="ანალიტიკა"
      userLabel={user.name ?? user.email}
    >
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
        <StatCard
          label="პასუხის მაჩვენებელი"
          value={profile ? `${Math.round(profile.responseRatePct)}%` : "—"}
          hint="ლიდებზე პასუხი"
          icon={<MessagesSquare size={18} />}
        />
        <StatCard
          label="საშ. გარიგების ხანგრძლივობა"
          value={profile ? `${profile.avgDealDays} დღე` : "—"}
          icon={<Clock size={18} />}
        />
        <StatCard
          label="ლიდები თვეში"
          value={profile?.monthlyLeads ?? "—"}
          hint="პროფილის მიხედვით"
          icon={<TrendingUp size={18} />}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-sv-ink/6 bg-white p-6 shadow-sm">
          <h2 className="text-[15px] font-extrabold text-sv-ink">ლიდები სტატუსით</h2>
          <div className="mt-4 flex flex-col gap-2.5">
            {LEAD_STATUS_ORDER.map((status) => (
              <BarRow
                key={status}
                label={LEAD_STATUS_LABELS[status]}
                count={leadCounts.get(status) ?? 0}
                max={maxLeads}
              />
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-sv-ink/6 bg-white p-6 shadow-sm">
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
