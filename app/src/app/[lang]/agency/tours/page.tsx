import type { Metadata } from "next"

import { getAgencyContext } from "@/components/agency-dashboard/data"
import { AGENCY_NAV } from "@/components/agency-dashboard/nav"
import DashboardShell from "@/components/dashboard/DashboardShell"
import EmptyState from "@/components/dashboard/EmptyState"
import TourCard, { tourListingInclude } from "@/components/dashboard/TourCard"
import { db } from "@/lib/db"
import { requireRole, safeQuery } from "@/lib/guards"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "ვიზიტები — სააგენტო",
  robots: { index: false },
}

export default async function AgencyToursPage() {
  const user = await requireRole("agency", "/agency")
  const { ownerIds } = await getAgencyContext(user)

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const mine = { listing: { ownerId: { in: ownerIds }, deletedAt: null } } as const
  const include = tourListingInclude

  const [upcoming, past] = await Promise.all([
    safeQuery(
      () =>
        db.propertyTour.findMany({
          where: { ...mine, tourDate: { gte: today }, status: { in: ["pending", "confirmed"] } },
          orderBy: [{ tourDate: "asc" }, { tourTime: "asc" }],
          include,
        }),
      [],
    ),
    safeQuery(
      () =>
        db.propertyTour.findMany({
          where: {
            ...mine,
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

  return (
    <DashboardShell
      nav={AGENCY_NAV}
      title="სააგენტოს პანელი"
      subtitle="ვიზიტები"
      userLabel={user.name ?? user.email}
    >
      <h1 className="mb-5 text-xl font-black tracking-tight text-sv-ink">ვიზიტები</h1>
      <div className="space-y-8">
        <section>
          <h2 className="mb-3 text-[14px] font-extrabold uppercase tracking-wide text-sv-ink/50">
            მომავალი ({upcoming.length})
          </h2>
          {upcoming.length === 0 ? (
            <EmptyState
              title="დაგეგმილი ვიზიტები არ არის"
              body="გუნდის განცხადებებზე დაჯავშნილი ვიზიტები აქ გამოჩნდება."
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
    </DashboardShell>
  )
}
