/**
 * SIVRCE — competitor-style listing URLs.
 * ss.ge ranks on `/ka/udzravi-qoneba/iyideba-3-otaxiani-bina-gldanshi-35127949`;
 * myhome on `/udzravi-qoneba/25505302/iyideba-2-otaxiani-bina-ortachalashi/`.
 * Ours: `/listing/{publicId}/{transliterated-keyword}` — MyHome-style 8-digit
 * public number as the stable lookup key, slug carries the exact Georgian
 * query in Latin. Canonical + 301 live in
 * app/[lang]/listing/[id]/[[...slug]]/page.tsx (uuid links redirect there too).
 */

import { ka, type DictKey } from '@/lib/i18n/ka'
import type { Lang } from '@/lib/i18n/context'
import { listingTitle } from '@/lib/place-label'
import { dealLabelKey } from '@/lib/add-listing-fields'
import { cap1, fillTpl, seoTitleParts } from '@/lib/seo-title'
import { PUBLIC_ID_BASE } from '@/lib/listing-public-id'
import type { DealType, PropType } from '@/data/listings'

/** Minimum shape the slug needs — both data/listings and listings-db Listing satisfy it. */
export interface SlugListing {
  id: string
  publicId?: number | null
  country?: string
  title?: string
  dealType: DealType
  propType: PropType
  rooms: number
  beds: number
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

/** Keyword-first detail title: "იყიდება 2-საძინებლიანი ბინა ვაკეში" — bedrooms first.
 *  World listings keep the authored Latin title (no Mkhedruli auto-title). */
export function listingKeyword(l: SlugListing): string {
  return listingKeywordIn(l, 'ka', (k) => ka[k])
}

/** Same keyword title in the reader's language ("3-bedroom apartment for sale
 *  in Vake, Tbilisi"). `t` = that locale's raw dict lookup (client useI18n or
 *  getServerT) so this leaf never bundles every dictionary. */
export function listingKeywordIn(l: SlugListing, lang: Lang, t: (k: DictKey) => string): string {
  if ((l.country ?? 'GE') !== 'GE' && l.title) return l.title
  const dealLabel = l.dealType === 'daily' && lang === 'ka'
    ? 'ქირავდება დღიურად'
    : t(dealLabelKey(l.dealType, l.propType))
  const { deal, where } = seoTitleParts({ lang, deal: l.dealType, dealLabel, propType: l.propType, district: l.district, city: l.city })
  const useBeds = l.beds > 0 && l.propType !== 'land'
  const useRooms = !useBeds && l.rooms > 0 && l.propType !== 'land'
  const key = useBeds ? 'add.autoTitle.beds' : useRooms ? 'add.autoTitle.rooms' : 'add.autoTitle.simple'
  const type = t(TITLE_TYPE[l.propType])
  return cap1(fillTpl(
    t(key),
    // Mid-sentence type word: "3-bedroom apartment", not "3-bedroom Apartment".
    { deal, rooms: l.rooms, beds: l.beds, type: lang === 'de' ? type : type.toLowerCase(), where },
  ))
}

const MKHEDRULI = /[\u10A0-\u10FF]/

/** Title a reader can read: authored title for ka (or Latin titles); a
 *  Georgian-authored title on a non-ka page becomes the localized keyword. */
export function listingDisplayTitle(l: SlugListing & { title: string }, lang: Lang, t: (k: DictKey) => string): string {
  if (lang !== 'ka' && (l.country ?? 'GE') === 'GE' && MKHEDRULI.test(l.title)) return listingKeywordIn(l, lang, t)
  return listingTitle(l.title, l.city, lang)
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

const LATIN_FOLD: Record<string, string> = {
  ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss', á: 'a', à: 'a', â: 'a', é: 'e', è: 'e', ê: 'e',
  í: 'i', ì: 'i', î: 'i', ó: 'o', ò: 'o', ô: 'o', ú: 'u', ù: 'u', û: 'u', ç: 'c', ñ: 'n',
}

function slugLatin(s: string): string {
  let out = ''
  for (const ch of s.toLowerCase()) out += LATIN_FOLD[ch] ?? ch
  return out.replace(/[^a-z0-9]+/g, '-').replace(/-{2,}/g, '-').replace(/^-+|-+$/g, '')
}

/** "iyideba-2-sadzinebliani-bina-vakeshi" — DE/world: umlaut-folded title. */
export function listingSlug(l: SlugListing): string {
  const kw = listingKeyword(l)
  return (l.country ?? 'GE') !== 'GE' ? slugLatin(kw) : transliterateKa(kw)
}

/** Canonical public path. Locale prefix is added by LocalizedLink / callers.
 * ponytail: public number when known, else the resolvable uuid — a uuid URL
 * 308s to the canonical server-side, so rendered links never dead-end (Meili
 * docs only gain publicId after the nightly sync-search). */
export function listingPath(l: SlugListing): string {
  const key = l.publicId != null && l.publicId >= PUBLIC_ID_BASE ? l.publicId : l.id
  return `/listing/${key}/${listingSlug(l)}`
}
