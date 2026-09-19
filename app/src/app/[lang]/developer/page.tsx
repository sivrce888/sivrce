import type { Metadata } from "next"
import LocalizedLink from "@/components/LocalizedLink"
import { Building2, CheckCircle2, Home, Plus, Star } from "lucide-react"

import DashboardShell from "@/components/dashboard/DashboardShell"
import StatCard from "@/components/dashboard/StatCard"
import EmptyState from "@/components/dashboard/EmptyState"
import { developerNav } from "@/components/developer-dashboard/nav"
import { fmtNum, projectStatusLabel } from "@/components/agent-dashboard/format"
import { db } from "@/lib/db"
import { isProjectStatus } from "@/lib/developer-project"
import { requireRole, safeQuery } from "@/lib/guards"
import { inquiryWhere } from "@/lib/pro-leads"
import { isValidLang } from "@/lib/i18n/core"

export const dynamic = "force-dynamic"

const L = {
  ka: {
    metaTitle: "დეველოპერის პანელი",
    title: "დეველოპერის პანელი",
    addProject: "დაამატე პროექტი",
    addApartment: "გასაყიდი ბინა",
    projects: "პროექტები",
    totalInRegistry: "სულ რეესტრში",
    completed: "დასრულებული",
    delivered: "ჩაბარებული პროექტი",
    rating: "რეიტინგი",
    clientRatings: "კლიენტების შეფასება",
    activeListings: "აქტიური განცხადებები",
    leadsCount: (n: number) => `${n} ლიდი`,
    latestProjects: "უახლესი პროექტები",
    all: "ყველა →",
    noProjectsTitle: "პროექტები ჯერ არ გაქვს",
    noProjectsBody: "დაამატე პროექტი — გამოჩნდება დირექტორიაში. შემდეგ დაამატე გასაყიდი ბინები.",
    priceFrom: (n: number) => `${fmtNum(n, "ka")} ₾-დან`,
    priceOnRequest: "ფასი მოთხოვნით",
    units: (n: number) => `${n} ბინა`,
    quickActions: "სწრაფი ქმედებები",
    newProject: "+ ახალი პროექტი",
    newApartment: "+ გასაყიდი ბინა",
    manageListings: "განცხადებების მართვა",
    leads: "ლიდები",
    companyProfile: "კომპანიის პროფილი",
  },
  en: {
    metaTitle: "Developer dashboard",
    title: "Developer dashboard",
    addProject: "Add project",
    addApartment: "Apartment for sale",
    projects: "Projects",
    totalInRegistry: "total in registry",
    completed: "Completed",
    delivered: "delivered projects",
    rating: "Rating",
    clientRatings: "client ratings",
    activeListings: "Active listings",
    leadsCount: (n: number) => `${n} leads`,
    latestProjects: "Latest projects",
    all: "All →",
    noProjectsTitle: "No projects yet",
    noProjectsBody: "Add a project — it will appear in the directory. Then add apartments for sale.",
    priceFrom: (n: number) => `from ₾${fmtNum(n, "en")}`,
    priceOnRequest: "Price on request",
    units: (n: number) => `${n} units`,
    quickActions: "Quick actions",
    newProject: "+ New project",
    newApartment: "+ Apartment for sale",
    manageListings: "Manage listings",
    leads: "Leads",
    companyProfile: "Company profile",
  },
  de: {
    metaTitle: "Developer-Dashboard",
    title: "Developer-Dashboard",
    addProject: "Projekt hinzufügen",
    addApartment: "Wohnung zum Verkauf",
    projects: "Projekte",
    totalInRegistry: "gesamt im Verzeichnis",
    completed: "Fertiggestellt",
    delivered: "übergebene Projekte",
    rating: "Bewertung",
    clientRatings: "Kundenbewertungen",
    activeListings: "Aktive Inserate",
    leadsCount: (n: number) => `${n} Leads`,
    latestProjects: "Neueste Projekte",
    all: "Alle →",
    noProjectsTitle: "Noch keine Projekte",
    noProjectsBody:
      "Füge ein Projekt hinzu — es erscheint im Verzeichnis. Lege danach Wohnungen zum Verkauf an.",
    priceFrom: (n: number) => `ab ${fmtNum(n, "de")} ₾`,
    priceOnRequest: "Preis auf Anfrage",
    units: (n: number) => `${n} Wohnungen`,
    quickActions: "Schnellaktionen",
    newProject: "+ Neues Projekt",
    newApartment: "+ Wohnung zum Verkauf",
    manageListings: "Inserate verwalten",
    leads: "Leads",
    companyProfile: "Firmenprofil",
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

export default async function DeveloperOverviewPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params
  const lang = isValidLang(raw) ? raw : "ka"
  const loc = lang === "en" ? "en" : lang === "de" ? "de" : "ka"
  const T = L[loc]
  const user = await requireRole("developer", "/developer")

  const profile = await safeQuery(
    () =>
      db.developerProfile.findFirst({
        where: { ownerId: user.id, deletedAt: null },
      }),
    null,
  )

  const projectWhere = {
    deletedAt: null,
    OR: [
      { ownerId: user.id },
      ...(profile ? [{ developer: profile.name }] : []),
    ],
  }

  const [projectsCount, projects, listings] = await Promise.all([
    safeQuery(() => db.projectDirectory.count({ where: projectWhere }), 0),
    safeQuery(
      () =>
        db.projectDirectory.findMany({
          where: projectWhere,
          orderBy: { createdAt: "desc" },
          take: 6,
        }),
      [],
    ),
    safeQuery(
      () =>
        db.listing.findMany({
          where: { ownerId: user.id, deletedAt: null },
          select: { id: true, status: true },
        }),
      [],
    ),
  ])

  const listingIds = listings.map((l) => l.id)
  const leadsCount = await safeQuery(
    () => db.inquiry.count({ where: inquiryWhere(listingIds, user.email) }),
    0,
  )

  const activeListings = listings.filter((l) => l.status === "active").length

  return (
    <DashboardShell
      nav={developerNav(lang)}
      title={T.title}
      subtitle={profile?.name}
      userLabel={user.name ?? user.email}
    >
      <div className="mb-5 flex flex-wrap justify-end gap-2">
        <LocalizedLink
          href="/developer/projects?new=1"
          className="inline-flex items-center gap-1.5 rounded-full border border-sv-ink/12 bg-sv-surface px-5 py-2.5 text-[13px] font-bold text-sv-ink transition hover:border-sv-blue hover:text-sv-blue"
        >
          <Plus size={15} strokeWidth={2.5} />
          {T.addProject}
        </LocalizedLink>
        <LocalizedLink
          href="/add-listing?deal=sale&propType=apartment"
          className="inline-flex items-center gap-1.5 rounded-full bg-sv-orange px-5 py-2.5 text-[13px] font-bold text-sv-ink shadow-glow-orange transition hover:opacity-95"
        >
          <Plus size={15} strokeWidth={2.5} />
          {T.addApartment}
        </LocalizedLink>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={T.projects}
          value={profile?.projectsCount ?? projectsCount}
          hint={T.totalInRegistry}
          icon={<Building2 size={18} />}
        />
        <StatCard
          label={T.completed}
          value={profile?.completedCount ?? 0}
          hint={T.delivered}
          icon={<CheckCircle2 size={18} />}
        />
        <StatCard
          label={T.rating}
          value={profile ? profile.rating.toFixed(1) : "—"}
          hint={T.clientRatings}
          icon={<Star size={18} />}
        />
        <StatCard
          label={T.activeListings}
          value={activeListings}
          hint={T.leadsCount(leadsCount)}
          icon={<Home size={18} />}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section>
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h2 className="text-[18px] font-extrabold tracking-tight text-sv-ink">
              {T.latestProjects}
            </h2>
            <LocalizedLink
              href="/developer/projects"
              className="text-[12.5px] font-bold text-sv-blue hover:underline"
            >
              {T.all}
            </LocalizedLink>
          </div>

          {projects.length === 0 ? (
            <EmptyState
              title={T.noProjectsTitle}
              body={T.noProjectsBody}
              actionHref="/developer/projects?new=1"
              actionLabel={T.addProject}
            />
          ) : (
            <div className="grid gap-4">
              {projects.map((p) => (
                <LocalizedLink
                  key={p.id}
                  href={`/developer/projects?edit=${encodeURIComponent(p.id)}`}
                  className="rounded-card border border-sv-ink/6 bg-sv-surface p-5 shadow-card transition hover:border-sv-blue/25"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-[15px] font-extrabold text-sv-ink">{p.name}</p>
                    <span className="shrink-0 rounded-full bg-sv-blue/8 px-2.5 py-1 text-[11px] font-bold text-sv-blue">
                      {isProjectStatus(p.status) ? projectStatusLabel(lang)[p.status] : p.status}
                    </span>
                  </div>
                  <p className="mt-1 text-[12.5px] font-medium text-sv-ink/60">
                    {p.city} · {p.district}
                  </p>
                  <div className="mt-3 flex items-baseline justify-between gap-2 text-[12.5px] font-semibold text-sv-ink/70">
                    <span>
                      {p.priceFrom > 0 ? T.priceFrom(p.priceFrom) : T.priceOnRequest}
                    </span>
                    <span className="text-sv-ink/60">{T.units(p.units)}</span>
                  </div>
                </LocalizedLink>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-card border border-sv-ink/6 bg-sv-surface p-5 shadow-card">
          <h2 className="mb-4 text-[15px] font-extrabold text-sv-ink">{T.quickActions}</h2>
          <div className="flex flex-col gap-3">
            <LocalizedLink
              href="/developer/projects?new=1"
              className="rounded-full bg-sv-orange px-5 py-3.5 text-center text-[14px] font-bold text-sv-ink shadow-glow-orange transition hover:opacity-95"
            >
              {T.newProject}
            </LocalizedLink>
            <LocalizedLink
              href="/add-listing?deal=sale&propType=apartment"
              className="rounded-full border border-sv-ink/12 bg-sv-surface px-5 py-3.5 text-center text-[14px] font-bold text-sv-ink transition hover:border-sv-blue hover:text-sv-blue"
            >
              {T.newApartment}
            </LocalizedLink>
            <LocalizedLink
              href="/developer/listings"
              className="rounded-full border border-sv-ink/12 bg-sv-surface px-5 py-3.5 text-center text-[14px] font-bold text-sv-ink transition hover:border-sv-blue hover:text-sv-blue"
            >
              {T.manageListings}
            </LocalizedLink>
            <LocalizedLink
              href="/developer/leads"
              className="rounded-full border border-sv-ink/12 bg-sv-surface px-5 py-3.5 text-center text-[14px] font-bold text-sv-ink transition hover:border-sv-blue hover:text-sv-blue"
            >
              {T.leads}
            </LocalizedLink>
            <LocalizedLink
              href="/developer/profile"
              className="rounded-full border border-sv-ink/12 bg-sv-surface px-5 py-3.5 text-center text-[14px] font-bold text-sv-ink transition hover:border-sv-blue hover:text-sv-blue"
            >
              {T.companyProfile}
            </LocalizedLink>
          </div>
        </section>
      </div>
    </DashboardShell>
  )
}
