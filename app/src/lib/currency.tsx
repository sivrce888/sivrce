'use client'

/**
 * SIVRCE — Currency context, hook and formatter.
 * Pattern: identical to I18nProvider (useSyncExternalStore, localStorage, cross-tab sync).
 * Default: GEL (₾). USD toggle at 1 USD = 2.7 GEL (sourced from data/listings.ts).
 */

import { createContext, useContext } from 'react'

export type Currency = 'GEL' | 'USD'

export const USD_GEL_RATE = 2.7

const CURRENCIES: readonly Currency[] = ['GEL', 'USD']
const STORAGE_KEY = 'sivrce:currency'
const CURRENCY_EVENT = 'sivrce:currency-changed'

export interface CurrencyContextValue {
  currency: Currency
  setCurrency: (c: Currency) => void
  /** Format a GEL amount in the active currency. */
  format: (gel: number) => string
  /** Raw converted number (no formatting). */
  convert: (gel: number) => number
}

export const CurrencyContext = createContext<CurrencyContextValue | null>(null)

export function readStoredCurrency(): Currency {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return CURRENCIES.includes(raw as Currency) ? (raw as Currency) : 'GEL'
  } catch {
    return 'GEL'
  }
}

export function persistCurrency(c: Currency) {
  try { localStorage.setItem(STORAGE_KEY, c) } catch { /* noop */ }
}

export function getServerCurrency(): Currency {
  return 'GEL'
}

export function subscribeCurrency(onChange: () => void): () => void {
  window.addEventListener(CURRENCY_EVENT, onChange)
  window.addEventListener('storage', onChange)
  return () => {
    window.removeEventListener(CURRENCY_EVENT, onChange)
    window.removeEventListener('storage', onChange)
  }
}

export function emitCurrencyChange() {
  window.dispatchEvent(new CustomEvent(CURRENCY_EVENT))
}

/**
 * Georgian number formatting: groups of 3 with space, ₾ or $ prefix.
 * ponytail: Intl.NumberFormat handles locale-aware grouping; 'ka' uses space separator.
 */
export function formatMoney(gel: number, currency: Currency): string {
  const value = currency === 'USD' ? Math.round(gel / USD_GEL_RATE) : Math.round(gel)
  const formatted = new Intl.NumberFormat('ka').format(value)
  return currency === 'USD' ? `$${formatted}` : `${formatted}₾`
}

export function convertGel(gel: number, currency: Currency): number {
  return currency === 'USD' ? Math.round(gel / USD_GEL_RATE) : Math.round(gel)
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext)
  if (!ctx) throw new Error('useCurrency must be used within <CurrencyProvider>')
  return ctx
}
