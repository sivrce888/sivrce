/**
 * Real listing phones — server-only. Public pages get maskPhone() only.
 * Static catalog map mirrors historical mock AGENTS; DB rows use listingPhone / agent.phone.
 */
import 'server-only'

import { db } from '@/lib/db'
import { normalizePhone, phoneRevealsOf } from '@/lib/inquiries/phone'

/** Static demo catalog — never import from client components. */
const STATIC_LISTING_PHONES: Readonly<Record<string, string>> = {
  'vake-chavchavadze-47': '+995 555 12 34 56',
  'saburtalo-pekin-12': '+995 577 98 76 54',
  'tskvarichamia-mshvidoba-8': '+995 593 45 67 89',
  'vake-abashidze-34': '+995 568 23 45 67',
  'mtatsminda-sanapiro-5': '+995 555 12 34 56',
  'dighomi-gudamaqari-21': '+995 579 11 22 33',
  'vake-irakli-abashidze-10-rent': '+995 568 23 45 67',
  'saburtalo-kavtaradze-3-rent': '+995 577 98 76 54',
  'ortachala-krtsanisi-15-rent': '+995 579 11 22 33',
  'isani-navtlughi-8-rent': '+995 593 45 67 89',
  'gldani-mikheil-4-rent': '+995 568 23 45 67',
  'mtatsminda-foothill-house-rent': '+995 555 12 34 56',
  'vake-tamarashvili-6': '+995 577 98 76 54',
  'saburtalo-nutsubidze-77': '+995 579 11 22 33',
  'ortachala-gulia-22': '+995 593 45 67 89',
  'isani-berbuta-11': '+995 568 23 45 67',
  'gldani-omar-khizaneishvili-30': '+995 579 11 22 33',
  'dighomi-agmashenebeli-alley-house': '+995 577 98 76 54',
  'batumi-sherif-khimshiashvili-20': '+995 551 87 65 43',
  'batumi-gorgiladze-50-rent': '+995 551 87 65 43',
  'batumi-makhinjauri-house': '+995 551 87 65 43',
  'kutaisi-tamar-mefe-14': '+995 593 45 67 89',
  'kutaisi-chavchavadze-rent': '+995 568 23 45 67',
  'tbilisi-avlabari-commercial': '+995 577 98 76 54',
  'tbilisi-land-tskneti': '+995 579 11 22 33',
  'tbilisi-commercial-vake-rent': '+995 555 12 34 56',
  'tbilisi-old-town-daily-1': '+995 593 45 67 89',
  'tbilisi-mtatsminda-daily-2': '+995 555 12 34 56',
  'batumi-boulevard-daily-1': '+995 551 87 65 43',
  'batumi-old-daily-2': '+995 551 87 65 43',
  'batumi-makhinjauri-daily-3': '+995 551 87 65 43',
  'kutaisi-center-daily-1': '+995 568 23 45 67',
  'tbilisi-vake-daily-3': '+995 555 12 34 56',
  'tbilisi-saburtalo-daily-4': '+995 577 98 76 54',
  'axis-towers-sale-1': '+995 555 12 34 56',
  'axis-towers-rent-1': '+995 555 12 34 56',
  'king-david-sale-1': '+995 593 45 67 89',
  'king-david-daily-1': '+995 593 45 67 89',
  'abashidze-34-pledge-1': '+995 577 98 76 54',
  'axis-towers-pledge-1': '+995 555 12 34 56',
}

/** Resolve full phone for a listing id (DB first, then static vault). */
export async function resolveListingPhone(id: string): Promise<string | null> {
  try {
    const row = await db.listing.findFirst({
      where: { id, deletedAt: null },
      select: { listingPhone: true, agent: true },
    })
    if (row) {
      const agentPhone = (row.agent as { phone?: string } | null)?.phone
      const raw = row.listingPhone || agentPhone || null
      return raw ? normalizePhone(raw) ?? raw : null
    }
  } catch {
    /* DB down — fall through to static */
  }
  const staticPhone = STATIC_LISTING_PHONES[id]
  return staticPhone ? normalizePhone(staticPhone) ?? staticPhone : null
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
