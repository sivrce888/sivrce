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
  STORY_DAYS,
  activeColorUntil,
  activeUrgentUntil,
  activePriceDropUntil,
  activeStoryUntil,
  extendIso,
  nextTierExpiresAt,
  TIER_DURATION_DAYS,
  clampPromoDays,
  tierCheckoutTetri,
  PROMO_INTENT_KEY,
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
if (STORY_DAYS !== 1) throw new Error("story days")
if (TIER_DURATION_DAYS !== 30) throw new Error("tier package days")
const now = new Date("2026-07-20T12:00:00.000Z")
const renew = nextTierExpiresAt("vip", new Date("2026-07-25T12:00:00.000Z"), "vip", 30, now)
if (renew.toISOString() !== "2026-08-24T12:00:00.000Z") {
  throw new Error(`renew stack got ${renew.toISOString()}`)
}
const upgrade = nextTierExpiresAt("vip", new Date("2026-08-20T12:00:00.000Z"), "diamond", 30, now)
if (upgrade.toISOString() !== "2026-08-19T12:00:00.000Z") {
  throw new Error(`upgrade fresh got ${upgrade.toISOString()}`)
}
const turboNoShorten = nextTierExpiresAt(
  "diamond",
  new Date("2026-08-20T12:00:00.000Z"),
  "diamond",
  7,
  now,
)
if (turboNoShorten.toISOString() !== "2026-08-27T12:00:00.000Z") {
  throw new Error(`turbo stack got ${turboNoShorten.toISOString()}`)
}
const expiredRenew = nextTierExpiresAt("vip", new Date("2026-07-01T12:00:00.000Z"), "vip", 30, now)
if (expiredRenew.toISOString() !== "2026-08-19T12:00:00.000Z") {
  throw new Error(`expired renew fresh got ${expiredRenew.toISOString()}`)
}
if (TURBO_DAYS.turbo_7 !== 7) throw new Error("turbo days")
if (!isCheckoutAddon("story")) throw new Error("story addon")
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
if (activeStoryUntil({ storyUntil: new Date(Date.now() + 60_000).toISOString() }) == null) {
  throw new Error("story active")
}
if (activeStoryUntil({ storyUntil: new Date(0).toISOString() }) != null) {
  throw new Error("story expired")
}
if (ADDON_TETRI.story !== COMPETITOR.ss.story) throw new Error("story must match SS 3")
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
if (clampPromoDays(0) !== 1) throw new Error("clamp min")
if (clampPromoDays(99) !== 30) throw new Error("clamp max")
if (tierCheckoutTetri("vip", 1) !== 100) throw new Error("1d VIP tetri")
if (tierCheckoutTetri("diamond", 7) !== 700 * 7) throw new Error("7d SUPER VIP")
if (tierCheckoutTetri("vip", 30, 3100) !== 3100) throw new Error("30d override")
if (!PROMO_INTENT_KEY) throw new Error("intent key")

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
  `· story ${formatGel(ADDON_TETRI.story)}`,
)
