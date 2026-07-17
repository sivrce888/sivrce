import type { Metadata } from "next"
import Link from "next/link"
import { Phone } from "lucide-react"

import DashboardShell from "@/components/dashboard/DashboardShell"
import EmptyState from "@/components/dashboard/EmptyState"
import Badge from "@/components/agent-dashboard/Badge"
import { agentNav } from "@/components/agent-dashboard/nav"
import { fmtDate, tourStatusLabel, tourStatusTone } from "@/components/agent-dashboard/format"
import { db } from "@/lib/db"
import { requireRole, safeQuery } from "@/lib/guards"
import type { Prisma } from "@/generated/prisma/client"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "ვიზიტები — აგენტის პანელი",
  robots: { index: false },
}

type TourWithListing = Prisma.PropertyTourGetPayload<{
  include: { listing: { select: { id: true; title: true; city: true; district: true } } }
}>

function TourCard({ tour }: { tour: TourWithListing }) {
  return (
    <li className="rounded-2xl border border-sv-ink/6 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`/listing/${tour.listing.id}`}
            className="block truncate text-[15px] font-extrabold text-sv-ink hover:text-sv-blue"
          >
            {tour.listing.title}
          </Link>
          <p className="mt-0.5 text-[12.5px] font-medium text-sv-ink/50">
            {tour.listing.city} · {tour.listing.district}
          </p>
        </div>
        <Badge
          label={tourStatusLabel[tour.status] ?? tour.status}
          tone={tourStatusTone[tour.status] ?? "neutral"}
        />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-sv-ink/6 pt-3 text-[12.5px] font-medium text-sv-ink/55">
        <span className="font-bold text-sv-ink/75">
          {fmtDate(tour.tourDate)} · {tour.tourTime}
        </span>
        <span>{tour.guestName}</span>
        <a
          href={`tel:${tour.guestPhone}`}
          className="inline-flex items-center gap-1.5 hover:text-sv-blue"
        >
          <Phone size={13} />
          {tour.guestPhone}
        </a>
      </div>
      {tour.guestNotes ? (
        <p className="mt-2 text-[12px] font-medium text-sv-ink/45">„{tour.guestNotes}“</p>
      ) : null}
    </li>
  )
}

export default async function AgentToursPage() {
  const user = await requireRole("agent", "/agent")

  const profile = await safeQuery(
    () => db.agentProfile.findFirst({ where: { ownerId: user.id, deletedAt: null } }),
    null,
  )

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const include = {
    listing: { select: { id: true, title: true, city: true, district: true } },
  } as const

  const [upcoming, past] = profile
    ? await Promise.all([
        safeQuery(
          () =>
            db.propertyTour.findMany({
              where: {
                agentId: profile.id,
                tourDate: { gte: today },
                status: { in: ["pending", "confirmed"] },
              },
              orderBy: [{ tourDate: "asc" }, { tourTime: "asc" }],
              include,
            }),
          [],
        ),
        safeQuery(
          () =>
            db.propertyTour.findMany({
              where: {
                agentId: profile.id,
                OR: [
                  { tourDate: { lt: today } },
                  { status: { in: ["cancelled_by_guest", "cancelled_by_agent", "completed", "no_show"] } },
                ],
              },
              orderBy: [{ tourDate: "desc" }, { tourTime: "desc" }],
              take: 20,
              include,
            }),
          [],
        ),
      ])
    : [[], []]

  return (
    <DashboardShell
      nav={agentNav}
      title="აგენტის პანელი"
      subtitle="ვიზიტები"
      userLabel={user.name ?? user.email}
    >
      <h1 className="mb-5 text-xl font-black tracking-tight text-sv-ink">ვიზიტები</h1>

      {!profile ? (
        <EmptyState
          title="აგენტის პროფილი საჭიროა"
          body="ვიზიტების სანახავად ჯერ უნდა შეიქმნას შენი საჯარო აგენტის პროფილი. მიმართე ადმინისტრაციას."
          actionHref="/agent/profile"
          actionLabel="პროფილის ნახვა"
        />
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 text-[14px] font-extrabold uppercase tracking-wide text-sv-ink/50">
              მომავალი ({upcoming.length})
            </h2>
            {upcoming.length === 0 ? (
              <EmptyState
                title="დაგეგმილი ვიზიტები არ არის"
                body="როცა მყიდველი განცხადების ნახვას დაჯავშნის, ვიზიტი აქ გამოჩნდება."
              />
            ) : (
              <ul className="space-y-3">
                {upcoming.map((tour) => (
                  <TourCard key={tour.id} tour={tour} />
                ))}
              </ul>
            )}
          </section>

          {past.length > 0 ? (
            <section>
              <h2 className="mb-3 text-[14px] font-extrabold uppercase tracking-wide text-sv-ink/50">
                გასული ({past.length})
              </h2>
              <ul className="space-y-3">
                {past.map((tour) => (
                  <TourCard key={tour.id} tour={tour} />
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      )}
    </DashboardShell>
  )
}
