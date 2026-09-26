import type { CrmLead, Prisma } from "@/generated/prisma/client"
import { CrmLeadStatus, CrmTaskPriority, CrmTaskStatus, type UserRole } from "@/generated/prisma/enums"

import { fmtMoney } from "@/lib/admin/format"
import { endOfToday } from "@/lib/crm-follow-up"
import { db } from "@/lib/db"
import { dashboardPathFor } from "@/lib/guards"
import { canWorkLeads, LEAD_WORKER_ROLES } from "@/lib/pro-leads"
import { sendPushToUser } from "@/lib/push"

/** One assignee pool for inbox leads and CRM clients. */
export type Assignee = { id: string; label: string }

export async function listAssignees(): Promise<Assignee[]> {
  const users = await db.user.findMany({
    where: { role: { in: [...LEAD_WORKER_ROLES] } },
    select: { id: true, name: true, email: true, role: true },
    orderBy: [{ role: "asc" }, { name: "asc" }],
    // ponytail: flat 500 cap; typeahead search when the team outgrows a select.
    take: 500,
  })
  return users.map((u) => ({ id: u.id, label: `${u.name ?? u.email} · ${u.role}` }))
}

/** Trust boundary: the posted id must be a real user who can work leads. */
export async function assertAssignee(id: string): Promise<UserRole> {
  const user = await db.user.findUnique({ where: { id }, select: { role: true } })
  if (!user || !canWorkLeads(user.role)) throw new Error("Assignee cannot work leads")
  return user.role
}

/** Where an assignee works the lead: staff tools for admins, their pro inbox otherwise. */
export function assigneeLeadsPath(role: UserRole, adminPath: string): string {
  return role === "admin" ? adminPath : `${dashboardPathFor(role)}/leads`
}

/**
 * In-app row + web push to the new owner; self-assignment stays silent.
 * The assignment is already saved — a delivery failure is logged, never thrown.
 */
export async function notifyAssignee(
  assigneeId: string,
  actorId: string,
  title: string,
  url: string,
): Promise<void> {
  if (assigneeId === actorId) return
  await Promise.all([
    db.notification.create({
      data: { userId: assigneeId, kind: "lead_assigned", title, actionUrl: url },
    }),
    sendPushToUser(assigneeId, { title, url }),
  ]).catch((err) => console.error("[crm] assignee notify failed", err))
}

export const LEAD_STATUS_ORDER = Object.values(CrmLeadStatus)

export function isCrmLeadStatus(v: string): v is CrmLeadStatus {
  return (LEAD_STATUS_ORDER as string[]).includes(v)
}

export const LEAD_STATUS_LABELS: Record<CrmLeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  viewing_scheduled: "Viewing scheduled",
  offer_made: "Offer made",
  negotiating: "Negotiating",
  closed_won: "Closed won",
  closed_lost: "Closed lost",
  disqualified: "Disqualified",
}

export const CLOSED_LEAD_STATUSES: readonly CrmLeadStatus[] = [
  CrmLeadStatus.closed_won,
  CrmLeadStatus.closed_lost,
  CrmLeadStatus.disqualified,
]

export const TASK_STATUS_LABELS: Record<CrmTaskStatus, string> = {
  todo: "To do",
  in_progress: "In progress",
  done: "Done",
  cancelled: "Cancelled",
}

export const TASK_PRIORITY_LABELS: Record<CrmTaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
}

/** CrmActivity.type is a free varchar — the form constrains it to this vocabulary. */
export const ACTIVITY_TYPES = ["call", "email", "sms", "meeting", "viewing", "note"] as const
export type ActivityType = (typeof ACTIVITY_TYPES)[number]

export function isActivityType(v: string): v is ActivityType {
  return (ACTIVITY_TYPES as readonly string[]).includes(v)
}

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  call: "Call",
  email: "Email",
  sms: "SMS",
  meeting: "Meeting",
  viewing: "Viewing",
  note: "Note",
}

export const CRM_CURRENCIES = ["GEL", "USD", "EUR"] as const
export const CRM_DEAL_TYPES = ["buy", "rent", "daily", "mortgage"] as const

export function budgetLabel(lead: Pick<CrmLead, "budgetMin" | "budgetMax" | "currency">): string {
  const { budgetMin, budgetMax, currency } = lead
  if (budgetMin === null && budgetMax === null) return "—"
  if (budgetMin === null) return `≤ ${fmtMoney(budgetMax, currency)}`
  if (budgetMax === null) return `${fmtMoney(budgetMin, currency)}+`
  return `${fmtMoney(budgetMin, currency)}–${fmtMoney(budgetMax, currency)}`
}

const OPEN_LEAD: Prisma.CrmLeadWhereInput = { status: { notIn: [...CLOSED_LEAD_STATUSES] } }
const OPEN_TASK = { in: [CrmTaskStatus.todo, CrmTaskStatus.in_progress] }

/**
 * One touch = activity row + lastContact + the next follow-up, atomically.
 * Shared by staff and pros so both keep the same client history.
 */
export async function recordCrmTouch(input: {
  leadId: string
  agentId: string
  type: ActivityType
  notes: string
  nextFollowUp: Date | null
}) {
  const { leadId, agentId, type, notes, nextFollowUp } = input
  const [activity] = await db.$transaction([
    db.crmActivity.create({ data: { leadId, agentId, type, notes }, select: { id: true } }),
    db.crmLead.update({
      where: { id: leadId },
      // Forms prefill only a future follow-up, so a touch resolves a due one and keeps a plan.
      data: { lastContact: new Date(), nextFollowUp },
    }),
  ])
  return activity
}

/** Pipeline board: leads grouped by status + the distinct agent list for the filter. */
export async function listCrmBoard(agent: string, q: string) {
  const where: Prisma.CrmLeadWhereInput = {
    ...(agent ? { agentId: agent } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { phone: { contains: q } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  }
  const [leads, agents] = await Promise.all([
    db.crmLead.findMany({
      where,
      orderBy: [{ nextFollowUp: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }],
      take: 500,
    }),
    db.crmLead.findMany({
      select: { agentId: true },
      distinct: ["agentId"],
      orderBy: { agentId: "asc" },
    }),
  ])
  const byStatus = new Map<CrmLeadStatus, CrmLead[]>()
  for (const status of LEAD_STATUS_ORDER) byStatus.set(status, [])
  for (const lead of leads) {
    const bucket = byStatus.get(lead.status)
    if (bucket) bucket.push(lead)
  }
  return { byStatus, agents: agents.map((a) => a.agentId), total: leads.length }
}

/** "Due now" queue: open leads whose follow-up is today or late + open tasks due by tonight. */
export async function listCrmDue(agent: string) {
  const by = agent ? { agentId: agent } : {}
  const cutoff = endOfToday()
  const [leads, tasks] = await Promise.all([
    db.crmLead.findMany({
      where: { ...by, ...OPEN_LEAD, nextFollowUp: { lte: cutoff } },
      select: { id: true, name: true, phone: true, nextFollowUp: true, agentId: true },
      orderBy: { nextFollowUp: "asc" },
      take: 50,
    }),
    db.crmTask.findMany({
      where: { ...by, status: OPEN_TASK, dueDate: { lte: cutoff } },
      select: { id: true, title: true, dueDate: true, priority: true, lead: { select: { id: true, name: true } } },
      orderBy: { dueDate: "asc" },
      take: 50,
    }),
  ])
  return { leads, tasks }
}

export async function getCrmLead(id: string) {
  return db.crmLead.findUnique({
    where: { id },
    include: {
      activities: { orderBy: { createdAt: "desc" }, take: 100 },
      tasks: { orderBy: [{ status: "asc" }, { dueDate: "asc" }] },
    },
  })
}
