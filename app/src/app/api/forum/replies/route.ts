import { type NextRequest, NextResponse } from "next/server"

import { auth } from "@/auth"
import { createForumReply } from "@/lib/forum-live"
import { clientIp, rateLimitOk } from "@/lib/reviews/rate-limit"
import { isSameOrigin } from "@/lib/security/origin"

export const dynamic = "force-dynamic"

const MIN_BODY = 10
const MAX_BODY = 4000

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "bad_origin" }, { status: 403 })
  }
  const ip = clientIp(req.headers)
  if (!rateLimitOk(`forum:${ip}`)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 })
  }

  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  let payload: unknown
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 })
  }
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 })
  }
  const p = payload as Record<string, unknown>

  const slug = typeof p.slug === "string" ? p.slug.trim() : ""
  const body = typeof p.body === "string" ? p.body.trim() : ""
  const authorName = (
    session.user.name?.trim() ||
    (typeof p.authorName === "string" ? p.authorName.trim() : "") ||
    ""
  ).slice(0, 80)

  if (!slug || slug.length > 180) {
    return NextResponse.json({ error: "invalid_slug" }, { status: 400 })
  }
  if (body.length < MIN_BODY || body.length > MAX_BODY) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 })
  }
  if (!authorName) {
    return NextResponse.json({ error: "author_name_required" }, { status: 400 })
  }

  try {
    const reply = await createForumReply({
      slug,
      ownerId: session.user.id,
      authorName,
      body,
    })
    return NextResponse.json({ ok: true, reply }, { status: 201 })
  } catch (err) {
    if (err instanceof Error && err.message === "thread_not_found") {
      return NextResponse.json({ error: "thread_not_found" }, { status: 404 })
    }
    return NextResponse.json({ error: "db_unavailable" }, { status: 500 })
  }
}
