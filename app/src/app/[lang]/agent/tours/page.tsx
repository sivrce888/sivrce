import type { Metadata } from "next"

import DashboardShell from "@/components/dashboard/DashboardShell"
import EmptyState from "@/components/dashboard/EmptyState"
import TourCard, { tourListingInclude, type TourWithListing } from "@/components/dashboard/TourCard"
import { agentNav } from "@/components/agent-dashboard/nav"
import { db } from "@/lib/db"
import { requireRole, safeQuery } from "@/lib/guards"
import { isValidLang, panelLang } from "@/lib/i18n/core"
import type { Prisma } from "@/generated/prisma/client"

export const dynamic = "force-dynamic"

const L = {
  ka: {
    metaTitle: "ვიზიტები — აგენტის პანელი",
    title: "აგენტის პანელი",
    subtitle: "ვიზიტები",
    h1: "ვიზიტები",
    noProfileTitle: "აგენტის პროფილი ჯერ არ გაქვს",
    noProfileBody:
      "საჯარო პროფილი კლიენტებს ეხმარება შენს პოვნაში. ვიზიტები მაინც ჩანს შენს განცხადებებზე.",
    fillProfile: "პროფილის შევსება",
    upcoming: (n: number) => `მომავალი (${n})`,
    past: (n: number) => `გასული (${n})`,
    noToursTitle: "დაგეგმილი ვიზიტები არ არის",
    noToursBody: "როცა მყიდველი განცხადების ნახვას დაჯავშნავს, ვიზიტი აქ გამოჩნდება.",
  },
  en: {
    metaTitle: "Tours — Agent dashboard",
    title: "Agent dashboard",
    subtitle: "Tours",
    h1: "Tours",
    noProfileTitle: "You don't have an agent profile yet",
    noProfileBody:
      "A public profile helps clients find you. Tours on your listings are still visible.",
    fillProfile: "Complete profile",
    upcoming: (n: number) => `Upcoming (${n})`,
    past: (n: number) => `Past (${n})`,
    noToursTitle: "No tours scheduled",
    noToursBody: "When a buyer books a viewing of a listing, the tour will appear here.",
  },
  de: {
    metaTitle: "Besichtigungen — Agenten-Dashboard",
    title: "Agenten-Dashboard",
    subtitle: "Besichtigungen",
    h1: "Besichtigungen",
    noProfileTitle: "Du hast noch kein Agentenprofil",
    noProfileBody:
      "Ein öffentliches Profil hilft Kunden, dich zu finden. Besichtigungen deiner Inserate bleiben trotzdem sichtbar.",
    fillProfile: "Profil vervollständigen",
    upcoming: (n: number) => `Anstehende (${n})`,
    past: (n: number) => `Vergangene (${n})`,
    noToursTitle: "Keine Besichtigungen geplant",
    noToursBody: "Sobald ein Käufer eine Besichtigung bucht, erscheint sie hier.",
  },
} as const
type Loc = keyof typeof L

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang: raw } = await params
  const loc: Loc = panelLang(raw)
  return { title: L[loc].metaTitle, robots: { index: false } }
}

export default async function AgentToursPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params
  const lang = isValidLang(raw) ? raw : "ka"
  const loc = panelLang(lang)
  const T = L[loc]
  const user = await requireRole("agent", "/agent")

  const profile = await safeQuery(
    () => db.agentProfile.findFirst({ where: { ownerId: user.id, deletedAt: null } }),
    null,
  )

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const include = tourListingInclude
  const none: TourWithListing[] = []
  const mine: Prisma.PropertyTourWhereInput = {
    OR: [
      ...(profile ? [{ agentId: profile.id }] : []),
      { listing: { ownerId: user.id, deletedAt: null } },
    ],
  }

  const [upcoming, past] = await Promise.all([
        safeQuery(
          () =>
            db.propertyTour.findMany({
              where: {
                AND: [mine, { tourDate: { gte: today }, status: { in: ["pending", "confirmed"] } }],
              },
              orderBy: [{ tourDate: "asc" }, { tourTime: "asc" }],
              include,
            }),
          none,
        ),
        safeQuery(
          () =>
            db.propertyTour.findMany({
              where: {
                AND: [
                  mine,
                  {
                    OR: [
                      { tourDate: { lt: today } },
                      { status: { in: ["cancelled_by_guest", "cancelled_by_agent", "completed", "no_show"] } },
                    ],
                  },
                ],
              },
              orderBy: [{ tourDate: "desc" }, { tourTime: "desc" }],
              take: 20,
              include,
            }),
          none,
        ),
      ])

  return (
    <DashboardShell
      nav={agentNav(lang)}
      title={T.title}
      subtitle={T.subtitle}
      userLabel={user.name ?? user.email}
    >
      <h1 className="mb-5 text-xl font-black tracking-tight text-sv-ink">{T.h1}</h1>

      {!profile ? (
        <div className="mb-6">
          <EmptyState
            title={T.noProfileTitle}
            body={T.noProfileBody}
            actionHref="/agent/profile"
            actionLabel={T.fillProfile}
          />
        </div>
      ) : null}

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
