/**
 * Metro distance formatting — zero dependencies, client-safe.
 * Split from lib/map/pois so cards can format server chips without shipping
 * the 1.1 MB POI JSON to the browser (device-budget lock).
 */
import type { Lang } from '@/lib/i18n/core'

export interface NearMetro {
  name: string
  meters: number
  walkMin: number
}

/** [m, km, walk minutes] per UI language; SI + "min" is the default. */
const UNITS: Partial<Record<Lang, readonly [string, string, string]>> = {
  ka: ['მ', 'კმ', 'წთ'],
  ru: ['м', 'км', 'мин'],
  uk: ['м', 'км', 'хв'],
  de: ['m', 'km', 'Min.'],
  tr: ['m', 'km', 'dk'],
  az: ['m', 'km', 'dəq'],
  hy: ['մ', 'կմ', 'րոպե'],
  he: ['מ׳', 'ק״מ', 'דק׳'],
  ar: ['م', 'كم', 'د'],
}

/** en/he/ar (Latin digits) write 1.6; the other UI languages write 1,6. */
const DOT_DECIMAL: ReadonlySet<Lang> = new Set(['en', 'he', 'ar'])

export function formatMetroDist(n: NearMetro, lang: Lang = 'en'): string {
  const [m, km, min] = UNITS[lang] ?? ['m', 'km', 'min']
  // Non-breaking spaces keep "645 m" and "8 min" whole when the line wraps.
  const dist =
    n.meters < 1000
      ? `${n.meters} ${m}`
      : `${(n.meters / 1000).toFixed(1).replace('.', DOT_DECIMAL.has(lang) ? '.' : ',')} ${km}`
  return `${dist} · ${n.walkMin} ${min}`
}
