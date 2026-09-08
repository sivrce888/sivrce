import { Activity, CalendarRange, Flame, ShieldCheck, UserPlus, Users } from "lucide-react"

import { DistributionBars } from "@/components/admin/dashboard/DistributionBars"
import { Panel } from "@/components/admin/dashboard/Panel"
import { TrendChart } from "@/components/admin/dashboard/TrendChart"
import { PageHeader } from "@/components/admin/ui/PageHeader"
import { StatCard } from "@/components/admin/ui/StatCard"
import { fmtNum, fmtTetri } from "@/lib/admin/format"
import { requireAdmin } from "@/lib/admin/guard"
import { getPlatformStats } from "@/lib/admin/metrics"

export const metadata = { title: "Statistics" }

export default async function AdminStatsPage() {
  await requireAdmin()
  const s = await getPlatformStats()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Statistics"
        description="Full platform telemetry — audience, acquisition, engagement, marketplace, revenue."
      />

      {/* Audience */}
      <section aria-label="Audience" className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard
            label="Active today"
            value={fmtNum(s.activeToday)}
            hint="Signed in since UTC midnight"
            icon={Activity}
            tone="blue"
            href="/admin/users"
          />
          <StatCard
            label="Active 7 days"
            value={fmtNum(s.active7d)}
            hint="Signed in this week"
            icon={Flame}
            href="/admin/users"
          />
          <StatCard
            label="Active 30 days"
            value={fmtNum(s.active30d)}
            hint="Rolling month"
            icon={CalendarRange}
            href="/admin/users"
          />
          <StatCard
            label="New users today"
            value={fmtNum(s.newToday)}
            hint={`+${fmtNum(s.new7d)} this week · ${fmtNum(s.totalUsers)} total`}
            icon={UserPlus}
            tone="success"
            href="/admin/users"
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            label="Verified emails"
            value={fmtNum(s.verifiedEmails)}
            hint={`of ${fmtNum(s.totalUsers)} users`}
            icon={ShieldCheck}
          />
          <StatCard
            label="Verified phones"
            value={fmtNum(s.verifiedPhones)}
            hint="OTP-confirmed"
            icon={ShieldCheck}
          />
          <StatCard label="Avg trust score" value={fmtNum(s.avgTrust)} hint="0–100 scale" icon={Users} />
        </div>
      </section>

      {/* Acquisition */}
      <section aria-label="Acquisition" className="grid gap-4 lg:grid-cols-3">
        <Panel title="Referral sources" hint="Where signups came from — first-touch attribution">
          <DistributionBars
            items={s.signupSources}
            emptyHint="No attribution yet — sources appear as users sign in."
          />
        </Panel>
        <Panel title="Sign-in providers">
          <DistributionBars
            items={s.providers}
            emptyHint="No linked providers yet."
          />
        </Panel>
        <Panel title="Users by role">
          <DistributionBars items={s.roles} emptyHint="No users yet." />
        </Panel>
      </section>

      {/* Engagement */}
      <section aria-label="Engagement" className="grid gap-4 lg:grid-cols-2">
        <Panel title="Engagement" hint="Event counts by window (UTC)">
          {s.engagement.every((r) => r.total === 0) ? (
            <p className="py-8 text-center text-[13px] text-sv-ink/60">
              No activity yet — events will appear as the platform is used.
            </p>
          ) : (
            <table className="w-full text-[13px]">
              <caption className="sr-only">Engagement events by time window</caption>
              <thead>
                <tr className="border-b border-sv-ink/8 text-left text-[11px] font-bold tracking-[0.08em] text-sv-ink/60 uppercase">
                  <th scope="col" className="py-2 font-bold">
                    Event
                  </th>
                  <th scope="col" className="py-2 text-right font-bold">
                    Today
                  </th>
                  <th scope="col" className="py-2 text-right font-bold">
                    7 days
                  </th>
                  <th scope="col" className="py-2 text-right font-bold">
                    All time
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sv-ink/5">
                {s.engagement.map((r) => (
                  <tr key={r.label}>
                    <th scope="row" className="py-2 text-left font-semibold text-sv-ink/75">
                      {r.label}
                    </th>
                    <td className="py-2 text-right font-bold tabular-nums text-sv-ink">
                      {fmtNum(r.today)}
                    </td>
                    <td className="py-2 text-right tabular-nums text-sv-ink/65">{fmtNum(r.d7)}</td>
                    <td className="py-2 text-right tabular-nums text-sv-ink/65">
                      {fmtNum(r.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
        <Panel title="Inquiries — last 30 days" href="/admin/inquiries">
          <TrendChart points={s.inquiryTrend} label="Inquiries per day" />
        </Panel>
      </section>

      {/* Marketplace */}
      <section aria-label="Marketplace" className="grid gap-4 md:grid-cols-3">
        <Panel title="Listings by status">
          <DistributionBars
            items={s.listingStatuses}
            emptyHint="No listings yet — statuses appear once inventory exists."
          />
        </Panel>
        <Panel title="Listings by tier">
          <DistributionBars
            items={s.listingTiers}
            emptyHint="No listings yet — tiers appear once inventory exists."
          />
        </Panel>
        <Panel title="Auctions by status">
          <DistributionBars items={s.auctionStatuses} emptyHint="No auctions yet." />
        </Panel>
      </section>

      {/* Money */}
      <section aria-label="Revenue" className="grid gap-4 lg:grid-cols-3">
        <Panel title="Payments" hint="Paid orders only" className="lg:col-span-1">
          <dl className="flex flex-col divide-y divide-sv-ink/5 text-[13px]">
            {[
              ["GEL today", `${fmtTetri(s.gelTodayTetri)} · ${fmtNum(s.gelOrdersToday)} orders`],
              ["GEL this month", fmtTetri(s.gelMonthTetri)],
              ["Stripe (USD) today", fmtTetri(s.usdTodayCents, "USD")],
              ["Stripe (USD) month", fmtTetri(s.usdMonthCents, "USD")],
              ["Failed payments", fmtNum(s.failedPayments)],
              [
                "Lead sales (GEL)",
                `${fmtNum(s.leadSales)} sold · ${fmtTetri(s.leadRevenueTetri)}`,
              ],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-3 py-2.5">
                <dt className="font-semibold text-sv-ink/60">{label}</dt>
                <dd className="font-bold tabular-nums text-sv-ink">{value}</dd>
              </div>
            ))}
          </dl>
        </Panel>
        <Panel title="Active subscriptions by tier">
          <DistributionBars items={s.subscriptionTiers} emptyHint="No active subscriptions yet." />
        </Panel>
        <Panel title="Subscriptions by status">
          <DistributionBars items={s.subscriptionStatuses} emptyHint="No subscriptions yet." />
        </Panel>
      </section>
    </div>
  )
}
