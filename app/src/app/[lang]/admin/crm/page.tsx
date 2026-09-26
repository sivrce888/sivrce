import { Phone, Users } from "lucide-react"
import Link from "next/link"

import { createLead } from "@/app/[lang]/admin/crm/actions"
import { EmptyState } from "@/components/admin/ui/EmptyState"
import { FilterSelect } from "@/components/admin/ui/FilterSelect"
import { PageHeader } from "@/components/admin/ui/PageHeader"
import { SearchForm } from "@/components/admin/ui/SearchForm"
import {
  budgetLabel,
  CLOSED_LEAD_STATUSES,
  LEAD_STATUS_LABELS,
  LEAD_STATUS_ORDER,
  listAssignees,
  listCrmBoard,
  listCrmDue,
  TASK_PRIORITY_LABELS,
} from "@/lib/admin/crm"
import { fmtDate, fmtNum } from "@/lib/admin/format"
import { requireAdmin } from "@/lib/admin/guard"
import { param, type SearchParams } from "@/lib/admin/query"
import { followUpState, type FollowUpState } from "@/lib/crm-follow-up"
import { telHref } from "@/lib/inquiries/phone"

export const metadata = { title: "CRM" }

const inputCls =
  "h-10 rounded-[var(--radius-control)] border border-sv-ink/10 bg-white px-3 text-[13.5px] text-sv-ink outline-none placeholder:text-sv-ink/30 focus:border-sv-blue"

const DUE_TONE: Record<FollowUpState, string> = {
  none: "text-sv-ink/60",
  upcoming: "text-sv-ink/60",
  today: "font-bold text-sv-blue-deep",
  overdue: "font-bold text-rose-600",
}

function dueLabel(d: Date | null, state: FollowUpState): string {
  return state === "today" ? "Today" : fmtDate(d)
}

export default async function AdminCrmPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  await requireAdmin()
  const sp = await searchParams
  const agent = param(sp.agent)
  const q = param(sp.q).slice(0, 120)
  const [{ byStatus, agents, total }, due, assignees] = await Promise.all([
    listCrmBoard(agent, q),
    listCrmDue(agent),
    listAssignees(),
  ])
  const agentNames = new Map(assignees.map((a) => [a.id, a.label]))
  const dueCount = due.leads.length + due.tasks.length

  return (
    <>
      <PageHeader
        title="CRM"
        description={`${fmtNum(total)} leads${q ? " found" : " on the board"} · ${fmtNum(dueCount)} due now`}
      />

      <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-3">
        <SearchForm action="/admin/crm" params={sp} placeholder="Name, phone or email" />
        <FilterSelect
          name="agent"
          label="Owner"
          options={agents.map((id) => ({ value: id, label: agentNames.get(id) ?? id }))}
          value={agent}
        />
      </div>

      <form action={createLead} className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-2">
        <select name="agentId" required aria-label="Assign to" className={inputCls}>
          {assignees.map((a) => (
            <option key={a.id} value={a.id}>
              {a.label}
            </option>
          ))}
        </select>
        <input aria-label="Lead name" name="name" required placeholder="Lead name" className={inputCls} />
        <input aria-label="Phone" name="phone" required placeholder="Phone" className={inputCls} />
        <input aria-label="Email (optional)" name="email" type="email" placeholder="Email (optional)" className={inputCls} />
        <input aria-label="Notes (optional)" name="notes" placeholder="Notes (optional)" className={inputCls} />
        <button
          type="submit"
          className="h-10 rounded-[var(--radius-control)] bg-sv-blue px-4 text-[13px] font-bold text-white transition-colors hover:bg-sv-blue-deep"
        >
          New lead
        </button>
      </form>

      {dueCount > 0 ? (
        <section
          aria-labelledby="crm-due-h"
          className="mb-6 rounded-[var(--radius-tile)] border border-sv-ink/6 bg-white p-4 shadow-[var(--shadow-card)]"
        >
          <h2 id="crm-due-h" className="mb-3 text-[15px] font-extrabold text-sv-ink">
            Due now <span className="text-sv-ink/40 tabular-nums">{dueCount}</span>
          </h2>
          <ul className="grid gap-x-6 gap-y-1 text-[13px] md:grid-cols-2">
            {due.leads.map((lead) => {
              const state = followUpState(lead.nextFollowUp)
              return (
                <li key={lead.id} className="flex min-h-11 items-center gap-3 border-b border-sv-ink/6 py-1.5">
                  <span className={`w-20 shrink-0 tabular-nums ${DUE_TONE[state]}`}>
                    {dueLabel(lead.nextFollowUp, state)}
                  </span>
                  <Link
                    href={`/admin/crm/${lead.id}`}
                    className="min-w-0 flex-1 truncate font-bold text-sv-ink hover:text-sv-blue"
                  >
                    Follow up · {lead.name}
                  </Link>
                  <a
                    href={telHref(lead.phone)}
                    aria-label={`Call ${lead.name}`}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-sv-cloud text-sv-ink/70 transition-colors hover:bg-sv-blue hover:text-white"
                  >
                    <Phone className="h-4 w-4" aria-hidden />
                  </a>
                </li>
              )
            })}
            {due.tasks.map((task) => {
              const state = followUpState(task.dueDate)
              return (
                <li key={task.id} className="flex min-h-11 items-center gap-3 border-b border-sv-ink/6 py-1.5">
                  <span className={`w-20 shrink-0 tabular-nums ${DUE_TONE[state]}`}>
                    {dueLabel(task.dueDate, state)}
                  </span>
                  {task.lead ? (
                    <Link
                      href={`/admin/crm/${task.lead.id}`}
                      className="min-w-0 flex-1 truncate font-bold text-sv-ink hover:text-sv-blue"
                    >
                      {task.title} · {task.lead.name}
                    </Link>
                  ) : (
                    <span className="min-w-0 flex-1 truncate font-bold text-sv-ink">{task.title}</span>
                  )}
                  <span className="shrink-0 text-[12px] text-sv-ink/60">
                    {TASK_PRIORITY_LABELS[task.priority]}
                  </span>
                </li>
              )
            })}
          </ul>
        </section>
      ) : null}

      {total === 0 ? (
        <EmptyState
          icon={Users}
          title={q ? "No matching leads" : "No leads yet"}
          hint={q ? "Try a name, phone fragment or email." : "Create the first lead with the form above."}
        />
      ) : (
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-4">
          {LEAD_STATUS_ORDER.map((status) => {
            const leads = byStatus.get(status) ?? []
            return (
              <section
                key={status}
                className="w-[240px] min-w-[240px] rounded-[var(--radius-tile)] bg-sv-cloud/60 p-2"
              >
                <header className="flex items-center justify-between px-2 pt-1.5 pb-2.5">
                  <h2 className="text-[11.5px] font-extrabold tracking-[0.08em] text-sv-ink/60 uppercase">
                    {LEAD_STATUS_LABELS[status]}
                  </h2>
                  <span className="rounded-full bg-sv-ink/6 px-1.5 py-0.5 text-[11px] leading-none font-extrabold text-sv-ink/60">
                    {leads.length}
                  </span>
                </header>
                <div className="space-y-2">
                  {leads.map((lead) => {
                    const state = CLOSED_LEAD_STATUSES.includes(lead.status)
                      ? "none"
                      : followUpState(lead.nextFollowUp)
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
                        <p className="mt-0.5 text-sv-ink/60 tabular-nums">{budgetLabel(lead)}</p>
                        {lead.district ? (
                          <p className="mt-0.5 text-sv-ink/60">{lead.district}</p>
                        ) : null}
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <span className={`text-[12px] tabular-nums ${DUE_TONE[state]}`}>
                            {dueLabel(lead.nextFollowUp, state)}
                          </span>
                          <span className="rounded-full bg-sv-cloud px-2 py-0.5 text-[11px] font-semibold text-sv-ink/60">
                            {lead.source}
                          </span>
                        </div>
                        <p className="mt-1.5 truncate text-[12px] text-sv-ink/60">
                          {agentNames.get(lead.agentId) ?? "Unknown owner"}
                        </p>
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
