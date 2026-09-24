import type { Metadata } from "next"
import LocalizedLink from "@/components/LocalizedLink"
import { BadgeCheck, ExternalLink, Star } from "lucide-react"

import { saveAgentProfile } from "@/app/[lang]/agent/profile/actions"
import DashboardShell from "@/components/dashboard/DashboardShell"
import EmptyState from "@/components/dashboard/EmptyState"
import StatCard from "@/components/dashboard/StatCard"
import { RequestVerification } from "@/components/dashboard/RequestVerification"
import OwnerReviews from "@/components/reviews/OwnerReviews"
import UserAvatar from "@/components/UserAvatar"
import { agentNav } from "@/components/agent-dashboard/nav"
import { db } from "@/lib/db"
import { requireRole, safeQuery } from "@/lib/guards"
import { isValidLang, panelLang } from "@/lib/i18n/core"

export const dynamic = "force-dynamic"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang: raw } = await params
  const c = L[panelLang(raw)]
  return { title: `${c.shellSubtitle} — ${c.shellTitle}`, robots: { index: false } }
}

const L = {
  ka: {
    shellTitle: "აგენტის პანელი",
    shellSubtitle: "პროფილი",
    title: "ჩემი პროფილი",
    publicPage: "საჯარო გვერდი",
    statListings: "განცხადებები",
    statRating: "რეიტინგი",
    statReviews: "შეფასებები",
    emptyTitle: "აგენტის პროფილი ჯერ არ გაქვს",
    emptyBody: "შეავსე სახელი და სააგენტო — საჯარო გვერდი /agents-ზე ავტომატურად შეიქმნება.",
    editTitle: "პროფილის რედაქტირება",
    createTitle: "პროფილის შექმნა",
    verified: "ვერიფიცირებული",
    name: "სახელი და გვარი",
    agency: "სააგენტო",
    agencyPh: "მაგ. Remax Georgia",
    avatarText: "ავატარის ტექსტი",
    languages: "ენები",
    languagesPh: "ქართული, ინგლისური, რუსული",
    specialties: "სპეციალიზაცია",
    specialtiesPh: "ბინები, კომერციული, ახალი პროექტები",
    save: "შენახვა",
    reviewsWord: "შეფასება",
  },
  en: {
    shellTitle: "Agent panel",
    shellSubtitle: "Profile",
    title: "My profile",
    publicPage: "Public page",
    statListings: "Listings",
    statRating: "Rating",
    statReviews: "Reviews",
    emptyTitle: "You don't have an agent profile yet",
    emptyBody: "Fill in your name and agency — your public page on /agents will be created automatically.",
    editTitle: "Edit profile",
    createTitle: "Create profile",
    verified: "Verified",
    name: "Full name",
    agency: "Agency",
    agencyPh: "e.g. Remax Georgia",
    avatarText: "Avatar text",
    languages: "Languages",
    languagesPh: "Georgian, English, Russian",
    specialties: "Specialties",
    specialtiesPh: "Apartments, commercial, new developments",
    save: "Save",
    reviewsWord: "reviews",
  },
  de: {
    shellTitle: "Makler-Bereich",
    shellSubtitle: "Profil",
    title: "Mein Profil",
    publicPage: "Öffentliche Seite",
    statListings: "Inserate",
    statRating: "Bewertung",
    statReviews: "Bewertungen",
    emptyTitle: "Sie haben noch kein Maklerprofil",
    emptyBody:
      "Tragen Sie Name und Agentur ein — Ihre öffentliche Seite unter /agents wird automatisch erstellt.",
    editTitle: "Profil bearbeiten",
    createTitle: "Profil erstellen",
    verified: "Verifiziert",
    name: "Vor- und Nachname",
    agency: "Agentur",
    agencyPh: "z. B. Remax Georgia",
    avatarText: "Avatar-Text",
    languages: "Sprachen",
    languagesPh: "Georgisch, Englisch, Russisch",
    specialties: "Spezialgebiete",
    specialtiesPh: "Wohnungen, Gewerbe, Neubauprojekte",
    save: "Speichern",
    reviewsWord: "Bewertungen",
  },
} as const

export default async function AgentProfilePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params
  const lang = isValidLang(raw) ? raw : "ka"
  const c = L[panelLang(lang)]
  const user = await requireRole("agent", "/agent")

  const profile = await safeQuery(
    () => db.agentProfile.findFirst({ where: { ownerId: user.id, deletedAt: null } }),
    null,
  )

  return (
    <DashboardShell
      nav={agentNav(lang)}
      title={c.shellTitle}
      subtitle={c.shellSubtitle}
      userLabel={user.name ?? user.email}
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[22px] font-black tracking-tight text-sv-ink">{c.title}</h1>
        {profile ? (
          <LocalizedLink
            href={`/agents/${profile.slug}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-sv-ink/12 px-4 py-2 text-[12.5px] font-bold text-sv-ink/70 transition hover:border-sv-blue hover:text-sv-blue"
          >
            {c.publicPage}
            <ExternalLink size={13} aria-hidden />
          </LocalizedLink>
        ) : null}
      </div>

      {profile ? (
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <StatCard label={c.statListings} value={profile.listingsCount} />
          <StatCard label={c.statRating} value={profile.rating ? profile.rating.toFixed(1) : "—"} />
          <StatCard label={c.statReviews} value={profile.reviewsCount} />
        </div>
      ) : (
        <div className="mb-6">
          <EmptyState title={c.emptyTitle} body={c.emptyBody} />
        </div>
      )}

      <section className="rounded-card border border-sv-ink/6 bg-sv-surface p-6 shadow-card">
        <h2 className="text-[15px] font-extrabold text-sv-ink">
          {profile ? c.editTitle : c.createTitle}
        </h2>
        {profile ? (
          <p className="mt-1 flex items-center gap-1.5 text-[12.5px] font-medium text-sv-ink/60">
            <BadgeCheck size={13} className="text-sv-blue" aria-hidden />
            {profile.agency}
            {profile.verified ? ` · ${c.verified}` : ""}
          </p>
        ) : null}

        <form action={saveAgentProfile} className="mt-5 grid gap-4">
          <label className="grid gap-1.5">
            <span className="text-[12px] font-bold text-sv-ink/60">{c.name}</span>
            <input
              name="name"
              required
              maxLength={160}
              defaultValue={profile?.name ?? user.name ?? ""}
              className="h-11 rounded-control border border-sv-ink/12 bg-sv-cloud/40 px-4 text-[14px] font-semibold text-sv-ink outline-none focus:border-sv-blue focus:ring-2 focus:ring-sv-blue/20"
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-[12px] font-bold text-sv-ink/60">{c.agency}</span>
            <input
              name="agency"
              required
              maxLength={160}
              defaultValue={profile?.agency ?? ""}
              placeholder={c.agencyPh}
              className="h-11 rounded-control border border-sv-ink/12 bg-sv-cloud/40 px-4 text-[14px] font-semibold text-sv-ink outline-none focus:border-sv-blue focus:ring-2 focus:ring-sv-blue/20"
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-[12px] font-bold text-sv-ink/60">{c.avatarText}</span>
            <input
              name="avatarText"
              maxLength={24}
              defaultValue={profile?.avatarText ?? ""}
              placeholder="NG"
              className="h-11 rounded-control border border-sv-ink/12 bg-sv-cloud/40 px-4 text-[14px] font-semibold text-sv-ink outline-none focus:border-sv-blue focus:ring-2 focus:ring-sv-blue/20"
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-[12px] font-bold text-sv-ink/60">{c.languages}</span>
            <input
              name="languages"
              defaultValue={profile?.languages.join(", ") ?? ""}
              placeholder={c.languagesPh}
              className="h-11 rounded-control border border-sv-ink/12 bg-sv-cloud/40 px-4 text-[14px] font-semibold text-sv-ink outline-none focus:border-sv-blue focus:ring-2 focus:ring-sv-blue/20"
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-[12px] font-bold text-sv-ink/60">{c.specialties}</span>
            <input
              name="specialties"
              defaultValue={profile?.specialties.join(", ") ?? ""}
              placeholder={c.specialtiesPh}
              className="h-11 rounded-control border border-sv-ink/12 bg-sv-cloud/40 px-4 text-[14px] font-semibold text-sv-ink outline-none focus:border-sv-blue focus:ring-2 focus:ring-sv-blue/20"
            />
          </label>
          <button
            type="submit"
            className="mt-1 inline-flex w-fit rounded-full bg-sv-orange px-6 py-2.5 text-[13px] font-bold text-sv-ink shadow-glow-orange transition hover:opacity-95"
          >
            {c.save}
          </button>
        </form>
      </section>

      {profile ? (
        <RequestVerification subjectType="agent" subjectId={profile.id} verified={profile.verified} lang={lang} />
      ) : null}

      {profile ? (
        <section className="mt-6 rounded-card border border-sv-ink/6 bg-sv-surface p-6 shadow-card">
          <div className="flex flex-wrap items-center gap-4">
            <UserAvatar name={profile.name} label={profile.avatarText} gradient={user.avatarStyle} color={user.avatarColor} icon={user.avatarIcon} size={64} shape="module" />
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-[18px] font-black text-sv-ink">
                {profile.name}
                {profile.verified ? (
                  <BadgeCheck size={18} className="text-sv-blue" aria-label={c.verified} />
                ) : null}
              </p>
              <p className="text-[13px] font-semibold text-sv-ink/60">{profile.agency}</p>
              {profile.rating > 0 ? (
                <p className="mt-1 inline-flex items-center gap-1 text-[12.5px] font-bold text-sv-ink/70">
                  <Star size={13} className="fill-sv-orange text-sv-orange" />
                  {profile.rating.toFixed(1)} · {profile.reviewsCount} {c.reviewsWord}
                </p>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      <OwnerReviews className="mt-6" />
    </DashboardShell>
  )
}
