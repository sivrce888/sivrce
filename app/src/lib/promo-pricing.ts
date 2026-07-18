/**
 * Sivrce promo tariffs — single source of truth.
 *
 * Competitor snapshot 2026-07-18:
 * - SS.ge help (public): SUPER VIP RE 9/8/7/6 · VIP+ 3/2.5 · VIP 1 · FB 45/95/135
 * - MyHome.ge (account modal screenshots): SUPER VIP 9 · VIP+ 4 · VIP 2.50 ·
 *   refresh 0.25–0.30 · color 0.30 · FB 49
 * - Livo.ge: no public day-rate VIP list (services/azomva, not classified boosts)
 * - Korter.ge: balance boost / sales quote — no public day tariffs
 *
 * Strategy: undercut SS + MyHome on VIP+ / SUPER VIP / addons; VIP RE = SS (1₾),
 * still far under MyHome 2.50. VIP+ recommended; SUPER VIP = ARPU anchor.
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

export type PromoBadge = "VIP" | "VIP+" | "SUPER VIP"

/** Verified competitor daily rates in tetri (RE unless noted). */
export const COMPETITOR = {
  ss: {
    super_vip_re: [900, 800, 700, 600] as const, // 1-3 / 4-8 / 9-29 / 30+
    vip_plus_re: [300, 250] as const, // 1-7 / 10+
    vip_re: 100,
    facebook: [4500, 9500, 13500] as const, // 3d / 7d / 7d XL
  },
  myhome: {
    super_vip_re: 900,
    vip_plus_re: 400,
    vip_re: 250,
    refresh_once: 25,
    refresh_auto_from: 30,
    color: 30,
    facebook: 4900,
  },
} as const

/** Bracket: apply this tetri/day when days <= upTo (last row = ∞). */
type Bracket = { upTo: number; tetriPerDay: number }

const SUPER_VIP: Record<PromoCategory, Bracket[]> = {
  real_estate: [
    { upTo: 3, tetriPerDay: 800 }, // 8 vs SS/MyHome 9
    { upTo: 8, tetriPerDay: 700 }, // 7 vs SS 8
    { upTo: 29, tetriPerDay: 600 }, // 6 vs SS 7
    { upTo: Infinity, tetriPerDay: 500 }, // 5 vs SS 6
  ],
  finance: [
    { upTo: 3, tetriPerDay: 650 }, // vs SS 8
    { upTo: 8, tetriPerDay: 550 },
    { upTo: 29, tetriPerDay: 450 },
    { upTo: Infinity, tetriPerDay: 400 },
  ],
  jobs_edu: [
    { upTo: 9, tetriPerDay: 500 }, // vs SS 6
    { upTo: 29, tetriPerDay: 400 },
    { upTo: Infinity, tetriPerDay: 350 },
  ],
  market_auto_service: [
    { upTo: 3, tetriPerDay: 250 }, // vs SS 3
    { upTo: 8, tetriPerDay: 150 },
    { upTo: Infinity, tetriPerDay: 120 },
  ],
}

/** VIP+ — real estate only (same product scope as SS) */
const VIP_PLUS: Partial<Record<PromoCategory, Bracket[]>> = {
  real_estate: [
    { upTo: 7, tetriPerDay: 250 }, // 2.50 vs SS 3 / MyHome 4
    { upTo: Infinity, tetriPerDay: 200 }, // 2.00 vs SS 2.50 @10+
  ],
}

const VIP: Record<PromoCategory, Bracket[]> = {
  real_estate: [{ upTo: Infinity, tetriPerDay: 100 }], // 1₾ = SS; MyHome 2.50
  finance: [{ upTo: Infinity, tetriPerDay: 150 }], // vs SS 2
  jobs_edu: [
    { upTo: 9, tetriPerDay: 250 }, // vs SS 3
    { upTo: Infinity, tetriPerDay: 150 }, // vs SS 2
  ],
  market_auto_service: [{ upTo: Infinity, tetriPerDay: 40 }], // vs SS 0.50
}

const TABLES: Record<PromoProduct, Partial<Record<PromoCategory, Bracket[]>>> = {
  vip: VIP,
  vip_plus: VIP_PLUS,
  super_vip: SUPER_VIP,
}

/** Add-ons — undercut MyHome + SS entry FB / urgent / turbo packages */
export const ADDON_TETRI = {
  refresh_once: 20, // MyHome 0.25
  refresh_auto_from: 25, // MyHome from 0.30
  color: 25, // MyHome 0.30
  /** 1 დღე — under SS სასწრაფოდ ~5₾ */
  sticker_urgent: 400,
  /** 7 დღე — price-drop signal (no SS twin; high intent) */
  sticker_price_drop: 250,
  /**
   * Turbo = SUPER VIP + ფერი + სასწრაფოდ + bump.
   * À la carte 7d ≈ 77₾ → −20% = 62₾ (SS Turbo ~100₾).
   */
  turbo_7: 6200,
  turbo_14: 10500, // ≈ −25% vs stack
  turbo_30: 18900, // ≈ −30% vs stack
  /** Default / entry Facebook package (3 დღე) — under SS 45 & MyHome 49 */
  facebook: 3900,
  facebook_7d: 8500, // under SS 95
  facebook_7d_xl: 12000, // under SS 135
} as const

export type AddonKey = keyof typeof ADDON_TETRI

/** Checkout add-ons (auto-refresh schedule is P1 SaaS, not à la carte yet). */
export const CHECKOUT_ADDONS = [
  "refresh_once",
  "color",
  "sticker_urgent",
  "sticker_price_drop",
  "turbo_7",
  "turbo_14",
  "turbo_30",
  "facebook",
  "facebook_7d",
  "facebook_7d_xl",
] as const satisfies ReadonlyArray<AddonKey>

export type CheckoutAddon = (typeof CHECKOUT_ADDONS)[number]

/** Color highlight window after purchase (days). */
export const COLOR_HIGHLIGHT_DAYS = 7

/** Paid sticker windows (days). */
export const STICKER_URGENT_DAYS = 1
export const STICKER_PRICE_DROP_DAYS = 7

/** Turbo duration by SKU. */
export const TURBO_DAYS: Record<"turbo_7" | "turbo_14" | "turbo_30", number> = {
  turbo_7: 7,
  turbo_14: 14,
  turbo_30: 30,
}

/** Min gap between paid refreshes (ms). */
export const REFRESH_COOLDOWN_MS = 60 * 60 * 1000

export function isCheckoutAddon(v: string): v is CheckoutAddon {
  return (CHECKOUT_ADDONS as ReadonlyArray<string>).includes(v)
}

export function isTurboAddon(v: string): v is keyof typeof TURBO_DAYS {
  return v === "turbo_7" || v === "turbo_14" || v === "turbo_30"
}

export function addonPriceTetri(addon: CheckoutAddon): number {
  return ADDON_TETRI[addon]
}

/** Active ISO expiry, or undefined if expired/absent. */
export function activeIsoUntil(
  iso: string | undefined | null,
  now: number = Date.now(),
): string | undefined {
  if (!iso) return undefined
  const t = Date.parse(iso)
  if (Number.isNaN(t) || t < now) return undefined
  return iso
}

/** Active color highlight ISO, or undefined if expired/absent. */
export function activeColorUntil(
  ext: { colorUntil?: string } | null | undefined,
  now: number = Date.now(),
): string | undefined {
  return activeIsoUntil(ext?.colorUntil, now)
}

/** Stack duration onto an existing future ISO (or now). */
export function extendIso(
  prev: string | undefined,
  days: number,
  now: Date = new Date(),
): Date {
  const baseMs =
    prev && Date.parse(prev) > now.getTime() ? Date.parse(prev) : now.getTime()
  return new Date(baseMs + Math.max(1, days) * 86_400_000)
}

export type PromoExtFields = {
  condition?: string
  buildingStatus?: string
  colorUntil?: string
  urgentUntil?: string
  priceDropUntil?: string
}

export function activeUrgentUntil(
  ext: PromoExtFields | null | undefined,
  now: number = Date.now(),
): string | undefined {
  return activeIsoUntil(ext?.urgentUntil, now)
}

export function activePriceDropUntil(
  ext: PromoExtFields | null | undefined,
  now: number = Date.now(),
): string | undefined {
  return activeIsoUntil(ext?.priceDropUntil, now)
}

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

/** DB / payment tier key → public badge (single mapping for UI + search). */
export function tierKeyToBadge(tier: string): PromoBadge | null {
  switch (tier) {
    case "vip":
      return "VIP"
    case "super_vip":
      return "VIP+"
    case "diamond":
      return "SUPER VIP"
    case "standard":
      return null
    default:
      return null
  }
}

/** Search/map sort weight. Expired paid tiers collapse to 0 (standard). */
export function tierRankOf(
  tier: string,
  expiresAt?: Date | string | null,
  now: number = Date.now(),
): number {
  if (expiresAt) {
    const t = typeof expiresAt === "string" ? Date.parse(expiresAt) : expiresAt.getTime()
    if (!Number.isNaN(t) && t < now) return 0
  }
  switch (tier) {
    case "diamond":
      return 3
    case "super_vip":
      return 2
    case "vip":
      return 1
    default:
      return 0
  }
}

/** Active DB tier key for indexing (expired → standard). */
export function effectiveTierKey(
  tier: string,
  expiresAt?: Date | string | null,
  now: number = Date.now(),
): string {
  return tierRankOf(tier, expiresAt, now) === 0 ? "standard" : tier
}

/** Display helper: "1₾" / "2.50₾" */
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

/** Self-check — fails loud if we drift above competitors or remap tiers. */
export function assertPromoPricing(): void {
  const sv1 = dailyRateTetri("super_vip", "real_estate", 1)!
  const sv30 = dailyRateTetri("super_vip", "real_estate", 30)!
  const vp1 = dailyRateTetri("vip_plus", "real_estate", 1)!
  const vp30 = dailyRateTetri("vip_plus", "real_estate", 30)!
  const vip1 = dailyRateTetri("vip", "real_estate", 1)!

  const checks: Array<[string, boolean]> = [
    ["SV 1d < SS/MyHome 9", sv1 < COMPETITOR.ss.super_vip_re[0]],
    ["SV 30d < SS 6", sv30 < COMPETITOR.ss.super_vip_re[3]],
    ["VIP+ 1d < SS 3", vp1 < COMPETITOR.ss.vip_plus_re[0]],
    ["VIP+ 1d < MyHome 4", vp1 < COMPETITOR.myhome.vip_plus_re],
    ["VIP+ 30d rate < SS 2.50", vp30 / 30 < COMPETITOR.ss.vip_plus_re[1]],
    ["VIP RE = SS 1", vip1 === COMPETITOR.ss.vip_re],
    ["VIP RE < MyHome 2.50", vip1 < COMPETITOR.myhome.vip_re],
    ["VIP+ not in market", dailyRateTetri("vip_plus", "market_auto_service", 1) === null],
    ["30d VIP = 3000", MONTHLY_RE_TETRI.vip === 3000],
    ["30d VIP+ = 6000", MONTHLY_RE_TETRI.vip_plus === 6000],
    ["30d SV = 15000", MONTHLY_RE_TETRI.super_vip === 15000],
    ["FB entry < SS 45", ADDON_TETRI.facebook < COMPETITOR.ss.facebook[0]],
    ["FB entry < MyHome 49", ADDON_TETRI.facebook < COMPETITOR.myhome.facebook],
    ["FB 7d < SS 95", ADDON_TETRI.facebook_7d < COMPETITOR.ss.facebook[1]],
    ["FB XL < SS 135", ADDON_TETRI.facebook_7d_xl < COMPETITOR.ss.facebook[2]],
    ["refresh < MyHome", ADDON_TETRI.refresh_once < COMPETITOR.myhome.refresh_once],
    ["color < MyHome", ADDON_TETRI.color < COMPETITOR.myhome.color],
    ["urgent < SS 5", ADDON_TETRI.sticker_urgent < 500],
    ["turbo_7 < SS ~100", ADDON_TETRI.turbo_7 < 10000],
    ["turbo_7 < stack", ADDON_TETRI.turbo_7 < 7745],
    ["checkout addons 10", CHECKOUT_ADDONS.length === 10],
    ["tier vip → VIP", tierKeyToBadge("vip") === "VIP"],
    ["tier super_vip → VIP+", tierKeyToBadge("super_vip") === "VIP+"],
    ["tier diamond → SUPER VIP", tierKeyToBadge("diamond") === "SUPER VIP"],
    ["rank diamond 3", tierRankOf("diamond") === 3],
    ["rank expired 0", tierRankOf("diamond", new Date(0)) === 0],
  ]
  for (const [label, ok] of checks) {
    if (!ok) throw new Error(`promo-pricing assert failed: ${label}`)
  }
}
