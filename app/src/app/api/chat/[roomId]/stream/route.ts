/**
 * SSE endpoint for real-time chat messages.
 * ponytail: polling-based SSE — 2 s indexed delta reads + peer read/typing state.
 * Upgrade path: Redis pub/sub when message volume warrants it.
 */

import { auth } from "@/auth"
import {
  getChatMessages,
  getChatMessagesAfter,
  getPeerLastReadAt,
  isPeerTyping,
} from "@/lib/chat"

interface RouteParams {
  params: Promise<{ roomId: string }>
}

const POLL_INTERVAL_MS = 2000
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
      let cursorId: string | null = null
      let cursorAt: Date | null = null
      let peerReadAt: string | null = null
      let peerTyping = false
      let heartbeat: ReturnType<typeof setInterval> | null = null
      let poll: ReturnType<typeof setInterval> | null = null
      let aborted = false
      let polling = false
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
        if (polling) return
        polling = true
        try {
          if (cursorAt) {
            const fresh = await getChatMessagesAfter(roomId, cursorId!, cursorAt)
            if (fresh.length > 0) {
              const last = fresh[fresh.length - 1]!
              cursorId = last.id
              cursorAt = last.createdAt
              send("message", { messages: fresh })
            }
          }

          const read = await getPeerLastReadAt(roomId, me)
          if (read !== peerReadAt) {
            peerReadAt = read
            send("read", { readAt: read })
          }

          const typing = await isPeerTyping(roomId, me)
          if (typing !== peerTyping) {
            peerTyping = typing
            send("typing", { typing })
          }
        } catch (error) {
          console.error("[api/chat/stream] poll error:", (error as Error).message)
          // ponytail: keep polling even on transient errors
        } finally {
          polling = false
        }
      }

      heartbeat = setInterval(() => {
        send("heartbeat", { ts: Date.now() })
      }, HEARTBEAT_INTERVAL_MS)

      poll = setInterval(pollTick, POLL_INTERVAL_MS)

      // Initial seed — client merges by id, so overlap with its own fetch is safe
      try {
        const { messages } = await getChatMessages(roomId)
        const last = messages[messages.length - 1]
        if (last) {
          cursorId = last.id
          cursorAt = last.createdAt
        }
        peerReadAt = await getPeerLastReadAt(roomId, me)
        send("seed", { messages, readAt: peerReadAt })
      } catch {
        send("seed", { messages: [], readAt: null })
      }

      // Cleanup on abort
      req.signal.addEventListener("abort", () => {
        aborted = true
        if (heartbeat) clearInterval(heartbeat)
        if (poll) clearInterval(poll)
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
