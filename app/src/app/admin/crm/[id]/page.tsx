import { ArrowLeft, ClipboardList, ListTodo } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import type { ReactNode } from "react"

import { addActivity, addTask, setTaskStatus, updateLeadStatus } from "@/app/admin/crm/actions"
import { ConfirmButton } from "@/components/admin/ui/ConfirmButton"
import { EmptyState } from "@/components/admin/ui/EmptyState"
import { PageHeader } from "@/components/admin/ui/PageHeader"
import { StatusPill } from "@/components/admin/ui/StatusPill"
import { CrmTaskPriority } from "@/generated/prisma/enums"
import type { CrmLead } from "@/generated/prisma/client"
import {
  ACTIVITY_TYPE_LABELS,
  ACTIVITY_TYPES,
  getCrmLead,
  LEAD_STATUS_LABELS,
  LEAD_STATUS_ORDER,
  TASK_PRIORITY_LABELS,
  type ActivityType,
} from "@/lib/admin/crm"
import { fmtDate, fmtDateTime, fmtMoney, timeAgo } from "@/lib/admin/format"
import { requireAdmin } from "@/lib/admin/guard"

export const metadata = { title: "Lead detail" }

const inputCls =
  "h-10 rounded-[var(--radius-control)] border border-sv-ink/10 bg-white px-3 text-[13.5px] text-sv-ink outline-none placeholder:text-sv-ink/30 focus:border-sv-blue"
const textareaCls =
  "w-full rounded-[var(--radius-control)] border border-sv-ink/10 bg-white px-3 py-2.5 text-[13.5px] leading-relaxed text-sv-ink outline-none placeholder:text-sv-ink/30 focus:border-sv-blue focus:ring-2 focus:ring-sv-blue/25"
const submitCls =
  "h-10 rounded-[var(--radius-control)] bg-sv-blue px-4 text-[13px] font-bold text-white transition-colors hover:bg-sv-blue-deep"

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-[var(--radius-tile)] border border-sv-ink/6 bg-white p-5 shadow-[var(--shadow-card)]">
      <h2 className="mb-4 text-[15px] font-extrabold text-sv-ink">{title}</h2>
      {children}
    </section>
  )
}

function Def({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] font-bold tracking-[0.08em] text-sv-ink/40 uppercase">{label}</dt>
      <dd className="mt-0.5 text-[13.5px] font-semibold break-words text-sv-ink/85">{children}</dd>
    </div>
  )
}

function budget(lead: CrmLead): string {
  const { budgetMin, budgetMax, currency } = lead
  if (budgetMin === null && budgetMax === null) return "—"
  if (budgetMin === null) return `≤ ${fmtMoney(budgetMax, currency)}`
  if (budgetMax === null) return `${fmtMoney(budgetMin, currency)}+`
  return `${fmtMoney(budgetMin, currency)}–${fmtMoney(budgetMax, currency)}`
}

export default async function AdminCrmLeadPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params
  const lead = await getCrmLead(id)
  if (!lead) notFound()

  return (
    <>
      <PageHeader
        title={lead.name}
        actions={
          <Link
            href="/admin/crm"
            className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-control)] border border-sv-ink/12 bg-white px-3.5 text-[12.5px] font-bold text-sv-ink/75 transition-colors hover:border-sv-ink/25 hover:text-sv-ink"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Board
          </Link>
        }
      />

      <Section title="Lead">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <StatusPill status={lead.status} />
          <span className="rounded-full bg-sv-cloud px-2.5 py-1 text-[12px] font-semibold text-sv-ink/55">
            {lead.source}
          </span>
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 xl:grid-cols-4">
          <Def label="Phone">{lead.phone}</Def>
          <Def label="Email">{lead.email ?? "—"}</Def>
          <Def label="Budget">{budget(lead)}</Def>
          <Def label="District">{lead.district ?? "—"}</Def>
          <Def label="Deal type">{lead.dealType ?? "—"}</Def>
          <Def label="Created">{fmtDateTime(lead.createdAt)}</Def>
          <Def label="Last contact">{fmtDateTime(lead.lastContact)}</Def>
          <Def label="Next follow-up">{fmtDateTime(lead.nextFollowUp)}</Def>
          {lead.closedAt ? <Def label="Closed">{fmtDateTime(lead.closedAt)}</Def> : null}
          {lead.closedReason ? <Def label="Close reason">{lead.closedReason}</Def> : null}
        </dl>
        {lead.notes ? (
          <p className="mt-4 text-[13.5px] leading-relaxed whitespace-pre-wrap text-sv-ink/75">
            {lead.notes}
          </p>
        ) : null}
        <form
          action={updateLeadStatus}
          className="mt-5 flex flex-wrap items-center gap-3 border-t border-sv-ink/8 pt-4"
        >
          <input type="hidden" name="id" value={lead.id} />
          <select
            name="status"
            defaultValue={lead.status}
            aria-label="Status"
            className={inputCls}
          >
            {LEAD_STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {LEAD_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <input name="closedReason" placeholder="Close reason (optional)" className={inputCls} />
          <button type="submit" className={submitCls}>
            Update status
          </button>
        </form>
      </Section>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-2">
        <Section title={`Activities (${lead.activities.length})`}>
          {lead.activities.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No activities yet"
              hint="Calls, emails and meetings logged for this lead will appear here."
            />
          ) : (
            <ol className="relative ml-1 space-y-4 border-l border-sv-ink/10 pl-5">
              {lead.activities.map((a) => (
                <li key={a.id} className="relative">
                  <span className="absolute top-1.5 -left-[26.5px] h-2.5 w-2.5 rounded-full bg-sv-blue ring-4 ring-sv-blue/10" />
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    <span className="inline-flex rounded-full bg-sv-blue/10 px-2.5 py-1 text-[12px] font-bold whitespace-nowrap text-sv-blue">
                      {ACTIVITY_TYPE_LABELS[a.type as ActivityType] ?? a.type}
                    </span>
                    <span className="text-[12px] whitespace-nowrap text-sv-ink/45">
                      {timeAgo(a.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 text-[13px] whitespace-pre-wrap text-sv-ink/75">{a.notes}</p>
                </li>
              ))}
            </ol>
          )}
          <form action={addActivity} className="mt-5 space-y-3 border-t border-sv-ink/8 pt-4">
            <input type="hidden" name="leadId" value={lead.id} />
            <select name="type" aria-label="Activity type" className={inputCls}>
              {ACTIVITY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {ACTIVITY_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
            <textarea
              name="notes"
              required
              rows={3}
              placeholder="What happened?"
              className={textareaCls}
            />
            <button type="submit" className={submitCls}>
              Add activity
            </button>
          </form>
        </Section>

        <Section title={`Tasks (${lead.tasks.length})`}>
          {lead.tasks.length === 0 ? (
            <EmptyState
              icon={ListTodo}
              title="No tasks yet"
              hint="Follow-ups and to-dos for this lead will appear here."
            />
          ) : (
            <ul className="space-y-2">
              {lead.tasks.map((t) => (
                <li
                  key={t.id}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-[var(--radius-control)] border border-sv-ink/6 px-3.5 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-bold break-words text-sv-ink">{t.title}</p>
                    <p className="mt-0.5 text-[12px] text-sv-ink/45">
                      Due {fmtDate(t.dueDate)} · {TASK_PRIORITY_LABELS[t.priority]}
                      {t.completedAt ? ` · Done ${fmtDate(t.completedAt)}` : ""}
                    </p>
                  </div>
                  <StatusPill status={t.status} />
                  {t.status === "done" ? (
                    <ConfirmButton
                      action={setTaskStatus}
                      fields={{ taskId: t.id, status: "todo" }}
                      label="Reopen"
                    />
                  ) : (
                    <ConfirmButton
                      action={setTaskStatus}
                      fields={{ taskId: t.id, status: "done" }}
                      label="Complete"
                      tone="primary"
                    />
                  )}
                </li>
              ))}
            </ul>
          )}
          <form action={addTask} className="mt-5 space-y-3 border-t border-sv-ink/8 pt-4">
            <input type="hidden" name="leadId" value={lead.id} />
            <input
              name="title"
              required
              placeholder="Task title"
              className={`${inputCls} w-full`}
            />
            <div className="flex flex-wrap gap-3">
              <input
                name="dueDate"
                type="datetime-local"
                required
                aria-label="Due date"
                className={inputCls}
              />
              <select
                name="priority"
                defaultValue="medium"
                aria-label="Priority"
                className={inputCls}
              >
                {Object.values(CrmTaskPriority).map((p) => (
                  <option key={p} value={p}>
                    {TASK_PRIORITY_LABELS[p]}
                  </option>
                ))}
              </select>
            </div>
            <input
              name="description"
              placeholder="Description (optional)"
              className={`${inputCls} w-full`}
            />
            <button type="submit" className={submitCls}>
              Add task
            </button>
          </form>
        </Section>
      </div>
    </>
  )
}
