import { NextResponse } from "next/server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { isSameOrigin } from "@/lib/security/origin"
import { checkVerifySms } from "@/lib/sms/twilio-verify"

export const dynamic = "force-dynamic"

/**
 * POST /api/phone/verify-code — { phone, code, listingId? }
 * Always stamps user.phoneVerifiedAt; optionally listing.listingPhoneVerifiedAt.
 */
export async function POST(req: Request) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ ok: false, error: "bad_origin" }, { status: 403 })
  }
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 })
  }
  let body: { phone?: string; code?: string; listingId?: string }
  try {
    body = (await req.json()) as { phone?: string; code?: string; listingId?: string }
  } catch {
    return NextResponse.json({ ok: false, error: "bad_json" }, { status: 400 })
  }

  const result = await checkVerifySms(body.phone ?? "", body.code ?? "")
  if (!result.ok) {
    const status = result.error === "sms_unconfigured" ? 503 : 400
    return NextResponse.json({ ok: false, error: result.error }, { status })
  }

  const now = new Date()
  await db.user.update({
    where: { id: session.user.id },
    data: {
      phone: body.phone ?? undefined,
      phoneVerifiedAt: now,
    },
  })

  if (body.listingId) {
    const owned = await db.listing.findFirst({
      where: { id: body.listingId, ownerId: session.user.id, deletedAt: null },
      select: { id: true },
    })
    if (owned) {
      await db.listing.update({
        where: { id: owned.id },
        data: {
          listingPhone: body.phone,
          listingPhoneVerifiedAt: now,
        },
      })
    }
  }

  return NextResponse.json({ ok: true, verifiedAt: now.toISOString() })
}
