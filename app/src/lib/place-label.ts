/**
 * Display-layer place names: catalog stores ka (GE convention), non-ka UI
 * must show Latin. cityByName already lives in the navbar chunk.
 */
import { cityByName } from '@/lib/map/user-place'

const MKHEDRULI = /[\u10A0-\u10FF]/

export function placeLabel(
  raw: string | null | undefined,
  lang: string,
  country?: string,
): string {
  if (!raw) return ''
  const pin = cityByName(raw)
  if (pin) return lang === 'ka' ? pin.ka : pin.en
  if (lang !== 'ka' && country && country !== 'GE' && MKHEDRULI.test(raw)) return ''
  return raw
}

export function listingTitle(title: string, city: string | undefined, lang: string): string {
  if (!city) return title
  const loc = placeLabel(city, lang)
  if (loc && loc !== city && title.includes(city)) return title.split(city).join(loc)
  return title
}
