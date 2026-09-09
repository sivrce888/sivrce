/**
 * Report a chat message — POST /api/chat/[roomId]/report
 * Body: { messageId, kind?, description? }
 * Zero-migration trust path: files a Complaint (subjectKind "chat_message",
 * subjectMessageId set) that the existing /admin moderation queue surfaces.
 */

import { auth } from "@/auth"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { ComplaintKind } from "@/generated/prisma/enums"
import { isChatParticipant } from "@/lib/chat"
import { rateLimitOk } from "@/lib/reviews/rate-limit"

interface RouteParams {
  params: Promise<{ roomId: string }>
}

// ComplaintKind values the chat UI offers — spam/scams/harassment cover the
// realistic chat-abuse reports; anything else files as "other".

export async function POST(req: Request, { params }: RouteParams) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }
  const me = session.user.id
  if (!rateLimitOk(`chatreport:${me}`, { max: 10 })) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 })
  }

  const { roomId } = await params
  if (!(await isChatParticipant(roomId, me))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  let body: { messageId?: string; kind?: string; description?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 })
  }
  if (!body.messageId) {
    return NextResponse.json({ error: "bad_target" }, { status: 400 })
  }

  const msg = await db.chatMessage.findUnique({
    where: { id: body.messageId },
    select: { id: true, roomId: true, senderId: true, content: true },
  })
  if (!msg || msg.roomId !== roomId || msg.senderId === me) {
    return NextResponse.json({ error: "bad_target" }, { status: 400 })
  }

  const kind: ComplaintKind = (Object.values(ComplaintKind) as string[]).includes(body.kind ?? "")
    ? (body.kind as ComplaintKind)
    : ComplaintKind.other
  const description = (body.description ?? "").slice(0, 500) || msg.content.slice(0, 500)

  try {
    const room = await db.chatRoom.findUnique({
      where: { id: roomId },
      select: { listingId: true },
    })
    await db.complaint.create({
      data: {
        subjectKind: "chat_message",
        subjectId: msg.id,
        subjectMessageId: msg.id,
        subjectUserId: msg.senderId,
        subjectListingId: room?.listingId ?? null,
        reporterId: me,
        kind,
        description,
      },
    })
    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (error) {
    console.error("[api/chat/report] failed:", (error as Error).message)
    return NextResponse.json({ error: "server_error" }, { status: 500 })
  }
}
