/**
 * Homepage paid rails — pick live photo listings for a public badge.
 * DB tier keys: diamond = SUPER VIP · super_vip = VIP+.
 */

export type HomeRailTier = "diamond" | "super_vip"
export type HomeRailBadge = "SUPER VIP" | "VIP+"

export const HOME_RAIL_BADGE: Record<HomeRailTier, HomeRailBadge> = {
  diamond: "SUPER VIP",
  super_vip: "VIP+",
}

export const SEARCH_TIERS = ["diamond", "super_vip", "vip"] as const
export type SearchTier = (typeof SEARCH_TIERS)[number]

export function isSearchTier(v: string | null | undefined): v is SearchTier {
  return SEARCH_TIERS.includes(v as SearchTier)
}

export function homeRailSearchHref(tier: HomeRailTier): string {
  return `/search?tier=${tier}`
}

/** Photo-first, then views. Empty photos never make the homepage. */
export function pickHomeRail<T extends { badge: string | null; images: unknown[]; views: number }>(
  items: T[],
  badge: HomeRailBadge,
  limit: number,
): T[] {
  const n = Math.max(0, Math.floor(limit))
  if (n === 0) return []
  return items
    .filter((l) => l.badge === badge && l.images.length > 0)
    .sort((a, b) => b.images.length - a.images.length || b.views - a.views)
    .slice(0, n)
}
