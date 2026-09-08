/**
 * Chat rooms API
 * GET  - List the current user's chat rooms
 * POST - Open a room: { listingId } | { userId } (direct) | { support: true }
 */

import { auth } from "@/auth"
import { NextResponse } from "next/server"
import {
  getChatUnread,
  getOrCreateChatRoom,
  getOrCreateDirectRoom,
  getOrCreateSupportRoom,
  getUserChats,
} from "@/lib/chat"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  try {
    const [rooms, unread] = await Promise.all([
      getUserChats(session.user.id),
      getChatUnread(session.user.id),
    ])
    return NextResponse.json({ rooms, unread })
  } catch (error) {
    console.error("[api/chat] GET failed:", (error as Error).message)
    return NextResponse.json({ error: "server_error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }
  const me = session.user.id

  let body: { listingId?: string; userId?: string; support?: boolean }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 })
  }

  // Exactly one target — listing room, direct room, or the support line
  const targets = [body.listingId, body.userId, body.support ? "support" : null].filter(
    Boolean,
  ) as string[]
  if (targets.length !== 1) {
    return NextResponse.json({ error: "bad_target" }, { status: 400 })
  }

  try {
    const room = body.listingId
      ? await getOrCreateChatRoom(body.listingId, me)
      : body.userId
        ? await getOrCreateDirectRoom(me, body.userId)
        : await getOrCreateSupportRoom(me)
    return NextResponse.json({ room }, { status: 201 })
  } catch (error) {
    const msg = (error as Error).message
    if (msg === "self_chat") {
      return NextResponse.json({ error: "self_chat" }, { status: 400 })
    }
    if (msg === "peer_not_found") {
      return NextResponse.json({ error: "peer_not_found" }, { status: 404 })
    }
    console.error("[api/chat] POST failed:", msg)
    return NextResponse.json({ error: "server_error" }, { status: 500 })
  }
}
