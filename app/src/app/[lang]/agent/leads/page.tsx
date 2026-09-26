import type { Metadata } from "next"
import LocalizedLink from "@/components/LocalizedLink"

import DashboardShell from "@/components/dashboard/DashboardShell"
import EmptyState from "@/components/dashboard/EmptyState"
import LeadInbox, { CrmClients } from "@/components/dashboard/LeadInbox"
import { agentNav } from "@/components/agent-dashboard/nav"
import { db } from "@/lib/db"
import { requireRole, safeQuery } from "@/lib/guards"
import { inquiryWhere, listingOwnerWhere } from "@/lib/pro-leads"
import { isValidLang, panelLang } from "@/lib/i18n/core"

export const dynamic = "force-dynamic"

const L = {
  ka: {
    metaTitle: "ლიდები — აგენტის პანელი",
    title: "აგენტის პანელი",
    subtitle: "ლიდები",
    h1: "ლიდები",
    tabAll: "ყველა",
    tabNew: "ახალი",
    tabActive: "მიმდინარე",
    tabClosed: "დასრულებული",
    emptyTitle: "ლიდები არ მოიძებნა",
    emptyAll: "ახალი მოთხოვნები აქ გამოჩნდება მაშინვე, როცა მომხმარებელი დაგიკავშირდება.",
    emptyFiltered: "ამ სტატუსით ლიდი ჯერ არ არის.",
  },
  en: {
    metaTitle: "Leads — Agent dashboard",
    title: "Agent dashboard",
    subtitle: "Leads",
    h1: "Leads",
    tabAll: "All",
    tabNew: "New",
    tabActive: "In progress",
    tabClosed: "Closed",
    emptyTitle: "No leads found",
    emptyAll: "New inquiries will appear here as soon as a user reaches out.",
    emptyFiltered: "No leads with this status yet.",
  },
  de: {
    metaTitle: "Leads — Agenten-Dashboard",
    title: "Agenten-Dashboard",
    subtitle: "Leads",
    h1: "Leads",
    tabAll: "Alle",
    tabNew: "Neu",
    tabActive: "In Bearbeitung",
    tabClosed: "Abgeschlossen",
    emptyTitle: "Keine Leads gefunden",
    emptyAll: "Neue Anfragen erscheinen hier, sobald ein Nutzer Kontakt aufnimmt.",
    emptyFiltered: "Noch keine Leads mit diesem Status.",
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

interface LeadsPageProps {
  params: Promise<{ lang: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function AgentLeadsPage({ params, searchParams }: LeadsPageProps) {
  const { lang: raw } = await params
  const lang = isValidLang(raw) ? raw : "ka"
  const loc = panelLang(lang)
  const T = L[loc]
  const user = await requireRole("agent", "/agent")
  const { status: rawStatus } = await searchParams
  const activeKey = typeof rawStatus === "string" ? rawStatus : "all"
  const tabs = [
    { key: "all", label: T.tabAll, statuses: null as string[] | null },
    { key: "new", label: T.tabNew, statuses: ["new"] },
    { key: "active", label: T.tabActive, statuses: ["contacted", "qualified"] },
    { key: "closed", label: T.tabClosed, statuses: ["closed"] },
  ] as const
  const activeTab = tabs.find((t) => t.key === activeKey) ?? tabs[0]

  const listingRows = await safeQuery(
    () =>
      db.listing.findMany({
        where: listingOwnerWhere([user.id]),
        select: { id: true, title: true },
      }),
    [],
  )
  const listingIds = listingRows.map((l) => l.id)
  const titles = Object.fromEntries(listingRows.map((l) => [l.id, l.title]))

  const leads = await safeQuery(
    () =>
      db.inquiry.findMany({
        where: {
          ...inquiryWhere(listingIds, user.email, [user.id]),
          ...(activeTab.statuses ? { status: { in: [...activeTab.statuses] } } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: 80,
      }),
    [],
  )

  return (
    <DashboardShell
      nav={agentNav(lang)}
      title={T.title}
      subtitle={T.subtitle}
      userLabel={user.name ?? user.email}
    >
      <h1 className="mb-5 text-xl font-black tracking-tight text-sv-ink">{T.h1}</h1>

      <CrmClients ownerIds={[user.id]} lang={lang} />

      <div className="mb-5 flex gap-2 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <LocalizedLink
            key={tab.key}
            href={tab.key === "all" ? "/agent/leads" : `/agent/leads?status=${tab.key}`}
            className={`shrink-0 rounded-full px-4 py-2 text-[12.5px] font-bold transition ${
              tab.key === activeTab.key
                ? "bg-sv-blue text-white"
                : "bg-sv-surface text-sv-ink/65 hover:text-sv-ink"
            }`}
          >
            {tab.label}
          </LocalizedLink>
        ))}
      </div>

      {leads.length === 0 ? (
        <EmptyState
          title={T.emptyTitle}
          body={activeTab.key === "all" ? T.emptyAll : T.emptyFiltered}
        />
      ) : (
        <LeadInbox leads={leads} titles={titles} lang={lang} />
      )}
    </DashboardShell>
  )
}
