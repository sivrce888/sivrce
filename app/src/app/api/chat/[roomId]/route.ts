/**
 * Single chat room API
 * GET   - Get paginated messages for a room
 * POST  - Send a message to the room
 * PATCH - Mark messages as read
 */

import { auth } from "@/auth"
import { NextResponse } from "next/server"
import {
  CHAT_MESSAGE_MAX,
  getChatMessages,
  getPeerLastReadAt,
  getRoomPushPeers,
  isChatParticipant,
  leaveChatRoom,
  markRead,
  sendMessage,
} from "@/lib/chat"

interface RouteParams {
  params: Promise<{ roomId: string }>
}

export async function GET(req: Request, { params }: RouteParams) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const { roomId } = await params
  if (!(await isChatParticipant(roomId, session.user.id))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const cursor = searchParams.get("cursor") ?? undefined
  if (cursor && Number.isNaN(Date.parse(cursor))) {
    return NextResponse.json({ error: "bad_cursor" }, { status: 400 })
  }

  try {
    const [result, peerReadAt] = await Promise.all([
      getChatMessages(roomId, cursor),
      cursor ? Promise.resolve(null) : getPeerLastReadAt(roomId, session.user.id),
    ])
    return NextResponse.json({ ...result, peerReadAt })
  } catch (error) {
    console.error("[api/chat/roomId] GET failed:", (error as Error).message)
    return NextResponse.json({ error: "server_error" }, { status: 500 })
  }
}

export async function POST(req: Request, { params }: RouteParams) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const { roomId } = await params

  let body: { text?: string; kind?: "text" | "image" | "file" | "system"; metadata?: Record<string, unknown> }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 })
  }

  const kind = body.kind === "image" || body.kind === "file" ? body.kind : "text"
  if (!body.text || body.text.trim().length === 0) {
    return NextResponse.json({ error: "empty_message" }, { status: 400 })
  }
  if (body.text.trim().length > CHAT_MESSAGE_MAX) {
    return NextResponse.json({ error: "too_long" }, { status: 400 })
  }
  // ponytail: metadata carries only client hints (e.g. clientId) — cap it
  const metadata =
    body.metadata && JSON.stringify(body.metadata).length <= 1000 ? body.metadata : {}

  try {
    const message = await sendMessage(roomId, session.user.id, body.text.trim(), kind, metadata)
    // Push fan-out is fire-and-forget: a dead push service must never fail
    // the send. VAPID-less dev machines no-op inside sendPushToUser.
    const me = session.user.id
    const preview = body.text.trim().slice(0, 120)
    void (async () => {
      try {
        const { peerIds, senderName } = await getRoomPushPeers(roomId, me)
        const { sendPushToUser } = await import("@/lib/push")
        await Promise.all(
          peerIds.map((peerId) =>
            sendPushToUser(peerId, {
              title: senderName,
              body: preview,
              url: `/?chat=${roomId}`,
            }).catch(() => {}),
          ),
        )
      } catch {
        // ponytail: poll/SSE still delivers when the app is open
      }
    })()
    return NextResponse.json({ message }, { status: 201 })
  } catch (error) {
    if ((error as Error).message === "not_participant") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 })
    }
    if ((error as Error).message === "too_long") {
      return NextResponse.json({ error: "too_long" }, { status: 400 })
    }
    if ((error as Error).message === "rate_limited") {
      return NextResponse.json({ error: "rate_limited" }, { status: 429 })
    }
    console.error("[api/chat/roomId] POST failed:", (error as Error).message)
    return NextResponse.json({ error: "server_error" }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: RouteParams) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const { roomId } = await params
  if (!(await isChatParticipant(roomId, session.user.id))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  try {
    await markRead(roomId, session.user.id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[api/chat/roomId] PATCH failed:", (error as Error).message)
    return NextResponse.json({ error: "server_error" }, { status: 500 })
  }
}

/** Leave a room — drops the caller's seat; history stays for the peer. */
export async function DELETE(_req: Request, { params }: RouteParams) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const { roomId } = await params
  try {
    const left = await leaveChatRoom(roomId, session.user.id)
    if (!left) return NextResponse.json({ error: "forbidden" }, { status: 403 })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[api/chat/roomId] DELETE failed:", (error as Error).message)
    return NextResponse.json({ error: "server_error" }, { status: 500 })
  }
}
