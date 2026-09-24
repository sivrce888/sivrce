/**
 * Server side of favorites sync — the `saved_listings` table (userId × listingId,
 * soft delete). The heart stays instant via localStorage; this makes it follow
 * the signed-in user across devices and lets owners see how many people saved
 * their listing.
 *
 * Only DB listings persist here. Catalog-only ids (static project/world data)
 * have no `listings` row to reference, so they stay device-local by design.
 */

import { db } from "@/lib/db"
import { FAV_MAX } from "@/lib/favorites-sync"

/** Live saved ids for a user, newest first. */
export async function listSavedIds(userId: string): Promise<string[]> {
  const rows = await db.savedListing.findMany({
    where: { userId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: FAV_MAX,
    select: { listingId: true },
  })
  return rows.map((r) => r.listingId)
}

/** Apply adds/removes (already validated by parseFavPatch) and return the new list. */
export async function patchSaved(
  userId: string,
  add: string[],
  remove: string[],
): Promise<string[]> {
  const now = new Date()
  if (remove.length) {
    await db.savedListing.updateMany({
      where: { userId, listingId: { in: remove }, deletedAt: null },
      data: { deletedAt: now },
    })
  }
  if (add.length) {
    const live = await db.savedListing.count({ where: { userId, deletedAt: null } })
    const room = Math.max(0, FAV_MAX - live)
    // Only live listings — a stale or forged id never becomes a row.
    const existing = await db.listing.findMany({
      where: { id: { in: add }, deletedAt: null },
      select: { id: true },
      take: room,
    })
    await db.$transaction(
      existing.map(({ id }) =>
        db.savedListing.upsert({
          where: { userId_listingId: { userId, listingId: id } },
          create: { userId, listingId: id },
          update: { deletedAt: null },
        }),
      ),
    )
  }
  return listSavedIds(userId)
}

/** Live save count per listing, for owner dashboards. */
export async function savedCounts(listingIds: string[]): Promise<Map<string, number>> {
  if (listingIds.length === 0) return new Map()
  const groups = await db.savedListing.groupBy({
    by: ["listingId"],
    where: { listingId: { in: listingIds }, deletedAt: null },
    _count: { _all: true },
  })
  return new Map(groups.map((g) => [g.listingId, g._count._all]))
}
