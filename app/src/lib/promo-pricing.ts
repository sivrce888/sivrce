/**
 * Sivrce promo tariffs — single source of truth.
 *
 * Strategy vs SS / MyHome (2026-07):
 * - Undercut daily rates ~15–20% (challenger switch reason)
 * - Same duration ladders (volume discount = commitment nudge)
 * - VIP+ = recommended sweet spot; SUPER VIP = ARPU / anchor
 * - Round ₾ / 0.5 — no weird decimals
 *
 * DB tier keys (do not rename): vip · super_vip (=VIP+) · diamond (=SUPER VIP)
 */

export type PromoCategory =
  | "real_estate"
  | "finance"
  | "jobs_edu"
  | "market_auto_service"

/** Public product names */
export type PromoProduct = "vip" | "vip_plus" | "super_vip"

/** Maps product → ListingTier / payment key */
export const PRODUCT_TO_TIER = {
  vip: "vip",
  vip_plus: "super_vip",
  super_vip: "diamond",
} as const

export type TierKey = (typeof PRODUCT_TO_TIER)[PromoProduct]

/** Bracket: apply this tetri/day when days <= upTo (last row = ∞). */
type Bracket = { upTo: number; tetriPerDay: number }

const SUPER_VIP: Record<PromoCategory, Bracket[]> = {
  real_estate: [
    { upTo: 3, tetriPerDay: 800 }, // 8₾ vs SS 9 / MyHome 9
    { upTo: 8, tetriPerDay: 700 }, // 7 vs 8
    { upTo: 29, tetriPerDay: 600 }, // 6 vs 7
    { upTo: Infinity, tetriPerDay: 500 }, // 5 vs 6
  ],
  finance: [
    { upTo: 3, tetriPerDay: 650 },
    { upTo: 8, tetriPerDay: 550 },
    { upTo: 29, tetriPerDay: 450 },
    { upTo: Infinity, tetriPerDay: 400 },
  ],
  jobs_edu: [
    { upTo: 9, tetriPerDay: 500 },
    { upTo: 29, tetriPerDay: 400 },
    { upTo: Infinity, tetriPerDay: 350 },
  ],
  market_auto_service: [
    { upTo: 3, tetriPerDay: 250 },
    { upTo: 8, tetriPerDay: 150 },
    { upTo: Infinity, tetriPerDay: 120 },
  ],
}

/** VIP+ — real estate only (same as SS) */
const VIP_PLUS: Partial<Record<PromoCategory, Bracket[]>> = {
  real_estate: [
    { upTo: 7, tetriPerDay: 250 }, // 2.50 vs SS 3 / MyHome 4
    { upTo: Infinity, tetriPerDay: 200 }, // 2.00 vs SS 2.50 @10+
  ],
}

const VIP: Record<PromoCategory, Bracket[]> = {
  real_estate: [{ upTo: Infinity, tetriPerDay: 100 }], // 1₾ — match SS, still under MyHome 2.50
  finance: [{ upTo: Infinity, tetriPerDay: 150 }], // 1.50 vs 2
  jobs_edu: [
    { upTo: 9, tetriPerDay: 250 },
    { upTo: Infinity, tetriPerDay: 150 },
  ],
  market_auto_service: [{ upTo: Infinity, tetriPerDay: 40 }], // 0.40 vs 0.50
}

const TABLES: Record<PromoProduct, Partial<Record<PromoCategory, Bracket[]>>> = {
  vip: VIP,
  vip_plus: VIP_PLUS,
  super_vip: SUPER_VIP,
}

/** Add-ons — undercut MyHome (refresh 0.25–0.30, color 0.30, FB 49) */
export const ADDON_TETRI = {
  refresh_once: 20,
  refresh_auto_from: 25,
  color: 25,
  facebook: 3900,
} as const

/** Default duration chip on promo UI (commitment without sticker shock). */
export const DEFAULT_PROMO_DAYS = 7

/** Duration options shown in promo picker. */
export const PROMO_DAY_OPTIONS = [1, 3, 7, 14, 30] as const

function pickBracket(brackets: Bracket[], days: number): number {
  const d = Math.max(1, Math.floor(days))
  for (const b of brackets) {
    if (d <= b.upTo) return b.tetriPerDay
  }
  return brackets[brackets.length - 1]!.tetriPerDay
}

/** Daily rate in tetri, or null if product unavailable for category. */
export function dailyRateTetri(
  product: PromoProduct,
  category: PromoCategory,
  days: number,
): number | null {
  const brackets = TABLES[product][category]
  if (!brackets?.length) return null
  return pickBracket(brackets, days)
}

/** Total charge in tetri for `days` at the bracket that applies to that length. */
export function totalTetri(
  product: PromoProduct,
  category: PromoCategory,
  days: number,
): number | null {
  const rate = dailyRateTetri(product, category, days)
  if (rate == null) return null
  return rate * Math.max(1, Math.floor(days))
}

/** 30-day real-estate package totals — backs flat monthly SystemConfig until per-day checkout. */
export const MONTHLY_RE_TETRI = {
  vip: totalTetri("vip", "real_estate", 30)!, // 30₾
  vip_plus: totalTetri("vip_plus", "real_estate", 30)!, // 60₾
  super_vip: totalTetri("super_vip", "real_estate", 30)!, // 150₾
} as const

/** Config / payment key → 30d RE tetri */
export const TIER_MONTHLY_TETRI: Record<TierKey, number> = {
  vip: MONTHLY_RE_TETRI.vip,
  super_vip: MONTHLY_RE_TETRI.vip_plus,
  diamond: MONTHLY_RE_TETRI.super_vip,
}

/** Display helper: "0.80₾" / "8₾" */
export function formatGel(tetri: number): string {
  const gel = tetri / 100
  if (Number.isInteger(gel)) return `${gel}₾`
  return `${gel.toFixed(2)}₾`
}

export function savingsPct(product: PromoProduct, category: PromoCategory, days: number): number | null {
  const short = dailyRateTetri(product, category, 1)
  const long = dailyRateTetri(product, category, days)
  if (short == null || long == null || short <= long) return null
  return Math.round(((short - long) / short) * 100)
}

/** Self-check — fails loud if competitor-undercut math drifts. */
export function assertPromoPricing(): void {
  const checks: Array<[string, boolean]> = [
    ["SV 1d RE under 900", dailyRateTetri("super_vip", "real_estate", 1)! < 900],
    ["SV 30d RE under 600", dailyRateTetri("super_vip", "real_estate", 30)! < 600],
    ["VIP+ 1d under MyHome 400", dailyRateTetri("vip_plus", "real_estate", 1)! < 400],
    ["VIP RE = 100", dailyRateTetri("vip", "real_estate", 1) === 100],
    ["VIP+ not in market", dailyRateTetri("vip_plus", "market_auto_service", 1) === null],
    ["30d VIP = 3000", MONTHLY_RE_TETRI.vip === 3000],
    ["30d VIP+ = 6000", MONTHLY_RE_TETRI.vip_plus === 6000],
    ["30d SV = 15000", MONTHLY_RE_TETRI.super_vip === 15000],
    ["FB under 4900", ADDON_TETRI.facebook < 4900],
  ]
  for (const [label, ok] of checks) {
    if (!ok) throw new Error(`promo-pricing assert failed: ${label}`)
  }
}
