import type { Metadata } from "next"
import LocalizedLink from "@/components/LocalizedLink"
import { Building2, CalendarDays, Eye, Plus, Users } from "lucide-react"

import DashboardShell from "@/components/dashboard/DashboardShell"
import DashboardQuickLinks from "@/components/dashboard/DashboardQuickLinks"
import StatCard from "@/components/dashboard/StatCard"
import EmptyState from "@/components/dashboard/EmptyState"
import Badge from "@/components/agent-dashboard/Badge"
import ImportCompetitorPanel from "@/components/agent-dashboard/ImportCompetitorPanel"
import { agentNav } from "@/components/agent-dashboard/nav"
import {
  fmtDate,
  inquiryStatusLabel,
  tourStatusLabel,
  tourStatusTone,
} from "@/components/agent-dashboard/format"
import { inquiryWhere, listingOwnerWhere } from "@/lib/pro-leads"
import { phoneRevealsOf } from "@/lib/inquiries/phone"
import { db } from "@/lib/db"
import { requireRole, safeQuery } from "@/lib/guards"
import { isValidLang } from "@/lib/i18n/core"
import type { Prisma } from "@/generated/prisma/client"

export const dynamic = "force-dynamic"

const L = {
  ka: {
    metaTitle: "აგენტის პანელი",
    title: "აგენტის პანელი",
    subtitle: "მიმოხილვა",
    addListing: "დაამატე განცხადება",
    active: "აქტიური",
    total: (n: number) => `${n} სულ`,
    views: "ნახვები",
    allListings: "ყველა განცხადება",
    newLeads: "ახალი ლიდები",
    phoneReveals: (n: number) => `ნომრის ნახვა: ${n}`,
    inquiries: "მოთხოვნები",
    upcomingTours: "მომავალი ვიზიტები",
    recentLeads: "ბოლო ლიდები",
    all: "ყველა →",
    noLeadsTitle: "ლიდები ჯერ არ გაქვს",
    noLeadsBody:
      "მყიდველის მოთხოვნა აქ გამოჩნდება, როგორც კი განცხადებაზე დაგიკავშირდება.",
    quickActions: "სწრაფი ქმედებები",
    newListing: "+ ახალი განცხადება",
    manageListings: "განცხადებების მართვა",
    tours: "ვიზიტები",
    vipPlans: "VIP ტარიფები",
    publicProfile: "საჯარო პროფილი",
    nextTours: "უახლოესი ვიზიტები",
    noToursTitle: "დაგეგმილი ვიზიტები არ არის",
    noToursBody: "როცა მყიდველი განცხადების ნახვას დაჯავშნავს, ვიზიტი აქ გამოჩნდება.",
  },
  en: {
    metaTitle: "Agent dashboard",
    title: "Agent dashboard",
    subtitle: "Overview",
    addListing: "Add listing",
    active: "Active",
    total: (n: number) => `${n} total`,
    views: "Views",
    allListings: "all listings",
    newLeads: "New leads",
    phoneReveals: (n: number) => `Phone reveals: ${n}`,
    inquiries: "inquiries",
    upcomingTours: "Upcoming tours",
    recentLeads: "Recent leads",
    all: "All →",
    noLeadsTitle: "No leads yet",
    noLeadsBody: "Buyer inquiries will appear here as soon as someone contacts you about a listing.",
    quickActions: "Quick actions",
    newListing: "+ New listing",
    manageListings: "Manage listings",
    tours: "Tours",
    vipPlans: "VIP plans",
    publicProfile: "Public profile",
    nextTours: "Next tours",
    noToursTitle: "No tours scheduled",
    noToursBody: "When a buyer books a viewing of a listing, the tour will appear here.",
  },
  de: {
    metaTitle: "Agenten-Dashboard",
    title: "Agenten-Dashboard",
    subtitle: "Überblick",
    addListing: "Inserat hinzufügen",
    active: "Aktiv",
    total: (n: number) => `${n} gesamt`,
    views: "Aufrufe",
    allListings: "alle Inserate",
    newLeads: "Neue Leads",
    phoneReveals: (n: number) => `Telefon-Aufrufe: ${n}`,
    inquiries: "Anfragen",
    upcomingTours: "Anstehende Besichtigungen",
    recentLeads: "Neueste Leads",
    all: "Alle →",
    noLeadsTitle: "Noch keine Leads",
    noLeadsBody:
      "Käuferanfragen erscheinen hier, sobald dich jemand wegen eines Inserats kontaktiert.",
    quickActions: "Schnellaktionen",
    newListing: "+ Neues Inserat",
    manageListings: "Inserate verwalten",
    tours: "Besichtigungen",
    vipPlans: "VIP-Tarife",
    publicProfile: "Öffentliches Profil",
    nextTours: "Nächste Besichtigungen",
    noToursTitle: "Keine Besichtigungen geplant",
    noToursBody: "Sobald ein Käufer eine Besichtigung bucht, erscheint sie hier.",
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

export default async function AgentOverviewPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params
  const lang = isValidLang(raw) ? raw : "ka"
  const loc: Loc = lang === "en" ? "en" : lang === "de" ? "de" : "ka"
  const T = L[loc]
  const user = await requireRole("agent", "/agent")

  const profile = await safeQuery(
    () => db.agentProfile.findFirst({ where: { ownerId: user.id, deletedAt: null } }),
    null,
  )

  const listings = await safeQuery(
    () =>
      db.listing.findMany({
        where: listingOwnerWhere([user.id]),
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
  const tourWhere: Prisma.PropertyTourWhereInput = {
    OR: [
      ...(profile ? [{ agentId: profile.id }] : []),
      { listing: { ownerId: user.id, deletedAt: null } },
    ],
  }

  const [newLeads, upcomingTours, recentLeads, nextTours] = await Promise.all([
    safeQuery(
      () => db.inquiry.count({ where: { ...inquiryWhere(listingIds, user.email), status: "new" } }),
      0,
    ),
    safeQuery(
      () =>
        db.propertyTour.count({
          where: { ...tourWhere, tourDate: { gte: today }, status: { in: ["pending", "confirmed"] } },
        }),
      0,
    ),
    safeQuery(
      () =>
        db.inquiry.findMany({
          where: inquiryWhere(listingIds, user.email),
          orderBy: { createdAt: "desc" },
          take: 5,
        }),
      [],
    ),
    safeQuery(
      () =>
        db.propertyTour.findMany({
          where: { ...tourWhere, tourDate: { gte: today }, status: { in: ["pending", "confirmed"] } },
          orderBy: [{ tourDate: "asc" }, { tourTime: "asc" }],
          take: 5,
          include: { listing: { select: { id: true, title: true } } },
        }),
      [],
    ),
  ])

  return (
    <DashboardShell
      nav={agentNav(lang)}
      title={T.title}
      subtitle={T.subtitle}
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
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard
          label={T.active}
          value={activeListings}
          hint={T.total(listings.length)}
          icon={<Building2 size={18} />}
        />
        <StatCard label={T.views} value={totalViews} hint={T.allListings} icon={<Eye size={18} />} />
        <StatCard
          label={T.newLeads}
          value={newLeads}
          hint={totalReveals > 0 ? T.phoneReveals(totalReveals) : T.inquiries}
          icon={<Users size={18} />}
        />
        <StatCard label={T.upcomingTours} value={upcomingTours} icon={<CalendarDays size={18} />} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-card border border-sv-ink/[0.06] bg-sv-surface p-5 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[15px] font-extrabold text-sv-ink">{T.recentLeads}</h2>
            <LocalizedLink
              href="/agent/leads"
              className="text-[12px] font-bold text-sv-blue hover:underline"
            >
              {T.all}
            </LocalizedLink>
          </div>
          {recentLeads.length === 0 ? (
            <EmptyState title={T.noLeadsTitle} body={T.noLeadsBody} />
          ) : (
            <ul className="divide-y divide-sv-ink/6">
              {recentLeads.map((lead) => (
                <li key={lead.id} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-bold text-sv-ink">{lead.buyerName}</p>
                    <p className="truncate text-[12px] font-medium text-sv-ink/60">
                      {lead.buyerPhone ?? lead.buyerEmail} · {fmtDate(lead.createdAt, lang)}
                    </p>
                  </div>
                  <Badge
                    label={inquiryStatusLabel(lang)[lead.status] ?? lead.status}
                    tone={lead.status === "new" ? "blue" : "neutral"}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-card border border-sv-ink/[0.06] bg-sv-surface p-5 shadow-card">
          <div className="mb-4">
            <h2 className="text-[15px] font-extrabold text-sv-ink">{T.quickActions}</h2>
          </div>
          <DashboardQuickLinks
            links={[
              { href: "/add-listing", label: T.newListing, primary: true },
              { href: "/agent/listings", label: T.manageListings },
              { href: "/agent/tours", label: T.tours },
              { href: "/advertise", label: T.vipPlans },
              ...(profile ? [{ href: `/u/${user.id}`, label: T.publicProfile }] : []),
            ]}
          />
        </section>
      </div>

      <section className="mt-6 rounded-card border border-sv-ink/[0.06] bg-sv-surface p-5 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[15px] font-extrabold text-sv-ink">{T.nextTours}</h2>
          <LocalizedLink
            href="/agent/tours"
            className="text-[12px] font-bold text-sv-blue hover:underline"
          >
            {T.all}
          </LocalizedLink>
        </div>
        {nextTours.length === 0 ? (
          <EmptyState title={T.noToursTitle} body={T.noToursBody} />
        ) : (
          <ul className="divide-y divide-sv-ink/6">
            {nextTours.map((tour) => (
              <li key={tour.id} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <LocalizedLink
                    href={`/listing/${tour.listing.id}`}
                    className="block truncate text-[13.5px] font-bold text-sv-ink hover:text-sv-blue"
                  >
                    {tour.listing.title}
                  </LocalizedLink>
                  <p className="truncate text-[12px] font-medium text-sv-ink/60">
                    {fmtDate(tour.tourDate, lang)} · {tour.tourTime} · {tour.guestName}
                  </p>
                </div>
                <Badge
                  label={tourStatusLabel(lang)[tour.status] ?? tour.status}
                  tone={tourStatusTone[tour.status] ?? "neutral"}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </DashboardShell>
  )
}
