"use server"

import { revalidatePath } from "next/cache"

import type { Prisma } from "@/generated/prisma/client"

import { logAdminAction } from "@/lib/admin/audit"
import { INQUIRY_STATUSES } from "@/lib/admin/inquiries"
import { requireAdminAction } from "@/lib/admin/guard"
import { reqEnum, reqString } from "@/lib/admin/validate"
import { db } from "@/lib/db"

/** Staff pipeline: move a lead's stage. */
export async function setLeadStage(formData: FormData) {
  const session = await requireAdminAction()
  const id = reqString(formData, "id", 120)
  const status = reqEnum(formData, "status", INQUIRY_STATUSES)
  const before = await db.inquiry.findUnique({
    where: { id },
    select: { status: true },
  })
  if (!before) throw new Error("Lead not found")
  await db.inquiry.update({ where: { id }, data: { status } })
  await logAdminAction(session, "inbox.set_stage", "Inquiry", id, {
    before: before.status,
    after: status,
  })
  revalidatePath("/admin/inbox")
  revalidatePath(`/admin/inbox`)
}

/** Staff routing: (re)assign a lead to a team member, or unassign. */
export async function assignLead(formData: FormData) {
  const session = await requireAdminAction()
  const id = reqString(formData, "id", 120)
  const assignedTo = reqString(formData, "assignedTo", 120)
  if (assignedTo !== "" ) {
    const user = await db.user.findUnique({
      where: { id: assignedTo },
      select: { role: true },
    })
    if (!user || user.role !== "admin") throw new Error("Assignee must be an admin")
  }
  const before = await db.inquiry.findUnique({
    where: { id },
    select: { assignedToId: true },
  })
  if (!before) throw new Error("Lead not found")
  await db.inquiry.update({
    where: { id },
    data: { assignedToId: assignedTo === "" ? null : assignedTo },
  })
  await logAdminAction(session, "inbox.assign", "Inquiry", id, {
    before: before.assignedToId,
    after: assignedTo === "" ? null : assignedTo,
  })
  revalidatePath("/admin/inbox")
}

/** Append an internal note to the lead's meta (never shown to the buyer). */
export async function addLeadNote(formData: FormData) {
  const session = await requireAdminAction()
  const id = reqString(formData, "id", 120)
  const text = reqString(formData, "note", 500).trim()
  if (!text) throw new Error("Empty note")
  const lead = await db.inquiry.findUnique({
    where: { id },
    select: { meta: true },
  })
  if (!lead) throw new Error("Lead not found")
  const meta =
    lead.meta && typeof lead.meta === "object" && !Array.isArray(lead.meta)
      ? (lead.meta as Record<string, unknown>)
      : {}
  const notes = Array.isArray(meta.notes) ? (meta.notes as unknown[]).slice(-19) : []
  notes.push({
    at: new Date().toISOString(),
    by: session.user.name ?? session.user.email ?? "staff",
    text,
  })
  await db.inquiry.update({
    where: { id },
    data: { meta: { ...meta, notes } as unknown as Prisma.InputJsonValue },
  })
  await logAdminAction(session, "inbox.note", "Inquiry", id, { len: text.length })
  revalidatePath("/admin/inbox")
}
