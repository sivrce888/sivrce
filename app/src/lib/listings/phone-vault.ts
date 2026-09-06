/**
 * Listing phone resolution — server-only. All user contact routes to the site
 * switchboard (owner mandate 2026-09); per-owner numbers stay in the DB for
 * dashboards/CRM only, never on public surfaces.
 */
import 'server-only'

import { db } from '@/lib/db'
import { CONTACT_PHONE, phoneRevealsOf } from '@/lib/inquiries/phone'

/** Resolve full phone for a listing id — always the site switchboard. */
export async function resolveListingPhone(id: string): Promise<string | null> {
  void id
  return CONTACT_PHONE
}

/** Bump phoneReveals in extendedFields; returns new count (0 if not a DB row). */
export async function bumpPhoneReveals(id: string): Promise<number> {
  try {
    const row = await db.listing.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, extendedFields: true },
    })
    if (!row) return 0
    const prev = (row.extendedFields as Record<string, unknown> | null) ?? {}
    const next = phoneRevealsOf(prev) + 1
    await db.listing.update({
      where: { id: row.id },
      data: { extendedFields: { ...prev, phoneReveals: next } },
    })
    return next
  } catch {
    return 0
  }
}
