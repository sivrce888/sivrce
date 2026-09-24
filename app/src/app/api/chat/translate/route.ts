/**
 * Real-time message translation API for cross-border buyers and sellers.
 * Translates message content to the user's active locale.
 */

import { auth } from "@/auth"
import { NextResponse } from "next/server"
import { rateLimitOk } from "@/lib/rate-limit"
import { translateText } from "@/lib/ai"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const userId = session.user.id
  if (!rateLimitOk(`chat-trans:${userId}`, { max: 40 })) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 })
  }

  let body: { text?: string; targetLang?: "ka" | "en" | "ru" }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 })
  }

  const text = (body.text ?? "").trim()
  if (!text || text.length > 2000) {
    return NextResponse.json({ error: "bad_text" }, { status: 400 })
  }

  const targetLang = (body.targetLang === "ka" || body.targetLang === "ru" || body.targetLang === "en")
    ? body.targetLang
    : "ka"

  try {
    const translated = await translateText(text, targetLang)
    if (!translated) {
      return NextResponse.json({ error: "translation_unavailable" }, { status: 503 })
    }
    return NextResponse.json({ ok: true, translated })
  } catch (err) {
    console.error("[api/chat/translate] failed:", (err as Error).message)
    return NextResponse.json({ error: "server_error" }, { status: 500 })
  }
}
