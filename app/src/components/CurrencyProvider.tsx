'use client'

/**
 * SIVRCE — Currency provider.
 * Mirror of I18nProvider: useSyncExternalStore for SSR safety, localStorage
 * persistence, cross-tab sync. Default USD ($). Live USD→GEL rate fetched
 * once per session, cached 6h in localStorage.
 *
 * Usage:
 *   import { useCurrency } from '@/lib/currency'
 *   const { currency, setCurrency, format, rate } = useCurrency()
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
  useLiveRate,
  type Currency,
  type CurrencyContextValue,
} from '@/lib/currency'

export type { Currency }

export default function CurrencyProvider({ children }: { children: ReactNode }) {
  const currency = useSyncExternalStore(subscribeCurrency, readStoredCurrency, getServerCurrency)
  const rate = useLiveRate()

  const setCurrency = useCallback((next: Currency) => {
    persistCurrency(next)
    emitCurrencyChange()
  }, [])

  const value = useMemo<CurrencyContextValue>(
    () => ({
      currency,
      setCurrency,
      rate,
      format: (gel: number) => formatMoney(gel, currency, rate),
      convert: (gel: number) => convertGel(gel, currency, rate),
    }),
    [currency, setCurrency, rate],
  )

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  )
}
