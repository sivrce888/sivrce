import type { Metadata } from "next"

import DashboardShell from "@/components/dashboard/DashboardShell"
import EmptyState from "@/components/dashboard/EmptyState"
import TourCard, { tourListingInclude } from "@/components/dashboard/TourCard"
import { developerNav } from "@/components/developer-dashboard/nav"
import { db } from "@/lib/db"
import { requireRole, safeQuery } from "@/lib/guards"
import { isValidLang } from "@/lib/i18n/core"

export const dynamic = "force-dynamic"

const L = {
  ka: {
    metaTitle: "ვიზიტები — დეველოპერი",
    title: "დეველოპერის პანელი",
    subtitle: "ვიზიტები",
    h1: "ვიზიტები",
    upcoming: (n: number) => `მომავალი (${n})`,
    past: (n: number) => `გასული (${n})`,
    noToursTitle: "დაგეგმილი ვიზიტები არ არის",
    noToursBody: "როცა მყიდველი შენი ბინის ნახვას დაჯავშნავს, ვიზიტი აქ გამოჩნდება.",
  },
  en: {
    metaTitle: "Tours — Developer",
    title: "Developer dashboard",
    subtitle: "Tours",
    h1: "Tours",
    upcoming: (n: number) => `Upcoming (${n})`,
    past: (n: number) => `Past (${n})`,
    noToursTitle: "No tours scheduled",
    noToursBody: "When a buyer books a viewing of your apartment, the tour will appear here.",
  },
  de: {
    metaTitle: "Besichtigungen — Developer",
    title: "Developer-Dashboard",
    subtitle: "Besichtigungen",
    h1: "Besichtigungen",
    upcoming: (n: number) => `Anstehende (${n})`,
    past: (n: number) => `Vergangene (${n})`,
    noToursTitle: "Keine Besichtigungen geplant",
    noToursBody: "Wenn ein Käufer eine Besichtigung deiner Wohnung bucht, erscheint sie hier.",
  },
} as const
type Loc = keyof typeof L

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang: raw } = await params
  const loc: Loc = raw === "en" ? "en" : raw === "de" ? "de" : "ka"
  return { title: L[loc].metaTitle, robots: { index: false } }
}

export default async function DeveloperToursPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params
  const lang = isValidLang(raw) ? raw : "ka"
  const loc = lang === "en" ? "en" : lang === "de" ? "de" : "ka"
  const T = L[loc]
  const user = await requireRole("developer", "/developer")

  const today = new Date()
  today.setHours(0, 0, 0, 0)
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
      nav={developerNav(lang)}
      title={T.title}
      subtitle={T.subtitle}
      userLabel={user.name ?? user.email}
    >
      <h1 className="mb-5 text-xl font-black tracking-tight text-sv-ink">{T.h1}</h1>
      <div className="space-y-8">
        <section>
          <h2 className="mb-3 text-[14px] font-extrabold uppercase tracking-wide text-sv-ink/60">
            {T.upcoming(upcoming.length)}
          </h2>
          {upcoming.length === 0 ? (
            <EmptyState title={T.noToursTitle} body={T.noToursBody} />
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
              {T.past(past.length)}
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
