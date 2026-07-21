/**
 * Typed config registry over the SystemConfig table — the ONLY keys the app
 * reads at runtime. Anything else in SystemConfig is inert (raw editor only).
 * Reads go through one cached, tag-busted query: admin settings writes call
 * `updateTag(CONFIG_TAG)` (+ revalidatePath for rendered pages), so saved
 * values apply immediately.
 *
 * ponytail: one cached findMany for all keys instead of per-key lookups.
 * Upgrade path: per-key cache entries if a key ever needs its own TTL.
 */

import { unstable_cache } from "next/cache"

import { db } from "@/lib/db"
import { TIER_MONTHLY_TETRI } from "@/lib/promo-pricing"

export const CONFIG_TAG = "system-config"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
/** Loose international display phone: `+` then digits/spaces, e.g. `+995 32 2 00 00 00`. */
const PHONE_RE = /^\+[0-9][0-9 ]{6,24}$/
/** Prices are stored as tetri (1 GEL = 100 tetri); cap 1 000 000 GEL. */
const MAX_TETRI = 100_000_000

/** Same-origin map style paths only — blocks open-redirect / SSRF via admin. */
const MAP_STYLE_RE = /^\/api\/map\/styles\/[a-z0-9._-]{1,64}$/

export interface ConfigValues {
  "site.contactEmail": string
  "site.contactPhone": string
  "price.vip": number
  "price.superVip": number
  "price.diamond": number
  "map.floorStacksEnabled": boolean
  "map.satelliteEnabled": boolean
  "map.defaultTerrain": "streets" | "clean" | "satellite"
  "map.defaultView3d": boolean
  "map.centerLat": number
  "map.centerLng": number
  "map.minZoom": number
  "map.detailZoom": number
  "map.priceMinZoom": number
  "map.clusterMaxZoom": number
  "map.styleUrlLight": string
  "map.styleUrlClean": string
  "map.styleUrlDark": string
  "map.jsonCacheVer": string
  "map.geocodeEnabled": boolean
}

export type ConfigKey = keyof ConfigValues

export type ConfigInput = "text" | "gel" | "bool" | "select" | "number"

type ConfigSection = "contact" | "marketplace" | "map"

interface ConfigEntry<T> {
  section: ConfigSection
  label: string
  hint: string
  input: ConfigInput
  defaultValue: T
  /** Parse a stored JSON value; null → invalid, fall back to the default. */
  parse: (value: unknown) => T | null
  options?: { value: string; label: string }[]
  min?: number
  max?: number
  step?: number
}

const textParser =
  (re: RegExp) =>
  (value: unknown): string | null =>
    typeof value === "string" && re.test(value) ? value : null

function tetriParser(value: unknown): number | null {
  return typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= MAX_TETRI
    ? value
    : null
}

function boolParser(value: unknown): boolean | null {
  if (value === true || value === false) return value
  if (value === "true") return true
  if (value === "false") return false
  return null
}

function terrainParser(value: unknown): "streets" | "clean" | "satellite" | null {
  return value === "streets" || value === "clean" || value === "satellite" ? value : null
}

function numberParser(min: number, max: number) {
  return (value: unknown): number | null => {
    const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN
    return Number.isFinite(n) && n >= min && n <= max ? n : null
  }
}

export const CONFIG_REGISTRY: { [K in ConfigKey]: ConfigEntry<ConfigValues[K]> } = {
  "site.contactEmail": {
    section: "contact",
    label: "Contact email",
    hint: "Shown on /contact; receives general (brand-level) leads.",
    input: "text",
    defaultValue: "hi@sivrce.ge",
    parse: textParser(EMAIL_RE),
  },
  "site.contactPhone": {
    section: "contact",
    label: "Contact phone",
    hint: "Shown on /contact, display form e.g. +995 32 2 00 00 00.",
    input: "text",
    defaultValue: "+995 32 2 00 00 00",
    parse: textParser(PHONE_RE),
  },
  "price.vip": {
    section: "marketplace",
    label: "VIP price (GEL / 30 days)",
    hint: "უძრავი ქონება · 30 დღე (1₾/დღე). სხვა კატეგორიები: promo-pricing.ts",
    input: "gel",
    defaultValue: TIER_MONTHLY_TETRI.vip,
    parse: tetriParser,
  },
  "price.superVip": {
    section: "marketplace",
    label: "VIP+ price (GEL / 30 days)",
    hint: "უძრავი ქონება · 30 დღე (2.00₾/დღე @30დ). სხვა კატეგორიები: promo-pricing.ts",
    input: "gel",
    defaultValue: TIER_MONTHLY_TETRI.super_vip,
    parse: tetriParser,
  },
  "price.diamond": {
    section: "marketplace",
    label: "SUPER VIP price (GEL / 30 days)",
    hint: "უძრავი ქონება · 30 დღე (5.00₾/დღე @30დ). სხვა კატეგორიები: promo-pricing.ts",
    input: "gel",
    defaultValue: TIER_MONTHLY_TETRI.diamond,
    parse: tetriParser,
  },
  "map.floorStacksEnabled": {
    section: "map",
    label: "Floor stacks (3D)",
    hint: "Per-floor extrusions on /map for developments. Env NEXT_PUBLIC_FLOOR_STACKS=1 also enables.",
    input: "bool",
    defaultValue: false,
    parse: boolParser,
  },
  "map.satelliteEnabled": {
    section: "map",
    label: "Satellite / hybrid basemap",
    hint: "Show hybrid (Esri) terrain toggle on /map.",
    input: "bool",
    defaultValue: true,
    parse: boolParser,
  },
  "map.defaultTerrain": {
    section: "map",
    label: "Default terrain",
    hint: "Used when the visitor has no map cookie yet.",
    input: "select",
    defaultValue: "streets",
    parse: terrainParser,
    options: [
      { value: "streets", label: "Streets (OSM / OpenFreeMap)" },
      { value: "clean", label: "Clean (Positron)" },
      { value: "satellite", label: "Hybrid satellite" },
    ],
  },
  "map.defaultView3d": {
    section: "map",
    label: "Default 3D pitch",
    hint: "Pitch buildings on first visit when no cookie.",
    input: "bool",
    defaultValue: true,
    parse: boolParser,
  },
  "map.centerLat": {
    section: "map",
    label: "Map center latitude",
    hint: "Initial /map center (Tbilisi default).",
    input: "number",
    defaultValue: 41.7151,
    parse: numberParser(40.95, 43.6),
    min: 40.95,
    max: 43.6,
    step: 0.0001,
  },
  "map.centerLng": {
    section: "map",
    label: "Map center longitude",
    hint: "Initial /map center (Tbilisi default).",
    input: "number",
    defaultValue: 44.8271,
    parse: numberParser(39.9, 46.8),
    min: 39.9,
    max: 46.8,
    step: 0.0001,
  },
  "map.minZoom": {
    section: "map",
    label: "Min zoom",
    hint: "Georgia clamp — lower = see more country.",
    input: "number",
    defaultValue: 7,
    parse: numberParser(5, 12),
    min: 5,
    max: 12,
    step: 0.1,
  },
  "map.detailZoom": {
    section: "map",
    label: "Detail zoom",
    hint: "Footprints + names replace clusters at/above this zoom.",
    input: "number",
    defaultValue: 13.5,
    parse: numberParser(11, 18),
    min: 11,
    max: 18,
    step: 0.1,
  },
  "map.priceMinZoom": {
    section: "map",
    label: "Price pill min zoom",
    hint: "Price labels appear once clusters start breaking apart.",
    input: "number",
    defaultValue: 11.2,
    parse: numberParser(8, 16),
    min: 8,
    max: 16,
    step: 0.1,
  },
  "map.clusterMaxZoom": {
    section: "map",
    label: "Cluster max zoom",
    hint: "Stop clustering just under detail zoom.",
    input: "number",
    defaultValue: 13,
    parse: numberParser(8, 16),
    min: 8,
    max: 16,
    step: 0.1,
  },
  "map.styleUrlLight": {
    section: "map",
    label: "Light style path",
    hint: "Same-origin OpenFreeMap proxy path only.",
    input: "text",
    defaultValue: "/api/map/styles/liberty",
    parse: textParser(MAP_STYLE_RE),
  },
  "map.styleUrlClean": {
    section: "map",
    label: "Clean style path",
    hint: "Same-origin OpenFreeMap proxy path only.",
    input: "text",
    defaultValue: "/api/map/styles/positron",
    parse: textParser(MAP_STYLE_RE),
  },
  "map.styleUrlDark": {
    section: "map",
    label: "Dark style path",
    hint: "Same-origin OpenFreeMap proxy path only.",
    input: "text",
    defaultValue: "/api/map/styles/dark",
    parse: textParser(MAP_STYLE_RE),
  },
  "map.jsonCacheVer": {
    section: "map",
    label: "TileJSON cache bust",
    hint: "Bump when proxy scrub changes — forces clients off sticky CDN JSON.",
    input: "text",
    defaultValue: "3",
    parse: textParser(/^[a-zA-Z0-9._-]{1,16}$/),
  },
  "map.geocodeEnabled": {
    section: "map",
    label: "Nominatim geocode API",
    hint: "Kill-switch for /api/geocode (OSM Nominatim). Off = 503.",
    input: "bool",
    defaultValue: true,
    parse: boolParser,
  },
}

export const CONFIG_KEYS = Object.keys(CONFIG_REGISTRY) as ConfigKey[]

/** All registry rows in one query; cached + tagged so admin writes can bust it. */
const readConfigRows = unstable_cache(
  async (): Promise<Partial<Record<ConfigKey, unknown>>> => {
    // ponytail: same fallback as cms.ts — config is decoration with coded
    // defaults; a DB hiccup during build/render must not fail the page.
    let rows: { id: string; value: unknown }[] = []
    try {
      rows = await db.systemConfig.findMany({
        where: { id: { in: CONFIG_KEYS } },
        select: { id: true, value: true },
      })
    } catch (e) {
      console.warn("[config] read failed, using defaults:", e instanceof Error ? e.message : e)
    }
    const map: Partial<Record<ConfigKey, unknown>> = {}
    for (const row of rows) {
      if ((CONFIG_KEYS as string[]).includes(row.id)) {
        map[row.id as ConfigKey] = row.value
      }
    }
    return map
  },
  ["system-config-rows"],
  { tags: [CONFIG_TAG] },
)

/** Parsed config value, or the registry default when unset/invalid. */
export async function getConfig<K extends ConfigKey>(key: K): Promise<ConfigValues[K]> {
  const rows = await readConfigRows()
  const entry = CONFIG_REGISTRY[key]
  return entry.parse(rows[key]) ?? entry.defaultValue
}

/** All parsed config values — backs the admin settings form. */
export async function getAllConfig(): Promise<ConfigValues> {
  const rows = await readConfigRows()
  const out = {} as ConfigValues
  for (const key of CONFIG_KEYS) {
    // ponytail: Object.assign — TS narrows indexed writes on union keys to never.
    Object.assign(out, { [key]: CONFIG_REGISTRY[key].parse(rows[key]) ?? CONFIG_REGISTRY[key].defaultValue })
  }
  return out
}

// ---------------------------------------------------------------------------
// Serializable form model for the admin settings UI (server → client boundary)
// ---------------------------------------------------------------------------

export interface ConfigFieldModel {
  key: ConfigKey
  label: string
  hint: string
  input: ConfigInput
  /** Current value as displayed (GEL for price fields). */
  value: string
  defaultLabel: string
  options?: { value: string; label: string }[]
  min?: number
  max?: number
  step?: number
}

export interface ConfigSectionModel {
  id: string
  title: string
  fields: ConfigFieldModel[]
}

const SECTION_TITLES: Record<ConfigSection, string> = {
  contact: "Contact",
  marketplace: "Marketplace",
  map: "Map / OSM",
}

/** Build the grouped settings form model; tetri prices display as GEL. */
export function configFormModel(
  values: ConfigValues,
  onlySections?: ConfigSection[],
): ConfigSectionModel[] {
  const sections: ConfigSectionModel[] = []
  for (const key of CONFIG_KEYS) {
    const entry = CONFIG_REGISTRY[key]
    if (onlySections && !onlySections.includes(entry.section)) continue
    let section = sections.find((s) => s.id === entry.section)
    if (!section) {
      section = { id: entry.section, title: SECTION_TITLES[entry.section], fields: [] }
      sections.push(section)
    }
    const isGel = entry.input === "gel"
    const isBool = entry.input === "bool"
    section.fields.push({
      key,
      label: entry.label,
      hint: entry.hint,
      input: entry.input,
      value: isGel
        ? String(Number(values[key]) / 100)
        : isBool
          ? values[key]
            ? "true"
            : "false"
          : String(values[key]),
      defaultLabel: isGel
        ? `${Number(entry.defaultValue) / 100} ₾`
        : isBool
          ? entry.defaultValue
            ? "On"
            : "Off"
          : String(entry.defaultValue),
      options: entry.options,
      min: entry.min,
      max: entry.max,
      step: entry.step,
    })
  }
  return sections
}
