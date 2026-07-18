import type { Metadata } from "next"
import Link from "next/link"
import { Mail, Phone } from "lucide-react"

import DashboardShell from "@/components/dashboard/DashboardShell"
import EmptyState from "@/components/dashboard/EmptyState"
import Badge from "@/components/agent-dashboard/Badge"
import { agentNav } from "@/components/agent-dashboard/nav"
import { fmtDate, fmtPrice, leadStatusLabel, leadStatusTone } from "@/components/agent-dashboard/format"
import { db } from "@/lib/db"
import { requireRole, safeQuery } from "@/lib/guards"
import type { CrmLeadStatus } from "@/generated/prisma/client"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "ლიდები — აგენტის პანელი",
  robots: { index: false },
}

const tabs = [
  { key: "all", label: "ყველა", statuses: null },
  { key: "new", label: "ახალი", statuses: ["new"] },
  {
    key: "active",
    label: "მიმდინარე",
    statuses: ["contacted", "viewing_scheduled", "offer_made", "negotiating"],
  },
  {
    key: "closed",
    label: "დასრულებული",
    statuses: ["closed_won", "closed_lost", "disqualified"],
  },
] as const

interface LeadsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function AgentLeadsPage({ searchParams }: LeadsPageProps) {
  const user = await requireRole("agent", "/agent")

  const { status: rawStatus } = await searchParams
  const activeKey = typeof rawStatus === "string" ? rawStatus : "all"
  const activeTab = tabs.find((t) => t.key === activeKey) ?? tabs[0]

  const leads = await safeQuery(
    () =>
      db.crmLead.findMany({
        where: {
          agentId: user.id,
          ...(activeTab.statuses
            ? { status: { in: [...activeTab.statuses] as CrmLeadStatus[] } }
            : {}),
        },
        orderBy: { createdAt: "desc" },
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

      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={tab.key === "all" ? "/agent/leads" : `/agent/leads?status=${tab.key}`}
            className={`shrink-0 rounded-full px-4 py-2 text-[12.5px] font-bold transition ${
              tab.key === activeTab.key
                ? "bg-sv-blue text-white"
                : "bg-white text-sv-ink/65 shadow-sm hover:text-sv-ink"
            }`}
          >
            {tab.label}
          </Link>
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
        <ul className="space-y-3">
          {leads.map((lead) => (
            <li
              key={lead.id}
              className="rounded-2xl border border-sv-ink/6 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[15px] font-extrabold text-sv-ink">{lead.name}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] font-medium text-sv-ink/55">
                    <a
                      href={`tel:${lead.phone}`}
                      className="inline-flex items-center gap-1.5 hover:text-sv-blue"
                    >
                      <Phone size={13} />
                      {lead.phone}
                    </a>
                    {lead.email ? (
                      <a
                        href={`mailto:${lead.email}`}
                        className="inline-flex items-center gap-1.5 hover:text-sv-blue"
                      >
                        <Mail size={13} />
                        {lead.email}
                      </a>
                    ) : null}
                  </div>
                </div>
                <Badge
                  label={leadStatusLabel[lead.status] ?? lead.status}
                  tone={leadStatusTone[lead.status] ?? "neutral"}
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 border-t border-sv-ink/6 pt-3 text-[12px] font-medium text-sv-ink/50">
                <span>დამატებული: {fmtDate(lead.createdAt)}</span>
                <span>წყარო: {lead.source}</span>
                {lead.district ? <span>უბანი: {lead.district}</span> : null}
                {lead.budgetMin != null || lead.budgetMax != null ? (
                  <span>
                    ბიუჯეტი: {lead.budgetMin != null ? fmtPrice(lead.budgetMin, lead.currency) : "—"}
                    {" — "}
                    {lead.budgetMax != null ? fmtPrice(lead.budgetMax, lead.currency) : "—"}
                  </span>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </DashboardShell>
  )
}
