/** Server-side catalog city/district → UI language. Mkhedruli never leaks off GE. */
import { WORLD_NEIGHBORHOODS } from '@/data/world-neighborhoods'
import { cityByName } from '@/lib/map/user-place'

const MKHEDRULI = /[\u10A0-\u10FF]/

export function catalogPlace(raw: string | undefined, latin: boolean): string {
  if (!raw) return ''
  const pin = cityByName(raw)
  if (pin) return latin ? pin.en : pin.ka
  const hood = WORLD_NEIGHBORHOODS.find((h) => h.ka === raw || h.en === raw)
  if (hood) return latin ? hood.en : hood.ka
  if (latin && MKHEDRULI.test(raw)) return ''
  return raw
}
