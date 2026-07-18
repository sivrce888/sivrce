"use server"

import { revalidatePath } from "next/cache"

import { SubscriptionStatus } from "@/generated/prisma/enums"
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

/**
 * Local record only — marks a succeeded Stripe order as refunded.
 * The Stripe SDK is not installed, so no Stripe API refund is issued here;
 * the actual refund is done manually in the Stripe dashboard.
 */
export async function markStripeOrderRefunded(fd: FormData) {
  const session = await requireAdminAction()
  const id = reqString(fd, "id", 120)
  const order = await db.stripeOrder.findUnique({
    where: { id },
    select: { status: true },
  })
  if (!order) throw new Error("Order not found")
  if (order.status !== "succeeded") {
    throw new Error(
      `Cannot refund an order in status "${order.status}" — only succeeded orders can be refunded`,
    )
  }
  await db.stripeOrder.update({
    where: { id },
    data: { status: "refunded" },
  })
  await logAdminAction(session, "payment.stripe.mark_refunded", "stripe_order", id, {
    before: { status: order.status },
    after: { status: "refunded" },
  })
  revalidatePath("/admin/payments")
}

/**
 * Admin comp/cancel of a subscription row. Local state only — no Stripe API
 * call (SDK not installed); mirror the cancellation in the Stripe dashboard.
 */
export async function cancelSubscription(fd: FormData) {
  const session = await requireAdminAction()
  const id = reqString(fd, "id", 120)
  const sub = await db.subscription.findUnique({
    where: { id },
    select: { status: true },
  })
  if (!sub) throw new Error("Subscription not found")
  if (sub.status !== SubscriptionStatus.active && sub.status !== SubscriptionStatus.trialing) {
    throw new Error(
      `Cannot cancel a subscription in status "${sub.status}" — only active or trialing subscriptions can be canceled`,
    )
  }
  await db.subscription.update({
    where: { id },
    data: { status: SubscriptionStatus.canceled, canceledAt: new Date() },
  })
  await logAdminAction(session, "payment.subscription.cancel", "subscription", id, {
    before: { status: sub.status },
    after: { status: SubscriptionStatus.canceled },
  })
  revalidatePath("/admin/payments")
}
