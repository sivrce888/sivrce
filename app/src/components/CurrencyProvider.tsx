'use client'

/**
 * SIVRCE — Currency provider.
 * Mirror of I18nProvider: useSyncExternalStore for SSR safety, localStorage
 * persistence, cross-tab sync. Default GEL (₾).
 *
 * Usage:
 *   import { useCurrency } from '@/lib/currency'
 *   const { currency, setCurrency, format } = useCurrency()
 */

import { useCallback, useMemo, useSyncExternalStore, type ReactNode } from 'react'
import {
  CurrencyContext,
  convertGel,
  emitCurrencyChange,
  formatMoney,
  getServerCurrency,
  persistCurrency,
  readStoredCurrency,
  subscribeCurrency,
  type Currency,
  type CurrencyContextValue,
} from '@/lib/currency'

export type { Currency }

export default function CurrencyProvider({ children }: { children: ReactNode }) {
  const currency = useSyncExternalStore(subscribeCurrency, readStoredCurrency, getServerCurrency)

  const setCurrency = useCallback((next: Currency) => {
    persistCurrency(next)
    emitCurrencyChange()
  }, [])

  const value = useMemo<CurrencyContextValue>(
    () => ({
      currency,
      setCurrency,
      format: (gel: number) => formatMoney(gel, currency),
      convert: (gel: number) => convertGel(gel, currency),
    }),
    [currency, setCurrency],
  )

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  )
}
