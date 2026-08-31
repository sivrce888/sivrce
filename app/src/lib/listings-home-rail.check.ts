/**
 * Runnable check: homepage SUPER VIP / VIP+ rail picker.
 * Run: npx tsx src/lib/listings-home-rail.check.ts
 */
import { HOME_RAIL_BADGE, homeRailSearchHref, isSearchTier, pickHomeRail } from "./listings-home-rail"

type Row = { badge: string | null; images: string[]; views: number; id: string }

const rows: Row[] = [
  { id: "sv-hi", badge: "SUPER VIP", images: ["a", "b", "c"], views: 10 },
  { id: "sv-lo", badge: "SUPER VIP", images: ["a"], views: 99 },
  { id: "sv-empty", badge: "SUPER VIP", images: [], views: 999 },
  { id: "vp-hi", badge: "VIP+", images: ["a", "b"], views: 5 },
  { id: "vp-hot", badge: "VIP+", images: ["a", "b"], views: 50 },
  { id: "vip", badge: "VIP", images: ["a", "b", "c", "d"], views: 80 },
  { id: "plain", badge: null, images: ["a"], views: 1 },
]

const sv = pickHomeRail(rows, "SUPER VIP", 8)
assert(sv.map((r) => r.id).join() === "sv-hi,sv-lo", "SUPER VIP photo-first, skip empty")
assert(!sv.some((r) => r.badge !== "SUPER VIP"), "no VIP+ leak into SUPER VIP")

const vp = pickHomeRail(rows, "VIP+", 8)
assert(vp.map((r) => r.id).join() === "vp-hot,vp-hi", "VIP+ same photo count → views")
assert(vp.length === 2)

assert(pickHomeRail(rows, "SUPER VIP", 1)[0]?.id === "sv-hi", "limit")
assert(pickHomeRail(rows, "SUPER VIP", 0).length === 0)
assert(HOME_RAIL_BADGE.diamond === "SUPER VIP")
assert(HOME_RAIL_BADGE.super_vip === "VIP+")
assert(homeRailSearchHref("diamond") === "/search?tier=diamond")
assert(homeRailSearchHref("super_vip") === "/search?tier=super_vip")
assert(isSearchTier("diamond") && isSearchTier("vip") && !isSearchTier("standard"))

console.log("listings-home-rail.check: ok")

function assert(cond: unknown, msg = "assert failed"): asserts cond {
  if (!cond) throw new Error(msg)
}
