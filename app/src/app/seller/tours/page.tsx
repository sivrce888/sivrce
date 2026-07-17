import type { Metadata } from "next"

import DashboardShell from "@/components/dashboard/DashboardShell"
import EmptyState from "@/components/dashboard/EmptyState"
import TourCard, { tourListingInclude } from "@/components/dashboard/TourCard"
import { sellerNav } from "@/components/seller-dashboard/nav"
import { db } from "@/lib/db"
import { requireRole, safeQuery } from "@/lib/guards"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "ვიზიტები — გამყიდველის პანელი",
  robots: { index: false },
}

export default async function SellerToursPage() {
  const user = await requireRole("seller", "/seller")

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Tours booked on the seller's own listings (agent-hosted or owner-hosted)
  const mine = { listing: { ownerId: user.id, deletedAt: null } } as const
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
      nav={sellerNav}
      title="გამყიდველის პანელი"
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
              body="როცა მყიდველი შენი განცხადების ნახვას დაჯავშნის, ვიზიტი აქ გამოჩნდება."
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
