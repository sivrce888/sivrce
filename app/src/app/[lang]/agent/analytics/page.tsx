import type { Metadata } from "next"
import { CalendarCheck, Eye, MessagesSquare, TrendingUp } from "lucide-react"

import BarRow from "@/components/agency-dashboard/BarRow"
import DashboardShell from "@/components/dashboard/DashboardShell"
import EmptyState from "@/components/dashboard/EmptyState"
import StatCard from "@/components/dashboard/StatCard"
import { agentNav } from "@/components/agent-dashboard/nav"
import { inquiryStatusLabel } from "@/components/agent-dashboard/format"
import { db } from "@/lib/db"
import { requireRole, safeQuery } from "@/lib/guards"
import { isValidLang } from "@/lib/i18n/core"

export const dynamic = "force-dynamic"

const L = {
  ka: {
    metaTitle: "ანალიტიკა · აგენტი",
    title: "აგენტის პანელი",
    subtitle: "ანალიტიკა",
    h1: "ანალიტიკა",
    views: "ნახვები",
    allListings: "ყველა განცხადება",
    leads: "ლიდები",
    inquiries: "მოთხოვნები",
    conversion: "კონვერსია",
    leadPerView: "ლიდი / ნახვა",
    tours: "ვიზიტები",
    activeListings: (n: number) => `${n} აქტიური განცხადება`,
    leadsByStatus: "ლიდები სტატუსით",
    noDataTitle: "ჯერ არ არის საკმარისი მონაცემები",
    noDataBody:
      "როცა მყიდველები დაგიკავშირდებიან, აქ გამოჩნდება ლიდების განაწილება სტატუსების მიხედვით.",
    addListing: "განცხადების დამატება",
  },
  en: {
    metaTitle: "Analytics · Agent",
    title: "Agent dashboard",
    subtitle: "Analytics",
    h1: "Analytics",
    views: "Views",
    allListings: "all listings",
    leads: "Leads",
    inquiries: "inquiries",
    conversion: "Conversion",
    leadPerView: "lead / view",
    tours: "Tours",
    activeListings: (n: number) => `${n} active listings`,
    leadsByStatus: "Leads by status",
    noDataTitle: "Not enough data yet",
    noDataBody:
      "Once buyers start contacting you, the lead breakdown by status will appear here.",
    addListing: "Add a listing",
  },
  de: {
    metaTitle: "Analyse · Agent",
    title: "Agenten-Dashboard",
    subtitle: "Analyse",
    h1: "Analyse",
    views: "Aufrufe",
    allListings: "alle Inserate",
    leads: "Leads",
    inquiries: "Anfragen",
    conversion: "Konversion",
    leadPerView: "Lead / Aufruf",
    tours: "Besichtigungen",
    activeListings: (n: number) => `${n} aktive Inserate`,
    leadsByStatus: "Leads nach Status",
    noDataTitle: "Noch nicht genügend Daten",
    noDataBody:
      "Sobald Käufer mit dir Kontakt aufnehmen, erscheint hier die Verteilung der Leads nach Status.",
    addListing: "Inserat hinzufügen",
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

const STATUS_ORDER = ["new", "contacted", "qualified", "closed"] as const

export default async function AgentAnalyticsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params
  const lang = isValidLang(raw) ? raw : "ka"
  const loc = lang === "en" ? "en" : lang === "de" ? "de" : "ka"
  const T = L[loc]
  const user = await requireRole("agent", "/agent")

  const listingIds = await safeQuery(
    () =>
      db.listing
        .findMany({
          where: { ownerId: user.id, deletedAt: null },
          select: { id: true, views: true, status: true },
        })
        .then((rows) => rows),
    [] as { id: string; views: number; status: string }[],
  )

  const ids = listingIds.map((l) => l.id)
  const totalViews = listingIds.reduce((sum, l) => sum + l.views, 0)
  const activeCount = listingIds.filter((l) => l.status === "active").length

  const profile = await safeQuery(
    () => db.agentProfile.findFirst({ where: { ownerId: user.id, deletedAt: null } }),
    null,
  )

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [leadGroups, upcomingTours] = await Promise.all([
    ids.length
      ? safeQuery(
          () =>
            db.inquiry.groupBy({
              by: ["status"],
              where: {
                deletedAt: null,
                OR: [{ listingId: { in: ids } }, { agentEmail: user.email }],
              },
              _count: { _all: true },
            }),
          [],
        )
      : Promise.resolve([]),
    profile
      ? safeQuery(
          () =>
            db.propertyTour.count({
              where: {
                agentId: profile.id,
                tourDate: { gte: today },
                status: { in: ["pending", "confirmed"] },
              },
            }),
          0,
        )
      : Promise.resolve(0),
  ])

  const leadCounts = new Map(leadGroups.map((g) => [g.status, g._count._all]))
  const totalLeads = leadGroups.reduce((sum, g) => sum + g._count._all, 0)
  const maxLeads = Math.max(0, ...leadGroups.map((g) => g._count._all))
  const conversion =
    totalViews > 0 ? Math.round((totalLeads / totalViews) * 1000) / 10 : 0

  return (
    <DashboardShell
      nav={agentNav(lang)}
      title={T.title}
      subtitle={T.subtitle}
      userLabel={user.name ?? user.email}
    >
      <h1 className="mb-5 text-[22px] font-black tracking-tight text-sv-ink">{T.h1}</h1>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={T.views} value={totalViews} hint={T.allListings} icon={<Eye size={18} />} />
        <StatCard label={T.leads} value={totalLeads} hint={T.inquiries} icon={<MessagesSquare size={18} />} />
        <StatCard
          label={T.conversion}
          value={`${conversion}%`}
          hint={T.leadPerView}
          icon={<TrendingUp size={18} />}
        />
        <StatCard
          label={T.tours}
          value={upcomingTours}
          hint={T.activeListings(activeCount)}
          icon={<CalendarCheck size={18} />}
        />
      </div>

      <section className="mt-6 rounded-card border border-sv-ink/6 bg-sv-surface p-6 shadow-card">
        <h2 className="text-[15px] font-extrabold text-sv-ink">{T.leadsByStatus}</h2>
        {totalLeads === 0 ? (
          <div className="mt-4">
            <EmptyState
              title={T.noDataTitle}
              body={T.noDataBody}
              actionHref="/add-listing"
              actionLabel={T.addListing}
            />
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-2.5">
            {STATUS_ORDER.map((status) => (
              <BarRow
                key={status}
                label={inquiryStatusLabel(lang)[status] ?? status}
                count={leadCounts.get(status) ?? 0}
                max={maxLeads}
              />
            ))}
          </div>
        )}
      </section>
    </DashboardShell>
  )
}
