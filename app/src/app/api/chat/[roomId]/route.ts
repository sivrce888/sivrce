/**
 * Single chat room API
 * GET   - Get paginated messages for a room
 * POST  - Send a message to the room
 * PATCH - Mark messages as read
 */

import { auth } from "@/auth"
import { NextResponse } from "next/server"
import { getChatMessages, isChatParticipant, markRead, sendMessage } from "@/lib/chat"

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

  try {
    const result = await getChatMessages(roomId, cursor)
    return NextResponse.json(result)
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

  if (!body.text || body.text.trim().length === 0) {
    return NextResponse.json({ error: "empty_message" }, { status: 400 })
  }

  try {
    const message = await sendMessage(
      roomId,
      session.user.id,
      body.text.trim(),
      body.kind ?? "text",
      body.metadata ?? {},
    )
    return NextResponse.json({ message }, { status: 201 })
  } catch (error) {
    if ((error as Error).message === "not_participant") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 })
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

  try {
    await markRead(roomId, session.user.id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[api/chat/roomId] PATCH failed:", (error as Error).message)
    return NextResponse.json({ error: "server_error" }, { status: 500 })
  }
}
