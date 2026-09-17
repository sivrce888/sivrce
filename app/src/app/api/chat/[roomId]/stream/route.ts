/**
 * SSE endpoint for real-time chat messages.
 * ponytail: polling-based SSE — one batched indexed round-trip per tick
 * (new rows + tombstones + peer read position + typing flag), backing off
 * while the room is quiet. Upgrade path: Redis pub/sub when volume warrants.
 */

import { auth } from "@/auth"
import { getChatMessages, getRoomTick } from "@/lib/chat"

interface RouteParams {
  params: Promise<{ roomId: string }>
}

/** Live cadence while anything is happening — fast enough to read as instant. */
const POLL_MIN_MS = 2000
/** Idle ceiling. A silent room costs a third of an active one. */
const POLL_MAX_MS = 6000
/** Quiet ticks before each step down (10 × 2 s = 20 s of silence). */
const BACKOFF_AFTER_TICKS = 10
const HEARTBEAT_INTERVAL_MS = 15_000

export async function GET(req: Request, { params }: RouteParams) {
  const session = await auth()
  if (!session?.user?.id) {
    return new Response("unauthorized", { status: 401 })
  }

  const { roomId } = await params
  const me = session.user.id

  // Rooms are private — participants only, membership is set at room creation.
  const { db } = await import("@/lib/db")
  const participant = await db.chatParticipant.findUnique({
    where: { roomId_userId: { roomId, userId: me } },
    select: { userId: true },
  })
  if (!participant) {
    return new Response("forbidden", { status: 403 })
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      let cursor: { id: string; at: Date } | null = null
      let lastTickAt = new Date()
      let peerReadAt: string | null = null
      let peerTyping = false
      let heartbeat: ReturnType<typeof setInterval> | null = null
      let poll: ReturnType<typeof setTimeout> | null = null
      let aborted = false
      let quietTicks = 0
      let firstFrame = true

      const send = (event: string, data: unknown) => {
        if (aborted) return
        try {
          // `retry` rides the first frame so EventSource reconnects on our terms
          const retry = firstFrame ? "retry: 3000\n" : ""
          firstFrame = false
          controller.enqueue(encoder.encode(`${retry}event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
        } catch {
          // stream closed
        }
      }

      const pollTick = async () => {
        if (aborted) return
        let busy = false
        try {
          const tickAt = new Date()
          const tick = await getRoomTick(roomId, me, cursor, lastTickAt)
          lastTickAt = tickAt

          if (tick.fresh.length > 0) {
            const last = tick.fresh[tick.fresh.length - 1]!
            cursor = { id: last.id, at: last.createdAt }
            busy = true
          }
          // Tombstones ride the same frame: the client merges by id, so an
          // unsent message collapses in place on the peer's screen.
          const payload = [...tick.fresh, ...tick.unsent]
          if (payload.length > 0) send("message", { messages: payload })
          if (tick.unsent.length > 0) busy = true

          if (tick.peerReadAt !== peerReadAt) {
            peerReadAt = tick.peerReadAt
            send("read", { readAt: peerReadAt })
            busy = true
          }
          if (tick.typing !== peerTyping) {
            peerTyping = tick.typing
            send("typing", { typing: peerTyping })
            busy = true
          }
          if (peerTyping) busy = true
        } catch (error) {
          console.error("[api/chat/stream] poll error:", (error as Error).message)
          // ponytail: keep polling even on transient errors
        } finally {
          quietTicks = busy ? 0 : quietTicks + 1
          if (!aborted) {
            const delay = Math.min(
              POLL_MAX_MS,
              POLL_MIN_MS * (1 + Math.floor(quietTicks / BACKOFF_AFTER_TICKS)),
            )
            poll = setTimeout(pollTick, delay)
          }
        }
      }

      heartbeat = setInterval(() => {
        send("heartbeat", { ts: Date.now() })
      }, HEARTBEAT_INTERVAL_MS)

      // Initial seed — client merges by id, so overlap with its own fetch is safe.
      // An empty room still needs a cursor, or its first message never streams.
      const emptyCursor = () => ({ id: "", at: new Date() })
      try {
        const { messages } = await getChatMessages(roomId)
        const last = messages[messages.length - 1]
        cursor = last ? { id: last.id, at: last.createdAt } : emptyCursor()
        send("seed", { messages })
      } catch {
        cursor = emptyCursor()
        send("seed", { messages: [] })
      }

      poll = setTimeout(pollTick, POLL_MIN_MS)

      // Cleanup on abort
      req.signal.addEventListener("abort", () => {
        aborted = true
        if (heartbeat) clearInterval(heartbeat)
        if (poll) clearTimeout(poll)
      })
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // disable nginx buffering
    },
  })
}
