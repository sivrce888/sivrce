/**
 * Listing phone resolution — server-only. Every listing reveals its own
 * number (listingPhone → agent.phone → owner User.phone). The site
 * switchboard (CONTACT_PHONE) is the last-resort fallback for numberless
 * (dev-seeded) listings only.
 */
import 'server-only'

import { db } from '@/lib/db'
import { CONTACT_PHONE, phoneRevealsOf } from '@/lib/inquiries/phone'

/** Resolve full phone for a listing id — the listing's own number. */
export async function resolveListingPhone(id: string): Promise<string | null> {
  try {
    const row = await db.listing.findFirst({
      where: { id, deletedAt: null },
      select: { listingPhone: true, agent: true, ownerId: true },
    })
    if (!row) return null
    // Seed rows may carry an already-masked agent.phone (`555 *** ***`) —
    // never reveal a mask; fall through to owner phone / switchboard.
    const agentPhone = (row.agent as { phone?: unknown } | null)?.phone
    const own =
      row.listingPhone ||
      (typeof agentPhone === 'string' && !agentPhone.includes('*') ? agentPhone : null)
    if (typeof own === 'string' && own && own !== '—') return own
    if (row.ownerId) {
      const owner = await db.user.findUnique({
        where: { id: row.ownerId },
        select: { phone: true },
      })
      if (owner?.phone) return owner.phone
    }
  } catch {
    // DB unavailable → switchboard answers so contact never breaks.
  }
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
