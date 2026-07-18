import type { Metadata } from "next"
import Link from "next/link"
import { Building2, CalendarDays, Star, Users } from "lucide-react"

import DashboardShell from "@/components/dashboard/DashboardShell"
import StatCard from "@/components/dashboard/StatCard"
import EmptyState from "@/components/dashboard/EmptyState"
import Badge from "@/components/agent-dashboard/Badge"
import { agentNav } from "@/components/agent-dashboard/nav"
import {
  fmtDate,
  leadStatusLabel,
  leadStatusTone,
  tourStatusLabel,
  tourStatusTone,
} from "@/components/agent-dashboard/format"
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

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const upcomingTourWhere: Prisma.PropertyTourWhereInput | null = profile
    ? { agentId: profile.id, tourDate: { gte: today }, status: { in: ["pending", "confirmed"] } }
    : null

  const [activeListings, newLeads, upcomingTours, reviewAgg, recentLeads, nextTours] =
    await Promise.all([
      safeQuery(
        () => db.listing.count({ where: { ownerId: user.id, status: "active", deletedAt: null } }),
        0,
      ),
      safeQuery(() => db.crmLead.count({ where: { agentId: user.id, status: "new" } }), 0),
      upcomingTourWhere
        ? safeQuery(() => db.propertyTour.count({ where: upcomingTourWhere }), 0)
        : Promise.resolve(0),
      profile
        ? safeQuery(
            () =>
              db.review.aggregate({
                where: {
                  targetType: "agent",
                  targetId: profile.id,
                  status: "published",
                  deletedAt: null,
                },
                _avg: { rating: true },
                _count: { _all: true },
              }),
            null,
          )
        : Promise.resolve(null),
      safeQuery(
        () =>
          db.crmLead.findMany({
            where: { agentId: user.id },
            orderBy: { createdAt: "desc" },
            take: 5,
          }),
        [],
      ),
      upcomingTourWhere
        ? safeQuery(
            () =>
              db.propertyTour.findMany({
                where: upcomingTourWhere,
                orderBy: [{ tourDate: "asc" }, { tourTime: "asc" }],
                take: 5,
                include: { listing: { select: { id: true, title: true } } },
              }),
            [],
          )
        : Promise.resolve([]),
    ])

  const rating = reviewAgg?._avg.rating ?? profile?.rating ?? 0
  const reviewsCount = reviewAgg?._count._all ?? profile?.reviewsCount ?? 0

  return (
    <DashboardShell
      nav={agentNav}
      title="აგენტის პანელი"
      subtitle="მიმოხილვა"
      userLabel={user.name ?? user.email}
    >
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          label="აქტიური განცხადებები"
          value={activeListings}
          icon={<Building2 size={18} />}
        />
        <StatCard label="ახალი ლიდები" value={newLeads} icon={<Users size={18} />} />
        <StatCard
          label="მომავალი ვიზიტები"
          value={upcomingTours}
          icon={<CalendarDays size={18} />}
        />
        <StatCard
          label="რეიტინგი"
          value={rating ? rating.toFixed(1) : "—"}
          hint={`${reviewsCount} შეფასება`}
          icon={<Star size={18} />}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-sv-ink/6 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[15px] font-extrabold text-sv-ink">ბოლო ლიდები</h2>
            <Link
              href="/agent/leads"
              className="text-[12px] font-bold text-sv-blue hover:underline"
            >
              ყველა →
            </Link>
          </div>
          {recentLeads.length === 0 ? (
            <EmptyState
              title="ლიდები ჯერ არ გყავს"
              body="ახალი მოთხოვნები აქ გამოჩნდება მაშინვე, როცა მომხმარებელი დაგიკავშირდება."
            />
          ) : (
            <ul className="divide-y divide-sv-ink/6">
              {recentLeads.map((lead) => (
                <li key={lead.id} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-bold text-sv-ink">{lead.name}</p>
                    <p className="truncate text-[12px] font-medium text-sv-ink/50">
                      {lead.phone} · {fmtDate(lead.createdAt)}
                    </p>
                  </div>
                  <Badge
                    label={leadStatusLabel[lead.status] ?? lead.status}
                    tone={leadStatusTone[lead.status] ?? "neutral"}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-sv-ink/6 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[15px] font-extrabold text-sv-ink">უახლოესი ვიზიტები</h2>
            <Link
              href="/agent/tours"
              className="text-[12px] font-bold text-sv-blue hover:underline"
            >
              ყველა →
            </Link>
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
                    <Link
                      href={`/listing/${tour.listing.id}`}
                      className="block truncate text-[13.5px] font-bold text-sv-ink hover:text-sv-blue"
                    >
                      {tour.listing.title}
                    </Link>
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
      </div>
    </DashboardShell>
  )
}
