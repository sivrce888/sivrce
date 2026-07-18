import { NextResponse } from "next/server"

import { auth } from "@/auth"
import { isSameOrigin } from "@/lib/security/origin"
import { sendVerifySms } from "@/lib/sms/twilio-verify"

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
  const result = await sendVerifySms(body.phone ?? "")
  if (!result.ok) {
    const status = result.error === "sms_unconfigured" ? 503 : 400
    return NextResponse.json({ ok: false, error: result.error }, { status })
  }
  return NextResponse.json({ ok: true })
}
