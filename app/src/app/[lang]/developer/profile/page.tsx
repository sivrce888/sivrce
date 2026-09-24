import type { Metadata } from "next"
import LocalizedLink from "@/components/LocalizedLink"
import { Building2, ExternalLink, MapPin, Star } from "lucide-react"

import { saveDeveloperProfile } from "@/app/[lang]/developer/profile/actions"
import DashboardShell from "@/components/dashboard/DashboardShell"
import EmptyState from "@/components/dashboard/EmptyState"
import StatCard from "@/components/dashboard/StatCard"
import { RequestVerification } from "@/components/dashboard/RequestVerification"
import { developerNav } from "@/components/developer-dashboard/nav"
import { db } from "@/lib/db"
import { requireRole, safeQuery } from "@/lib/guards"
import { isValidLang, panelLang } from "@/lib/i18n/core"

export const dynamic = "force-dynamic"

const L = {
  ka: {
    metaTitle: "ჩემი პროფილი",
    title: "დეველოპერის პანელი",
    subtitle: "პროფილი",
    h1: "პროფილი",
    publicPage: "საჯარო გვერდი",
    projects: "პროექტები",
    completed: "დასრულებული",
    rating: "რეიტინგი",
    noProfileTitle: "პროფილი ჯერ არ გაქვს",
    noProfileBody:
      "შეავსე ქვემოთ სახელი, შტაბ-ბინა და აღწერა — საჯარო გვერდი ავტომატურად შეიქმნება.",
    editProfile: "პროფილის რედაქტირება",
    createProfile: "პროფილის შექმნა",
    nameLabel: "კომპანიის სახელი",
    hqLabel: "შტაბ-ბინა",
    hqPh: "თბილისი",
    logoTextLabel: "ლოგოს ტექსტი",
    websiteLabel: "ვებგვერდი",
    descLabel: "აღწერა",
    save: "შენახვა",
  },
  en: {
    metaTitle: "My profile",
    title: "Developer dashboard",
    subtitle: "Profile",
    h1: "Profile",
    publicPage: "Public page",
    projects: "Projects",
    completed: "Completed",
    rating: "Rating",
    noProfileTitle: "No profile yet",
    noProfileBody:
      "Fill in the name, headquarters and description below — your public page will be created automatically.",
    editProfile: "Edit profile",
    createProfile: "Create profile",
    nameLabel: "Company name",
    hqLabel: "Headquarters",
    hqPh: "Tbilisi",
    logoTextLabel: "Logo text",
    websiteLabel: "Website",
    descLabel: "Description",
    save: "Save",
  },
  de: {
    metaTitle: "Mein Profil",
    title: "Developer-Dashboard",
    subtitle: "Profil",
    h1: "Profil",
    publicPage: "Öffentliche Seite",
    projects: "Projekte",
    completed: "Fertiggestellt",
    rating: "Bewertung",
    noProfileTitle: "Noch kein Profil",
    noProfileBody:
      "Fülle unten Name, Hauptsitz und Beschreibung aus — deine öffentliche Seite wird automatisch erstellt.",
    editProfile: "Profil bearbeiten",
    createProfile: "Profil erstellen",
    nameLabel: "Firmenname",
    hqLabel: "Hauptsitz",
    hqPh: "Tiflis",
    logoTextLabel: "Logo-Text",
    websiteLabel: "Webseite",
    descLabel: "Beschreibung",
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
  const loc: Loc = panelLang(raw)
  return { title: L[loc].metaTitle, robots: { index: false } }
}

export default async function DeveloperProfilePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params
  const lang = isValidLang(raw) ? raw : "ka"
  const loc = panelLang(lang)
  const T = L[loc]
  const user = await requireRole("developer", "/developer")

  const profile = await safeQuery(
    () => db.developerProfile.findFirst({ where: { ownerId: user.id, deletedAt: null } }),
    null,
  )

  return (
    <DashboardShell
      nav={developerNav(lang)}
      title={T.title}
      subtitle={T.subtitle}
      userLabel={user.name ?? user.email}
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[22px] font-black tracking-tight text-sv-ink">{T.h1}</h1>
        {profile ? (
          <LocalizedLink
            href={`/developers/${profile.slug}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-sv-ink/12 px-4 py-2 text-[12.5px] font-bold text-sv-ink/70 transition hover:border-sv-blue hover:text-sv-blue"
          >
            {T.publicPage}
            <ExternalLink size={13} aria-hidden />
          </LocalizedLink>
        ) : null}
      </div>

      {profile ? (
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <StatCard label={T.projects} value={profile.projectsCount} icon={<Building2 size={18} />} />
          <StatCard
            label={T.completed}
            value={profile.completedCount}
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
            {profile.headquarters}
          </p>
        ) : null}

        <form action={saveDeveloperProfile} className="mt-5 grid gap-4">
          <label className="grid gap-1.5">
            <span className="text-[12px] font-bold text-sv-ink/60">{T.nameLabel}</span>
            <input
              name="name"
              required
              maxLength={160}
              defaultValue={profile?.name ?? ""}
              className="h-11 rounded-control border border-sv-ink/12 bg-sv-cloud/40 px-4 text-[14px] font-semibold text-sv-ink outline-none focus:border-sv-blue focus:ring-2 focus:ring-sv-blue/20"
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-[12px] font-bold text-sv-ink/60">{T.hqLabel}</span>
            <input
              name="headquarters"
              required
              maxLength={160}
              defaultValue={profile?.headquarters ?? ""}
              placeholder={T.hqPh}
              className="h-11 rounded-control border border-sv-ink/12 bg-sv-cloud/40 px-4 text-[14px] font-semibold text-sv-ink outline-none focus:border-sv-blue focus:ring-2 focus:ring-sv-blue/20"
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-[12px] font-bold text-sv-ink/60">{T.logoTextLabel}</span>
            <input
              name="logoText"
              maxLength={40}
              defaultValue={profile?.logoText ?? ""}
              placeholder="AB"
              className="h-11 rounded-control border border-sv-ink/12 bg-sv-cloud/40 px-4 text-[14px] font-semibold text-sv-ink outline-none focus:border-sv-blue focus:ring-2 focus:ring-sv-blue/20"
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-[12px] font-bold text-sv-ink/60">{T.websiteLabel}</span>
            <input
              name="website"
              type="url"
              maxLength={200}
              defaultValue={profile?.website ?? ""}
              placeholder="https://"
              className="h-11 rounded-control border border-sv-ink/12 bg-sv-cloud/40 px-4 text-[14px] font-semibold text-sv-ink outline-none focus:border-sv-blue focus:ring-2 focus:ring-sv-blue/20"
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-[12px] font-bold text-sv-ink/60">{T.descLabel}</span>
            <textarea
              name="description"
              required
              maxLength={4000}
              rows={5}
              defaultValue={profile?.description ?? ""}
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
        <RequestVerification subjectType="developer" subjectId={profile.id} lang={lang} />
      ) : null}
    </DashboardShell>
  )
}
