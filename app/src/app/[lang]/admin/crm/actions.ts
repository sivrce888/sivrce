"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { CrmLeadStatus, CrmTaskPriority, CrmTaskStatus } from "@/generated/prisma/enums"
import { logAdminAction } from "@/lib/admin/audit"
import {
  ACTIVITY_TYPES,
  assertAssignee,
  assigneeLeadsPath,
  CLOSED_LEAD_STATUSES,
  CRM_CURRENCIES,
  CRM_DEAL_TYPES,
  notifyAssignee,
  recordCrmTouch,
} from "@/lib/admin/crm"
import { requireAdminAction } from "@/lib/admin/guard"
import { optInt, optString, reqEnum, reqString } from "@/lib/admin/validate"
import { parseFollowUp } from "@/lib/crm-follow-up"
import { db } from "@/lib/db"
import { normalizePhone } from "@/lib/inquiries/phone"

const LEAD_STATUSES = Object.values(CrmLeadStatus)
const TASK_PRIORITIES = Object.values(CrmTaskPriority)
const TASK_STATUSES = Object.values(CrmTaskStatus)

function revalidateLead(id: string) {
  revalidatePath("/admin/crm")
  revalidatePath(`/admin/crm/${id}`)
}

export async function createLead(fd: FormData) {
  const session = await requireAdminAction()
  const agentId = reqString(fd, "agentId", 120)
  const name = reqString(fd, "name", 160)
  const raw = reqString(fd, "phone", 30)
  // Canonical +995/+49 form keeps tel:/wa.me links dialable; unknown formats kept as typed.
  const phone = normalizePhone(raw) ?? raw
  const email = optString(fd, "email", 240)
  const notes = optString(fd, "notes", 2000)
  const role = await assertAssignee(agentId)
  const lead = await db.crmLead.create({
    data: { agentId, name, phone, email, notes },
    select: { id: true },
  })
  await logAdminAction(session, "crm.create_lead", "crm_lead", lead.id, {
    before: null,
    after: { agentId, name, phone, email },
  })
  await notifyAssignee(
    agentId,
    session.user.id,
    `New client assigned: ${name}`,
    assigneeLeadsPath(role, `/admin/crm/${lead.id}`),
  )
  revalidatePath("/admin/crm")
  redirect(`/admin/crm/${lead.id}`)
}

/** Hand a client to another user; their open tasks move with them. */
export async function reassignLead(fd: FormData) {
  const session = await requireAdminAction()
  const id = reqString(fd, "id", 120)
  const agentId = reqString(fd, "agentId", 120)
  const before = await db.crmLead.findUniqueOrThrow({
    where: { id },
    select: { agentId: true, name: true },
  })
  if (before.agentId === agentId) return
  const role = await assertAssignee(agentId)
  await db.$transaction([
    db.crmLead.update({ where: { id }, data: { agentId } }),
    db.crmTask.updateMany({
      where: { leadId: id, status: { in: [CrmTaskStatus.todo, CrmTaskStatus.in_progress] } },
      data: { agentId },
    }),
  ])
  await logAdminAction(session, "crm.reassign", "crm_lead", id, {
    before: { agentId: before.agentId },
    after: { agentId },
  })
  await notifyAssignee(
    agentId,
    session.user.id,
    `Client assigned to you: ${before.name}`,
    assigneeLeadsPath(role, `/admin/crm/${id}`),
  )
  revalidateLead(id)
}

export async function updateLeadStatus(fd: FormData) {
  const session = await requireAdminAction()
  const id = reqString(fd, "id", 120)
  const status = reqEnum(fd, "status", LEAD_STATUSES)
  const closedReason = optString(fd, "closedReason", 200)
  const before = await db.crmLead.findUniqueOrThrow({
    where: { id },
    select: { status: true, closedAt: true, closedReason: true, nextFollowUp: true },
  })
  const closing = CLOSED_LEAD_STATUSES.includes(status)
  const after = {
    status,
    closedAt: closing ? new Date() : null,
    closedReason: closing ? closedReason : null,
    // A closed lead leaves the follow-up queue.
    ...(closing ? { nextFollowUp: null } : {}),
  }
  await db.crmLead.update({ where: { id }, data: after })
  await logAdminAction(session, "crm.update_status", "crm_lead", id, { before, after })
  revalidateLead(id)
}

export async function addActivity(fd: FormData) {
  const session = await requireAdminAction()
  const leadId = reqString(fd, "leadId", 120)
  const type = reqEnum(fd, "type", ACTIVITY_TYPES)
  const notes = optString(fd, "notes", 2000) ?? ""
  const nextFollowUp = parseFollowUp(fd)
  const lead = await db.crmLead.findUniqueOrThrow({
    where: { id: leadId },
    select: { agentId: true },
  })
  const activity = await recordCrmTouch({ leadId, agentId: lead.agentId, type, notes, nextFollowUp })
  await logAdminAction(session, "crm.add_activity", "crm_lead", leadId, {
    after: { activityId: activity.id, type, nextFollowUp },
  })
  revalidateLead(leadId)
}

/** Qualification facts the board shows: budget, area, deal type, contact, notes. */
export async function updateLeadDetails(fd: FormData) {
  const session = await requireAdminAction()
  const id = reqString(fd, "id", 120)
  const budgetMin = optInt(fd, "budgetMin")
  const budgetMax = optInt(fd, "budgetMax")
  if (budgetMin !== null && budgetMax !== null && budgetMin > budgetMax) {
    throw new Error("Budget min exceeds max")
  }
  const dealType = optString(fd, "dealType", 20)
  if (dealType !== null && !(CRM_DEAL_TYPES as readonly string[]).includes(dealType)) {
    throw new Error("Invalid deal type")
  }
  const after = {
    email: optString(fd, "email", 240),
    budgetMin,
    budgetMax,
    currency: reqEnum(fd, "currency", CRM_CURRENCIES),
    dealType,
    district: optString(fd, "district", 120),
    notes: optString(fd, "notes", 2000),
  }
  const before = await db.crmLead.findUniqueOrThrow({
    where: { id },
    select: { email: true, budgetMin: true, budgetMax: true, currency: true, dealType: true, district: true, notes: true },
  })
  await db.crmLead.update({ where: { id }, data: after })
  await logAdminAction(session, "crm.update_details", "crm_lead", id, { before, after })
  revalidateLead(id)
}

export async function addTask(fd: FormData) {
  const session = await requireAdminAction()
  const leadId = reqString(fd, "leadId", 120)
  const title = reqString(fd, "title", 200)
  const dueDate = new Date(reqString(fd, "dueDate", 40))
  if (Number.isNaN(dueDate.getTime())) throw new Error("Invalid due date")
  const priority = reqEnum(fd, "priority", TASK_PRIORITIES)
  const description = optString(fd, "description", 2000)
  const lead = await db.crmLead.findUniqueOrThrow({
    where: { id: leadId },
    select: { agentId: true },
  })
  const task = await db.crmTask.create({
    data: { agentId: lead.agentId, leadId, title, dueDate, priority, description },
    select: { id: true },
  })
  await logAdminAction(session, "crm.add_task", "crm_task", task.id, {
    after: { leadId, title, dueDate, priority },
  })
  revalidateLead(leadId)
}

export async function setTaskStatus(fd: FormData) {
  const session = await requireAdminAction()
  const taskId = reqString(fd, "taskId", 120)
  const status = reqEnum(fd, "status", TASK_STATUSES)
  const before = await db.crmTask.findUniqueOrThrow({
    where: { id: taskId },
    select: { status: true, leadId: true },
  })
  const completedAt = status === CrmTaskStatus.done ? new Date() : null
  await db.crmTask.update({ where: { id: taskId }, data: { status, completedAt } })
  await logAdminAction(session, "crm.set_task_status", "crm_task", taskId, {
    before: { status: before.status },
    after: { status },
  })
  revalidatePath("/admin/crm")
  if (before.leadId) revalidatePath(`/admin/crm/${before.leadId}`)
}
