/**
 * Server fallback for chat translation (browsers without Chrome's on-device
 * Translator — see components/chat/translate.ts). Translates a stored
 * message by id, never caller-supplied text: only room members can
 * translate, and the endpoint can't be used as a free LLM proxy.
 */

import { auth } from "@/auth"
import { NextResponse } from "next/server"
import { rateLimitOk } from "@/lib/rate-limit"
import { translateText } from "@/lib/ai"
import { db } from "@/lib/db"
import { isChatParticipant } from "@/lib/chat"
import { isValidLang } from "@/lib/i18n/core"

export const maxDuration = 15

// ponytail: per-instance memo (messages are immutable once sent); move to a
// DB column if translate volume ever shows up in the Gemini bill.
const CACHE_MAX = 500
const cache = new Map<string, string>()

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }
  const userId = session.user.id

  let body: { messageId?: unknown; targetLang?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 })
  }

  const { messageId, targetLang } = body
  if (typeof messageId !== "string" || messageId.length === 0 || messageId.length > 120) {
    return NextResponse.json({ error: "bad_message" }, { status: 400 })
  }
  if (typeof targetLang !== "string" || !isValidLang(targetLang)) {
    return NextResponse.json({ error: "bad_lang" }, { status: 400 })
  }

  const key = `${messageId}:${targetLang}`
  const hit = cache.get(key)
  if (hit) return NextResponse.json({ ok: true, translated: hit })

  if (!rateLimitOk(`chat-trans:${userId}`, { max: 40 })) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 })
  }

  const msg = await db.chatMessage.findUnique({
    where: { id: messageId },
    select: { roomId: true, content: true, deletedAt: true },
  })
  // One 404 for "missing", "unsent" and "not your room" — no id probing.
  if (!msg || msg.deletedAt || !msg.content.trim() || !(await isChatParticipant(msg.roomId, userId))) {
    return NextResponse.json({ error: "not_found" }, { status: 404 })
  }

  try {
    const translated = await translateText(msg.content, targetLang)
    if (!translated) {
      return NextResponse.json({ error: "translation_unavailable" }, { status: 503 })
    }
    if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value!)
    cache.set(key, translated)
    return NextResponse.json({ ok: true, translated })
  } catch (err) {
    console.error("[api/chat/translate] failed:", (err as Error).message)
    return NextResponse.json({ error: "server_error" }, { status: 500 })
  }
}
