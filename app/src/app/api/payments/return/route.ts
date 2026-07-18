/**
 * GET /api/payments/return?order=<internalId> | ?poid=<providerOrderId>
 * Browser return target for both banks (TBC returnurl, BOG redirect_urls).
 * A redirect proves nothing about money, so the order is re-verified
 * server-to-server (idempotent) and only then the user lands on a result page.
 */

import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { finalizeOrder, getPaymentProvider } from "@/lib/payments"

export async function GET(req: Request) {
  const { searchParams, origin } = new URL(req.url)
  const orderId = searchParams.get("order") ?? ""
  const poid = searchParams.get("poid") ?? searchParams.get("orderId") ?? ""

  const fail = (order?: string) =>
    NextResponse.redirect(new URL(`/payment/failed${order ? `?order=${order}` : ""}`, origin))

  try {
    let providerOrderId = poid
    const internalId = orderId

    if (internalId) {
      const row = await db.georgianPaymentOrder.findUnique({
        where: { id: internalId },
        select: { providerOrderId: true },
      })
      if (!row) return fail()
      providerOrderId = row.providerOrderId
    }
    if (!providerOrderId) return fail()

    const result = await finalizeOrder(getPaymentProvider(), providerOrderId, { return: true })
    const id = result.orderId ?? internalId

    if (result.outcome === "paid") {
      return NextResponse.redirect(new URL(`/payment/success${id ? `?order=${id}` : ""}`, origin))
    }
    if (result.outcome === "pending") {
      // Bank hasn't finalized yet — success page renders the "processing" state.
      return NextResponse.redirect(new URL(`/payment/success${id ? `?order=${id}` : ""}`, origin))
    }
    return fail(id || undefined)
  } catch (error) {
    console.error("[api/payments/return] failed:", (error as Error).message)
    return fail(orderId || undefined)
  }
}
