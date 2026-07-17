/**
 * POST /api/payments/callback
 * Payment provider webhook/callback handler.
 * Validates the callback, updates order status, activates tier if paid.
 */

import { NextResponse } from "next/server"
import { handleCallback, getPaymentProvider } from "@/lib/payments"

export async function POST(req: Request) {
  let payload: Record<string, unknown>
  try {
    payload = await req.json()
  } catch {
    // Some payment gateways send form-encoded callbacks
    try {
      const formData = await req.formData()
      payload = Object.fromEntries(formData.entries())
    } catch {
      return NextResponse.json({ error: "bad_request" }, { status: 400 })
    }
  }

  const providerOrderId = (payload.providerOrderId ?? payload.order_id ?? payload.OrderId ?? "") as string
  const status = (payload.status ?? payload.Status ?? "") as string

  if (!providerOrderId) {
    return NextResponse.json({ error: "missing_order_id" }, { status: 400 })
  }

  try {
    const provider = getPaymentProvider()
    await handleCallback(provider, { providerOrderId, status })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[api/payments/callback] failed:", (error as Error).message)
    return NextResponse.json({ error: "server_error" }, { status: 500 })
  }
}

// ponytail: GET also handles simple redirect-based callbacks (mock provider, etc.)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const providerOrderId = searchParams.get("orderId") ?? searchParams.get("order_id") ?? ""
  const status = searchParams.get("status") ?? ""

  if (!providerOrderId) {
    return NextResponse.json({ error: "missing_order_id" }, { status: 400 })
  }

  try {
    const provider = getPaymentProvider()
    await handleCallback(provider, { providerOrderId, status })
    // ponytail: redirect to a thank-you page in production
    return NextResponse.redirect(new URL("/dashboard?paid=1", req.url))
  } catch (error) {
    console.error("[api/payments/callback] GET failed:", (error as Error).message)
    return NextResponse.json({ error: "server_error" }, { status: 500 })
  }
}
