/**
 * /api/price-watches — favorite price-drop alerts (auth).
 * POST { listingId, lang? } · DELETE ?listingId= · GET → ids[]
 */

import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { isSameOrigin } from "@/lib/security/origin"
import {
  listPriceWatchIds,
  removePriceWatch,
  upsertPriceWatch,
} from "@/lib/price-watches"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 })
  }
  const ids = await listPriceWatchIds(session.user.id)
  return NextResponse.json({ ok: true, ids })
}

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ ok: false, error: "bad_origin" }, { status: 403 })
  }
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 })
  }
  const body = (await req.json().catch(() => null)) as { listingId?: string; lang?: string } | null
  const listingId = typeof body?.listingId === "string" ? body.listingId.trim().slice(0, 120) : ""
  if (!listingId) {
    return NextResponse.json({ ok: false, error: "bad_id" }, { status: 400 })
  }
  const lang = typeof body?.lang === "string" ? body.lang.slice(0, 8) : "ka"
  const result = await upsertPriceWatch(session.user.id, listingId, lang)
  if (result === "not_found") {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 })
  }
  if (result === "limit") {
    return NextResponse.json({ ok: false, error: "limit" }, { status: 400 })
  }
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ ok: false, error: "bad_origin" }, { status: 403 })
  }
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 })
  }
  const listingId = req.nextUrl.searchParams.get("listingId")?.trim().slice(0, 120) ?? ""
  if (!listingId) {
    return NextResponse.json({ ok: false, error: "bad_id" }, { status: 400 })
  }
  await removePriceWatch(session.user.id, listingId)
  return NextResponse.json({ ok: true })
}
