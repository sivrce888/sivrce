import { NextResponse } from "next/server"
import { LISTINGS, getListing as getMockListing } from "@/data/listings"
import { getListing as getDbListing, resolveListingQuery } from "@/lib/listings-db"
import { listingPath } from "@/lib/listing-slug"
import { listingPublicId, parseListingNumber, parsePhoneDigits, PUBLIC_ID_BASE } from "@/lib/listing-public-id"

export const runtime = "nodejs"

/**
 * GET /api/listings/resolve?q=24316314 | ?q=597737123
 * → { ok, id, publicId, path } for hero ID·phone jump.
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
    /* DB down — mock fallback */
  }

  const n = parseListingNumber(q)
  if (n != null) {
    const i = n - PUBLIC_ID_BASE
    if (i >= 0 && i < LISTINGS.length) {
      const l = getMockListing(LISTINGS[i]!.id)
      if (l) {
        return NextResponse.json({
          ok: true,
          id: l.id,
          publicId: listingPublicId(l),
          path: listingPath(l),
        })
      }
    }
  }

  return NextResponse.json({ ok: false, error: "not found" }, { status: 404 })
}
