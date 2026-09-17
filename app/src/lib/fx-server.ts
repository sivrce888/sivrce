/**
 * SIVRCE — Global Multi-Currency FX Engine (USD/EUR/GEL/AED/GBP/CHF/CAD/AUD/JPY/TRY/ILS/SAR/QAR).
 * Zero deps, server & client compatible, 6h cache with instant fallback.
 *
 * Provides real-time cross-currency conversion across all 55+ market currencies.
 */

export interface FxRates {
  usdGel: number
  eurGel: number
  source: "live" | "fallback"
  rates?: Record<string, number>
}

/** Static pegged & baseline rates for instant zero-latency fallbacks. */
export const GLOBAL_FX_FALLBACK: Record<string, number> = {
  USD: 1.0,
  GEL: 2.70,
  EUR: 0.92,
  AED: 3.6725,
  GBP: 0.77,
  CHF: 0.88,
  CAD: 1.38,
  AUD: 1.52,
  JPY: 154.5,
  TRY: 34.2,
  ILS: 3.75,
  SAR: 3.75,
  QAR: 3.64,
  KWD: 0.31,
  BHD: 0.38,
  OMR: 0.38,
  SGD: 1.34,
  HKD: 7.82,
  CNY: 7.24,
  INR: 84.0,
  BRL: 5.65,
  MXN: 19.8,
  PLN: 3.98,
  SEK: 10.6,
  NOK: 10.9,
  DKK: 6.87,
  NZD: 1.68,
  ZAR: 17.8,
}

/** Mirrors currency.tsx fallbacks so server and client agree pre-hydration. */
export const FX_FALLBACK: FxRates = {
  usdGel: 2.7,
  eurGel: 3.04,
  source: "fallback",
  rates: GLOBAL_FX_FALLBACK,
}

let fxCache: { at: number; fx: FxRates } | null = null
const FX_TTL = 6 * 3600_000

/** Universal USD-based live FX engine with full multi-currency quotes. */
export async function getFx(): Promise<FxRates> {
  if (fxCache && Date.now() - fxCache.at < FX_TTL) return fxCache.fx
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      next: { revalidate: 6 * 3600 },
      signal: AbortSignal.timeout(8000),
    })
    const json = (await res.json()) as { rates?: Record<string, number> }
    const gel = json.rates?.GEL
    const eur = json.rates?.EUR
    if (typeof gel === "number" && typeof eur === "number" && gel > 0 && eur > 0) {
      const mergedRates: Record<string, number> = {
        ...GLOBAL_FX_FALLBACK,
        ...(json.rates || {}),
      }
      const fx: FxRates = {
        usdGel: gel,
        eurGel: gel / eur,
        source: "live",
        rates: mergedRates,
      }
      fxCache = { at: Date.now(), fx }
      return fx
    }
  } catch {
    // fall through to fallback
  }
  fxCache = { at: Date.now(), fx: FX_FALLBACK }
  return FX_FALLBACK
}

/** Convert any amount between any two currencies using live/cached rates. */
export function convertCrossFx(
  amount: number,
  fromIso: string,
  toIso: string,
  rates: Record<string, number> = GLOBAL_FX_FALLBACK,
): number {
  if (fromIso.toUpperCase() === toIso.toUpperCase()) return amount
  const fromRate = rates[fromIso.toUpperCase()] ?? GLOBAL_FX_FALLBACK[fromIso.toUpperCase()] ?? 1.0
  const toRate = rates[toIso.toUpperCase()] ?? GLOBAL_FX_FALLBACK[toIso.toUpperCase()] ?? 1.0
  const inUsd = amount / fromRate
  return inUsd * toRate
}
