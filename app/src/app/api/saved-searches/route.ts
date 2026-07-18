/**
 * /api/saved-searches — server-backed saved searches with instant alerts.
 * Auth-gated, same-origin only (client redirects to signin on 401).
 *
 * Stores the page-URL query string (short grammar: deal/type/min/max/…) for
 * "run this search" links, plus the parsed SearchFilters (via the SHARED
 * parseSearchParams) so the alert matcher reuses exact /api/search semantics.
 *
 * ponytail: GET+POST+PATCH+DELETE in one route, soft delete, no pagination
 * (client caps at 20 per user).
 */

import { randomUUID } from "node:crypto"

import { type NextRequest, NextResponse } from "next/server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import type { Prisma } from "@/generated/prisma/client"
import { parseSearchParams } from "@/lib/search-filters"
import { isSameOrigin } from "@/lib/security/origin"
import type { SavedSearchParams } from "@/lib/saved-search-alerts"

export const dynamic = "force-dynamic"

const MAX_PER_USER = 20

/** Page-URL short grammar → /api/search grammar (SearchClient's own mapping). */
const KEY_MAP: Record<string, string> = {
  deal: "dealType",
  type: "propertyType",
  min: "minPrice",
  max: "maxPrice",
  amin: "minArea",
  amax: "maxArea",
}
const PASS_THROUGH = new Set([
  "q", "city", "district", "rooms", "beds", "baths", "fmin", "fmax",
  "cond", "bstat", "feat", "photo", "verified", "pets", "seller",
  "from", "to", "cur", "sort",
])

function toApiParams(pageQuery: string): URLSearchParams {
  const out = new URLSearchParams()
  for (const [k, v] of new URLSearchParams(pageQuery)) {
    const apiKey = KEY_MAP[k] ?? (PASS_THROUGH.has(k) ? k : null)
    if (apiKey) out.append(apiKey, v)
  }
  return out
}

const asStr = (v: unknown, max: number): string | null =>
  typeof v === "string" && v.trim().length > 0 && v.length <= max ? v.trim() : null

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 })
  }
  const rows = await db.savedSearch.findMany({
    where: { userId: session.user.id, deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: MAX_PER_USER,
  })
  return NextResponse.json({
    ok: true,
    searches: rows.map((r) => ({
      id: r.id,
      name: r.name,
      query: ((r.params as SavedSearchParams | null)?.q ?? "") as string,
      alertEnabled: r.alertEnabled,
      createdAt: r.createdAt.toISOString(),
    })),
  })
}

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ ok: false, error: "bad_origin" }, { status: 403 })
  }
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ ok: false, error: "bad_json" }, { status: 400 })
  }

  const name = asStr(body.name, 160)
  const query = typeof body.query === "string" && body.query.length <= 800 ? body.query : null
  const lang = asStr(body.lang, 8) ?? undefined
  if (!name || query === null) {
    return NextResponse.json({ ok: false, error: "invalid_fields" }, { status: 400 })
  }

  const params: SavedSearchParams = {
    q: query,
    lang,
    filters: parseSearchParams(toApiParams(query)),
  }
  // Prisma Json columns need an explicit JsonValue cast (SearchFilters has
  // optional props; values are already JSON-safe after parsing).
  const paramsJson = params as unknown as Prisma.InputJsonValue

  // Dedupe by query per user (JS filter — ≤20 rows): re-saving revives + refreshes.
  const existing = await db.savedSearch.findMany({
    where: { userId: session.user.id },
    select: { id: true, params: true, deletedAt: true },
  })
  const dupe = existing.find((r) => (r.params as SavedSearchParams | null)?.q === query)

  if (dupe) {
    await db.savedSearch.update({
      where: { id: dupe.id },
      data: { name, params: paramsJson, alertEnabled: true, deletedAt: null },
    })
    return NextResponse.json({ ok: true, id: dupe.id }, { status: 200 })
  }

  if (existing.filter((r) => r.deletedAt === null).length >= MAX_PER_USER) {
    return NextResponse.json({ ok: false, error: "limit_reached" }, { status: 409 })
  }

  const row = await db.savedSearch.create({
    data: { id: `ss_${randomUUID()}`, userId: session.user.id, name, params: paramsJson },
    select: { id: true },
  })
  return NextResponse.json({ ok: true, id: row.id }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ ok: false, error: "bad_origin" }, { status: 403 })
  }
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ ok: false, error: "bad_json" }, { status: 400 })
  }
  const id = asStr(body.id, 120)
  if (!id || typeof body.alertEnabled !== "boolean") {
    return NextResponse.json({ ok: false, error: "invalid_fields" }, { status: 400 })
  }

  const result = await db.savedSearch.updateMany({
    where: { id, userId: session.user.id, deletedAt: null },
    data: { alertEnabled: body.alertEnabled },
  })
  if (result.count === 0) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 })
  }
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ ok: false, error: "bad_origin" }, { status: 403 })
  }
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 })
  }

  const id = asStr(new URL(req.url).searchParams.get("id"), 120)
  if (!id) {
    return NextResponse.json({ ok: false, error: "invalid_fields" }, { status: 400 })
  }

  await db.savedSearch.updateMany({
    where: { id, userId: session.user.id },
    data: { deletedAt: new Date(), alertEnabled: false },
  })
  return NextResponse.json({ ok: true })
}
