/**
 * SIVRCE — server-side FX (USD/EUR → GEL), no key, no deps.
 *
 * Same free endpoint and same fallbacks as the client currency context, so a
 * server-rendered price and a hydrated one agree. Lives apart from hotels.ts
 * so a route can import rates without dragging the WORLD_PLACES catalog in.
 */

export interface FxRates {
  usdGel: number
  eurGel: number
  source: "live" | "fallback"
}

/** Mirrors currency.tsx fallbacks so server and client agree pre-hydration. */
export const FX_FALLBACK: FxRates = { usdGel: 2.7, eurGel: 3.04, source: "fallback" }

let fxCache: { at: number; fx: FxRates } | null = null
const FX_TTL = 6 * 3600_000

/** USD-based live FX (same free endpoint as the client currency context). */
export async function getFx(): Promise<FxRates> {
  if (fxCache && Date.now() - fxCache.at < FX_TTL) return fxCache.fx
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      next: { revalidate: 6 * 3600 },
    })
    const json = (await res.json()) as { rates?: Record<string, number> }
    const gel = json.rates?.GEL
    const eur = json.rates?.EUR
    if (typeof gel === "number" && typeof eur === "number" && gel > 0 && eur > 0) {
      const fx: FxRates = { usdGel: gel, eurGel: gel / eur, source: "live" }
      fxCache = { at: Date.now(), fx }
      return fx
    }
  } catch {
    // fall through to fallback
  }
  fxCache = { at: Date.now(), fx: FX_FALLBACK }
  return FX_FALLBACK
}
