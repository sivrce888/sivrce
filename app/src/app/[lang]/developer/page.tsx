import type { Metadata } from "next"
import LocalizedLink from "@/components/LocalizedLink"
import { Building2, CheckCircle2, Home, Plus, Star } from "lucide-react"

import DashboardShell from "@/components/dashboard/DashboardShell"
import StatCard from "@/components/dashboard/StatCard"
import EmptyState from "@/components/dashboard/EmptyState"
import { developerNav } from "@/components/developer-dashboard/nav"
import { db } from "@/lib/db"
import { PROJECT_STATUS_KA, isProjectStatus } from "@/lib/developer-project"
import { requireRole, safeQuery } from "@/lib/guards"
import { inquiryWhere } from "@/lib/pro-leads"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "დეველოპერის პანელი",
  robots: { index: false },
}

const fmt = new Intl.NumberFormat("ka-GE")

export default async function DeveloperOverviewPage() {
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
      nav={developerNav}
      title="დეველოპერის პანელი"
      subtitle={profile?.name}
      userLabel={user.name ?? user.email}
    >
      <div className="mb-5 flex flex-wrap justify-end gap-2">
        <LocalizedLink
          href="/developer/projects?new=1"
          className="inline-flex items-center gap-1.5 rounded-full border border-sv-ink/12 bg-sv-surface px-5 py-2.5 text-[13px] font-bold text-sv-ink transition hover:border-sv-blue hover:text-sv-blue"
        >
          <Plus size={15} strokeWidth={2.5} />
          პროექტი
        </LocalizedLink>
        <LocalizedLink
          href="/add-listing?deal=sale&propType=apartment"
          className="inline-flex items-center gap-1.5 rounded-full bg-sv-orange px-5 py-2.5 text-[13px] font-bold text-white shadow-glow-orange transition hover:opacity-95"
        >
          <Plus size={15} strokeWidth={2.5} />
          გასაყიდი ბინა
        </LocalizedLink>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="პროექტები"
          value={profile?.projectsCount ?? projectsCount}
          hint="სულ რეესტრში"
          icon={<Building2 size={18} />}
        />
        <StatCard
          label="დასრულებული"
          value={profile?.completedCount ?? 0}
          hint="ჩაბარებული პროექტი"
          icon={<CheckCircle2 size={18} />}
        />
        <StatCard
          label="რეიტინგი"
          value={profile ? profile.rating.toFixed(1) : "—"}
          hint="კლიენტების შეფასება"
          icon={<Star size={18} />}
        />
        <StatCard
          label="აქტიური განცხადებები"
          value={activeListings}
          hint={`${leadsCount} ლიდი`}
          icon={<Home size={18} />}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section>
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h2 className="text-[18px] font-extrabold tracking-tight text-sv-ink">
              უახლესი პროექტები
            </h2>
            <LocalizedLink
              href="/developer/projects"
              className="text-[12.5px] font-bold text-sv-blue hover:underline"
            >
              ყველა →
            </LocalizedLink>
          </div>

          {projects.length === 0 ? (
            <EmptyState
              title="პროექტები ჯერ არ გაქვს"
              body="დაამატე პროექტი — გამოჩნდება დირექტორიაში. შემდეგ დაამატე გასაყიდი ბინები."
              actionHref="/developer/projects?new=1"
              actionLabel="დაამატე პროექტი"
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
                      {isProjectStatus(p.status) ? PROJECT_STATUS_KA[p.status] : p.status}
                    </span>
                  </div>
                  <p className="mt-1 text-[12.5px] font-medium text-sv-ink/55">
                    {p.city} · {p.district}
                  </p>
                  <div className="mt-3 flex items-baseline justify-between gap-2 text-[12.5px] font-semibold text-sv-ink/70">
                    <span>
                      {p.priceFrom > 0 ? `${fmt.format(p.priceFrom)} ₾-დან` : "ფასი მოთხოვნით"}
                    </span>
                    <span className="text-sv-ink/45">{p.units} ბინა</span>
                  </div>
                </LocalizedLink>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-card border border-sv-ink/6 bg-sv-surface p-5 shadow-card">
          <h2 className="mb-4 text-[15px] font-extrabold text-sv-ink">სწრაფი ქმედებები</h2>
          <div className="flex flex-col gap-3">
            <LocalizedLink
              href="/developer/projects?new=1"
              className="rounded-full bg-sv-orange px-5 py-3.5 text-center text-[14px] font-bold text-white shadow-glow-orange transition hover:opacity-95"
            >
              + ახალი პროექტი
            </LocalizedLink>
            <LocalizedLink
              href="/add-listing?deal=sale&propType=apartment"
              className="rounded-full border border-sv-ink/12 bg-sv-surface px-5 py-3.5 text-center text-[14px] font-bold text-sv-ink transition hover:border-sv-blue hover:text-sv-blue"
            >
              + გასაყიდი ბინა
            </LocalizedLink>
            <LocalizedLink
              href="/developer/listings"
              className="rounded-full border border-sv-ink/12 bg-sv-surface px-5 py-3.5 text-center text-[14px] font-bold text-sv-ink transition hover:border-sv-blue hover:text-sv-blue"
            >
              განცხადებების მართვა
            </LocalizedLink>
            <LocalizedLink
              href="/developer/leads"
              className="rounded-full border border-sv-ink/12 bg-sv-surface px-5 py-3.5 text-center text-[14px] font-bold text-sv-ink transition hover:border-sv-blue hover:text-sv-blue"
            >
              ლიდები
            </LocalizedLink>
            <LocalizedLink
              href="/developer/profile"
              className="rounded-full border border-sv-ink/12 bg-sv-surface px-5 py-3.5 text-center text-[14px] font-bold text-sv-ink transition hover:border-sv-blue hover:text-sv-blue"
            >
              კომპანიის პროფილი
            </LocalizedLink>
          </div>
        </section>
      </div>
    </DashboardShell>
  )
}
