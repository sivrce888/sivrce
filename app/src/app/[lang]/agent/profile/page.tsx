import type { Metadata } from "next"
import { BadgeCheck, Star } from "lucide-react"

import DashboardShell from "@/components/dashboard/DashboardShell"
import EmptyState from "@/components/dashboard/EmptyState"
import StatCard from "@/components/dashboard/StatCard"
import { agentNav } from "@/components/agent-dashboard/nav"
import { db } from "@/lib/db"
import { requireRole, safeQuery } from "@/lib/guards"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "პროფილი — აგენტის პანელი",
  robots: { index: false },
}

export default async function AgentProfilePage() {
  const user = await requireRole("agent", "/agent")

  const profile = await safeQuery(
    () => db.agentProfile.findFirst({ where: { ownerId: user.id, deletedAt: null } }),
    null,
  )

  return (
    <DashboardShell
      nav={agentNav}
      title="აგენტის პანელი"
      subtitle="პროფილი"
      userLabel={user.name ?? user.email}
    >
      <h1 className="mb-5 text-xl font-black tracking-tight text-sv-ink">ჩემი პროფილი</h1>

      {!profile ? (
        <EmptyState
          title="აგენტის პროფილი ჯერ არ არის შექმნილი"
          body="შენი ანგარიში აგენტის როლით არის დარეგისტრირებული, მაგრამ საჯარო აგენტის პროფილი ჯერ არ შექმნილა. მიმართე ადმინისტრაციას, რომ პროფილი გააქტიურდეს — მასზე მიბმულია ვიზიტები, შეფასებები და საჯარო გვერდი."
          actionHref="/contact"
          actionLabel="დაგვიკავშირდი"
        />
      ) : (
        <div className="space-y-6">
          <section className="rounded-2xl border border-sv-ink/6 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center gap-4">
              <span
                className="flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-black text-white"
                style={{ backgroundColor: profile.color }}
              >
                {profile.avatarText}
              </span>
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-[18px] font-black text-sv-ink">
                  {profile.name}
                  {profile.verified ? (
                    <BadgeCheck size={18} className="text-sv-blue" aria-label="ვერიფიცირებული" />
                  ) : null}
                </p>
                <p className="text-[13px] font-semibold text-sv-ink/55">{profile.agency}</p>
                {profile.rating > 0 ? (
                  <p className="mt-1 inline-flex items-center gap-1 text-[12.5px] font-bold text-sv-ink/70">
                    <Star size={13} className="fill-sv-orange text-sv-orange" />
                    {profile.rating.toFixed(1)} · {profile.reviewsCount} შეფასება
                  </p>
                ) : null}
              </div>
            </div>

            {profile.languages.length > 0 || profile.specialties.length > 0 ? (
              <div className="mt-5 flex flex-wrap gap-2 border-t border-sv-ink/6 pt-5">
                {profile.languages.map((lang) => (
                  <span
                    key={`lang-${lang}`}
                    className="rounded-full bg-sv-cloud px-3 py-1.5 text-[11.5px] font-bold text-sv-ink/65"
                  >
                    {lang}
                  </span>
                ))}
                {profile.specialties.map((spec) => (
                  <span
                    key={`spec-${spec}`}
                    className="rounded-full bg-sv-blue/10 px-3 py-1.5 text-[11.5px] font-bold text-sv-blue"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            ) : null}
          </section>

          <div className="grid grid-cols-3 gap-4">
            <StatCard label="განცხადებები" value={profile.listingsCount} />
            <StatCard
              label="რეიტინგი"
              value={profile.rating ? profile.rating.toFixed(1) : "—"}
            />
            <StatCard label="შეფასებები" value={profile.reviewsCount} />
          </div>
        </div>
      )}
    </DashboardShell>
  )
}
