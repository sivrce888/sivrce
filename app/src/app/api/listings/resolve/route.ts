import { NextResponse } from "next/server"
import { getListing as getDbListing, resolveListingQuery } from "@/lib/listings-db"
import { listingPath } from "@/lib/listing-slug"
import { parseListingNumber, parsePhoneDigits } from "@/lib/listing-public-id"

export const runtime = "nodejs"

/**
 * GET /api/listings/resolve?q=24316314 | ?q=597737123
 * → { ok, id, publicId, path } for hero ID·phone jump.
 * Live DB only — no mock public-id table.
 */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? ""
  if (!q || q.length > 40) {
    return NextResponse.json({ ok: false, error: "q required" }, { status: 400 })
  }
  if (!parseListingNumber(q) && !parsePhoneDigits(q)) {
    return NextResponse.json({ ok: false, error: "not an id or phone" }, { status: 400 })
  }

  try {
    const hit = await resolveListingQuery(q)
    if (hit) {
      const listing = await getDbListing(hit.id)
      const path = listing ? listingPath(listing) : `/listing/${hit.id}`
      return NextResponse.json({ ok: true, id: hit.id, publicId: hit.publicId, path })
    }
  } catch {
    /* DB down */
  }

  return NextResponse.json({ ok: false, error: "not found" }, { status: 404 })
}
