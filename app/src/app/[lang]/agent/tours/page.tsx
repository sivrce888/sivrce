import type { Metadata } from "next"

import DashboardShell from "@/components/dashboard/DashboardShell"
import EmptyState from "@/components/dashboard/EmptyState"
import TourCard, { tourListingInclude } from "@/components/dashboard/TourCard"
import { agentNav } from "@/components/agent-dashboard/nav"
import { db } from "@/lib/db"
import { requireRole, safeQuery } from "@/lib/guards"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "ვიზიტები — აგენტის პანელი",
  robots: { index: false },
}

export default async function AgentToursPage() {
  const user = await requireRole("agent", "/agent")

  const profile = await safeQuery(
    () => db.agentProfile.findFirst({ where: { ownerId: user.id, deletedAt: null } }),
    null,
  )

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const include = tourListingInclude

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
