"use server"

import { revalidatePath } from "next/cache"

import { logAdminAction } from "@/lib/admin/audit"
import { requireAdminAction } from "@/lib/admin/guard"
import { INQUIRY_STATUSES } from "@/lib/admin/inquiries"
import { optInt, reqEnum, reqString } from "@/lib/admin/validate"
import { db } from "@/lib/db"

export async function setStatus(formData: FormData) {
  const session = await requireAdminAction()
  const id = reqString(formData, "id", 120)
  const status = reqEnum(formData, "status", INQUIRY_STATUSES)
  const before = await db.inquiry.findUnique({ where: { id }, select: { status: true } })
  if (!before) throw new Error("Inquiry not found")
  await db.inquiry.update({ where: { id }, data: { status } })
  await logAdminAction(session, "inquiry.set_status", "Inquiry", id, {
    before: before.status,
    after: status,
  })
  revalidatePath("/admin/inquiries")
  revalidatePath(`/admin/inquiries/${id}`)
}

export async function toggleForSale(formData: FormData) {
  const session = await requireAdminAction()
  const id = reqString(formData, "id", 120)
  const isForSale = formData.get("isForSale") === "true"
  const price = optInt(formData, "price", 0) ?? 0
  const before = await db.inquiry.findUnique({
    where: { id },
    select: { isForSale: true, price: true },
  })
  if (!before) throw new Error("Inquiry not found")
  await db.inquiry.update({ where: { id }, data: { isForSale, price } })
  await logAdminAction(session, "inquiry.toggle_for_sale", "Inquiry", id, {
    before,
    after: { isForSale, price },
  })
  revalidatePath("/admin/inquiries")
  revalidatePath(`/admin/inquiries/${id}`)
}

export async function softDelete(formData: FormData) {
  const session = await requireAdminAction()
  const id = reqString(formData, "id", 120)
  const before = await db.inquiry.findUnique({ where: { id }, select: { deletedAt: true } })
  if (!before) throw new Error("Inquiry not found")
  await db.inquiry.update({ where: { id }, data: { deletedAt: new Date() } })
  await logAdminAction(session, "inquiry.soft_delete", "Inquiry", id, {
    before: { deletedAt: before.deletedAt?.toISOString() ?? null },
    after: { deletedAt: "now" },
  })
  revalidatePath("/admin/inquiries")
  revalidatePath(`/admin/inquiries/${id}`)
}

export async function restore(formData: FormData) {
  const session = await requireAdminAction()
  const id = reqString(formData, "id", 120)
  const before = await db.inquiry.findUnique({ where: { id }, select: { deletedAt: true } })
  if (!before) throw new Error("Inquiry not found")
  await db.inquiry.update({ where: { id }, data: { deletedAt: null } })
  await logAdminAction(session, "inquiry.restore", "Inquiry", id, {
    before: { deletedAt: before.deletedAt?.toISOString() ?? null },
    after: { deletedAt: null },
  })
  revalidatePath("/admin/inquiries")
  revalidatePath(`/admin/inquiries/${id}`)
}
