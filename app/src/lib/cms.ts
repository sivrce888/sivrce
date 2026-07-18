/**
 * SIVRCE — CMS override store (server-only).
 * Overrides live in SystemConfig rows: `cms.<lang>.<dictKey>` for dictionary
 * strings, `cms.<lang>.block.<blockKey>` for homepage marketing blocks. One
 * cached findMany for all rows; admin writes call updateTag(CMS_TAG) +
 * revalidatePath("/", "layout"), so saves apply site-wide immediately.
 *
 * ponytail: one cached map for every key instead of per-key lookups.
 * Upgrade path: per-language cache entries if the row count ever hurts.
 */

import { unstable_cache } from "next/cache"

import { CMS_BLOCKS, CMS_BLOCK_KEYS, type CmsBlockKey } from "@/lib/cms-blocks"
import { db } from "@/lib/db"
import { ka, type DictKey } from "@/lib/i18n/ka"
import { LANGS, translate, type Lang } from "@/lib/i18n/core"

export const CMS_TAG = "cms-overrides"
export const CMS_PREFIX = "cms."
/** Max chars of an override text (admin textarea + server action validation). */
export const CMS_MAX_VALUE_LEN = 2000

/** lang → (stripped key → text). Dict keys and `block.*` keys share the map. */
export type CmsOverrideMap = Partial<Record<Lang, Record<string, string>>>

const readOverrides = unstable_cache(
  async (): Promise<CmsOverrideMap> => {
    const rows = await db.systemConfig.findMany({
      where: { id: { startsWith: CMS_PREFIX } },
      select: { id: true, value: true },
    })
    const map: CmsOverrideMap = {}
    for (const row of rows) {
      const parsed = parseCmsId(row.id)
      if (!parsed || typeof row.value !== "string") continue
      ;(map[parsed.lang] ??= {})[parsed.key] = row.value
    }
    return map
  },
  ["cms-override-rows"],
  { tags: [CMS_TAG] },
)

/** Split `cms.en.block.home.hero.titleA` → { lang: "en", key: "block.home.hero.titleA" }. */
export function parseCmsId(id: string): { lang: Lang; key: string } | null {
  if (!id.startsWith(CMS_PREFIX)) return null
  const rest = id.slice(CMS_PREFIX.length)
  const dot = rest.indexOf(".")
  if (dot < 1) return null
  const lang = rest.slice(0, dot)
  if (!(LANGS as readonly string[]).includes(lang)) return null
  return { lang: lang as Lang, key: rest.slice(dot + 1) }
}

/** SystemConfig.id is VarChar(64): null when the pair would overflow. */
export function buildCmsId(lang: Lang, key: string): string | null {
  const id = `${CMS_PREFIX}${lang}.${key}`
  return id.length <= 64 ? id : null
}

/** Overrides for one language — injected into I18nProvider by the [lang] layout. */
export async function getCmsOverrides(lang: Lang): Promise<Record<string, string>> {
  return (await readOverrides())[lang] ?? {}
}

/**
 * Server-component read for marketing blocks. Server-rendered sections have
 * no per-request locale yet (ka SSR), so lang defaults to "ka".
 * Falls back: lang override → ka override → registry default.
 */
export async function getCmsBlock(key: CmsBlockKey, lang: Lang = "ka"): Promise<string> {
  const map = await readOverrides()
  return map[lang]?.[`block.${key}`] ?? map.ka?.[`block.${key}`] ?? CMS_BLOCKS[key]
}

// ---------------------------------------------------------------------------
// Admin editor model — groups + rows for /admin/content/pages
// ---------------------------------------------------------------------------

export const CMS_BLOCKS_GROUP = "blocks"

export interface CmsGroup {
  id: string
  label: string
  count: number
}

export interface CmsRow {
  /** Stripped key: dict key ("nav.buy") or block key ("home.hero.titleA"). */
  key: string
  /** Default text shown as placeholder/hint (active lang for dicts, ka source for blocks). */
  defaultText: string
  /** Current override, "" when none. */
  value: string
}

export interface PagesFormState {
  error: string | null
  saved: boolean
}

/** Dict-key prefixes in ka order, then the marketing-blocks group. */
export function cmsGroups(): CmsGroup[] {
  const groups: CmsGroup[] = []
  for (const key of Object.keys(ka)) {
    const prefix = key.split(".")[0]
    const g = groups.find((x) => x.id === prefix)
    if (g) g.count++
    else groups.push({ id: prefix, label: prefix, count: 1 })
  }
  groups.push({ id: CMS_BLOCKS_GROUP, label: "Homepage blocks", count: CMS_BLOCK_KEYS.length })
  return groups
}

const DICT_KEYS = Object.keys(ka) as DictKey[]

/** Rows for one group+language. Unknown group → []. Reused by page AND action (never trust client keys). */
export function cmsRowsForGroup(lang: Lang, group: string, overrides: Record<string, string>): CmsRow[] {
  if (group === CMS_BLOCKS_GROUP) {
    return CMS_BLOCK_KEYS.map((key) => ({
      key: `block.${key}`,
      defaultText: CMS_BLOCKS[key],
      value: overrides[`block.${key}`] ?? "",
    }))
  }
  return DICT_KEYS.filter((k) => k.split(".")[0] === group).map((k) => ({
    key: k,
    defaultText: translate(lang, k),
    value: overrides[k] ?? "",
  }))
}
