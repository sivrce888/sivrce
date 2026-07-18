import {
  assertPromoPricing,
  dailyRateTetri,
  totalTetri,
  formatGel,
  COMPETITOR,
  ADDON_TETRI,
  TIER_MONTHLY_TETRI,
  TURBO_DAYS,
  tierKeyToBadge,
  tierRankOf,
  effectiveTierKey,
  isCheckoutAddon,
  isTurboAddon,
  addonPriceTetri,
  COLOR_HIGHLIGHT_DAYS,
  STICKER_URGENT_DAYS,
  STICKER_PRICE_DROP_DAYS,
  activeColorUntil,
  activeUrgentUntil,
  activePriceDropUntil,
  extendIso,
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
if (!isCheckoutAddon("sticker_urgent")) throw new Error("urgent addon")
if (!isCheckoutAddon("turbo_7")) throw new Error("turbo addon")
if (!isTurboAddon("turbo_14")) throw new Error("turbo detect")
if (addonPriceTetri("color") !== ADDON_TETRI.color) throw new Error("addon price")
if (COLOR_HIGHLIGHT_DAYS !== 7) throw new Error("color days")
if (STICKER_URGENT_DAYS !== 1) throw new Error("urgent days")
if (STICKER_PRICE_DROP_DAYS !== 7) throw new Error("price-drop days")
if (TURBO_DAYS.turbo_7 !== 7) throw new Error("turbo days")
if (activeColorUntil({ colorUntil: new Date(Date.now() + 60_000).toISOString() }) == null) {
  throw new Error("color active")
}
if (activeColorUntil({ colorUntil: new Date(0).toISOString() }) != null) {
  throw new Error("color expired")
}
if (activeUrgentUntil({ urgentUntil: new Date(Date.now() + 60_000).toISOString() }) == null) {
  throw new Error("urgent active")
}
if (activePriceDropUntil({ priceDropUntil: new Date(0).toISOString() }) != null) {
  throw new Error("price-drop expired")
}
const stacked = extendIso(new Date(Date.now() + 86_400_000).toISOString(), 1)
if (stacked.getTime() < Date.now() + 86_400_000) throw new Error("extend stacks")

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
console.log(
  "addons:",
  `Turbo ${formatGel(ADDON_TETRI.turbo_7)}/${formatGel(ADDON_TETRI.turbo_14)}/${formatGel(ADDON_TETRI.turbo_30)}`,
  `· urgent ${formatGel(ADDON_TETRI.sticker_urgent)}`,
  `· price↓ ${formatGel(ADDON_TETRI.sticker_price_drop)}`,
)
