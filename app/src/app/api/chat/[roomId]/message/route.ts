/**
 * Unsend one of my own messages — DELETE /api/chat/[roomId]/message
 * Body: { messageId }
 * Soft delete: the body stops crossing the wire, the row stays so the
 * moderation queue keeps whatever it may already hold about it.
 */

import { auth } from "@/auth"
import { NextResponse } from "next/server"
import { isChatParticipant, unsendMessage } from "@/lib/chat"
import { rateLimitOk } from "@/lib/rate-limit"

interface RouteParams {
  params: Promise<{ roomId: string }>
}

export async function DELETE(req: Request, { params }: RouteParams) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }
  const me = session.user.id
  if (!rateLimitOk(`chatunsend:${me}`, { max: 30 })) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 })
  }

  const { roomId } = await params
  if (!(await isChatParticipant(roomId, me))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  let body: { messageId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 })
  }
  if (!body.messageId || typeof body.messageId !== "string") {
    return NextResponse.json({ error: "bad_target" }, { status: 400 })
  }

  try {
    await unsendMessage(roomId, body.messageId, me)
    return NextResponse.json({ ok: true })
  } catch (error) {
    const msg = (error as Error).message
    if (msg === "not_found") return NextResponse.json({ error: "not_found" }, { status: 404 })
    if (msg === "forbidden") return NextResponse.json({ error: "forbidden" }, { status: 403 })
    console.error("[api/chat/message] DELETE failed:", msg)
    return NextResponse.json({ error: "server_error" }, { status: 500 })
  }
}
