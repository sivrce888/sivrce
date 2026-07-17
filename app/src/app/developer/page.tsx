import type { Metadata } from "next"
import Link from "next/link"
import { Building2, CheckCircle2, Home, Star } from "lucide-react"

import DashboardShell from "@/components/dashboard/DashboardShell"
import StatCard from "@/components/dashboard/StatCard"
import EmptyState from "@/components/dashboard/EmptyState"
import { developerNav } from "@/components/developer-dashboard/nav"
import { db } from "@/lib/db"
import { requireRole, safeQuery } from "@/lib/guards"

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

  const [projectsCount, projects, activeListings] = await Promise.all([
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
        db.listing.count({
          where: { ownerId: user.id, status: "active", deletedAt: null },
        }),
      0,
    ),
  ])

  return (
    <DashboardShell
      nav={developerNav}
      title="დეველოპერის პანელი"
      subtitle={profile?.name}
      userLabel={user.name ?? user.email}
    >
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
          hint="იყიდება ახლა"
          icon={<Home size={18} />}
        />
      </div>

      <section className="mt-8">
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <h2 className="text-[18px] font-extrabold tracking-tight text-sv-ink">
            უახლესი პროექტები
          </h2>
          <Link
            href="/developer/projects"
            className="text-[12.5px] font-bold text-sv-blue hover:underline"
          >
            ყველა პროექტი →
          </Link>
        </div>

        {projects.length === 0 ? (
          <EmptyState
            title="პროექტები ჯერ არ გაქვს"
            body="როცა შენი პროექტები რეესტრში დაემატება, აქ გამოჩნდება მათი მიმოხილვა."
            actionHref="/developer/projects"
            actionLabel="პროექტების გვერდი"
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {projects.map((p) => (
              <div
                key={p.id}
                className="rounded-2xl border border-sv-ink/6 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[15px] font-extrabold text-sv-ink">{p.name}</p>
                  <span className="shrink-0 rounded-full bg-sv-blue/8 px-2.5 py-1 text-[11px] font-bold text-sv-blue">
                    {p.status}
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
              </div>
            ))}
          </div>
        )}
      </section>
    </DashboardShell>
  )
}
