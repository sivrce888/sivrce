import {
  Activity,
  Building2,
  CreditCard,
  Flag,
  Gavel,
  Hourglass,
  Inbox,
  ShieldAlert,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react"
import Link from "next/link"

import { AttentionList } from "@/components/admin/dashboard/AttentionList"
import { DistributionBars } from "@/components/admin/dashboard/DistributionBars"
import { Panel } from "@/components/admin/dashboard/Panel"
import { TrendChart } from "@/components/admin/dashboard/TrendChart"
import { EmptyState } from "@/components/admin/ui/EmptyState"
import { PageHeader } from "@/components/admin/ui/PageHeader"
import { StatCard } from "@/components/admin/ui/StatCard"
import { StatusPill } from "@/components/admin/ui/StatusPill"
import { fmtDate, fmtMoney, fmtNum, fmtTetri, timeAgo } from "@/lib/admin/format"
import { getDashboardMetrics } from "@/lib/admin/metrics"

export default async function AdminDashboardPage() {
  const m = await getDashboardMetrics()

  const revenueHint =
    m.stripeRevenueCents > 0
      ? `+ ${fmtTetri(m.stripeRevenueCents, "USD")} via Stripe · since ${fmtDate(m.monthStart)}`
      : `Since ${fmtDate(m.monthStart)}`

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Dashboard"
        description="Platform health at a glance — every number is live."
      />

      {/* KPI row */}
      <section
        aria-label="Key metrics"
        className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6"
      >
        <StatCard
          label="Active listings"
          value={fmtNum(m.activeListings)}
          icon={Building2}
          tone="blue"
        />
        <StatCard
          label="Total users"
          value={fmtNum(m.totalUsers)}
          hint={`+${fmtNum(m.newUsersThisWeek)} this week`}
          icon={Users}
        />
        <StatCard
          label="Moderation queue"
          value={fmtNum(m.pendingModeration)}
          hint="Pending review"
          icon={ShieldCheck}
          tone={m.pendingModeration > 0 ? "orange" : "ink"}
        />
        <StatCard
          label="Open complaints"
          value={fmtNum(m.openComplaints)}
          icon={Flag}
          tone={m.openComplaints > 0 ? "danger" : "ink"}
        />
        <StatCard
          label="Revenue (month)"
          value={fmtTetri(m.gelRevenueTetri)}
          hint={revenueHint}
          icon={CreditCard}
          tone="success"
        />
        <StatCard
          label="Live auctions"
          value={fmtNum(m.liveAuctions)}
          icon={Gavel}
          tone={m.liveAuctions > 0 ? "blue" : "ink"}
        />
      </section>

      {/* 30-day trends */}
      <section aria-label="Trends" className="grid gap-4 lg:grid-cols-2">
        <Panel title="New listings — last 30 days" href="/admin/listings">
          <TrendChart points={m.listingTrend} label="New listings per day" />
        </Panel>
        <Panel title="New users — last 30 days" href="/admin/users">
          <TrendChart points={m.userTrend} label="New users per day" />
        </Panel>
      </section>

      {/* Attention + activity */}
      <section className="grid gap-4 lg:grid-cols-3">
        <Panel title="Needs attention">
          <AttentionList
            items={[
              {
                label: "Moderation queue",
                hint: "Items awaiting review",
                count: m.pendingModeration,
                href: "/admin/moderation",
                icon: ShieldCheck,
              },
              {
                label: "Fraud signals",
                hint: "Unresolved active signals",
                count: m.unresolvedFraud,
                href: "/admin/moderation",
                icon: ShieldAlert,
              },
              {
                label: "VIP tiers expiring",
                hint: "Within the next 7 days",
                count: m.vipExpiringSoon,
                href: "/admin/listings",
                icon: Star,
              },
              {
                label: "Stale inquiries",
                hint: "Still new after 48h",
                count: m.staleInquiries,
                href: "/admin/inquiries",
                icon: Hourglass,
              },
              {
                label: "Failed payments",
                hint: "Georgian + Stripe orders",
                count: m.failedPayments,
                href: "/admin/payments",
                icon: CreditCard,
              },
            ]}
          />
        </Panel>

        <Panel title="Latest admin activity" className="lg:col-span-1">
          {m.latestAudit.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="No admin activity yet"
              hint="Actions taken by the team will appear here."
            />
          ) : (
            <ul className="flex flex-col divide-y divide-sv-ink/5">
              {m.latestAudit.map((row) => (
                <li
                  key={row.id}
                  className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] text-sv-ink/70">
                      <span className="font-bold text-sv-ink">
                        {row.actorName}
                      </span>{" "}
                      {row.action}
                    </span>
                    <span className="block text-[11.5px] text-sv-ink/40">
                      {row.targetType}
                    </span>
                  </span>
                  <time
                    dateTime={row.createdAt.toISOString()}
                    className="shrink-0 text-[11.5px] tabular-nums text-sv-ink/40"
                  >
                    {timeAgo(row.createdAt)}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Newest inquiries" href="/admin/inquiries">
          {m.latestInquiries.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No inquiries yet"
              hint="Buyer messages to agents will appear here."
            />
          ) : (
            <ul className="flex flex-col divide-y divide-sv-ink/5">
              {m.latestInquiries.map((row) => (
                <li key={row.id}>
                  <Link
                    href="/admin/inquiries"
                    className="flex items-center gap-3 py-2.5 transition-colors first:pt-0 last:pb-0 hover:bg-sv-cloud/50 focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:outline-none"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-bold text-sv-ink/85">
                        {row.buyerName}
                        <span className="ml-2 font-semibold text-sv-ink/45">
                          {fmtMoney(row.price)}
                        </span>
                      </span>
                      <span className="block truncate text-[11.5px] text-sv-ink/40">
                        {row.city || "—"} · {timeAgo(row.createdAt)}
                      </span>
                    </span>
                    <StatusPill status={row.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </section>

      {/* Distributions */}
      <section aria-label="Distributions" className="grid gap-4 md:grid-cols-3">
        <Panel title="Listings by deal type">
          <DistributionBars
            items={m.dealTypes}
            emptyHint="No listings yet — distribution will appear once inventory exists."
          />
        </Panel>
        <Panel title="Listings by property type">
          <DistributionBars
            items={m.propertyTypes}
            emptyHint="No listings yet — distribution will appear once inventory exists."
          />
        </Panel>
        <Panel title="Top cities">
          <DistributionBars
            items={m.cities}
            emptyHint="No listings yet — top cities will appear once inventory exists."
          />
        </Panel>
      </section>
    </div>
  )
}
