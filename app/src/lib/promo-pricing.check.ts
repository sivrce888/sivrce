/**
 * Runnable check: npx tsx src/lib/promo-pricing.check.ts
 * ponytail: one assert file, no test framework.
 */
import { assertPromoPricing, dailyRateTetri, totalTetri, formatGel } from "./promo-pricing"

assertPromoPricing()

// Spot-check display + 7-day totals (default chip)
const seven = totalTetri("vip_plus", "real_estate", 7)!
if (seven !== 250 * 7) throw new Error(`7d VIP+ expected 1750 tetri, got ${seven}`)
if (formatGel(100) !== "1₾") throw new Error(`formatGel(100) = ${formatGel(100)}`)
if (dailyRateTetri("super_vip", "real_estate", 30) !== 500) throw new Error("30d SV rate")

console.log("promo-pricing: ok")
