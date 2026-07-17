/**
 * SSE endpoint for real-time chat messages.
 * ponytail: Simple polling-based SSE — polls DB every 2s for new messages.
 * Upgrade path: Redis pub/sub when message volume warrants it.
 */

import { auth } from "@/auth"
import { getChatMessages, unreadCount } from "@/lib/chat"

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

  // Rooms are private — participants only, membership is set at room creation.
  const { db } = await import("@/lib/db")
  const participant = await db.chatParticipant.findUnique({
    where: { roomId_userId: { roomId, userId: session.user.id } },
  })
  if (!participant) {
    return new Response("forbidden", { status: 403 })
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      let lastMessageId: string | null = null
      let heartbeat: ReturnType<typeof setInterval> | null = null
      let poll: ReturnType<typeof setInterval> | null = null
      let aborted = false

      const send = (event: string, data: unknown) => {
        if (aborted) return
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
        } catch {
          // stream closed
        }
      }

      heartbeat = setInterval(() => {
        send("heartbeat", { ts: Date.now() })
      }, HEARTBEAT_INTERVAL_MS)

      poll = setInterval(async () => {
        try {
          // Fetch latest messages since last known ID
          const { messages } = await getChatMessages(roomId)
          const newMessages = lastMessageId
            ? messages.filter((m) => {
                // Simple ID-based comparison since CUIDs are time-sortable
                return m.id > (lastMessageId ?? "")
              })
            : messages

          if (newMessages.length > 0) {
            lastMessageId = newMessages[newMessages.length - 1]!.id
            send("message", { messages: newMessages })
          }

          // Also send updated unread count
          const count = await unreadCount(roomId, session.user!.id)
          send("unread", { roomId, count })
        } catch (error) {
          console.error("[api/chat/stream] poll error:", (error as Error).message)
          // ponytail: keep polling even on transient errors
        }
      }, POLL_INTERVAL_MS)

      // Initial seed
      try {
        const { messages } = await getChatMessages(roomId)
        if (messages.length > 0) {
          lastMessageId = messages[messages.length - 1]!.id
        }
        send("seed", { messages })
      } catch {
        send("seed", { messages: [] })
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
