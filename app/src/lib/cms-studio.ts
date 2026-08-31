/**
 * SIVRCE — visual CMS studio model (isomorphic).
 * Shopify-style customizer: homepage sections + site pages. Storage keys
 * reuse cms-blocks; layout lives in SystemConfig `cms.layout.home`.
 */

import { ka } from "./i18n/ka"
import {
  CMS_BLOCK_KEYS,
  CMS_SEO_KEYS,
  type CmsRow,
  cmsRowForKey,
  cmsRowsForGroup,
} from "./cms-blocks"
import type { Lang } from "./i18n/core"

export const CMS_LAYOUT_ID = "cms.layout.home"

export const HOME_FLOW = [
  "stories",
  "categories",
  "listings",
  "vip_plus",
  "ad_mid",
  "neighborhoods",
  "map",
  "projects",
  "ad_after_projects",
  "agents",
  "developers",
  "services",
  "stats",
  "forum",
  "blog",
  "cta",
] as const

export type HomeFlowId = (typeof HOME_FLOW)[number]

export type HomeLayoutItem = { id: HomeFlowId; hidden?: boolean }

export interface StudioPage {
  id: string
  path: string
  label: string
  /** Dict-key prefix for non-home pages. Home uses HOME_SECTIONS instead. */
  group?: string
}

export interface StudioSection {
  id: string
  label: string
  /** Pinned chrome — not in the reorder list. */
  pin?: "start" | "end" | "meta"
  keys: string[]
}

export const STUDIO_PAGES: readonly StudioPage[] = [
  { id: "home", path: "/", label: "Home" },
  { id: "search", path: "/search", label: "Search", group: "search" },
  { id: "map", path: "/map", label: "Map", group: "map" },
  { id: "projects", path: "/projects", label: "Projects" },
  { id: "buildings", path: "/buildings", label: "Buildings" },
  { id: "agents", path: "/agents", label: "Agents" },
  { id: "blog", path: "/blog", label: "Blog" },
  { id: "forum", path: "/forum", label: "Forum" },
  { id: "about", path: "/about", label: "About" },
  { id: "contact", path: "/contact", label: "Contact" },
  { id: "faq", path: "/faq", label: "FAQ" },
  { id: "advertise", path: "/advertise", label: "Advertise" },
]

function blockKeys(prefix: string): string[] {
  return CMS_BLOCK_KEYS.filter((k) => k === prefix || k.startsWith(`${prefix}.`)).map(
    (k) => `block.${k}`,
  )
}

function dictKeys(prefix: string): string[] {
  return Object.keys(ka).filter((k) => k === prefix || k.startsWith(`${prefix}.`))
}

export const HOME_SECTIONS: readonly StudioSection[] = [
  { id: "nav", label: "Navigation", pin: "start", keys: dictKeys("nav") },
  {
    id: "hero",
    label: "Hero",
    pin: "start",
    keys: [...blockKeys("home.hero"), ...blockKeys("home.search")],
  },
  { id: "stories", label: "Stories", keys: blockKeys("home.stories") },
  { id: "categories", label: "Categories", keys: blockKeys("home.categories") },
  { id: "listings", label: "SUPER VIP", keys: blockKeys("home.listings") },
  { id: "vip_plus", label: "VIP+", keys: blockKeys("home.vipPlus") },
  { id: "ad_mid", label: "Banner · mid", keys: [] },
  { id: "neighborhoods", label: "Neighborhoods", keys: blockKeys("home.nb") },
  { id: "map", label: "3D Map", keys: blockKeys("home.map") },
  { id: "projects", label: "Projects", keys: blockKeys("home.projects") },
  { id: "ad_after_projects", label: "Banner · projects", keys: [] },
  { id: "agents", label: "Agents", keys: blockKeys("home.agents") },
  { id: "developers", label: "Developers", keys: blockKeys("home.devs") },
  { id: "services", label: "Services", keys: blockKeys("home.services") },
  { id: "stats", label: "Stats", keys: blockKeys("home.stats") },
  { id: "forum", label: "Forum", keys: blockKeys("home.forum") },
  { id: "blog", label: "Blog", keys: blockKeys("home.blog") },
  { id: "cta", label: "Call to action", keys: blockKeys("home.cta") },
  { id: "footer", label: "Footer", pin: "end", keys: dictKeys("footer") },
  { id: "seo", label: "SEO", pin: "meta", keys: [...CMS_SEO_KEYS] },
]

const FLOW_SET = new Set<string>(HOME_FLOW)

export function defaultHomeLayout(): HomeLayoutItem[] {
  return HOME_FLOW.map((id) => ({ id }))
}

/** Merge stored order with the coded flow — drop unknown, append missing. */
export function parseHomeLayout(raw: unknown): HomeLayoutItem[] {
  const src: unknown[] | null = Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object" && Array.isArray((raw as { order?: unknown }).order)
      ? (raw as { order: unknown[] }).order
      : null
  const items: HomeLayoutItem[] = []
  if (src) {
    for (const x of src) {
      const id =
        typeof x === "string"
          ? x
          : x && typeof x === "object" && typeof (x as { id: unknown }).id === "string"
            ? (x as { id: string }).id
            : null
      if (!id || !FLOW_SET.has(id) || items.some((i) => i.id === id)) continue
      const hidden =
        typeof x === "object" && x !== null && (x as { hidden?: unknown }).hidden === true
      items.push(hidden ? { id: id as HomeFlowId, hidden: true } : { id: id as HomeFlowId })
    }
  }
  for (const id of HOME_FLOW) {
    if (!items.some((i) => i.id === id)) items.push({ id })
  }
  return lockHomeVipRails(items)
}

export const HOME_VIP_LEAD = "listings"
export const HOME_VIP_FOLLOW = "vip_plus"

function isVipRail(id: string): boolean {
  return id === HOME_VIP_LEAD || id === HOME_VIP_FOLLOW
}

/** SUPER VIP → VIP+ glued. CMS / studio cannot split them. */
export function lockHomeVipRails(items: HomeLayoutItem[]): HomeLayoutItem[] {
  const vipIdx = items.findIndex((i) => i.id === HOME_VIP_FOLLOW)
  const superIdx = items.findIndex((i) => i.id === HOME_VIP_LEAD)
  if (vipIdx < 0 || superIdx < 0 || vipIdx === superIdx + 1) return items
  const next = items.slice()
  const [vip] = next.splice(vipIdx, 1)
  next.splice(next.findIndex((i) => i.id === HOME_VIP_LEAD) + 1, 0, vip)
  return next
}

/** Studio drag: SUPER VIP moves VIP+ with it. Dropping on VIP+ = drop on the pair. */
export function moveHomeLayout(
  items: HomeLayoutItem[],
  fromId: string,
  overId: string,
): HomeLayoutItem[] {
  const from = fromId === HOME_VIP_FOLLOW ? HOME_VIP_LEAD : fromId
  const over = overId === HOME_VIP_FOLLOW ? HOME_VIP_LEAD : overId
  if (from === over || (isVipRail(fromId) && isVipRail(overId))) return lockHomeVipRails(items)
  const next = items.slice()
  const fi = next.findIndex((i) => i.id === from)
  const ti = next.findIndex((i) => i.id === over)
  if (fi < 0 || ti < 0) return lockHomeVipRails(items)
  const [moved] = next.splice(fi, 1)
  next.splice(ti, 0, moved)
  return lockHomeVipRails(next)
}

export function studioPageById(id: string): StudioPage | undefined {
  return STUDIO_PAGES.find((p) => p.id === id)
}

export function sectionById(id: string): StudioSection | undefined {
  return HOME_SECTIONS.find((s) => s.id === id)
}

export function sectionIdForKey(key: string): string | undefined {
  return HOME_SECTIONS.find((s) => s.keys.includes(key))?.id
}

export function rowsForSection(
  lang: Lang,
  section: StudioSection,
  overrides: Record<string, string>,
): CmsRow[] {
  const rows: CmsRow[] = []
  for (const key of section.keys) {
    const row = cmsRowForKey(lang, key, overrides)
    if (row) rows.push(row)
  }
  return rows
}

export function rowsForPage(
  lang: Lang,
  page: StudioPage,
  overrides: Record<string, string>,
): CmsRow[] {
  if (page.id === "home") return []
  if (page.group) return cmsRowsForGroup(lang, page.group, overrides)
  return []
}

export function previewPath(lang: Lang, path: string): string {
  const suffix = path === "/" ? "" : path
  return lang === "ka" ? suffix || "/" : `/${lang}${suffix}`
}
