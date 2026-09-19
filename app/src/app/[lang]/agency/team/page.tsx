import type { Metadata } from "next"
import LocalizedLink from "@/components/LocalizedLink"
import { BadgeCheck, Star } from "lucide-react"

import { getAgencyContext } from "@/components/agency-dashboard/data"
import { AGENCY_NAV } from "@/components/agency-dashboard/nav"
import DashboardShell from "@/components/dashboard/DashboardShell"
import EmptyState from "@/components/dashboard/EmptyState"
import UserAvatar from "@/components/UserAvatar"
import { requireRole } from "@/lib/guards"
import { isValidLang } from "@/lib/i18n/core"

export const dynamic = "force-dynamic"

const L = {
  ka: {
    metaTitle: "სააგენტოს გუნდი",
    title: "სააგენტოს პანელი",
    subtitle: "გუნდი",
    emptyTitle: "აგენტები ჯერ არ არის",
    teamSizeNote: (n: number) =>
      `პროფილში მითითებულია გუნდის ზომა: ${n}. აგენტის პროფილი გუნდში გამოჩნდება, როცა მისი სააგენტო ემთხვევა ამ სააგენტოს სახელს.`,
    noAgents: "ჯერ არ არის ამ სააგენტოსთან დაკავშირებული აგენტების პროფილები.",
    verified: "ვერიფიცირებული",
    reviewsWord: "შეფასება",
    listingsWord: "განცხადება",
    publicProfile: "საჯარო პროფილი →",
  },
  en: {
    metaTitle: "Agency team",
    title: "Agency dashboard",
    subtitle: "Team",
    emptyTitle: "No agents yet",
    teamSizeNote: (n: number) =>
      `Team size listed in the profile: ${n}. An agent's profile appears on the team when their agency matches this agency's name.`,
    noAgents: "No agent profiles are linked to this agency yet.",
    verified: "Verified",
    reviewsWord: "reviews",
    listingsWord: "listings",
    publicProfile: "Public profile →",
  },
  de: {
    metaTitle: "Agentur-Team",
    title: "Agentur-Dashboard",
    subtitle: "Team",
    emptyTitle: "Noch keine Agenten",
    teamSizeNote: (n: number) =>
      `Im Profil ist eine Teamgröße von ${n} hinterlegt. Das Profil eines Agenten erscheint im Team, wenn seine Agentur zum Namen dieser Agentur passt.`,
    noAgents: "Mit dieser Agentur sind noch keine Agentenprofile verknüpft.",
    verified: "Verifiziert",
    reviewsWord: "Bewertungen",
    listingsWord: "Inserate",
    publicProfile: "Öffentliches Profil →",
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

export default async function AgencyTeamPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params
  const lang = isValidLang(raw) ? raw : "ka"
  const loc = lang === "en" ? "en" : lang === "de" ? "de" : "ka"
  const T = L[loc]
  const user = await requireRole("agency", "/agency")
  const { profile, team } = await getAgencyContext(user)

  return (
    <DashboardShell
      nav={AGENCY_NAV(lang)}
      title={T.title}
      subtitle={T.subtitle}
      userLabel={user.name ?? user.email}
    >
      {team.length === 0 ? (
        <EmptyState
          title={T.emptyTitle}
          body={profile ? T.teamSizeNote(profile.teamSize) : T.noAgents}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {team.map((agent) => (
            <article
              key={agent.id}
              className="rounded-card border border-sv-ink/[0.06] bg-sv-surface p-5 shadow-card"
            >
              <div className="flex items-center gap-3">
                <UserAvatar name={agent.name} label={agent.avatarText} size={48} />
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 truncate text-[14.5px] font-extrabold text-sv-ink">
                    {agent.name}
                    {agent.verified ? (
                      <BadgeCheck size={15} className="shrink-0 text-sv-blue" aria-label={T.verified} />
                    ) : null}
                  </p>
                  <p className="text-[12px] font-semibold text-sv-ink/60">
                    <Star size={12} className="mr-0.5 inline -translate-y-px text-sv-blue" aria-hidden />
                    {agent.rating.toFixed(1)} · {agent.reviewsCount} {T.reviewsWord}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-[13px] font-black tabular-nums text-sv-ink">
                {agent.listingsCount}{" "}
                <span className="text-[11.5px] font-bold text-sv-ink/60">{T.listingsWord}</span>
              </p>
              {agent.languages.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {agent.languages.map((lang) => (
                    <span
                      key={lang}
                      className="rounded-full bg-sv-cloud px-2.5 py-0.5 text-[10.5px] font-bold uppercase text-sv-ink/60"
                    >
                      {lang}
                    </span>
                  ))}
                </div>
              ) : null}
              {agent.specialties.length > 0 ? (
                <p className="mt-2 truncate text-[11.5px] font-medium text-sv-ink/60">
                  {agent.specialties.join(" · ")}
                </p>
              ) : null}
              {agent.ownerId ? (
                <LocalizedLink
                  href={`/u/${agent.ownerId}`}
                  className="mt-3 inline-block text-[12px] font-bold text-sv-blue hover:underline"
                >
                  {T.publicProfile}
                </LocalizedLink>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </DashboardShell>
  )
}
