import { type NextRequest, NextResponse } from "next/server"

import { auth } from "@/auth"
import { FORUM_CATEGORIES, createForumThread } from "@/lib/forum-live"
import { clientIp, rateLimitOk } from "@/lib/reviews/rate-limit"
import { isSameOrigin } from "@/lib/security/origin"

export const dynamic = "force-dynamic"

const MIN_TITLE = 8
const MAX_TITLE = 200
const MIN_BODY = 20
const MAX_BODY = 8000
const MAX_DISTRICT = 80
const MAX_TAGS = 5

function parseTags(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((t): t is string => typeof t === "string")
    .map((t) => t.trim().slice(0, 40))
    .filter(Boolean)
    .slice(0, MAX_TAGS)
}

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

  const title = typeof p.title === "string" ? p.title.trim() : ""
  const body = typeof p.body === "string" ? p.body.trim() : ""
  const category = typeof p.category === "string" ? p.category.trim() : ""
  const district = typeof p.district === "string" ? p.district.trim() : "თბილისი"
  const authorName = (
    session.user.name?.trim() ||
    (typeof p.authorName === "string" ? p.authorName.trim() : "") ||
    ""
  ).slice(0, 80)

  if (title.length < MIN_TITLE || title.length > MAX_TITLE) {
    return NextResponse.json({ error: "invalid_title" }, { status: 400 })
  }
  if (body.length < MIN_BODY || body.length > MAX_BODY) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 })
  }
  if (!(FORUM_CATEGORIES as readonly string[]).includes(category)) {
    return NextResponse.json({ error: "invalid_category" }, { status: 400 })
  }
  if (!district || district.length > MAX_DISTRICT) {
    return NextResponse.json({ error: "invalid_district" }, { status: 400 })
  }
  if (!authorName) {
    return NextResponse.json({ error: "author_name_required" }, { status: 400 })
  }

  try {
    const thread = await createForumThread({
      ownerId: session.user.id,
      authorName,
      title,
      body,
      category,
      district,
      tags: parseTags(p.tags),
    })
    return NextResponse.json({ ok: true, slug: thread.slug, thread }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "db_unavailable" }, { status: 500 })
  }
}
