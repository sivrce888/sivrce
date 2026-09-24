/**
 * Display-layer place names: catalog stores ka (GE convention), non-ka UI
 * must show Latin. Reads the names-only leaf, never map/user-place — this
 * rides ListingCard onto every card page (bundle-leak.check locks it).
 */
import { CITY_NAMES, CITY_NAME_ALIASES } from '@/lib/city-names.gen'

const MKHEDRULI = /[\u10A0-\u10FF]/

type CityName = (typeof CITY_NAMES)[number]
let index: Map<string, CityName> | undefined

/** Same match as user-place cityByName (alias → slug, else first slug/en/ka hit),
 *  names only — safe for client code and the edge middleware. */
export function cityNameHit(raw: string): { slug: string; ka: string; en: string } | null {
  if (!index) {
    index = new Map()
    for (const row of CITY_NAMES) {
      for (const k of [row[0], row[2].toLowerCase(), row[1].toLowerCase()]) {
        if (!index.has(k)) index.set(k, row)
      }
    }
  }
  const q = raw.trim().toLowerCase()
  if (!q) return null
  const row = index.get(CITY_NAME_ALIASES[q] ?? q)
  return row ? { slug: row[0], ka: row[1], en: row[2] } : null
}

export function placeLabel(
  raw: string | null | undefined,
  lang: string,
  country?: string,
): string {
  if (!raw) return ''
  const pin = cityNameHit(raw)
  if (pin) return lang === 'ka' ? pin.ka : pin.en
  if (lang !== 'ka' && country && country !== 'GE' && MKHEDRULI.test(raw)) return ''
  return raw
}

export function listingTitle(title: string, city: string | undefined, lang: string): string {
  if (!city) return title
  const loc = placeLabel(city, lang)
  if (!loc || loc === city || !title.includes(city)) return title
  // Swap only completes an otherwise-Latin world title ("Quartier — ბერლინი"
  // → "Quartier — Berlin"); inside an authored Mkhedruli title it would break
  // Georgian grammar (ქუთაისის → Kutaisiს), so those stay verbatim.
  if (MKHEDRULI.test(title.split(city).join(''))) return title
  return title.split(city).join(loc)
}
