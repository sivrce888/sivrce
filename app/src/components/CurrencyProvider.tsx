'use client'

/**
 * SIVRCE — Currency provider.
 * Mirror of I18nProvider: useSyncExternalStore for SSR safety, localStorage
 * persistence, cross-tab sync. Default USD ($). Live USD→GEL + EUR→GEL rates
 * fetched once per session, cached 6h in localStorage.
 *
 * Usage:
 *   import { useCurrency } from '@/lib/currency'
 *   const { currency, setCurrency, format, rate, eurRate } = useCurrency()
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
  useLiveRates,
  type Currency,
  type CurrencyContextValue,
} from '@/lib/currency'

export type { Currency }

export default function CurrencyProvider({ children }: { children: ReactNode }) {
  const currency = useSyncExternalStore(subscribeCurrency, readStoredCurrency, getServerCurrency)
  const { usd: rate, eur: eurRate } = useLiveRates()

  const setCurrency = useCallback((next: Currency) => {
    persistCurrency(next)
    emitCurrencyChange()
  }, [])

  const value = useMemo<CurrencyContextValue>(
    () => ({
      currency,
      setCurrency,
      rate,
      eurRate,
      format: (gel: number) => formatMoney(gel, currency, rate, eurRate),
      convert: (gel: number) => convertGel(gel, currency, rate, eurRate),
    }),
    [currency, setCurrency, rate, eurRate],
  )

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  )
}
