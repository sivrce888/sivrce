import { ArrowLeft, ClipboardList, ListTodo, Mail, MessageCircle, Phone } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import type { ReactNode } from "react"

import {
  addActivity,
  addTask,
  reassignLead,
  setTaskStatus,
  updateLeadDetails,
  updateLeadStatus,
} from "@/app/[lang]/admin/crm/actions"
import { ConfirmButton } from "@/components/admin/ui/ConfirmButton"
import { EmptyState } from "@/components/admin/ui/EmptyState"
import { PageHeader } from "@/components/admin/ui/PageHeader"
import { CrmTouchForm } from "@/components/crm/CrmTouchForm"
import { StatusPill } from "@/components/admin/ui/StatusPill"
import { CrmTaskPriority } from "@/generated/prisma/enums"
import {
  ACTIVITY_TYPE_LABELS,
  budgetLabel,
  CRM_CURRENCIES,
  CRM_DEAL_TYPES,
  getCrmLead,
  listAssignees,
  LEAD_STATUS_LABELS,
  LEAD_STATUS_ORDER,
  TASK_PRIORITY_LABELS,
  type ActivityType,
} from "@/lib/admin/crm"
import { fmtDate, fmtDateTime, timeAgo } from "@/lib/admin/format"
import { requireAdmin } from "@/lib/admin/guard"
import { followUpState } from "@/lib/crm-follow-up"
import { telHref, waHref } from "@/lib/inquiries/phone"
import { leadWaText } from "@/lib/pro-leads"

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
      <dt className="text-[11px] font-bold tracking-[0.08em] text-sv-ink/60 uppercase">{label}</dt>
      <dd className="mt-0.5 text-[13.5px] font-semibold break-words text-sv-ink/85">{children}</dd>
    </div>
  )
}

const contactCls =
  "inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-[13px] font-bold transition-colors"

export default async function AdminCrmLeadPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params
  const [lead, assignees] = await Promise.all([getCrmLead(id), listAssignees()])
  if (!lead) notFound()
  const owner = assignees.find((a) => a.id === lead.agentId)
  const due = followUpState(lead.nextFollowUp)

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
          <span className="rounded-full bg-sv-cloud px-2.5 py-1 text-[12px] font-semibold text-sv-ink/60">
            {lead.source}
          </span>
          <span className="flex-1" />
          <a href={telHref(lead.phone)} className={`${contactCls} bg-sv-blue text-white hover:bg-sv-blue-deep`}>
            <Phone className="h-3.5 w-3.5" aria-hidden /> Call
          </a>
          <a
            href={waHref(lead.phone, leadWaText(lead.name))}
            target="_blank"
            rel="noopener noreferrer"
            className={`${contactCls} border border-sv-ink/12 bg-white text-sv-ink/80 hover:border-sv-blue hover:text-sv-blue-deep`}
          >
            <MessageCircle className="h-3.5 w-3.5" aria-hidden /> WhatsApp
          </a>
          {lead.email ? (
            <a
              href={`mailto:${lead.email}`}
              className={`${contactCls} border border-sv-ink/12 bg-white text-sv-ink/80 hover:border-sv-blue hover:text-sv-blue-deep`}
            >
              <Mail className="h-3.5 w-3.5" aria-hidden /> Email
            </a>
          ) : null}
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 xl:grid-cols-4">
          <Def label="Owner">{owner?.label ?? "Unknown"}</Def>
          <Def label="Phone">
            <a href={telHref(lead.phone)} className="hover:text-sv-blue">
              {lead.phone}
            </a>
          </Def>
          <Def label="Email">{lead.email ?? "—"}</Def>
          <Def label="Budget">{budgetLabel(lead)}</Def>
          <Def label="District">{lead.district ?? "—"}</Def>
          <Def label="Deal type">{lead.dealType ?? "—"}</Def>
          <Def label="Created">{fmtDateTime(lead.createdAt)}</Def>
          <Def label="Last contact">{fmtDateTime(lead.lastContact)}</Def>
          <Def label="Next follow-up">
            <span className={due === "overdue" ? "text-rose-600" : due === "today" ? "text-sv-blue-deep" : undefined}>
              {due === "today" ? "Today" : fmtDate(lead.nextFollowUp)}
              {due === "overdue" ? " · overdue" : ""}
            </span>
          </Def>
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
          <input aria-label="Close reason (optional)" name="closedReason" placeholder="Close reason (optional)" className={inputCls} />
          <button type="submit" className={submitCls}>
            Update status
          </button>
        </form>
        <form action={reassignLead} className="mt-3 flex flex-wrap items-center gap-3">
          <input type="hidden" name="id" value={lead.id} />
          <select
            name="agentId"
            defaultValue={lead.agentId}
            aria-label="Assign to"
            className={inputCls}
          >
            {owner ? null : <option value={lead.agentId}>Unknown owner</option>}
            {assignees.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </select>
          <button type="submit" className={submitCls}>
            Reassign
          </button>
        </form>
        <details className="mt-4 border-t border-sv-ink/8 pt-4">
          <summary className="cursor-pointer text-[13px] font-bold text-sv-blue-deep hover:text-sv-blue">
            Edit qualification
          </summary>
          <form action={updateLeadDetails} className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <input type="hidden" name="id" value={lead.id} />
            <label className="grid gap-1 text-[12px] font-semibold text-sv-ink/60">
              Budget from
              <input name="budgetMin" type="number" min={0} step={1000} inputMode="numeric" defaultValue={lead.budgetMin ?? ""} className={inputCls} />
            </label>
            <label className="grid gap-1 text-[12px] font-semibold text-sv-ink/60">
              Budget to
              <input name="budgetMax" type="number" min={0} step={1000} inputMode="numeric" defaultValue={lead.budgetMax ?? ""} className={inputCls} />
            </label>
            <label className="grid gap-1 text-[12px] font-semibold text-sv-ink/60">
              Currency
              <select name="currency" defaultValue={lead.currency} className={inputCls}>
                {CRM_CURRENCIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-[12px] font-semibold text-sv-ink/60">
              Deal type
              <select name="dealType" defaultValue={lead.dealType ?? ""} className={inputCls}>
                <option value="">—</option>
                {CRM_DEAL_TYPES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-[12px] font-semibold text-sv-ink/60">
              District
              <input name="district" maxLength={120} defaultValue={lead.district ?? ""} className={inputCls} />
            </label>
            <label className="grid gap-1 text-[12px] font-semibold text-sv-ink/60">
              Email
              <input name="email" type="email" maxLength={240} defaultValue={lead.email ?? ""} className={inputCls} />
            </label>
            <label className="grid gap-1 text-[12px] font-semibold text-sv-ink/60 sm:col-span-2 xl:col-span-4">
              Notes
              <textarea name="notes" rows={3} maxLength={2000} defaultValue={lead.notes ?? ""} className={textareaCls} />
            </label>
            <div>
              <button type="submit" className={submitCls}>
                Save details
              </button>
            </div>
          </form>
        </details>
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
                    <span className="inline-flex rounded-full bg-sv-blue/10 px-2.5 py-1 text-[12px] font-bold whitespace-nowrap text-sv-blue-deep">
                      {ACTIVITY_TYPE_LABELS[a.type as ActivityType] ?? a.type}
                    </span>
                    <span className="text-[12px] whitespace-nowrap text-sv-ink/60">
                      {timeAgo(a.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 text-[13px] whitespace-pre-wrap text-sv-ink/75">{a.notes}</p>
                </li>
              ))}
            </ol>
          )}
          <div className="mt-5 border-t border-sv-ink/8 pt-4">
            <CrmTouchForm action={addActivity} leadId={lead.id} nextFollowUp={lead.nextFollowUp} lang="en" />
          </div>
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
                    <p className="mt-0.5 text-[12px] text-sv-ink/60">
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
            <input aria-label="Task title"
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
            <input aria-label="Description (optional)"
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
