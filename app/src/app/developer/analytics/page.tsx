import type { Metadata } from "next"
import { Eye, Home, MessagesSquare, TrendingUp } from "lucide-react"

import BarRow from "@/components/agency-dashboard/BarRow"
import DashboardShell from "@/components/dashboard/DashboardShell"
import EmptyState from "@/components/dashboard/EmptyState"
import StatCard from "@/components/dashboard/StatCard"
import { developerNav } from "@/components/developer-dashboard/nav"
import { db } from "@/lib/db"
import { requireRole, safeQuery } from "@/lib/guards"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "ანალიტიკა · დეველოპერი",
  robots: { index: false },
}

const STATUS_ORDER = ["new", "contacted", "qualified", "closed"] as const
const STATUS_KA: Record<string, string> = {
  new: "ახალი",
  contacted: "დაკავშირებული",
  qualified: "კვალიფიცირებული",
  closed: "დახურული",
}

export default async function DeveloperAnalyticsPage() {
  const user = await requireRole("developer", "/developer")

  const listingIds = await safeQuery(
    () =>
      db.listing
        .findMany({
          where: { ownerId: user.id, deletedAt: null },
          select: { id: true, views: true, status: true },
        })
        .then((rows) => rows),
    [] as { id: string; views: number; status: string }[],
  )

  const ids = listingIds.map((l) => l.id)
  const totalViews = listingIds.reduce((sum, l) => sum + l.views, 0)
  const activeCount = listingIds.filter((l) => l.status === "active").length

  const [leadGroups, projectsCount] = await Promise.all([
    ids.length
      ? safeQuery(
          () =>
            db.inquiry.groupBy({
              by: ["status"],
              where: {
                deletedAt: null,
                OR: [{ listingId: { in: ids } }, { agentEmail: user.email }],
              },
              _count: { _all: true },
            }),
          [],
        )
      : Promise.resolve([]),
    safeQuery(
      () =>
        db.projectDirectory.count({
          where: { ownerId: user.id, deletedAt: null },
        }),
      0,
    ),
  ])

  const leadCounts = new Map(leadGroups.map((g) => [g.status, g._count._all]))
  const totalLeads = leadGroups.reduce((sum, g) => sum + g._count._all, 0)
  const maxLeads = Math.max(0, ...leadGroups.map((g) => g._count._all))
  const conversion =
    totalViews > 0 ? Math.round((totalLeads / totalViews) * 1000) / 10 : 0

  return (
    <DashboardShell
      nav={developerNav}
      title="დეველოპერის პანელი"
      subtitle="ანალიტიკა"
      userLabel={user.name ?? user.email}
    >
      <h1 className="mb-5 text-[22px] font-black tracking-tight text-sv-ink">ანალიტიკა</h1>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="ნახვები" value={totalViews} hint="ყველა განცხადება" icon={<Eye size={18} />} />
        <StatCard label="ლიდები" value={totalLeads} hint="მოთხოვნები" icon={<MessagesSquare size={18} />} />
        <StatCard
          label="კონვერსია"
          value={`${conversion}%`}
          hint="ლიდი / ნახვა"
          icon={<TrendingUp size={18} />}
        />
        <StatCard
          label="აქტიური"
          value={activeCount}
          hint={`${projectsCount} პროექტი`}
          icon={<Home size={18} />}
        />
      </div>

      <section className="mt-6 rounded-card border border-sv-ink/6 bg-sv-surface p-6 shadow-card">
        <h2 className="text-[15px] font-extrabold text-sv-ink">ლიდები სტატუსით</h2>
        {totalLeads === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="ჯერ არ არის საკმარისი მონაცემი"
              body="როცა მყიდველები დაგიკავშირდებიან, აქ გამოჩნდება ლიდების განაწილება სტატუსების მიხედვით."
              actionHref="/add-listing"
              actionLabel="განცხადების დამატება"
            />
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-2.5">
            {STATUS_ORDER.map((status) => (
              <BarRow
                key={status}
                label={STATUS_KA[status] ?? status}
                count={leadCounts.get(status) ?? 0}
                max={maxLeads}
              />
            ))}
          </div>
        )}
      </section>
    </DashboardShell>
  )
}
