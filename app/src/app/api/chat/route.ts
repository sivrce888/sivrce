/**
 * Chat rooms API
 * GET  - List the current user's chat rooms
 * POST - Create a new chat room for a listing
 */

import { auth } from "@/auth"
import { NextResponse } from "next/server"
import { getUserChats, getOrCreateChatRoom } from "@/lib/chat"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  try {
    const rooms = await getUserChats(session.user.id)
    return NextResponse.json({ rooms })
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

  let body: { listingId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 })
  }

  if (!body.listingId) {
    return NextResponse.json({ error: "missing_listing_id" }, { status: 400 })
  }

  try {
    const room = await getOrCreateChatRoom(body.listingId, session.user.id)
    return NextResponse.json({ room }, { status: 201 })
  } catch (error) {
    console.error("[api/chat] POST failed:", (error as Error).message)
    return NextResponse.json({ error: "server_error" }, { status: 500 })
  }
}
