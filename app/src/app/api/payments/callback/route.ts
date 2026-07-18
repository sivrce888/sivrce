/**
 * POST /api/payments/callback
 * Bank webhook (TBC: {"PaymentId"} · BOG: {event, body:{order_id}} + RSA signature).
 * The body is never trusted: BOG's Callback-Signature is verified when present,
 * and paid state is decided only by a server-to-server lookup (finalizeOrder).
 * Always 200 on handled payloads so the bank stops retrying; 4xx/5xx → bank retries.
 */

import { NextResponse } from "next/server"
import { finalizeOrder, getPaymentProvider, verifyBogCallbackSignature } from "@/lib/payments"

export async function POST(req: Request) {
  const raw = await req.text()

  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(raw) as Record<string, unknown>
  } catch {
    // Some gateways send form-encoded callbacks
    try {
      payload = Object.fromEntries(new URLSearchParams(raw).entries())
    } catch {
      return NextResponse.json({ error: "bad_request" }, { status: 400 })
    }
  }

  // BOG signs callbacks (SHA256withRSA over the raw body). An invalid signature
  // means the payload is forged or corrupted — reject before trusting any field.
  const signature = req.headers.get("callback-signature")
  if (signature && !verifyBogCallbackSignature(raw, signature)) {
    console.error("[api/payments/callback] invalid BOG callback signature")
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 })
  }

  const bogBody = payload.body as Record<string, unknown> | undefined
  const providerOrderId = String(
    payload.PaymentId ??
      bogBody?.order_id ??
      payload.providerOrderId ??
      payload.order_id ??
      payload.OrderId ??
      "",
  )

  if (!providerOrderId) {
    return NextResponse.json({ error: "missing_order_id" }, { status: 400 })
  }

  try {
    const result = await finalizeOrder(getPaymentProvider(), providerOrderId, payload)
    return NextResponse.json({ ok: true, outcome: result.outcome })
  } catch (error) {
    // 5xx → the bank retries the webhook; the flip itself is idempotent.
    console.error("[api/payments/callback] failed:", (error as Error).message)
    return NextResponse.json({ error: "server_error" }, { status: 500 })
  }
}
