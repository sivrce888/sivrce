import type { Metadata } from "next"

import OwnerReviews from "@/components/reviews/OwnerReviews"
import LocalizedLink from "@/components/LocalizedLink"
import { Building2, CalendarDays, Eye, Plus, Users } from "lucide-react"

import BarRow from "@/components/agency-dashboard/BarRow"
import { getAgencyContext } from "@/components/agency-dashboard/data"
import ImportCompetitorPanel from "@/components/agent-dashboard/ImportCompetitorPanel"
import { AGENCY_NAV } from "@/components/agency-dashboard/nav"
import DashboardShell from "@/components/dashboard/DashboardShell"
import DashboardQuickLinks from "@/components/dashboard/DashboardQuickLinks"
import EmptyState from "@/components/dashboard/EmptyState"
import StatCard from "@/components/dashboard/StatCard"
import UserAvatar from "@/components/UserAvatar"
import { db } from "@/lib/db"
import { requireRole, safeQuery } from "@/lib/guards"
import { INQUIRY_STATUSES, inquiryWhere, listingOwnerWhere } from "@/lib/pro-leads"
import { inquiryStatusLabel } from "@/components/agent-dashboard/format"
import { phoneRevealsOf } from "@/lib/inquiries/phone"
import { isValidLang } from "@/lib/i18n/core"

export const dynamic = "force-dynamic"

const L = {
  ka: {
    metaTitle: "სააგენტოს პანელი",
    title: "სააგენტოს პანელი",
    addListing: "დაამატე განცხადება",
    noProfileTitle: "სააგენტოს პროფილი ვერ მოიძებნა",
    noProfileBody: "შეავსე პროფილი — საჯარო გვერდი და სტატისტიკა გამოჩნდება შენახვისთანავე.",
    fillProfile: "პროფილის შევსება",
    active: "აქტიური",
    total: (n: number) => `${n} სულ`,
    views: "ნახვები",
    teamPortfolio: "გუნდის პორტფოლიო",
    newLeads: "ახალი ლიდები",
    totalLeads: (n: number) => `სულ ${n}`,
    phoneReveals: (n: number) => `ნომრის ნახვა: ${n}`,
    crm: "CRM",
    tours: "ვიზიტები",
    leadPipeline: "ლიდების ძარღვი",
    noLeads: "ლიდები ჯერ არ არის — ახალი მოთხოვნები აქ გამოჩნდება.",
    allLeads: "ყველა ლიდი →",
    quickActions: "სწრაფი ქმედებები",
    newListing: "+ ახალი განცხადება",
    manageListings: "განცხადებების მართვა",
    team: "გუნდი",
    vipPlans: "VIP ტარიფები",
    publicPage: "საჯარო გვერდი",
    teamSizeNote: (n: number) =>
      `პროფილში მითითებულია გუნდის ზომა: ${n}. აგენტი გუნდში გამოჩნდება, როცა მისი სააგენტო ემთხვევა ამ სააგენტოს სახელს.`,
    noAgents: "აგენტები ჯერ არ არის დამატებული.",
    listingsWord: "განცხადება",
    viewTeam: "გუნდის ნახვა →",
  },
  en: {
    metaTitle: "Agency dashboard",
    title: "Agency dashboard",
    addListing: "Add listing",
    noProfileTitle: "Agency profile not found",
    noProfileBody: "Complete your profile — the public page and statistics will appear as soon as you save.",
    fillProfile: "Complete profile",
    active: "Active",
    total: (n: number) => `${n} total`,
    views: "Views",
    teamPortfolio: "team portfolio",
    newLeads: "New leads",
    totalLeads: (n: number) => `${n} total`,
    phoneReveals: (n: number) => `Phone reveals: ${n}`,
    crm: "CRM",
    tours: "Tours",
    leadPipeline: "Lead pipeline",
    noLeads: "No leads yet — new inquiries will appear here.",
    allLeads: "All leads →",
    quickActions: "Quick actions",
    newListing: "+ New listing",
    manageListings: "Manage listings",
    team: "Team",
    vipPlans: "VIP plans",
    publicPage: "Public page",
    teamSizeNote: (n: number) =>
      `Team size listed in the profile: ${n}. An agent appears on the team when their agency matches this agency's name.`,
    noAgents: "No agents added yet.",
    listingsWord: "listings",
    viewTeam: "View team →",
  },
  de: {
    metaTitle: "Agentur-Dashboard",
    title: "Agentur-Dashboard",
    addListing: "Inserat hinzufügen",
    noProfileTitle: "Agenturprofil nicht gefunden",
    noProfileBody: "Vervollständige dein Profil — öffentliche Seite und Statistiken erscheinen sofort nach dem Speichern.",
    fillProfile: "Profil vervollständigen",
    active: "Aktiv",
    total: (n: number) => `${n} gesamt`,
    views: "Aufrufe",
    teamPortfolio: "Team-Portfolio",
    newLeads: "Neue Leads",
    totalLeads: (n: number) => `Gesamt ${n}`,
    phoneReveals: (n: number) => `Telefon-Aufrufe: ${n}`,
    crm: "CRM",
    tours: "Besichtigungen",
    leadPipeline: "Lead-Pipeline",
    noLeads: "Noch keine Leads — neue Anfragen erscheinen hier.",
    allLeads: "Alle Leads →",
    quickActions: "Schnellaktionen",
    newListing: "+ Neues Inserat",
    manageListings: "Inserate verwalten",
    team: "Team",
    vipPlans: "VIP-Tarife",
    publicPage: "Öffentliche Seite",
    teamSizeNote: (n: number) =>
      `Im Profil ist eine Teamgröße von ${n} hinterlegt. Ein Agent erscheint im Team, wenn seine Agentur zum Namen dieser Agentur passt.`,
    noAgents: "Noch keine Agenten hinzugefügt.",
    listingsWord: "Inserate",
    viewTeam: "Team ansehen →",
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

export default async function AgencyOverviewPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params
  const lang = isValidLang(raw) ? raw : "ka"
  const loc = lang === "en" ? "en" : lang === "de" ? "de" : "ka"
  const T = L[loc]
  const user = await requireRole("agency", "/agency")
  const { profile, team, ownerIds } = await getAgencyContext(user)

  const listings = await safeQuery(
    () =>
      db.listing.findMany({
        where: listingOwnerWhere(ownerIds),
        select: { id: true, status: true, views: true, extendedFields: true },
      }),
    [],
  )
  const listingIds = listings.map((l) => l.id)
  const totalViews = listings.reduce((sum, l) => sum + l.views, 0)
  const totalReveals = listings.reduce((sum, l) => sum + phoneRevealsOf(l.extendedFields), 0)
  const activeListings = listings.filter((l) => l.status === "active").length

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [leadGroups, upcomingTours] = await Promise.all([
    safeQuery(
      () =>
        db.inquiry.groupBy({
          by: ["status"],
          where: inquiryWhere(listingIds, user.email),
          _count: { _all: true },
        }),
      [],
    ),
    safeQuery(
      () =>
        db.propertyTour.count({
          where: {
            listing: { ownerId: { in: ownerIds }, deletedAt: null },
            tourDate: { gte: today },
            status: { in: ["pending", "confirmed"] },
          },
        }),
      0,
    ),
  ])
  const counts = new Map(leadGroups.map((g) => [g.status, g._count._all]))
  const totalLeads = leadGroups.reduce((sum, g) => sum + g._count._all, 0)
  const maxCount = Math.max(0, ...leadGroups.map((g) => g._count._all))
  const newLeads = counts.get("new") ?? 0

  return (
    <DashboardShell
      nav={AGENCY_NAV(lang)}
      title={T.title}
      subtitle={profile?.name}
      userLabel={user.name ?? user.email}
    >
      <div className="mb-5 flex justify-end">
        <LocalizedLink
          href="/add-listing"
          className="inline-flex items-center gap-1.5 rounded-full bg-sv-orange px-5 py-2.5 text-[13px] font-bold text-sv-ink shadow-glow-orange transition hover:opacity-95"
        >
          <Plus size={15} strokeWidth={2.5} />
          {T.addListing}
        </LocalizedLink>
      </div>
      <ImportCompetitorPanel />
      {!profile ? (
        <EmptyState
          title={T.noProfileTitle}
          body={T.noProfileBody}
          actionHref="/agency/profile"
          actionLabel={T.fillProfile}
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          <StatCard
            label={T.active}
            value={activeListings}
            hint={T.total(listings.length)}
            icon={<Building2 size={18} />}
          />
          <StatCard label={T.views} value={totalViews} hint={T.teamPortfolio} icon={<Eye size={18} />} />
          <StatCard
            label={T.newLeads}
            value={newLeads}
            hint={totalLeads ? T.totalLeads(totalLeads) : totalReveals ? T.phoneReveals(totalReveals) : T.crm}
            icon={<Users size={18} />}
          />
          <StatCard label={T.tours} value={upcomingTours} icon={<CalendarDays size={18} />} />
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-card border border-sv-ink/[0.06] bg-sv-surface p-6 shadow-card">
          <h2 className="text-[15px] font-extrabold text-sv-ink">{T.leadPipeline}</h2>
          {totalLeads === 0 ? (
            <p className="mt-4 text-[13px] font-medium text-sv-ink/60">{T.noLeads}</p>
          ) : (
            <div className="mt-4 flex flex-col gap-2.5">
              {INQUIRY_STATUSES.map((status) => (
                <BarRow
                  key={status}
                  label={inquiryStatusLabel(lang)[status]}
                  count={counts.get(status) ?? 0}
                  max={maxCount}
                />
              ))}
            </div>
          )}
          <LocalizedLink
            href="/agency/leads"
            className="mt-5 inline-block text-[12.5px] font-bold text-sv-blue hover:underline"
          >
            {T.allLeads}
          </LocalizedLink>
        </section>

        <section className="rounded-card border border-sv-ink/[0.06] bg-sv-surface p-6 shadow-card">
          <h2 className="text-[15px] font-extrabold text-sv-ink">{T.quickActions}</h2>
          <div className="mt-4">
            <DashboardQuickLinks
              links={[
                { href: "/add-listing", label: T.newListing, primary: true },
                { href: "/agency/listings", label: T.manageListings },
                { href: "/agency/team", label: T.team },
                { href: "/advertise", label: T.vipPlans },
                ...(user.id ? [{ href: `/u/${user.id}`, label: T.publicPage }] : []),
              ]}
            />
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-card border border-sv-ink/[0.06] bg-sv-surface p-6 shadow-card">
        <h2 className="text-[15px] font-extrabold text-sv-ink">{T.team}</h2>
        {team.length === 0 ? (
          <p className="mt-4 text-[13px] font-medium text-sv-ink/60">
            {profile ? T.teamSizeNote(profile.teamSize) : T.noAgents}
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {team.slice(0, 4).map((agent) => (
              <li key={agent.id} className="flex items-center gap-3">
                <UserAvatar name={agent.name} label={agent.avatarText} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-bold text-sv-ink">{agent.name}</p>
                  <p className="text-[11.5px] font-medium text-sv-ink/60">
                    {agent.listingsCount} {T.listingsWord} · {agent.rating.toFixed(1)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
        <LocalizedLink
          href="/agency/team"
          className="mt-5 inline-block text-[12.5px] font-bold text-sv-blue hover:underline"
        >
          {T.viewTeam}
        </LocalizedLink>
      </section>

      <OwnerReviews className="mt-6" />
    </DashboardShell>
  )
}
