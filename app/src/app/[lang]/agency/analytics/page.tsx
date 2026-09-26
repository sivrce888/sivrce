import type { Metadata } from "next"
import { CalendarCheck, Eye, MessagesSquare, TrendingUp } from "lucide-react"

import BarRow from "@/components/agency-dashboard/BarRow"
import { getAgencyContext } from "@/components/agency-dashboard/data"
import { AGENCY_NAV, listingStatusLabels } from "@/components/agency-dashboard/nav"
import DashboardShell from "@/components/dashboard/DashboardShell"
import EmptyState from "@/components/dashboard/EmptyState"
import StatCard from "@/components/dashboard/StatCard"
import { db } from "@/lib/db"
import { requireRole, safeQuery } from "@/lib/guards"
import { inquiryStatusLabel } from "@/components/agent-dashboard/format"
import { isValidLang, panelLang } from "@/lib/i18n/core"
import {
  INQUIRY_STATUSES,
  inquiryWhere,
  listingOwnerWhere,
} from "@/lib/pro-leads"
import type { ListingStatus } from "@/generated/prisma/client"

export const dynamic = "force-dynamic"

const L = {
  ka: {
    metaTitle: "სააგენტოს ანალიტიკა",
    title: "სააგენტოს პანელი",
    subtitle: "ანალიტიკა",
    views: "ნახვები",
    teamPortfolio: "გუნდის პორტფოლიო",
    leads: "ლიდები",
    inquiries: "მოთხოვნები",
    conversion: "კონვერსია",
    leadPerView: "ლიდი / ნახვა",
    tours: "ვიზიტები",
    leadsByStatus: "ლიდები სტატუსით",
    noDataTitle: "ჯერ არ არის საკმარისი მონაცემები",
    noDataBody: "როცა მყიდველები დაგიკავშირდებიან, აქ გამოჩნდება განაწილება.",
    listingsByStatus: "განცხადებები სტატუსით",
  },
  en: {
    metaTitle: "Agency analytics",
    title: "Agency dashboard",
    subtitle: "Analytics",
    views: "Views",
    teamPortfolio: "team portfolio",
    leads: "Leads",
    inquiries: "inquiries",
    conversion: "Conversion",
    leadPerView: "lead / view",
    tours: "Tours",
    leadsByStatus: "Leads by status",
    noDataTitle: "Not enough data yet",
    noDataBody: "Once buyers start contacting you, the breakdown will appear here.",
    listingsByStatus: "Listings by status",
  },
  de: {
    metaTitle: "Agentur-Analyse",
    title: "Agentur-Dashboard",
    subtitle: "Analyse",
    views: "Aufrufe",
    teamPortfolio: "Team-Portfolio",
    leads: "Leads",
    inquiries: "Anfragen",
    conversion: "Konversion",
    leadPerView: "Lead / Aufruf",
    tours: "Besichtigungen",
    leadsByStatus: "Leads nach Status",
    noDataTitle: "Noch nicht genügend Daten",
    noDataBody: "Sobald Käufer mit dir Kontakt aufnehmen, erscheint hier die Verteilung.",
    listingsByStatus: "Inserate nach Status",
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

const LISTING_STATUS_ORDER: ListingStatus[] = ["active", "pending", "sold", "expired", "withdrawn"]

export default async function AgencyAnalyticsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params
  const lang = isValidLang(raw) ? raw : "ka"
  const loc = panelLang(lang)
  const T = L[loc]
  const user = await requireRole("agency", "/agency")
  const { ownerIds } = await getAgencyContext(user)

  const listings = await safeQuery(
    () =>
      db.listing.findMany({
        where: listingOwnerWhere(ownerIds),
        select: { id: true, views: true, status: true },
      }),
    [],
  )
  const ids = listings.map((l) => l.id)
  const totalViews = listings.reduce((sum, l) => sum + l.views, 0)
  const listingCounts = new Map<string, number>()
  for (const l of listings) listingCounts.set(l.status, (listingCounts.get(l.status) ?? 0) + 1)
  const maxListings = Math.max(0, ...listingCounts.values())

  const leadGroups = await safeQuery(
    () =>
      db.inquiry.groupBy({
        by: ["status"],
        where: inquiryWhere(ids, user.email, ownerIds),
        _count: { _all: true },
      }),
    [],
  )
  const leadCounts = new Map(leadGroups.map((g) => [g.status, g._count._all]))
  const totalLeads = leadGroups.reduce((sum, g) => sum + g._count._all, 0)
  const maxLeads = Math.max(0, ...leadGroups.map((g) => g._count._all))
  const conversion = totalViews > 0 ? Math.round((totalLeads / totalViews) * 1000) / 10 : 0

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const upcomingTours = await safeQuery(
    () =>
      db.propertyTour.count({
        where: {
          listing: { ownerId: { in: ownerIds }, deletedAt: null },
          tourDate: { gte: today },
          status: { in: ["pending", "confirmed"] },
        },
      }),
    0,
  )

  return (
    <DashboardShell
      nav={AGENCY_NAV(lang)}
      title={T.title}
      subtitle={T.subtitle}
      userLabel={user.name ?? user.email}
    >
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label={T.views} value={totalViews} hint={T.teamPortfolio} icon={<Eye size={18} />} />
        <StatCard label={T.leads} value={totalLeads} hint={T.inquiries} icon={<MessagesSquare size={18} />} />
        <StatCard
          label={T.conversion}
          value={`${conversion}%`}
          hint={T.leadPerView}
          icon={<TrendingUp size={18} />}
        />
        <StatCard label={T.tours} value={upcomingTours} icon={<CalendarCheck size={18} />} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-card border border-sv-ink/[0.06] bg-sv-surface p-6 shadow-card">
          <h2 className="text-[15px] font-extrabold text-sv-ink">{T.leadsByStatus}</h2>
          {totalLeads === 0 ? (
            <div className="mt-4">
              <EmptyState title={T.noDataTitle} body={T.noDataBody} />
            </div>
          ) : (
            <div className="mt-4 flex flex-col gap-2.5">
              {INQUIRY_STATUSES.map((status) => (
                <BarRow
                  key={status}
                  label={inquiryStatusLabel(lang)[status]}
                  count={leadCounts.get(status) ?? 0}
                  max={maxLeads}
                />
              ))}
            </div>
          )}
        </section>

        <section className="rounded-card border border-sv-ink/[0.06] bg-sv-surface p-6 shadow-card">
          <h2 className="text-[15px] font-extrabold text-sv-ink">{T.listingsByStatus}</h2>
          <div className="mt-4 flex flex-col gap-2.5">
            {LISTING_STATUS_ORDER.map((status) => (
              <BarRow
                key={status}
                label={listingStatusLabels(lang)[status]}
                count={listingCounts.get(status) ?? 0}
                max={maxListings}
              />
            ))}
          </div>
        </section>
      </div>
    </DashboardShell>
  )
}
