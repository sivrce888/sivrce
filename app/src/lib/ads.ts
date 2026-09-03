/**
 * Display-ad slots, targeting, and weighted pick.
 * Listing VIP/turbo lives in promo-pricing.ts — this is site banners.
 */

import type { Lang } from "@/lib/i18n/core"

export const AD_SLOTS = [
  "home_hero",
  "home_mid",
  "home_after_projects",
  "search_top",
  "search_native",
  "listing_rail",
  "neighborhoods",
  "blog",
  "agents",
  "agencies",
  "developers",
  "projects",
  "mortgage",
  "advertise",
  "services",
] as const

export type AdSlotId = (typeof AD_SLOTS)[number]

export const AD_FORMATS = ["billboard", "strip", "native", "tile"] as const
export type AdFormat = (typeof AD_FORMATS)[number]

export const AD_STATUSES = ["draft", "live", "paused"] as const
export type AdStatus = (typeof AD_STATUSES)[number]

export const AD_AUDIENCES = [
  "all",
  "guest",
  "buyer",
  "seller",
  "agent",
  "agency",
  "developer",
] as const
export type AdAudience = (typeof AD_AUDIENCES)[number]

export const SLOT_META: Record<
  AdSlotId,
  { label: string; format: AdFormat; hint: string }
> = {
  home_hero: { label: "Home · below search", format: "billboard", hint: "First paid surface after the hero." },
  home_mid: { label: "Home · mid page", format: "billboard", hint: "Between listings and the map." },
  home_after_projects: { label: "Home · after projects", format: "strip", hint: "Developer / bank after the project rail." },
  search_top: { label: "Search · above results", format: "strip", hint: "Strip over the result count." },
  search_native: { label: "Search · in grid", format: "native", hint: "Sits in the listing grid like a card." },
  listing_rail: { label: "Listing · sidebar", format: "tile", hint: "Under the agent / lead card." },
  neighborhoods: { label: "Neighborhoods", format: "strip", hint: "Guide index." },
  blog: { label: "Blog", format: "strip", hint: "Editorial index." },
  agents: { label: "Agents directory", format: "strip", hint: "Pro directory." },
  agencies: { label: "Agencies directory", format: "strip", hint: "Agency directory." },
  developers: { label: "Developers directory", format: "strip", hint: "Developer directory." },
  projects: { label: "Projects", format: "strip", hint: "New-builds hub." },
  mortgage: { label: "Mortgage calculator", format: "strip", hint: "Bank / loan product." },
  advertise: { label: "Advertise page", format: "billboard", hint: "Partner upsell on the pricing page." },
  services: { label: "Services directory", format: "strip", hint: "Renovation / legal / photo marketplace." },
}

export type PublicAd = {
  id: string
  slot: AdSlotId
  format: AdFormat
  title: string
  subtitle: string | null
  ctaLabel: string | null
  href: string
  imageUrl: string | null
  advertiser: string | null
}

export type AdCandidate = PublicAd & {
  weight: number
  audiences: string[]
  langs: string[]
  startsAt: Date | null
  endsAt: Date | null
  status: string
}

const SPONSORED: Record<Lang, string> = {
  ka: "რეკლამა",
  en: "Sponsored",
  ru: "Реклама",
  he: "ממומן",
  ar: "إعلان",
  tr: "Sponsorlu",
  uk: "Реклама",
  hy: "Գովազդ",
  az: "Reklam",
}

export function sponsoredLabel(lang: Lang): string {
  return SPONSORED[lang]
}

export function isAdSlot(v: string): v is AdSlotId {
  return (AD_SLOTS as readonly string[]).includes(v)
}

export function isAdFormat(v: string): v is AdFormat {
  return (AD_FORMATS as readonly string[]).includes(v)
}

export function isAdStatus(v: string): v is AdStatus {
  return (AD_STATUSES as readonly string[]).includes(v)
}

export function isAdAudience(v: string): v is AdAudience {
  return (AD_AUDIENCES as readonly string[]).includes(v)
}

export function audienceFromRole(role: string | null | undefined): AdAudience {
  if (!role) return "guest"
  switch (role) {
    case "buyer":
    case "seller":
    case "agent":
    case "agency":
    case "developer":
      return role
    case "admin":
      return "all"
    default:
      return "guest"
  }
}

export function matchesAudience(audiences: string[], viewer: AdAudience): boolean {
  if (audiences.length === 0 || audiences.includes("all")) return true
  if (viewer === "all") return true
  return audiences.includes(viewer)
}

export function matchesLang(langs: string[], lang: Lang): boolean {
  if (langs.length === 0 || langs.includes("all")) return true
  return langs.includes(lang)
}

export function isLiveNow(row: { status: string; startsAt: Date | null; endsAt: Date | null }, now = Date.now()): boolean {
  if (row.status !== "live") return false
  if (row.startsAt && row.startsAt.getTime() > now) return false
  if (row.endsAt && row.endsAt.getTime() < now) return false
  return true
}

/** Weighted random among matches. Deterministic when rng is injected (checks). */
export function pickWeighted<T extends { weight: number }>(rows: T[], rng: () => number = Math.random): T | null {
  if (rows.length === 0) return null
  const total = rows.reduce((s, r) => s + Math.max(1, r.weight), 0)
  let n = rng() * total
  for (const row of rows) {
    n -= Math.max(1, row.weight)
    if (n <= 0) return row
  }
  return rows[rows.length - 1] ?? null
}

export function filterCandidates(
  rows: AdCandidate[],
  slot: AdSlotId,
  viewer: AdAudience,
  lang: Lang,
  now = Date.now(),
): AdCandidate[] {
  return rows.filter(
    (r) =>
      r.slot === slot &&
      isLiveNow(r, now) &&
      matchesAudience(r.audiences, viewer) &&
      matchesLang(r.langs, lang),
  )
}

export function isSafeHref(raw: string): boolean {
  const s = raw.trim()
  if (s.startsWith("/") && !s.startsWith("//") && !s.includes("\\")) return s.length <= 500
  try {
    const u = new URL(s)
    return (u.protocol === "https:" || u.protocol === "http:") && s.length <= 500
  } catch {
    return false
  }
}

export function isInternalHref(href: string): boolean {
  return href.startsWith("/") && !href.startsWith("//")
}

export function toPublicAd(row: AdCandidate): PublicAd {
  return {
    id: row.id,
    slot: row.slot,
    format: isAdFormat(row.format) ? row.format : SLOT_META[row.slot].format,
    title: row.title,
    subtitle: row.subtitle,
    ctaLabel: row.ctaLabel,
    href: row.href,
    imageUrl: row.imageUrl,
    advertiser: row.advertiser,
  }
}
