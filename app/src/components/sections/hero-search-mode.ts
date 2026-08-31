/** Recent-search chip helpers for the homepage hero. */

import { DEAL_BRAND } from '@/lib/category-brand'
import type { DictKey } from '@/lib/i18n/ka'
import type { DealType, PropType } from '@/data/listings'

export const RECENT_KEY = 'sivrce:hero-recent'

/**
 * Homepage deal segmented control.
 * ponytail: revert to sale/rent/daily + projects (4 tabs) if inventory stays thin;
 * drop the pledge row and restore `grid-cols-2` without col-span on projects.
 */
export const HERO_TABS = [
  { id: 'sale', key: 'search.sale' as DictKey, hue: DEAL_BRAND.sale, deal: 'sale' as const },
  { id: 'rent', key: 'search.rent' as DictKey, hue: DEAL_BRAND.rent, deal: 'rent' as const },
  { id: 'pledge', key: 'map.pledge' as DictKey, hue: DEAL_BRAND.pledge, deal: 'pledge' as const },
  { id: 'daily', key: 'nav.daily' as DictKey, hue: DEAL_BRAND.daily, deal: 'daily' as const },
  { id: 'projects', key: 'nav.projects' as DictKey, hue: DEAL_BRAND.newProjects, deal: undefined },
] as const

export type HeroTabId = (typeof HERO_TABS)[number]['id']

export function heroDeal(tab: number): DealType | undefined {
  return HERO_TABS[tab]?.deal
}

const TYPE_HUB: Record<PropType, string> = {
  apartment: 'apartments',
  house: 'houses',
  villa: 'houses',
  commercial: 'commercial',
  land: 'land',
  hotel: 'commercial',
}

export function quickHref(
  chip: { sale: string; rent: string; pledge: string; daily: string; projects: string },
  tab: number,
  type?: PropType,
): string {
  const id = HERO_TABS[tab]?.id
  const base =
    id === 'rent' ? chip.rent
    : id === 'pledge' ? chip.pledge
    : id === 'daily' ? chip.daily
    : id === 'projects' ? chip.projects
    : chip.sale
  if (id === 'projects' || !type || type === 'apartment') return base
  if (id === 'pledge' && base.includes('deal=pledge')) {
    return `${base}&type=${type}`
  }
  return base.replace('/apartments/', `/${TYPE_HUB[type]}/`)
}

/** Exact 1–4 (ss.ge / myhome); 5+ is gte. */
export const ROOM_CHIPS = [
  { label: '1', n: 1, exact: true },
  { label: '2', n: 2, exact: true },
  { label: '3', n: 3, exact: true },
  { label: '4', n: 4, exact: true },
  { label: '5+', n: 5, exact: false },
] as const

export function moneyShort(n: number, cur: 'GEL' | 'USD'): string {
  const s = cur === 'GEL' ? '₾' : '$'
  if (n >= 1_000_000) return `${s}${n % 1_000_000 === 0 ? n / 1_000_000 : (n / 1_000_000).toFixed(1)}m`
  if (n >= 1000) return `${s}${Math.round(n / 1000)}k`
  return `${s}${n}`
}

export function boundNum(raw: string): number | undefined {
  const n = Number(raw)
  return raw.trim() && Number.isFinite(n) && n > 0 ? n : undefined
}

export function priceLabel(min: string, max: string, cur: 'GEL' | 'USD'): string | null {
  const a = boundNum(min)
  const b = boundNum(max)
  if (a && b) return `${moneyShort(a, cur)}–${moneyShort(b, cur)}`
  if (a) return `${moneyShort(a, cur)}+`
  if (b) return `≤${moneyShort(b, cur)}`
  return null
}

export function sizeLabel(
  rooms: number | undefined,
  exact: boolean,
  amin: string,
  amax: string,
  unit: string,
): string | null {
  const bits: string[] = []
  if (rooms) bits.push(exact ? String(rooms) : `${rooms}+`)
  const a = boundNum(amin)
  const b = boundNum(amax)
  if (a && b) bits.push(`${a}–${b} ${unit}`)
  else if (a) bits.push(`${a}+ ${unit}`)
  else if (b) bits.push(`≤${b} ${unit}`)
  return bits.length ? bits.join(' · ') : null
}

export type RecentSearch = { path: string; label: string }

export function readRecent(): RecentSearch | null {
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    if (!raw) return null
    const j = JSON.parse(raw) as RecentSearch
    return typeof j.path === 'string' && typeof j.label === 'string' ? j : null
  } catch {
    return null
  }
}

export function writeRecent(r: RecentSearch): void {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(r))
  } catch {
    /* private mode / quota — ignore */
  }
}

/** Build a short chip label from search params. */
export function recentLabel(params: URLSearchParams, dealLabel: string): string {
  const bits = [dealLabel]
  const city = params.get('city')
  const district = params.get('district')
  if (district) bits.push(district)
  else if (city) bits.push(city)
  const type = params.get('type')
  const TYPE_KA: Record<string, string> = {
    apartment: 'ბინა',
    house: 'სახლი',
    villa: 'აგარაკი',
    commercial: 'კომერციული',
    land: 'მიწა',
    hotel: 'სასტუმრო',
  }
  if (type && TYPE_KA[type]) bits.push(TYPE_KA[type])
  const q = params.get('q')
  if (q) bits.push(q)
  const rooms = params.get('rooms')
  const beds = params.get('beds')
  if (beds) bits.push(`${beds}+ საძ.`)
  else if (rooms) bits.push(`${rooms}+ ოთ.`)
  const max = params.get('max')
  if (max) bits.push(`≤$${Number(max).toLocaleString('en-US')}`)
  return bits.slice(0, 3).join(' · ')
}
