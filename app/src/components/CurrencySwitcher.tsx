'use client'

/**
 * SIVRCE — Currency switcher. Simple toggle between ₾ (GEL) and $ (USD).
 * Pattern: mirror of LangSwitcher but collapsed to a single toggle button.
 */

import { useCurrency, type Currency } from '@/lib/currency'

export function CurrencySwitcher({ light = false }: { light?: boolean }) {
  const { currency, setCurrency } = useCurrency()

  const next: Currency = currency === 'GEL' ? 'USD' : 'GEL'

  return (
    <button
      type="button"
      onClick={() => setCurrency(next)}
      aria-label={`Switch currency to ${next === 'USD' ? 'US Dollars' : 'Georgian Lari'}`}
      className={`flex h-10 items-center gap-1 rounded-full px-2.5 text-[13px] font-extrabold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2 ${
        light ? 'text-sv-ink/70 hover:bg-sv-ink/5' : 'text-white/85 hover:bg-white/10'
      }`}
    >
      <span className={currency === 'GEL' ? 'text-sv-orange' : 'text-sv-blue'}>
        {currency === 'GEL' ? '₾' : '$'}
      </span>
    </button>
  )
}
