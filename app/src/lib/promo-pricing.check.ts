import {
  assertPromoPricing,
  dailyRateTetri,
  totalTetri,
  formatGel,
  COMPETITOR,
  ADDON_TETRI,
  TIER_MONTHLY_TETRI,
  tierKeyToBadge,
  tierRankOf,
  effectiveTierKey,
  isCheckoutAddon,
  addonPriceTetri,
  COLOR_HIGHLIGHT_DAYS,
  activeColorUntil,
} from "./promo-pricing"

assertPromoPricing()

const seven = totalTetri("vip_plus", "real_estate", 7)!
if (seven !== 250 * 7) throw new Error(`7d VIP+ expected 1750 tetri, got ${seven}`)
if (formatGel(100) !== "1₾") throw new Error(`formatGel(100) = ${formatGel(100)}`)
if (dailyRateTetri("super_vip", "real_estate", 30) !== 500) throw new Error("30d SV rate")

// Payment key ↔ monthly package must stay wired
if (TIER_MONTHLY_TETRI.vip !== 3000) throw new Error("config vip monthly")
if (TIER_MONTHLY_TETRI.super_vip !== 6000) throw new Error("config VIP+ monthly")
if (TIER_MONTHLY_TETRI.diamond !== 15000) throw new Error("config SUPER VIP monthly")

if (tierRankOf("vip") !== 1) throw new Error("tierRank vip")
if (tierRankOf("diamond", new Date(0)) !== 0) throw new Error("expired rank")
if (effectiveTierKey("diamond", new Date(0)) !== "standard") throw new Error("expired key")
if (!isCheckoutAddon("refresh_once")) throw new Error("addon key")
if (addonPriceTetri("color") !== ADDON_TETRI.color) throw new Error("addon price")
if (COLOR_HIGHLIGHT_DAYS !== 7) throw new Error("color days")
if (activeColorUntil({ colorUntil: new Date(Date.now() + 60_000).toISOString() }) == null) {
  throw new Error("color active")
}
if (activeColorUntil({ colorUntil: new Date(0).toISOString() }) != null) {
  throw new Error("color expired")
}

// Spot-check undercuts vs live competitor constants
const table = [
  ["SV1", dailyRateTetri("super_vip", "real_estate", 1)!, COMPETITOR.ss.super_vip_re[0]],
  ["VP1", dailyRateTetri("vip_plus", "real_estate", 1)!, COMPETITOR.ss.vip_plus_re[0]],
  ["VIP", dailyRateTetri("vip", "real_estate", 1)!, COMPETITOR.ss.vip_re],
] as const
for (const [name, ours, ss] of table) {
  if (name === "VIP") {
    if (ours !== ss) throw new Error(`${name}: expected match SS ${ss}, got ${ours}`)
  } else if (ours >= ss) {
    throw new Error(`${name}: must undercut SS ${ss}, got ${ours}`)
  }
}
if (ADDON_TETRI.facebook >= COMPETITOR.myhome.facebook) {
  throw new Error("FB must undercut MyHome 49")
}
if (tierKeyToBadge("diamond") !== "SUPER VIP") throw new Error("badge map")

console.log("promo-pricing: ok")
console.log(
  "RE 30d packages:",
  `VIP ${formatGel(3000)} · VIP+ ${formatGel(6000)} · SUPER VIP ${formatGel(15000)}`,
)
