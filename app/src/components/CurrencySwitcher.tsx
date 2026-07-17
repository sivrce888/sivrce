'use client'

/**
 * SIVRCE — Currency switcher. iOS-style segmented ₾/$ control so the active
 * currency and the alternative are both visible at a glance, on the dark hero
 * and the light glass bar alike.
 */

import { useCurrency, type Currency } from '@/lib/currency'

const OPTIONS: { value: Currency; symbol: string; label: string }[] = [
  { value: 'GEL', symbol: '₾', label: 'Georgian Lari' },
  { value: 'USD', symbol: '$', label: 'US Dollar' },
]

export function CurrencySwitcher({ light = false }: { light?: boolean }) {
  const { currency, setCurrency } = useCurrency()

  return (
    <div
      role="group"
      aria-label="Currency"
      className={`flex h-10 items-center rounded-full p-1 ${
        light ? 'bg-sv-ink/[0.06]' : 'bg-white/10'
      }`}
    >
      {OPTIONS.map((o) => {
        const active = currency === o.value
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            aria-label={o.label}
            onClick={() => setCurrency(o.value)}
            className={`grid h-8 w-9 place-items-center rounded-full text-[15px] font-extrabold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue ${
              active
                ? light
                  ? 'bg-sv-surface text-sv-ink'
                  : 'bg-white/20 text-white'
                : light
                  ? 'text-sv-ink/50 hover:text-sv-ink'
                  : 'text-white/60 hover:text-white'
            }`}
          >
            {o.symbol}
          </button>
        )
      })}
    </div>
  )
}
