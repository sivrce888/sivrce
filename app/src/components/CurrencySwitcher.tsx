'use client'

/**
 * SIVRCE — Currency switcher. iOS-style segmented ₾/$ control so the active
 * currency and the alternative are both visible at a glance, on the dark hero
 * and the light glass bar alike. Chips follow the market: ₾ only on Georgia,
 * € first in Europe, AED first in the Gulf.
 */

import { usePathname } from 'next/navigation'
import { marketCurrencyOptions, useCurrency, type Currency } from '@/lib/currency'
import { parseCountryPath } from '@/lib/markets'
import { stripLangPrefix } from '@/lib/i18n/core'

const OPTIONS: { value: Currency; symbol: string; label: string }[] = [
  { value: 'USD', symbol: '$', label: 'US Dollar' },
  { value: 'EUR', symbol: '€', label: 'Euro' },
  { value: 'GEL', symbol: '₾', label: 'Georgian Lari' },
  { value: 'AED', symbol: 'AED', label: 'UAE Dirham' },
]

export function CurrencySwitcher({ light = false }: { light?: boolean }) {
  const { currency, setCurrency } = useCurrency()
  const pathname = usePathname()
  // SSR-safe market read: locale-prefixed market paths parse on the server;
  // bare /de resolves to a market only once hydrated on sivrce.com.
  const country = parseCountryPath(stripLangPrefix(pathname))?.country ?? null
  const allowed = marketCurrencyOptions(country)

  return (
    <div
      role="group"
      aria-label="Currency"
      className={`flex h-10 items-center rounded-full p-1 ${
        light ? 'bg-sv-ink/[0.06]' : 'bg-sv-ink/[0.06] dark:bg-white/10'
      }`}
    >
      {OPTIONS.filter((o) => allowed.includes(o.value)).map((o) => {
        const active = currency === o.value
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            aria-label={o.label}
            onClick={() => setCurrency(o.value)}
            className={`grid h-8 min-w-9 place-items-center rounded-full px-1 text-[15px] font-extrabold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue ${
              active
                ? light
                  ? 'bg-sv-surface text-sv-ink'
                  : 'bg-sv-surface text-sv-ink dark:bg-white/20 dark:text-white'
                : light
                  ? 'text-sv-ink/60 hover:text-sv-ink'
                  : 'text-sv-ink/60 hover:text-sv-ink dark:text-white/60 dark:hover:text-white'
            }`}
          >
            {o.symbol}
          </button>
        )
      })}
    </div>
  )
}
