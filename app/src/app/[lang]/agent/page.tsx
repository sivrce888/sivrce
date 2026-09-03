import type { Metadata } from "next"
import LocalizedLink from "@/components/LocalizedLink"
import { Building2, CalendarDays, Eye, Plus, Users } from "lucide-react"

import DashboardShell from "@/components/dashboard/DashboardShell"
import DashboardQuickLinks from "@/components/dashboard/DashboardQuickLinks"
import StatCard from "@/components/dashboard/StatCard"
import EmptyState from "@/components/dashboard/EmptyState"
import Badge from "@/components/agent-dashboard/Badge"
import ImportCompetitorPanel from "@/components/agent-dashboard/ImportCompetitorPanel"
import { agentNav } from "@/components/agent-dashboard/nav"
import {
  fmtDate,
  tourStatusLabel,
  tourStatusTone,
} from "@/components/agent-dashboard/format"
import { INQUIRY_STATUS_KA, inquiryWhere, listingOwnerWhere } from "@/lib/pro-leads"
import { phoneRevealsOf } from "@/lib/inquiries/phone"
import { db } from "@/lib/db"
import { requireRole, safeQuery } from "@/lib/guards"
import type { Prisma } from "@/generated/prisma/client"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "აგენტის პანელი",
  robots: { index: false },
}

export default async function AgentOverviewPage() {
  const user = await requireRole("agent", "/agent")

  const profile = await safeQuery(
    () => db.agentProfile.findFirst({ where: { ownerId: user.id, deletedAt: null } }),
    null,
  )

  const listings = await safeQuery(
    () =>
      db.listing.findMany({
        where: listingOwnerWhere([user.id]),
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
  const tourWhere: Prisma.PropertyTourWhereInput = {
    OR: [
      ...(profile ? [{ agentId: profile.id }] : []),
      { listing: { ownerId: user.id, deletedAt: null } },
    ],
  }

  const [newLeads, upcomingTours, recentLeads, nextTours] = await Promise.all([
    safeQuery(
      () => db.inquiry.count({ where: { ...inquiryWhere(listingIds, user.email), status: "new" } }),
      0,
    ),
    safeQuery(
      () =>
        db.propertyTour.count({
          where: { ...tourWhere, tourDate: { gte: today }, status: { in: ["pending", "confirmed"] } },
        }),
      0,
    ),
    safeQuery(
      () =>
        db.inquiry.findMany({
          where: inquiryWhere(listingIds, user.email),
          orderBy: { createdAt: "desc" },
          take: 5,
        }),
      [],
    ),
    safeQuery(
      () =>
        db.propertyTour.findMany({
          where: { ...tourWhere, tourDate: { gte: today }, status: { in: ["pending", "confirmed"] } },
          orderBy: [{ tourDate: "asc" }, { tourTime: "asc" }],
          take: 5,
          include: { listing: { select: { id: true, title: true } } },
        }),
      [],
    ),
  ])

  return (
    <DashboardShell
      nav={agentNav}
      title="აგენტის პანელი"
      subtitle="მიმოხილვა"
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
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard
          label="აქტიური"
          value={activeListings}
          hint={`${listings.length} სულ`}
          icon={<Building2 size={18} />}
        />
        <StatCard label="ნახვები" value={totalViews} hint="ყველა განცხადება" icon={<Eye size={18} />} />
        <StatCard
          label="ახალი ლიდები"
          value={newLeads}
          hint={totalReveals > 0 ? `ნომრის ნახვა: ${totalReveals}` : "მოთხოვნები"}
          icon={<Users size={18} />}
        />
        <StatCard label="მომავალი ვიზიტები" value={upcomingTours} icon={<CalendarDays size={18} />} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-card border border-sv-ink/[0.06] bg-sv-surface p-5 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[15px] font-extrabold text-sv-ink">ბოლო ლიდები</h2>
            <LocalizedLink
              href="/agent/leads"
              className="text-[12px] font-bold text-sv-blue hover:underline"
            >
              ყველა →
            </LocalizedLink>
          </div>
          {recentLeads.length === 0 ? (
            <EmptyState
              title="ლიდები ჯერ არ გყავს"
              body="მყიდველის მოთხოვნა აქ გამოჩნდება, როგორც კი განცხადებაზე დაგიკავშირდება."
            />
          ) : (
            <ul className="divide-y divide-sv-ink/6">
              {recentLeads.map((lead) => (
                <li key={lead.id} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-bold text-sv-ink">{lead.buyerName}</p>
                    <p className="truncate text-[12px] font-medium text-sv-ink/50">
                      {lead.buyerPhone ?? lead.buyerEmail} · {fmtDate(lead.createdAt)}
                    </p>
                  </div>
                  <Badge
                    label={INQUIRY_STATUS_KA[lead.status as keyof typeof INQUIRY_STATUS_KA] ?? lead.status}
                    tone={lead.status === "new" ? "blue" : "neutral"}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-card border border-sv-ink/[0.06] bg-sv-surface p-5 shadow-card">
          <div className="mb-4">
            <h2 className="text-[15px] font-extrabold text-sv-ink">სწრაფი ქმედებები</h2>
          </div>
          <DashboardQuickLinks
            links={[
              { href: "/add-listing", label: "+ ახალი განცხადება", primary: true },
              { href: "/agent/listings", label: "განცხადებების მართვა" },
              { href: "/agent/tours", label: "ვიზიტები" },
              { href: "/advertise", label: "VIP ტარიფები" },
              ...(profile ? [{ href: `/u/${user.id}`, label: "საჯარო პროფილი" }] : []),
            ]}
          />
        </section>
      </div>

      <section className="mt-6 rounded-card border border-sv-ink/[0.06] bg-sv-surface p-5 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[15px] font-extrabold text-sv-ink">უახლოესი ვიზიტები</h2>
          <LocalizedLink
            href="/agent/tours"
            className="text-[12px] font-bold text-sv-blue hover:underline"
          >
            ყველა →
          </LocalizedLink>
        </div>
        {nextTours.length === 0 ? (
          <EmptyState
            title="დაგეგმილი ვიზიტები არ არის"
            body="როცა მყიდველი განცხადების ნახვას დაჯავშნის, ვიზიტი აქ გამოჩნდება."
          />
        ) : (
          <ul className="divide-y divide-sv-ink/6">
            {nextTours.map((tour) => (
              <li key={tour.id} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <LocalizedLink
                    href={`/listing/${tour.listing.id}`}
                    className="block truncate text-[13.5px] font-bold text-sv-ink hover:text-sv-blue"
                  >
                    {tour.listing.title}
                  </LocalizedLink>
                  <p className="truncate text-[12px] font-medium text-sv-ink/50">
                    {fmtDate(tour.tourDate)} · {tour.tourTime} · {tour.guestName}
                  </p>
                </div>
                <Badge
                  label={tourStatusLabel[tour.status] ?? tour.status}
                  tone={tourStatusTone[tour.status] ?? "neutral"}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </DashboardShell>
  )
}
