"use server"

import { revalidatePath } from "next/cache"

import { logAdminAction } from "@/lib/admin/audit"
import { requireAdminAction } from "@/lib/admin/guard"
import { reqString } from "@/lib/admin/validate"
import { db } from "@/lib/db"

/** Georgian providers support refunds (model has refundedAt); marks a paid order refunded. */
export async function markGeorgianOrderRefunded(fd: FormData) {
  const session = await requireAdminAction()
  const id = reqString(fd, "id", 40)
  const order = await db.georgianPaymentOrder.findUnique({
    where: { id },
    select: { status: true, deletedAt: true },
  })
  if (!order || order.deletedAt) throw new Error("Order not found")
  if (order.status !== "paid") {
    throw new Error(`Cannot refund an order in status "${order.status}" — only paid orders can be refunded`)
  }
  await db.georgianPaymentOrder.update({
    where: { id },
    data: { status: "refunded", refundedAt: new Date() },
  })
  await logAdminAction(session, "payment.georgian.mark_refunded", "georgian_payment_order", id, {
    before: { status: order.status },
    after: { status: "refunded" },
  })
  revalidatePath("/admin/payments")
}
