/**
 * Typing heartbeat — POST every ~3 s while the user types.
 * The SSE stream reads the 5 s TTL flag; no history is kept.
 */

import { auth } from "@/auth"
import { isChatParticipant, setChatTyping } from "@/lib/chat"

interface RouteParams {
  params: Promise<{ roomId: string }>
}

export async function POST(_req: Request, { params }: RouteParams) {
  const session = await auth()
  if (!session?.user?.id) {
    return new Response("unauthorized", { status: 401 })
  }

  const { roomId } = await params
  if (!(await isChatParticipant(roomId, session.user.id))) {
    return new Response("forbidden", { status: 403 })
  }

  try {
    await setChatTyping(roomId, session.user.id)
    return new Response(null, { status: 204 })
  } catch {
    // Typing is cosmetic — never surface storage errors to the sender
    return new Response(null, { status: 204 })
  }
}
