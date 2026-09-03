import type { Metadata } from "next"
import LocalizedLink from "@/components/LocalizedLink"
import { Building2, CalendarDays, Eye, Plus, Users } from "lucide-react"

import BarRow from "@/components/agency-dashboard/BarRow"
import { getAgencyContext } from "@/components/agency-dashboard/data"
import ImportCompetitorPanel from "@/components/agent-dashboard/ImportCompetitorPanel"
import { AGENCY_NAV } from "@/components/agency-dashboard/nav"
import DashboardShell from "@/components/dashboard/DashboardShell"
import DashboardQuickLinks from "@/components/dashboard/DashboardQuickLinks"
import EmptyState from "@/components/dashboard/EmptyState"
import StatCard from "@/components/dashboard/StatCard"
import { db } from "@/lib/db"
import { requireRole, safeQuery } from "@/lib/guards"
import { INQUIRY_STATUS_KA, INQUIRY_STATUSES, inquiryWhere, listingOwnerWhere } from "@/lib/pro-leads"
import { phoneRevealsOf } from "@/lib/inquiries/phone"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "სააგენტოს პანელი",
  robots: { index: false },
}

export default async function AgencyOverviewPage() {
  const user = await requireRole("agency", "/agency")
  const { profile, team, ownerIds } = await getAgencyContext(user)

  const listings = await safeQuery(
    () =>
      db.listing.findMany({
        where: listingOwnerWhere(ownerIds),
        select: { id: true, status: true, views: true, extendedFields: true },
      }),
    [],
  )
  const listingIds = listings.map((l) => l.id)
  const totalViews = listings.reduce((sum, l) => sum + l.views, 0)
  const totalReveals = listings.reduce((sum, l) => sum + phoneRevealsOf(l.extendedFields), 0)
  const activeListings = listings.filter((l) => l.status === "active").length

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [leadGroups, upcomingTours] = await Promise.all([
    safeQuery(
      () =>
        db.inquiry.groupBy({
          by: ["status"],
          where: inquiryWhere(listingIds, user.email),
          _count: { _all: true },
        }),
      [],
    ),
    safeQuery(
      () =>
        db.propertyTour.count({
          where: {
            listing: { ownerId: { in: ownerIds }, deletedAt: null },
            tourDate: { gte: today },
            status: { in: ["pending", "confirmed"] },
          },
        }),
      0,
    ),
  ])
  const counts = new Map(leadGroups.map((g) => [g.status, g._count._all]))
  const totalLeads = leadGroups.reduce((sum, g) => sum + g._count._all, 0)
  const maxCount = Math.max(0, ...leadGroups.map((g) => g._count._all))
  const newLeads = counts.get("new") ?? 0

  return (
    <DashboardShell
      nav={AGENCY_NAV}
      title="სააგენტოს პანელი"
      subtitle={profile?.name}
      userLabel={user.name ?? user.email}
    >
      <div className="mb-5 flex justify-end">
        <LocalizedLink
          href="/add-listing"
          className="inline-flex items-center gap-1.5 rounded-full bg-sv-orange px-5 py-2.5 text-[13px] font-bold text-white shadow-glow-orange transition hover:opacity-95"
        >
          <Plus size={15} strokeWidth={2.5} />
          დაამატე განცხადება
        </LocalizedLink>
      </div>
      <ImportCompetitorPanel />
      {!profile ? (
        <EmptyState
          title="სააგენტოს პროფილი ვერ მოიძებნა"
          body="შეავსე პროფილი — საჯარო გვერდი და სტატისტიკა გამოჩნდება შენახვისთანავე."
          actionHref="/agency/profile"
          actionLabel="პროფილის შევსება"
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          <StatCard
            label="აქტიური"
            value={activeListings}
            hint={`${listings.length} სულ`}
            icon={<Building2 size={18} />}
          />
          <StatCard label="ნახვები" value={totalViews} hint="გუნდის პორტფოლიო" icon={<Eye size={18} />} />
          <StatCard
            label="ახალი ლიდები"
            value={newLeads}
            hint={totalLeads ? `სულ ${totalLeads}` : totalReveals ? `ნომრის ნახვა: ${totalReveals}` : "CRM"}
            icon={<Users size={18} />}
          />
          <StatCard label="ვიზიტები" value={upcomingTours} icon={<CalendarDays size={18} />} />
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-card border border-sv-ink/[0.06] bg-sv-surface p-6 shadow-card">
          <h2 className="text-[15px] font-extrabold text-sv-ink">ლიდების ძარღვი</h2>
          {totalLeads === 0 ? (
            <p className="mt-4 text-[13px] font-medium text-sv-ink/50">
              ლიდები ჯერ არ არის — ახალი მოთხოვნები აქ გამოჩნდება.
            </p>
          ) : (
            <div className="mt-4 flex flex-col gap-2.5">
              {INQUIRY_STATUSES.map((status) => (
                <BarRow
                  key={status}
                  label={INQUIRY_STATUS_KA[status]}
                  count={counts.get(status) ?? 0}
                  max={maxCount}
                />
              ))}
            </div>
          )}
          <LocalizedLink
            href="/agency/leads"
            className="mt-5 inline-block text-[12.5px] font-bold text-sv-blue hover:underline"
          >
            ყველა ლიდი →
          </LocalizedLink>
        </section>

        <section className="rounded-card border border-sv-ink/[0.06] bg-sv-surface p-6 shadow-card">
          <h2 className="text-[15px] font-extrabold text-sv-ink">სწრაფი ქმედებები</h2>
          <div className="mt-4">
            <DashboardQuickLinks
              links={[
                { href: "/add-listing", label: "+ ახალი განცხადება", primary: true },
                { href: "/agency/listings", label: "განცხადებების მართვა" },
                { href: "/agency/team", label: "გუნდი" },
                { href: "/advertise", label: "VIP ტარიფები" },
                ...(user.id ? [{ href: `/u/${user.id}`, label: "საჯარო გვერდი" }] : []),
              ]}
            />
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-card border border-sv-ink/[0.06] bg-sv-surface p-6 shadow-card">
        <h2 className="text-[15px] font-extrabold text-sv-ink">გუნდი</h2>
        {team.length === 0 ? (
          <p className="mt-4 text-[13px] font-medium text-sv-ink/50">
            {profile
              ? `პროფილში მითითებულია გუნდის ზომა: ${profile.teamSize}. აგენტი გუნდში გამოჩნდება, როცა მისი სააგენტოს სახელი ემთხვევა.`
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
                    {agent.listingsCount} განცხადება · {agent.rating.toFixed(1)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
        <LocalizedLink
          href="/agency/team"
          className="mt-5 inline-block text-[12.5px] font-bold text-sv-blue hover:underline"
        >
          გუნდის ნახვა →
        </LocalizedLink>
      </section>
    </DashboardShell>
  )
}
