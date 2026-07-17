import { logAdminAction } from "@/lib/admin/audit"
import { requireAdminAction } from "@/lib/admin/guard"
import { syncAllListings, type ListingDocument } from "@/lib/search"
import { db } from "@/lib/db"

/**
 * POST /api/admin/sync-search
 * Admin-only endpoint to trigger a full Meilisearch reindex.
 *
 * ponytail: synchronous, single-pass. For large datasets (>50k listings),
 * consider a background job pattern with status polling.
 */

export async function POST() {
  // Auth guard — throws 403 if not admin.
  let session
  try {
    session = await requireAdminAction()
  } catch {
    return Response.json({ ok: false, error: "forbidden" }, { status: 403 })
  }

  // Fetch all active listings from DB and map to Meilisearch documents.
  let listings: ListingDocument[]
  try {
    const rows = await db.listing.findMany({
      where: { deletedAt: null, status: "active" },
      select: {
        id: true,
        title: true,
        description: true,
        city: true,
        district: true,
        address: true,
        dealType: true,
        propertyType: true,
        price: true,
        currency: true,
        area: true,
        rooms: true,
        bedrooms: true,
        bathrooms: true,
        floor: true,
        totalFloors: true,
        features: true,
        images: true,
        lat: true,
        lng: true,
        createdAt: true,
        status: true,
        trustScore: true,
      },
      take: 50000, // ponytail: cap for safety; upgrade: paginate.
    })

    listings = rows.map((row) => ({
      ...row,
      features: (row.features as string[]) ?? [],
      images: (row.images as string[]) ?? [],
      floor: row.floor ?? undefined,
      totalFloors: row.totalFloors ?? undefined,
      createdAt: row.createdAt.toISOString(),
    }))
  } catch (e) {
    console.error("[admin/sync-search] DB fetch failed:", (e as Error).message)
    return Response.json(
      { ok: false, error: "db_error", detail: (e as Error).message },
      { status: 500 },
    )
  }

  const result = await syncAllListings(listings)

  if (!result.ok) {
    return Response.json(
      { ok: false, error: result.error ?? "sync_failed", indexed: result.indexed },
      { status: 500 },
    )
  }

  await logAdminAction(session, "search.sync_listings", "search_index", "listings", {
    indexed: result.indexed,
    total: listings.length,
  })

  return Response.json({
    ok: true,
    indexed: result.indexed,
    total: listings.length,
  })
}
