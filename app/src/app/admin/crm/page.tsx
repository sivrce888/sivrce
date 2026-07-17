import { Users } from "lucide-react"
import Link from "next/link"

import { createLead } from "@/app/admin/crm/actions"
import { EmptyState } from "@/components/admin/ui/EmptyState"
import { FilterSelect } from "@/components/admin/ui/FilterSelect"
import { PageHeader } from "@/components/admin/ui/PageHeader"
import type { CrmLead } from "@/generated/prisma/client"
import {
  CLOSED_LEAD_STATUSES,
  LEAD_STATUS_LABELS,
  LEAD_STATUS_ORDER,
  listCrmBoard,
} from "@/lib/admin/crm"
import { fmtDate, fmtMoney, fmtNum } from "@/lib/admin/format"
import { requireAdmin } from "@/lib/admin/guard"
import { param, type SearchParams } from "@/lib/admin/query"
import { db } from "@/lib/db"

export const metadata = { title: "CRM" }

const inputCls =
  "h-10 rounded-[var(--radius-control)] border border-sv-ink/10 bg-white px-3 text-[13.5px] text-sv-ink outline-none placeholder:text-sv-ink/30 focus:border-sv-blue"

function budget(lead: CrmLead): string {
  const { budgetMin, budgetMax, currency } = lead
  if (budgetMin === null && budgetMax === null) return "—"
  if (budgetMin === null) return `≤ ${fmtMoney(budgetMax, currency)}`
  if (budgetMax === null) return `${fmtMoney(budgetMin, currency)}+`
  return `${fmtMoney(budgetMin, currency)}–${fmtMoney(budgetMax, currency)}`
}

export default async function AdminCrmPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  await requireAdmin()
  const sp = await searchParams
  const agent = param(sp.agent)
  const [{ byStatus, agents, total }, agentProfiles] = await Promise.all([
    listCrmBoard(agent),
    db.agentProfile.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
      take: 200,
    }),
  ])
  const agentNames = new Map(agentProfiles.map((a) => [a.id, a.name]))
  const now = new Date()

  return (
    <>
      <PageHeader title="CRM" description={`${fmtNum(total)} leads on the board`} />

      <div className="mb-4 flex flex-wrap items-end gap-x-6 gap-y-3">
        <FilterSelect
          name="agent"
          label="Agent"
          options={agents.map((id) => ({ value: id, label: agentNames.get(id) ?? id }))}
          value={agent}
        />
      </div>

      <form action={createLead} className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-2">
        <select name="agentId" required aria-label="Agent" className={inputCls}>
          {agentProfiles.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <input name="name" required placeholder="Lead name" className={inputCls} />
        <input name="phone" required placeholder="Phone" className={inputCls} />
        <input name="email" type="email" placeholder="Email (optional)" className={inputCls} />
        <input name="notes" placeholder="Notes (optional)" className={inputCls} />
        <button
          type="submit"
          className="h-10 rounded-[var(--radius-control)] bg-sv-blue px-4 text-[13px] font-bold text-white transition-colors hover:bg-sv-blue-deep"
        >
          New lead
        </button>
      </form>

      {total === 0 ? (
        <EmptyState
          icon={Users}
          title="No leads yet"
          hint="Create the first lead with the form above."
        />
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {LEAD_STATUS_ORDER.map((status) => {
            const leads = byStatus.get(status) ?? []
            return (
              <section
                key={status}
                className="w-[240px] min-w-[240px] rounded-[var(--radius-tile)] bg-sv-cloud/60 p-2"
              >
                <header className="flex items-center justify-between px-2 pt-1.5 pb-2.5">
                  <h2 className="text-[11.5px] font-extrabold tracking-[0.08em] text-sv-ink/50 uppercase">
                    {LEAD_STATUS_LABELS[status]}
                  </h2>
                  <span className="rounded-full bg-sv-ink/6 px-1.5 py-0.5 text-[11px] leading-none font-extrabold text-sv-ink/45">
                    {leads.length}
                  </span>
                </header>
                <div className="space-y-2">
                  {leads.map((lead) => {
                    const overdue =
                      lead.nextFollowUp !== null &&
                      lead.nextFollowUp < now &&
                      !CLOSED_LEAD_STATUSES.includes(lead.status)
                    return (
                      <article
                        key={lead.id}
                        className="rounded-[var(--radius-control)] border border-sv-ink/6 bg-white p-3 text-[13px]"
                      >
                        <Link
                          href={`/admin/crm/${lead.id}`}
                          className="font-bold text-sv-ink transition-colors hover:text-sv-blue"
                        >
                          {lead.name}
                        </Link>
                        <p className="mt-1 text-sv-ink/60">{lead.phone}</p>
                        <p className="mt-0.5 text-sv-ink/60 tabular-nums">{budget(lead)}</p>
                        {lead.district ? (
                          <p className="mt-0.5 text-sv-ink/45">{lead.district}</p>
                        ) : null}
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <span
                            className={`text-[12px] ${overdue ? "font-bold text-rose-600" : "text-sv-ink/45"}`}
                          >
                            {fmtDate(lead.nextFollowUp)}
                          </span>
                          <span className="rounded-full bg-sv-cloud px-2 py-0.5 text-[11px] font-semibold text-sv-ink/55">
                            {lead.source}
                          </span>
                        </div>
                      </article>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </>
  )
}
