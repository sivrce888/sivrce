import type { Metadata } from "next"
import Link from "next/link"
import { Building2, Star, TrendingUp, Users } from "lucide-react"

import BarRow from "@/components/agency-dashboard/BarRow"
import { getAgencyContext } from "@/components/agency-dashboard/data"
import { AGENCY_NAV, LEAD_STATUS_LABELS, LEAD_STATUS_ORDER } from "@/components/agency-dashboard/nav"
import DashboardShell from "@/components/dashboard/DashboardShell"
import EmptyState from "@/components/dashboard/EmptyState"
import StatCard from "@/components/dashboard/StatCard"
import { db } from "@/lib/db"
import { requireRole, safeQuery } from "@/lib/guards"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "სააგენტოს პანელი",
  robots: { index: false },
}

export default async function AgencyOverviewPage() {
  const user = await requireRole("agency", "/agency")
  const { profile, team, ownerIds } = await getAgencyContext(user)
  const leadGroups = await safeQuery(
    () =>
      db.crmLead.groupBy({
        by: ["status"],
        where: { agentId: { in: ownerIds } },
        _count: { _all: true },
      }),
    [],
  )
  const counts = new Map(leadGroups.map((g) => [g.status, g._count._all]))
  const totalLeads = leadGroups.reduce((sum, g) => sum + g._count._all, 0)
  const maxCount = Math.max(0, ...leadGroups.map((g) => g._count._all))

  return (
    <DashboardShell
      nav={AGENCY_NAV}
      title="სააგენტოს პანელი"
      subtitle={profile?.name}
      userLabel={user.name ?? user.email}
    >
      {!profile ? (
        <EmptyState
          title="სააგენტოს პროფილი ვერ მოიძებნა"
          body="შენს ანგარიშზე სააგენტოს პროფილი ჯერ არ არის მიბმული. სტატისტიკა გამოჩნდება პროფილის შექმნისთანავე."
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <StatCard
            label="აქტიური განცხადებები"
            value={profile.activeListings}
            icon={<Building2 size={18} />}
          />
          <StatCard
            label="ლიდები თვეში"
            value={profile.monthlyLeads}
            hint={`სულ CRM-ში: ${totalLeads}`}
            icon={<TrendingUp size={18} />}
          />
          <StatCard
            label="პასუხის მაჩვენებელი"
            value={`${Math.round(profile.responseRatePct)}%`}
            hint={`საშ. გარიგება: ${profile.avgDealDays} დღე`}
            icon={<Star size={18} />}
          />
          <StatCard
            label="რეიტინგი"
            value={profile.rating.toFixed(1)}
            hint={`${profile.reviewsCount} შეფასება`}
            icon={<Users size={18} />}
          />
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-sv-ink/6 bg-white p-6 shadow-sm">
          <h2 className="text-[15px] font-extrabold text-sv-ink">ლიდების ძარღვი</h2>
          {totalLeads === 0 ? (
            <p className="mt-4 text-[13px] font-medium text-sv-ink/50">
              ლიდები ჯერ არ არის — ახალი მოთხოვნები აქ გამოჩნდება.
            </p>
          ) : (
            <div className="mt-4 flex flex-col gap-2.5">
              {LEAD_STATUS_ORDER.map((status) => (
                <BarRow
                  key={status}
                  label={LEAD_STATUS_LABELS[status]}
                  count={counts.get(status) ?? 0}
                  max={maxCount}
                />
              ))}
            </div>
          )}
          <Link
            href="/agency/leads"
            className="mt-5 inline-block text-[12.5px] font-bold text-sv-blue hover:underline"
          >
            ყველა ლიდი →
          </Link>
        </section>

        <section className="rounded-2xl border border-sv-ink/6 bg-white p-6 shadow-sm">
          <h2 className="text-[15px] font-extrabold text-sv-ink">გუნდი</h2>
          {team.length === 0 ? (
            <p className="mt-4 text-[13px] font-medium text-sv-ink/50">
              {profile
                ? `პროფილში მითითებულია გუნდის ზომა: ${profile.teamSize}. აგენტების პროფილები ჯერ არ არის დაკავშირებული.`
                : "აგენტები ჯერ არ არის დამატებული."}
            </p>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
              {team.slice(0, 4).map((agent) => (
                <li key={agent.id} className="flex items-center gap-3">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[12px] font-black text-white"
                    style={{ backgroundColor: agent.color || "var(--sv-blue)" }}
                  >
                    {agent.avatarText}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-bold text-sv-ink">{agent.name}</p>
                    <p className="text-[11.5px] font-medium text-sv-ink/50">
                      {agent.listingsCount} განცხადება · ★ {agent.rating.toFixed(1)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/agency/team"
            className="mt-5 inline-block text-[12.5px] font-bold text-sv-blue hover:underline"
          >
            გუნდის ნახვა →
          </Link>
        </section>
      </div>
    </DashboardShell>
  )
}
