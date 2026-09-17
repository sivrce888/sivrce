/**
 * Contact sivrce — POST /api/contact
 *
 * Signed in: the message is written into the user's support chat room, so it
 * lands in /admin/chats and the sender keeps a thread they can follow. Guests:
 * email only. Both paths also notify the configured contact inbox, because an
 * unread admin panel must never be the only place a question lives.
 */

import { NextResponse, type NextRequest } from "next/server"
import { auth } from "@/auth"
import { getOrCreateSupportRoom, sendMessage } from "@/lib/chat"
import { getConfig } from "@/lib/config"
import { sendEmail } from "@/lib/email"
import { checkRateLimit } from "@/lib/inquiries/rate-limit"
import { isSameOrigin } from "@/lib/security/origin"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const NAME_MAX = 120
const MESSAGE_MIN = 10
const MESSAGE_MAX = 2000

/** Escape before the values land in an HTML email body. */
function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : "&quot;",
  )
}

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  if (!checkRateLimit(`contact:${ip}`).ok) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 })
  }

  const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "")
  const name = str(body.name, NAME_MAX)
  const email = str(body.email, 240)
  const message = str(body.message, MESSAGE_MAX)

  // Honeypot: a real person never fills a field they cannot see. Answer 200 so
  // the bot learns nothing.
  if (str(body.company, 200)) return NextResponse.json({ ok: true })

  if (name.length < 2) return NextResponse.json({ error: "bad_name" }, { status: 400 })
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: "bad_email" }, { status: 400 })
  if (message.length < MESSAGE_MIN) {
    return NextResponse.json({ error: "bad_message" }, { status: 400 })
  }

  const session = await auth()
  let roomId: string | null = null

  // Signed in → the support thread is the record; the email is the nudge.
  if (session?.user?.id) {
    try {
      const room = await getOrCreateSupportRoom(session.user.id)
      await sendMessage(room.id, session.user.id, message)
      roomId = room.id
    } catch (error) {
      console.error("[api/contact] support room failed:", (error as Error).message)
      // Keep going — the email below is the fallback channel, not a nicety.
    }
  }

  const to = await getConfig("site.contactEmail")
  const { ok } = await sendEmail({
    to,
    subject: `sivrce — ${name}`,
    html: `<p><strong>${esc(name)}</strong> &lt;${esc(email)}&gt;</p><p>${esc(message).replace(/\n/g, "<br>")}</p>${
      roomId ? `<p>Reply in /admin/chats (room ${esc(roomId)}).</p>` : ""
    }`,
  })

  // Only a total failure is an error: a stored support thread is a delivered
  // message even when the mail provider is down.
  if (!ok && !roomId) {
    return NextResponse.json({ error: "send_failed" }, { status: 502 })
  }
  return NextResponse.json({ ok: true, roomId })
}
