/**
 * Block / unblock the counterparty of a room — POST /api/chat/[roomId]/block
 * Body: { block: boolean }
 * Room-scoped on purpose: the peer is resolved server-side from the room, so
 * the endpoint can never be pointed at a stranger the caller never met.
 */

import { auth } from "@/auth"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { SUPPORT_ROLE, blockUser, unblockUser } from "@/lib/chat"
import { rateLimitOk } from "@/lib/reviews/rate-limit"

interface RouteParams {
  params: Promise<{ roomId: string }>
}

export async function POST(req: Request, { params }: RouteParams) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }
  const me = session.user.id
  if (!rateLimitOk(`chatblock:${me}`, { max: 20 })) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 })
  }

  const { roomId } = await params

  let body: { block?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 })
  }
  if (typeof body.block !== "boolean") {
    return NextResponse.json({ error: "bad_target" }, { status: 400 })
  }

  const seats = await db.chatParticipant.findMany({
    where: { roomId },
    select: { userId: true, role: true },
  })
  if (!seats.some((s) => s.userId === me)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }
  const peer = seats.find((s) => s.userId !== me)
  if (!peer) {
    return NextResponse.json({ error: "no_peer" }, { status: 409 })
  }
  // The support line is the escalation path — blocking it would strand the
  // user with no way to reach a human.
  if (peer.role === SUPPORT_ROLE) {
    return NextResponse.json({ error: "not_blockable" }, { status: 409 })
  }

  try {
    if (body.block) await blockUser(me, peer.userId)
    else await unblockUser(me, peer.userId)
    return NextResponse.json({ ok: true, blocked: body.block })
  } catch (error) {
    const msg = (error as Error).message
    if (msg === "self_block") return NextResponse.json({ error: "self_block" }, { status: 400 })
    console.error("[api/chat/block] failed:", msg)
    return NextResponse.json({ error: "server_error" }, { status: 500 })
  }
}
