import type { Metadata } from "next"

import { getAgencyContext } from "@/components/agency-dashboard/data"
import { AGENCY_NAV, LEAD_STATUS_LABELS, LEAD_STATUS_ORDER } from "@/components/agency-dashboard/nav"
import DashboardShell from "@/components/dashboard/DashboardShell"
import EmptyState from "@/components/dashboard/EmptyState"
import { db } from "@/lib/db"
import { requireRole, safeQuery } from "@/lib/guards"
import type { CrmLead, CrmLeadStatus } from "@/generated/prisma/client"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "სააგენტოს ლიდები",
  robots: { index: false },
}

function budgetLabel(lead: CrmLead): string | null {
  if (lead.budgetMin == null && lead.budgetMax == null) return null
  const min = lead.budgetMin?.toLocaleString("en-US") ?? "…"
  const max = lead.budgetMax?.toLocaleString("en-US") ?? "…"
  return `${min}–${max} ${lead.currency}`
}

export default async function AgencyLeadsPage() {
  const user = await requireRole("agency", "/agency")
  const { ownerIds } = await getAgencyContext(user)
  const leads = await safeQuery(
    () =>
      db.crmLead.findMany({
        where: { agentId: { in: ownerIds } },
        orderBy: { createdAt: "desc" },
        take: 120,
      }),
    [],
  )
  const byStatus = new Map<CrmLeadStatus, CrmLead[]>()
  for (const lead of leads) {
    const bucket = byStatus.get(lead.status) ?? []
    bucket.push(lead)
    byStatus.set(lead.status, bucket)
  }

  return (
    <DashboardShell
      nav={AGENCY_NAV}
      title="სააგენტოს პანელი"
      subtitle="ლიდების ძარღვი"
      userLabel={user.name ?? user.email}
    >
      {leads.length === 0 ? (
        <EmptyState
          title="ლიდები ჯერ არ არის"
          body="ახალი მოთხოვნები CRM ძარღვში გამოჩნდება მათი შემოსვლისთანავე."
        />
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {LEAD_STATUS_ORDER.map((status) => {
            const bucket = byStatus.get(status) ?? []
            return (
              <section
                key={status}
                className="w-60 shrink-0 rounded-2xl border border-sv-ink/6 bg-white/70 p-3"
              >
                <header className="flex items-center justify-between px-1 pb-2">
                  <h2 className="text-[12px] font-extrabold uppercase tracking-wide text-sv-ink/55">
                    {LEAD_STATUS_LABELS[status]}
                  </h2>
                  <span className="rounded-full bg-sv-ink/6 px-2 py-0.5 text-[11px] font-black tabular-nums text-sv-ink/60">
                    {bucket.length}
                  </span>
                </header>
                <div className="flex flex-col gap-2">
                  {bucket.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-sv-ink/10 px-3 py-4 text-center text-[11.5px] font-medium text-sv-ink/35">
                      ცარიელი
                    </p>
                  ) : (
                    bucket.map((lead) => (
                      <article
                        key={lead.id}
                        className="rounded-xl border border-sv-ink/6 bg-white p-3 shadow-sm"
                      >
                        <p className="truncate text-[13px] font-bold text-sv-ink">{lead.name}</p>
                        <p className="mt-0.5 text-[12px] font-semibold tabular-nums text-sv-blue">
                          {lead.phone}
                        </p>
                        <p className="mt-1.5 text-[11px] font-medium text-sv-ink/45">
                          {lead.source}
                          {lead.district ? ` · ${lead.district}` : ""}
                        </p>
                        {budgetLabel(lead) ? (
                          <p className="mt-1 text-[11.5px] font-bold text-sv-ink/65">
                            ბიუჯეტი: {budgetLabel(lead)}
                          </p>
                        ) : null}
                      </article>
                    ))
                  )}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </DashboardShell>
  )
}
