import { NextResponse } from "next/server"

import { auth } from "@/auth"
import { normalizePhone } from "@/lib/auth-phone"
import { clientIp, rateLimitOk } from "@/lib/reviews/rate-limit"
import { isSameOrigin } from "@/lib/security/origin"
import { sendVerifySms, toE164 } from "@/lib/sms/twilio-verify"

export const dynamic = "force-dynamic"

/** POST /api/phone/send-code — { phone: "+995 XXX XX XX XX" } */
export async function POST(req: Request) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ ok: false, error: "bad_origin" }, { status: 403 })
  }
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 })
  }
  let body: { phone?: string }
  try {
    body = (await req.json()) as { phone?: string }
  } catch {
    return NextResponse.json({ ok: false, error: "bad_json" }, { status: 400 })
  }
  // Each call = a paid Twilio SMS. Same budget as the login OTP path.
  const phone = normalizePhone(body.phone ?? "")
  if (!phone) {
    return NextResponse.json({ ok: false, error: "bad_phone" }, { status: 400 })
  }
  if (!rateLimitOk(`otp-ip:${clientIp(req.headers)}`) || !rateLimitOk(`otp-phone:${toE164(phone) ?? phone}`)) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 })
  }
  const result = await sendVerifySms(phone)
  if (!result.ok) {
    const status = result.error === "sms_unconfigured" ? 503 : 400
    return NextResponse.json({ ok: false, error: result.error }, { status })
  }
  return NextResponse.json({ ok: true })
}
