/** MapLibre Marker owns `el.style.transform` (lng/lat). Visual scale lives on the inner pill. */

import type { Listing } from '@/data/listings'

const INK = '#0A1030'
const NAVY = '#050B26'
const PAPER = '#FFFFFF'

export const PRICE_PILL_IDLE = 'sv-price-pill'
export const PRICE_PILL_ACTIVE = 'sv-price-pill-on'

export type PinGroup = {
  key: string
  lat: number
  lng: number
  listings: Listing[]
}

/** ~1.1 m cells — same building / same pin, not neighbourhood clustering. */
export function groupListingsByPin(listings: readonly Listing[], decimals = 5): PinGroup[] {
  const m = new Map<string, PinGroup>()
  for (const l of listings) {
    const { lat, lng } = l.coords
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) continue
    const key = `${lat.toFixed(decimals)},${lng.toFixed(decimals)}`
    const g = m.get(key)
    if (g) g.listings.push(l)
    else m.set(key, { key, lat, lng, listings: [l] })
  }
  for (const g of m.values()) g.listings.sort((a, b) => a.priceGEL - b.priceGEL)
  return [...m.values()]
}

export function pinMinPriceGEL(listings: readonly Listing[]): number {
  let min = Infinity
  for (const l of listings) {
    if (l.priceGEL > 0 && l.priceGEL < min) min = l.priceGEL
  }
  return min === Infinity ? 0 : min
}

export function paintPricePinEl(
  el: HTMLElement,
  inner: HTMLElement,
  s: { hover: boolean; active: boolean; seen: boolean },
) {
  const hot = s.hover || s.active
  inner.style.transform = hot ? 'scale(1.12)' : 'scale(1)'
  el.style.zIndex = s.active ? '30' : s.hover ? '20' : '1'
  el.style.opacity = s.seen && !hot ? '0.55' : '1'
  inner.style.backgroundColor = s.active ? NAVY : PAPER
  inner.style.color = s.active ? PAPER : INK
  inner.style.borderColor = s.active ? NAVY : 'rgba(10,16,48,0.08)'
  inner.style.boxShadow = s.active
    ? '0 0 0 2px rgba(255,255,255,0.95), 0 6px 20px rgba(5,11,38,0.28)'
    : hot
      ? '0 4px 14px rgba(5,11,38,0.22)'
      : '0 2px 8px rgba(5,11,38,0.16)'
  const nEl = el.querySelector('[data-pin-n]') as HTMLElement | null
  if (nEl) {
    nEl.style.backgroundColor = s.active ? PAPER : NAVY
    nEl.style.color = s.active ? NAVY : PAPER
  }
}

type PillMap = {
  hasImage: (id: string) => boolean
  addImage: (
    id: string,
    image: { width: number; height: number; data: Uint8Array },
    options?: {
      pixelRatio?: number
      stretchX?: [number, number][]
      stretchY?: [number, number][]
      content?: [number, number, number, number]
    },
  ) => void
}

/** Stretchable capsule sprite — GPU Airbnb pills on /map. */
export function addPricePillImages(map: PillMap) {
  if (typeof document === 'undefined') return
  const idle = pillImage(PAPER, 'rgba(10,16,48,0.10)')
  const on = pillImage(NAVY, PAPER)
  if (!idle || !on) return
  const meta = {
    pixelRatio: 2,
    stretchX: [[24, 76]] as [number, number][],
    stretchY: [[22, 26]] as [number, number][],
    content: [16, 8, 84, 40] as [number, number, number, number],
  }
  if (!map.hasImage(PRICE_PILL_IDLE)) map.addImage(PRICE_PILL_IDLE, idle, meta)
  if (!map.hasImage(PRICE_PILL_ACTIVE)) map.addImage(PRICE_PILL_ACTIVE, on, meta)
}

function pillImage(fill: string, stroke: string) {
  const w = 100
  const h = 48
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  const r = (h - 4) / 2
  ctx.beginPath()
  ctx.roundRect(2, 2, w - 4, h - 4, r)
  ctx.fillStyle = fill
  ctx.fill()
  ctx.strokeStyle = stroke
  ctx.lineWidth = 2
  ctx.stroke()
  const { data } = ctx.getImageData(0, 0, w, h)
  return { width: w, height: h, data: new Uint8Array(data.buffer.slice(0)) }
}
