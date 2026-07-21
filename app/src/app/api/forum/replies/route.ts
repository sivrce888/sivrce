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
  const parentId = typeof p.parentId === "string" ? p.parentId.trim() : null
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
      parentId,
    })
    return NextResponse.json({ ok: true, reply }, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : ""
    if (msg === "thread_not_found") {
      return NextResponse.json({ error: "thread_not_found" }, { status: 404 })
    }
    if (msg === "parent_not_found") {
      return NextResponse.json({ error: "parent_not_found" }, { status: 404 })
    }
    if (msg === "nest_too_deep") {
      return NextResponse.json({ error: "nest_too_deep" }, { status: 400 })
    }
    return NextResponse.json({ error: "db_unavailable" }, { status: 500 })
  }
}
