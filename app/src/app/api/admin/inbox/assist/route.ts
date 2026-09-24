/**
 * POST /api/admin/inbox/assist — AI summary + suggested reply for one room.
 * Admin-only, rate-limited; degrades to 503 when no AI key is configured.
 */

import { NextResponse } from "next/server"
import { requireAdminAction } from "@/lib/admin/guard"

import { rateLimitOk } from "@/lib/rate-limit"
import { db } from "@/lib/db"
import { summarizeConversationAi } from "@/lib/ai"

export async function POST(req: Request) {
  let session: Awaited<ReturnType<typeof requireAdminAction>>
  try {
    session = await requireAdminAction()
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  let body: { roomId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 })
  }
  const roomId = body.roomId
  if (!roomId || typeof roomId !== "string" || roomId.length > 120) {
    return NextResponse.json({ error: "bad_room" }, { status: 400 })
  }
  if (!rateLimitOk(`inbox-assist:${session.user.id}`, { windowMs: 60_000, max: 6 })) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 })
  }

  const room = await db.chatRoom.findUnique({
    where: { id: roomId },
    select: { id: true },
  })
  if (!room) return NextResponse.json({ error: "not_found" }, { status: 404 })

  const [messages, participants] = await Promise.all([
    db.chatMessage.findMany({
      where: { roomId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: { senderId: true, content: true, kind: true },
    }),
    db.chatParticipant.findMany({
      where: { roomId },
      select: { userId: true, role: true },
    }),
  ])
  // Participant rows carry bare ids — resolve names for the model prompt.
  const userIds = [...new Set(participants.map((p) => p.userId))]
  const users = await db.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true },
  })
  const nameById = new Map(users.map((u) => [u.id, u.name ?? "user"]))
  // Model prompt reads better with named roles than bare user ids.
  const nameOf = (senderId: string) => {
    const p = participants.find((x) => x.userId === senderId)
    if (!p) return "unknown"
    const name = nameById.get(senderId) ?? ""
    return p.role === "member" ? `buyer ${name}` : `${p.role} ${name}`
  }
  const turns = messages
    .reverse()
    .filter((m) => m.kind === "text" || m.kind === "image" || m.kind === "file")
    .map((m) => ({ senderId: nameOf(m.senderId), content: m.content }))

  const assist = await summarizeConversationAi(turns)
  if (!assist) return NextResponse.json({ error: "ai_unavailable" }, { status: 503 })
  return NextResponse.json({ assist })
}
