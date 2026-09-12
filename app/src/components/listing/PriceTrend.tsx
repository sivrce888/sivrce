'use client'

/**
 * PriceTrend — mini sparkline showing price history on listing cards.
 * Zero dependencies. SVG-only, 40×16px.
 */

import type { PriceEventView } from '@/lib/price-scale'

interface PriceTrendProps {
  events: PriceEventView[]
  className?: string
}

export function PriceTrend({ events, className = '' }: PriceTrendProps) {
  if (events.length < 2) return null

  const prices = events.map((e) => e.priceUSD)
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const range = max - min || 1

  const w = 40
  const h = 16
  const pad = 1

  const points = prices.map((p, i) => {
    const x = pad + (i / (prices.length - 1)) * (w - 2 * pad)
    const y = pad + (1 - (p - min) / range) * (h - 2 * pad)
    return `${x},${y}`
  })

  const isUp = prices[prices.length - 1] >= prices[0]
  const color = isUp ? '#007a33' : '#e8421e'

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={`inline-block ${className}`}
      width={w}
      height={h}
      aria-label={`Price trend: ${isUp ? 'increasing' : 'decreasing'}`}
      role="img"
    >
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* End dot */}
      <circle
        cx={pad + ((prices.length - 1) / (prices.length - 1)) * (w - 2 * pad)}
        cy={pad + (1 - (prices[prices.length - 1] - min) / range) * (h - 2 * pad)}
        r="2"
        fill={color}
      />
    </svg>
  )
}

/** Compact delta badge (e.g. -5% from last price). */
export function PriceDelta({ events, className = '' }: { events: PriceEventView[]; className?: string }) {
  const last = events[events.length - 1]
  if (!last?.deltaPct) return null
  const isDown = last.type === 'price_drop'
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[10px] font-black ${isDown ? 'text-green-600' : 'text-red-500'} ${className}`}
    >
      {isDown ? '↓' : '↑'}{last.deltaPct}%
    </span>
  )
}
