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

import { CMS_BLOCKS, type CmsBlockKey } from "@/lib/cms-blocks"
import { db } from "@/lib/db"
import { LANGS, type Lang } from "@/lib/i18n/core"

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
