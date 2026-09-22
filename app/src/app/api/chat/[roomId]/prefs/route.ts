/**
 * Per-user room prefs — POST /api/chat/[roomId]/prefs
 * Body: { muted?: boolean, archived?: boolean }
 * Only ever touches the caller's own participant seat.
 */

import { auth } from "@/auth"
import { NextResponse } from "next/server"
import { setRoomPrefs } from "@/lib/chat"
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
  if (!rateLimitOk(`chatprefs:${me}`, { max: 30 })) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 })
  }

  const { roomId } = await params

  let body: { muted?: unknown; archived?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 })
  }
  const muted = typeof body.muted === "boolean" ? body.muted : undefined
  const archived = typeof body.archived === "boolean" ? body.archived : undefined
  if (muted === undefined && archived === undefined) {
    return NextResponse.json({ error: "bad_target" }, { status: 400 })
  }

  try {
    const ok = await setRoomPrefs(roomId, me, { muted, archived })
    if (!ok) return NextResponse.json({ error: "forbidden" }, { status: 403 })
    return NextResponse.json({ ok: true, muted, archived })
  } catch (error) {
    console.error("[api/chat/prefs] failed:", (error as Error).message)
    return NextResponse.json({ error: "server_error" }, { status: 500 })
  }
}
