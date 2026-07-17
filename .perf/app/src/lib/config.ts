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

export const CONFIG_TAG = "system-config"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
/** Loose international display phone: `+` then digits/spaces, e.g. `+995 32 2 00 00 00`. */
const PHONE_RE = /^\+[0-9][0-9 ]{6,24}$/
/** Prices are stored as tetri (1 GEL = 100 tetri); cap 1 000 000 GEL. */
const MAX_TETRI = 100_000_000

export interface ConfigValues {
  "site.contactEmail": string
  "site.contactPhone": string
  "price.vip": number
  "price.superVip": number
  "price.diamond": number
}

export type ConfigKey = keyof ConfigValues

type ConfigInput = "text" | "gel"

interface ConfigEntry<T> {
  section: "contact" | "marketplace"
  label: string
  hint: string
  /** "text" renders a text input; "gel" edits GEL but stores tetri. */
  input: ConfigInput
  defaultValue: T
  /** Parse a stored JSON value; null → invalid, fall back to the default. */
  parse: (value: unknown) => T | null
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

export const CONFIG_REGISTRY: { [K in ConfigKey]: ConfigEntry<ConfigValues[K]> } = {
  "site.contactEmail": {
    section: "contact",
    label: "Contact email",
    hint: "Shown on /contact; receives general (brand-level) leads.",
    input: "text",
    defaultValue: "info@sivrce.ge",
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
    label: "VIP price (GEL / month)",
    hint: "Charged for the VIP listing tier upgrade.",
    input: "gel",
    defaultValue: 99_00,
    parse: tetriParser,
  },
  "price.superVip": {
    section: "marketplace",
    label: "VIP+ price (GEL / month)",
    hint: "Charged for the VIP+ listing tier upgrade.",
    input: "gel",
    defaultValue: 199_00,
    parse: tetriParser,
  },
  "price.diamond": {
    section: "marketplace",
    label: "SUPER VIP price (GEL / month)",
    hint: "Charged for the SUPER VIP listing tier upgrade.",
    input: "gel",
    defaultValue: 499_00,
    parse: tetriParser,
  },
}

export const CONFIG_KEYS = Object.keys(CONFIG_REGISTRY) as ConfigKey[]

/** All registry rows in one query; cached + tagged so admin writes can bust it. */
const readConfigRows = unstable_cache(
  async (): Promise<Partial<Record<ConfigKey, unknown>>> => {
    const rows = await db.systemConfig.findMany({
      where: { id: { in: CONFIG_KEYS } },
      select: { id: true, value: true },
    })
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
}

export interface ConfigSectionModel {
  id: string
  title: string
  fields: ConfigFieldModel[]
}

const SECTION_TITLES: Record<ConfigEntry<unknown>["section"], string> = {
  contact: "Contact",
  marketplace: "Marketplace",
}

/** Build the grouped settings form model; tetri prices display as GEL. */
export function configFormModel(values: ConfigValues): ConfigSectionModel[] {
  const sections: ConfigSectionModel[] = []
  for (const key of CONFIG_KEYS) {
    const entry = CONFIG_REGISTRY[key]
    let section = sections.find((s) => s.id === entry.section)
    if (!section) {
      section = { id: entry.section, title: SECTION_TITLES[entry.section], fields: [] }
      sections.push(section)
    }
    const isGel = entry.input === "gel"
    section.fields.push({
      key,
      label: entry.label,
      hint: entry.hint,
      input: entry.input,
      value: isGel ? String(Number(values[key]) / 100) : String(values[key]),
      defaultLabel: isGel
        ? `${Number(entry.defaultValue) / 100} ₾`
        : String(entry.defaultValue),
    })
  }
  return sections
}
