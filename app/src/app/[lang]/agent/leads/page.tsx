import type { Metadata } from "next"
import LocalizedLink from "@/components/LocalizedLink"

import DashboardShell from "@/components/dashboard/DashboardShell"
import EmptyState from "@/components/dashboard/EmptyState"
import LeadInbox from "@/components/dashboard/LeadInbox"
import { agentNav } from "@/components/agent-dashboard/nav"
import { db } from "@/lib/db"
import { requireRole, safeQuery } from "@/lib/guards"
import { inquiryWhere, listingOwnerWhere } from "@/lib/pro-leads"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "ლიდები — აგენტის პანელი",
  robots: { index: false },
}

const tabs = [
  { key: "all", label: "ყველა", statuses: null as string[] | null },
  { key: "new", label: "ახალი", statuses: ["new"] },
  { key: "active", label: "მიმდინარე", statuses: ["contacted", "qualified"] },
  { key: "closed", label: "დასრულებული", statuses: ["closed"] },
] as const

interface LeadsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function AgentLeadsPage({ searchParams }: LeadsPageProps) {
  const user = await requireRole("agent", "/agent")
  const { status: rawStatus } = await searchParams
  const activeKey = typeof rawStatus === "string" ? rawStatus : "all"
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
          ...inquiryWhere(listingIds, user.email),
          ...(activeTab.statuses ? { status: { in: [...activeTab.statuses] } } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: 80,
      }),
    [],
  )

  return (
    <DashboardShell
      nav={agentNav}
      title="აგენტის პანელი"
      subtitle="ლიდები"
      userLabel={user.name ?? user.email}
    >
      <h1 className="mb-5 text-xl font-black tracking-tight text-sv-ink">ლიდები</h1>

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
          title="ლიდები არ მოიძებნა"
          body={
            activeTab.key === "all"
              ? "ახალი მოთხოვნები აქ გამოჩნდება მაშინვე, როცა მომხმარებელი დაგიკავშირდება."
              : "ამ სტატუსით ლიდი ჯერ არ გყავს."
          }
        />
      ) : (
        <LeadInbox leads={leads} titles={titles} />
      )}
    </DashboardShell>
  )
}
