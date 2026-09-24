import type { Metadata } from "next"

import DashboardShell from "@/components/dashboard/DashboardShell"
import EmptyState from "@/components/dashboard/EmptyState"
import TourCard, { tourListingInclude } from "@/components/dashboard/TourCard"
import { sellerNav } from "@/components/seller-dashboard/nav"
import { db } from "@/lib/db"
import { requireRole, safeQuery } from "@/lib/guards"
import { panelTitle } from "@/lib/workspace"
import { readPersona } from "@/lib/workspace-cookie"
import { isValidLang, panelLang } from "@/lib/i18n/core"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "ვიზიტები — გამყიდველის პანელი",
  robots: { index: false },
}

const L = {
  ka: {
    title: "ვიზიტები",
    upcoming: "მომავალი",
    past: "გასული",
    emptyTitle: "დაგეგმილი ვიზიტები არ არის",
    emptyBody: "როცა მყიდველი შენი განცხადების ნახვას დაჯავშნავს, ვიზიტი აქ გამოჩნდება.",
  },
  en: {
    title: "Tours",
    upcoming: "Upcoming",
    past: "Past",
    emptyTitle: "No tours scheduled",
    emptyBody: "When a buyer books a viewing of your listing, the tour will appear here.",
  },
  de: {
    title: "Besichtigungen",
    upcoming: "Anstehend",
    past: "Vergangene",
    emptyTitle: "Keine Besichtigungen geplant",
    emptyBody: "Sobald ein Käufer eine Besichtigung Ihres Inserats bucht, erscheint sie hier.",
  },
} as const

export default async function SellerToursPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params
  const lang = isValidLang(raw) ? raw : "ka"
  const c = L[panelLang(lang)]
  const user = await requireRole("seller", "/seller")
  const persona = await readPersona(user.role)

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
      nav={sellerNav(lang)}
      title={panelTitle(persona, lang)}
      subtitle={c.title}
      userLabel={user.name ?? user.email}
    >
      <h1 className="mb-5 text-xl font-black tracking-tight text-sv-ink">{c.title}</h1>

      <div className="space-y-8">
        <section>
          <h2 className="mb-3 text-[14px] font-extrabold uppercase tracking-wide text-sv-ink/60">
            {c.upcoming} ({upcoming.length})
          </h2>
          {upcoming.length === 0 ? (
            <EmptyState title={c.emptyTitle} body={c.emptyBody} />
          ) : (
            <ul className="space-y-3">
              {upcoming.map((tour) => (
                <TourCard key={tour.id} tour={tour} lang={lang} />
              ))}
            </ul>
          )}
        </section>

        {past.length > 0 ? (
          <section>
            <h2 className="mb-3 text-[14px] font-extrabold uppercase tracking-wide text-sv-ink/60">
              {c.past} ({past.length})
            </h2>
            <ul className="space-y-3">
              {past.map((tour) => (
                <TourCard key={tour.id} tour={tour} lang={lang} />
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </DashboardShell>
  )
}
