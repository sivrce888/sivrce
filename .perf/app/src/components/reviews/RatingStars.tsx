'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

const SIZES = {
  sm: 'h-3.5 w-3.5',
  md: 'h-[18px] w-[18px]',
  lg: 'h-6 w-6',
} as const

const GAPS = {
  sm: 'gap-0.5',
  md: 'gap-0.5',
  lg: 'gap-1',
} as const

export interface RatingStarsProps {
  /** 0–5; read-only mode renders fractional fill. */
  value: number
  size?: keyof typeof SIZES
  interactive?: boolean
  onChange?: (value: number) => void
  /** aria-label for the whole group (read-only: e.g. "Rated 4.6 out of 5"). */
  label?: string
  /** aria-label per star button in interactive mode. */
  optionLabel?: (n: number) => string
  className?: string
}

export function RatingStars({
  value,
  size = 'md',
  interactive = false,
  onChange,
  label,
  optionLabel,
  className,
}: RatingStarsProps) {
  const [preview, setPreview] = useState<number | null>(null)

  if (interactive) {
    const active = preview ?? value
    return (
      <div
        role="group"
        aria-label={label}
        className={cn('flex', GAPS[size], className)}
        onMouseLeave={() => setPreview(null)}
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={optionLabel ? optionLabel(n) : `${n}`}
            aria-pressed={value === n}
            onClick={() => onChange?.(n)}
            onMouseEnter={() => setPreview(n)}
            onFocus={() => setPreview(n)}
            onBlur={() => setPreview(null)}
            className="grid min-h-[44px] min-w-[44px] place-items-center rounded-full transition-transform duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2 active:scale-90"
          >
            <Star
              className={cn(
                SIZES[size],
                'transition-colors duration-150',
                n <= active ? 'fill-sv-orange text-sv-orange' : 'fill-sv-ink/15 text-sv-ink/15',
              )}
            />
          </button>
        ))}
      </div>
    )
  }

  const clamped = Math.max(0, Math.min(5, value))
  const row = (cls: string) => (
    <span aria-hidden className={cn('flex', GAPS[size], cls)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={cn(SIZES[size], 'fill-current')} />
      ))}
    </span>
  )

  return (
    <span role="img" aria-label={label} className={cn('relative inline-flex align-middle', className)}>
      {row('text-sv-ink/15')}
      {/* ponytail: logical `start-0` keeps the fill anchored to the first star in RTL too */}
      <span className="absolute start-0 top-0 h-full overflow-hidden" style={{ width: `${(clamped / 5) * 100}%` }}>
        {row('text-sv-orange')}
      </span>
    </span>
  )
}
