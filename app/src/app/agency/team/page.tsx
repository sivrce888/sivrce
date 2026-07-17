import type { Metadata } from "next"
import { BadgeCheck } from "lucide-react"

import { getAgencyContext } from "@/components/agency-dashboard/data"
import { AGENCY_NAV } from "@/components/agency-dashboard/nav"
import DashboardShell from "@/components/dashboard/DashboardShell"
import EmptyState from "@/components/dashboard/EmptyState"
import { requireRole } from "@/lib/guards"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "სააგენტოს გუნდი",
  robots: { index: false },
}

export default async function AgencyTeamPage() {
  const user = await requireRole("agency", "/agency")
  const { profile, team } = await getAgencyContext(user)

  return (
    <DashboardShell
      nav={AGENCY_NAV}
      title="სააგენტოს პანელი"
      subtitle="გუნდი"
      userLabel={user.name ?? user.email}
    >
      {team.length === 0 ? (
        <EmptyState
          title="აგენტები ჯერ არ არის"
          body={
            profile
              ? `პროფილში მითითებულია გუნდის ზომა: ${profile.teamSize}. აგენტის პროფილი გუნდში გამოჩნდება, როცა მისი agency ველი ემთხვევა სააგენტოს სახელს.`
              : "ჯერ არ არის აგენტების პროფილები დაკავშირებული ამ სააგენტოზე."
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {team.map((agent) => (
            <article
              key={agent.id}
              className="rounded-2xl border border-sv-ink/6 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <span
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-[13px] font-black text-white"
                  style={{ backgroundColor: agent.color || "var(--sv-blue)" }}
                >
                  {agent.avatarText}
                </span>
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 truncate text-[14.5px] font-extrabold text-sv-ink">
                    {agent.name}
                    {agent.verified ? (
                      <BadgeCheck size={15} className="shrink-0 text-sv-blue" aria-label="ვერიფიცირებული" />
                    ) : null}
                  </p>
                  <p className="text-[12px] font-semibold text-sv-ink/50">
                    ★ {agent.rating.toFixed(1)} · {agent.reviewsCount} შეფასება
                  </p>
                </div>
              </div>
              <p className="mt-3 text-[13px] font-black tabular-nums text-sv-ink">
                {agent.listingsCount}{" "}
                <span className="text-[11.5px] font-bold text-sv-ink/45">განცხადება</span>
              </p>
              {agent.languages.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {agent.languages.map((lang) => (
                    <span
                      key={lang}
                      className="rounded-full bg-sv-cloud px-2.5 py-0.5 text-[10.5px] font-bold uppercase text-sv-ink/55"
                    >
                      {lang}
                    </span>
                  ))}
                </div>
              ) : null}
              {agent.specialties.length > 0 ? (
                <p className="mt-2 truncate text-[11.5px] font-medium text-sv-ink/45">
                  {agent.specialties.join(" · ")}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </DashboardShell>
  )
}
