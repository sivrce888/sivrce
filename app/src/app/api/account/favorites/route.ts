/**
 * POST /api/account/favorites — cross-device favorites sync (auth, self-scoped).
 * Body `{ add?: string[], remove?: string[] }`; `{}` just reads. Always answers
 * with the user's full saved list so the client can 3-way merge in one trip.
 */

import { type NextRequest, NextResponse } from "next/server"

import { auth } from "@/auth"
import { parseFavPatch } from "@/lib/favorites-sync"
import { patchSaved } from "@/lib/saved-listings"
import { isSameOrigin } from "@/lib/security/origin"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ ok: false, error: "bad_origin" }, { status: 403 })
  }
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 })
  }
  const patch = parseFavPatch(await req.json().catch(() => null))
  if (!patch) {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 })
  }
  try {
    const ids = await patchSaved(userId, patch.add, patch.remove)
    return NextResponse.json({ ok: true, ids }, { headers: { "Cache-Control": "no-store" } })
  } catch {
    return NextResponse.json({ ok: false, error: "unavailable" }, { status: 503 })
  }
}
