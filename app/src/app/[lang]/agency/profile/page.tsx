import type { Metadata } from "next"
import Link from "next/link"
import { Building2, ExternalLink, MapPin, Star, Users } from "lucide-react"

import { saveAgencyProfile } from "@/app/[lang]/agency/profile/actions"
import { AGENCY_NAV } from "@/components/agency-dashboard/nav"
import DashboardShell from "@/components/dashboard/DashboardShell"
import EmptyState from "@/components/dashboard/EmptyState"
import StatCard from "@/components/dashboard/StatCard"
import { RequestVerification } from "@/components/dashboard/RequestVerification"
import { db } from "@/lib/db"
import { requireRole, safeQuery } from "@/lib/guards"
import { isValidLang } from "@/lib/i18n/core"

export const dynamic = "force-dynamic"

const L = {
  ka: {
    metaTitle: "სააგენტოს პროფილი",
    title: "სააგენტოს პანელი",
    subtitle: "პროფილი",
    h1: "პროფილი",
    publicPage: "საჯარო გვერდი",
    team: "გუნდი",
    activeListings: "აქტიური განცხადებები",
    rating: "რეიტინგი",
    noProfileTitle: "პროფილი ჯერ არ გაქვს",
    noProfileBody:
      "შეავსე ქვემოთ სახელი, ქალაქი და აღწერა — ეს მონაცემები გამოჩნდება შენს სააგენტოსთან დაკავშირებულ განცხადებებზე.",
    editProfile: "პროფილის რედაქტირება",
    createProfile: "პროფილის შექმნა",
    nameLabel: "სააგენტოს სახელი",
    cityLabel: "ქალაქი",
    cityPh: "თბილისი",
    logoTextLabel: "ლოგოს ტექსტი",
    summaryLabel: "აღწერა",
    save: "შენახვა",
  },
  en: {
    metaTitle: "Agency profile",
    title: "Agency dashboard",
    subtitle: "Profile",
    h1: "Profile",
    publicPage: "Public page",
    team: "Team",
    activeListings: "Active listings",
    rating: "Rating",
    noProfileTitle: "No profile yet",
    noProfileBody:
      "Fill in the name, city and description below — this information will appear on listings linked to your agency.",
    editProfile: "Edit profile",
    createProfile: "Create profile",
    nameLabel: "Agency name",
    cityLabel: "City",
    cityPh: "Tbilisi",
    logoTextLabel: "Logo text",
    summaryLabel: "Description",
    save: "Save",
  },
  de: {
    metaTitle: "Agenturprofil",
    title: "Agentur-Dashboard",
    subtitle: "Profil",
    h1: "Profil",
    publicPage: "Öffentliche Seite",
    team: "Team",
    activeListings: "Aktive Inserate",
    rating: "Bewertung",
    noProfileTitle: "Noch kein Profil",
    noProfileBody:
      "Fülle unten Name, Stadt und Beschreibung aus — diese Angaben erscheinen auf Inseraten, die mit deiner Agentur verknüpft sind.",
    editProfile: "Profil bearbeiten",
    createProfile: "Profil erstellen",
    nameLabel: "Agenturname",
    cityLabel: "Stadt",
    cityPh: "Tiflis",
    logoTextLabel: "Logo-Text",
    summaryLabel: "Beschreibung",
    save: "Speichern",
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

export default async function AgencyProfilePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params
  const lang = isValidLang(raw) ? raw : "ka"
  const loc = lang === "en" ? "en" : lang === "de" ? "de" : "ka"
  const T = L[loc]
  const user = await requireRole("agency", "/agency")

  const profile = await safeQuery(
    () => db.agencyProfile.findFirst({ where: { ownerId: user.id, deletedAt: null } }),
    null,
  )

  return (
    <DashboardShell
      nav={AGENCY_NAV(lang)}
      title={T.title}
      subtitle={T.subtitle}
      userLabel={user.name ?? user.email}
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[22px] font-black tracking-tight text-sv-ink">{T.h1}</h1>
        <Link
          href={`/u/${user.id}`}
          className="inline-flex items-center gap-1.5 rounded-full border border-sv-ink/12 px-4 py-2 text-[12.5px] font-bold text-sv-ink/70 transition hover:border-sv-blue hover:text-sv-blue"
        >
          {T.publicPage}
          <ExternalLink size={13} aria-hidden />
        </Link>
      </div>

      {profile ? (
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <StatCard label={T.team} value={profile.teamSize} icon={<Users size={18} />} />
          <StatCard
            label={T.activeListings}
            value={profile.activeListings}
            icon={<Building2 size={18} />}
          />
          <StatCard label={T.rating} value={profile.rating.toFixed(1)} icon={<Star size={18} />} />
        </div>
      ) : (
        <div className="mb-6">
          <EmptyState title={T.noProfileTitle} body={T.noProfileBody} />
        </div>
      )}

      <section className="rounded-card border border-sv-ink/6 bg-sv-surface p-6 shadow-card">
        <h2 className="text-[15px] font-extrabold text-sv-ink">
          {profile ? T.editProfile : T.createProfile}
        </h2>
        {profile ? (
          <p className="mt-1 flex items-center gap-1 text-[12.5px] font-medium text-sv-ink/60">
            <MapPin size={13} aria-hidden />
            {profile.city}
          </p>
        ) : null}

        <form action={saveAgencyProfile} className="mt-5 grid gap-4">
          <label className="grid gap-1.5">
            <span className="text-[12px] font-bold text-sv-ink/60">{T.nameLabel}</span>
            <input
              name="name"
              required
              maxLength={180}
              defaultValue={profile?.name ?? ""}
              className="h-11 rounded-control border border-sv-ink/12 bg-sv-cloud/40 px-4 text-[14px] font-semibold text-sv-ink outline-none focus:border-sv-blue focus:ring-2 focus:ring-sv-blue/20"
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-[12px] font-bold text-sv-ink/60">{T.cityLabel}</span>
            <input
              name="city"
              required
              maxLength={100}
              defaultValue={profile?.city ?? ""}
              placeholder={T.cityPh}
              className="h-11 rounded-control border border-sv-ink/12 bg-sv-cloud/40 px-4 text-[14px] font-semibold text-sv-ink outline-none focus:border-sv-blue focus:ring-2 focus:ring-sv-blue/20"
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-[12px] font-bold text-sv-ink/60">{T.logoTextLabel}</span>
            <input
              name="logoText"
              maxLength={40}
              defaultValue={profile?.logoText ?? ""}
              placeholder="AG"
              className="h-11 rounded-control border border-sv-ink/12 bg-sv-cloud/40 px-4 text-[14px] font-semibold text-sv-ink outline-none focus:border-sv-blue focus:ring-2 focus:ring-sv-blue/20"
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-[12px] font-bold text-sv-ink/60">{T.summaryLabel}</span>
            <textarea
              name="summary"
              required
              maxLength={4000}
              rows={5}
              defaultValue={profile?.summary ?? ""}
              className="rounded-control border border-sv-ink/12 bg-sv-cloud/40 px-4 py-3 text-[14px] font-medium leading-relaxed text-sv-ink outline-none focus:border-sv-blue focus:ring-2 focus:ring-sv-blue/20"
            />
          </label>
          <button
            type="submit"
            className="mt-1 inline-flex w-fit rounded-full bg-sv-orange px-6 py-2.5 text-[13px] font-bold text-sv-ink shadow-glow-orange transition hover:opacity-95"
          >
            {T.save}
          </button>
        </form>
      </section>

      {profile ? (
        <RequestVerification subjectType="agency" subjectId={profile.id} verified={profile.verified} />
      ) : null}
    </DashboardShell>
  )
}
