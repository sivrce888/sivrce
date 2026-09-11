/**
 * Pure listing formatting helpers — zero catalog imports (Listing is type-only),
 * so client components can import these without shipping the LISTINGS data array.
 * data/listings.ts re-exports these for server callers.
 */

import type { Listing } from '@/data/listings'
import type { Currency } from '@/lib/currency'
import type { Lang } from '@/lib/i18n/core'

export const USD_GEL = 2.7
/** Static EUR cross — mirrors USD_GEL; lib/currency.tsx holds the live rate. */
export const EUR_GEL = 3.04

/** Area-unit symbol per UI language; m² is the international default. */
const M2_SYM: Partial<Record<Lang, string>> = { ka: 'მ²', ru: 'м²', uk: 'м²', ar: 'م²', he: 'מ״ר' }

export function areaSym(lang: Lang): string {
  return M2_SYM[lang] ?? 'm²'
}

export function formatUSD(n: number): string {
  // whole dollars — fractional prices ($868.519/mo) never belong in a listing UI
  return `$${Math.round(n).toLocaleString('en-US')}`
}

export function formatGEL(n: number): string {
  return `${Math.round(n).toLocaleString('en-US')} ₾`
}

export function formatPerM2(l: Listing, currency?: Currency, lang: Lang = 'ka'): string {
  const m2 = areaSym(lang)
  if (currency === 'GEL') {
    const gelPerM2 = Math.round(l.perM2USD * USD_GEL)
    return `${gelPerM2.toLocaleString('en-US')}₾/${m2}`
  }
  if (currency === 'EUR') {
    const eurPerM2 = Math.round((l.perM2USD * USD_GEL) / EUR_GEL)
    return `€${eurPerM2.toLocaleString('en-US')}/${m2}`
  }
  return `$${l.perM2USD.toLocaleString('en-US')}/${m2}`
}

/** 3200 → "3.2კ" (ka) / "3.2k" elsewhere */
export function formatViews(v: number, lang: Lang = 'ka'): string {
  if (v >= 1000) return `${(v / 1000).toFixed(1)}${lang === 'ka' ? 'კ' : 'k'}`
  return String(v)
}

/** Bedrooms first; total rooms after. Legacy sale rows with beds=0 fall back to rooms. */
export function stayCount(l: Pick<Listing, 'rooms' | 'beds'>): {
  n: number
  rooms: number
  labelKey: 'spec.rooms' | 'spec.beds'
  kind: 'rooms' | 'beds'
} {
  if (l.beds > 0) return { n: l.beds, rooms: l.rooms, labelKey: 'spec.beds', kind: 'beds' }
  return { n: l.rooms, rooms: l.rooms, labelKey: 'spec.rooms', kind: 'rooms' }
}

/** "2 საძინებელი · 3 ოთახი" — bedrooms first, total rooms second. */
export function stayLine(
  l: Pick<Listing, 'rooms' | 'beds'>,
  t: (k: 'spec.rooms' | 'spec.beds') => string,
): string {
  const s = stayCount(l)
  if (s.n <= 0) return ''
  if (s.kind === 'beds' && s.rooms > 0) return `${s.n} ${t('spec.beds')} · ${s.rooms} ${t('spec.rooms')}`
  return `${s.n} ${t(s.labelKey)}`
}

export function formatFloor(l: Listing, lang: Lang = 'ka'): string {
  if (l.propType === 'house')
    return l.totalFloors > 0 ? (lang === 'ka' ? `${l.totalFloors} სართ.` : String(l.totalFloors)) : '—'
  if (l.propType === 'land') return '—'
  if (l.floor <= 0 && l.totalFloors <= 0) return '—'
  if (l.floor <= 0) return l.totalFloors > 0 ? `—/${l.totalFloors}` : '—'
  if (l.totalFloors <= 0) return String(l.floor)
  return `${l.floor}/${l.totalFloors}`
}

export function postedDaysAgo(l: Listing, today = new Date()): number {
  // Hits may ship ISO datetime; static mocks use YYYY-MM-DD.
  // Compare calendar days in Asia/Tbilisi so SSR (UTC) and client (GE) agree.
  const ymd = (d: Date) =>
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Tbilisi',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d)
  const raw = /T/.test(l.postedAt) ? l.postedAt : `${l.postedAt}T12:00:00`
  const posted = new Date(raw)
  if (Number.isNaN(posted.getTime())) return 0
  const a = ymd(posted)
  const b = ymd(today)
  // en-CA → YYYY-MM-DD; day diff via UTC noon anchors
  const toUtc = (s: string) => Date.parse(`${s}T12:00:00Z`)
  return Math.max(0, Math.round((toUtc(b) - toUtc(a)) / 86_400_000))
}

/** Card timestamp. ka is hardcoded — ICU RelativeTimeFormat falls back to English "today". */
export function postedAgoLabel(days: number, lang: string): string {
  if (lang === 'ka') {
    if (days < 1) return 'დღეს'
    if (days === 1) return 'გუშინ'
    if (days < 7) return `${days} დღის წინ`
    const w = Math.ceil(days / 7)
    return `${w} კვირის წინ`
  }
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' })
  if (days < 1) return rtf.format(0, 'day')
  if (days < 7) return rtf.format(-days, 'day')
  return rtf.format(-Math.ceil(days / 7), 'week')
}
