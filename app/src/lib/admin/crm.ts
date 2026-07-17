import type { CrmLead, Prisma } from "@/generated/prisma/client"
import { CrmLeadStatus, CrmTaskPriority, CrmTaskStatus } from "@/generated/prisma/enums"

import { db } from "@/lib/db"

export const LEAD_STATUS_ORDER = Object.values(CrmLeadStatus)

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

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  call: "Call",
  email: "Email",
  sms: "SMS",
  meeting: "Meeting",
  viewing: "Viewing",
  note: "Note",
}

/** Pipeline board: leads grouped by status + the distinct agent list for the filter. */
export async function listCrmBoard(agent: string) {
  const where: Prisma.CrmLeadWhereInput = agent ? { agentId: agent } : {}
  const [leads, agents] = await Promise.all([
    db.crmLead.findMany({
      where,
      orderBy: [{ nextFollowUp: "asc" }, { createdAt: "desc" }],
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

export async function getCrmLead(id: string) {
  return db.crmLead.findUnique({
    where: { id },
    include: {
      activities: { orderBy: { createdAt: "desc" }, take: 100 },
      tasks: { orderBy: [{ status: "asc" }, { dueDate: "asc" }] },
    },
  })
}
