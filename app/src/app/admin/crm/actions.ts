"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { CrmLeadStatus, CrmTaskPriority, CrmTaskStatus } from "@/generated/prisma/enums"
import { logAdminAction } from "@/lib/admin/audit"
import { ACTIVITY_TYPES, CLOSED_LEAD_STATUSES } from "@/lib/admin/crm"
import { requireAdminAction } from "@/lib/admin/guard"
import { optString, reqEnum, reqString } from "@/lib/admin/validate"
import { db } from "@/lib/db"

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
  const phone = reqString(fd, "phone", 30)
  const email = optString(fd, "email", 240)
  const notes = optString(fd, "notes", 2000)
  const agent = await db.user.findUnique({ where: { id: agentId }, select: { id: true } })
  if (!agent) throw new Error("Agent not found")
  const lead = await db.crmLead.create({
    data: { agentId, name, phone, email, notes },
    select: { id: true },
  })
  await logAdminAction(session, "crm.create_lead", "crm_lead", lead.id, {
    before: null,
    after: { agentId, name, phone, email },
  })
  revalidatePath("/admin/crm")
  redirect(`/admin/crm/${lead.id}`)
}

export async function updateLeadStatus(fd: FormData) {
  const session = await requireAdminAction()
  const id = reqString(fd, "id", 120)
  const status = reqEnum(fd, "status", LEAD_STATUSES)
  const closedReason = optString(fd, "closedReason", 200)
  const before = await db.crmLead.findUniqueOrThrow({
    where: { id },
    select: { status: true, closedAt: true, closedReason: true },
  })
  const closing = CLOSED_LEAD_STATUSES.includes(status)
  const after = {
    status,
    closedAt: closing ? new Date() : null,
    closedReason: closing ? closedReason : null,
  }
  await db.crmLead.update({ where: { id }, data: after })
  await logAdminAction(session, "crm.update_status", "crm_lead", id, { before, after })
  revalidateLead(id)
}

export async function addActivity(fd: FormData) {
  const session = await requireAdminAction()
  const leadId = reqString(fd, "leadId", 120)
  const type = reqEnum(fd, "type", ACTIVITY_TYPES)
  const notes = reqString(fd, "notes", 2000)
  const lead = await db.crmLead.findUniqueOrThrow({
    where: { id: leadId },
    select: { agentId: true },
  })
  const lastContact = new Date()
  const [activity] = await db.$transaction([
    db.crmActivity.create({ data: { leadId, agentId: lead.agentId, type, notes } }),
    db.crmLead.update({ where: { id: leadId }, data: { lastContact } }),
  ])
  await logAdminAction(session, "crm.add_activity", "crm_lead", leadId, {
    after: { activityId: activity.id, type },
  })
  revalidateLead(leadId)
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
