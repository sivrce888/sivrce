/**
 * SIVRCE — competitor-style listing URL slugs.
 * ss.ge ranks on `/ka/udzravi-qoneba/iyideba-3-otaxiani-bina-gldanshi-35127949`;
 * myhome on `/udzravi-qoneba/25505302/iyideba-2-otaxiani-bina-ortachalashi/`.
 * Ours: `/listing/{id}/{transliterated-keyword}` — id stays the lookup key
 * (unique, stable), the slug carries the exact Georgian query in Latin.
 * Canonical + 301 live in app/[lang]/listing/[id]/[[...slug]]/page.tsx.
 */

import { ka, type DictKey } from '@/lib/i18n/ka'
import { DEALS } from '@/lib/seo-pages'
import { cap1, fillTpl, seoTitleParts } from '@/lib/seo-title'
import type { DealType, PropType } from '@/data/listings'

/** Minimum shape the slug needs — both data/listings and listings-db Listing satisfy it. */
export interface SlugListing {
  id: string
  dealType: DealType
  propType: PropType
  rooms: number
  district: string
  city: string
}

/** Title-slot type labels — the SEO keyword forms (კომერციული ფართი, not კომერციული). */
const TITLE_TYPE: Record<PropType, DictKey> = {
  apartment: 'prop.apartment',
  house: 'prop.houseShort',
  villa: 'prop.villa',
  commercial: 'add.titleType.commercial',
  land: 'prop.land',
  hotel: 'prop.hotel',
}

/** Keyword-first detail title: "იყიდება 2-ოთახიანი ბინა ვაკეში" — same engine as the /add-listing default. */
export function listingKeyword(l: SlugListing): string {
  const dealLabel = l.dealType === 'daily' ? 'ქირავდება დღიურად' : DEALS[l.dealType].ka
  const { deal, where } = seoTitleParts({ lang: 'ka', deal: l.dealType, dealLabel, district: l.district, city: l.city })
  return cap1(fillTpl(
    ka[l.rooms > 0 && l.propType !== 'land' ? 'add.autoTitle.rooms' : 'add.autoTitle.simple'],
    { deal, rooms: l.rooms, type: ka[TITLE_TYPE[l.propType]], where },
  ))
}

/* Georgian Mkhedruli → Latin, matching the romanization Georgians actually
 * type into Google (ოთახიანი → otaxiani, გლდანში → gldanshi). */
const GEO_LATIN: Record<string, string> = {
  'ა': 'a', 'ბ': 'b', 'გ': 'g', 'დ': 'd', 'ე': 'e', 'ვ': 'v', 'ზ': 'z',
  'თ': 't', 'ი': 'i', 'კ': 'k', 'ლ': 'l', 'მ': 'm', 'ნ': 'n', 'ო': 'o', 'პ': 'p',
  'ჟ': 'zh', 'რ': 'r', 'ს': 's', 'ტ': 't', 'უ': 'u', 'ფ': 'p', 'ქ': 'k', 'ღ': 'gh',
  'ყ': 'y', 'შ': 'sh', 'ჩ': 'ch', 'ც': 'ts', 'ძ': 'dz', 'წ': 'ts', 'ჭ': 'ch',
  'ხ': 'x', 'ჯ': 'j', 'ჰ': 'h',
}

export function transliterateKa(s: string): string {
  let out = ''
  for (const ch of s.toLowerCase()) out += GEO_LATIN[ch] ?? ch
  return out.replace(/[^a-z0-9]+/g, '-').replace(/-{2,}/g, '-').replace(/^-+|-+$/g, '')
}

/** "iyideba-2-otaxiani-bina-vakeshi" */
export function listingSlug(l: SlugListing): string {
  return transliterateKa(listingKeyword(l))
}

/** Canonical public path. Locale prefix is added by LocalizedLink / callers. */
export function listingPath(l: SlugListing): string {
  return `/listing/${l.id}/${listingSlug(l)}`
}
