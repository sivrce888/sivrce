/**
 * SIVRCE — CMS override store (server-only).
 * Overrides live in SystemConfig rows: `cms.<lang>.<dictKey>` for dictionary
 * strings, `cms.<lang>.block.<blockKey>` for homepage marketing blocks. One
 * cached findMany for all rows; admin writes call updateTag(CMS_TAG) +
 * revalidatePath("/", "layout"), so saves apply site-wide immediately.
 * Pure key/admin-model helpers live in ./cms-blocks (isomorphic) and are
 * re-exported here so server callers have one import site.
 *
 * ponytail: one cached map for every key instead of per-key lookups.
 * Upgrade path: per-language cache entries if the row count ever hurts.
 */

import { unstable_cache } from "next/cache"

import {
  CMS_BLOCKS,
  CMS_PREFIX,
  parseCmsId,
  type CmsBlockKey,
} from "@/lib/cms-blocks"
import { db, dbAvailable } from "@/lib/db"
import type { Lang } from "@/lib/i18n/core"

export {
  buildCmsId,
  CMS_BLOCKS_GROUP,
  CMS_MAX_VALUE_LEN,
  CMS_PREFIX,
  cmsGroups,
  cmsRowsForGroup,
  parseCmsId,
  type CmsGroup,
  type CmsRow,
  type PagesFormState,
} from "@/lib/cms-blocks"

export const CMS_TAG = "cms-overrides"

/** lang → (stripped key → text). Dict keys and `block.*` keys share the map. */
export type CmsOverrideMap = Partial<Record<Lang, Record<string, string>>>

const readOverrides = unstable_cache(
  async (): Promise<CmsOverrideMap> => {
    // ponytail: overrides are decoration, not data — if the DB hiccups during
    // build/render, fall back to coded defaults instead of failing the page.
    let rows: { id: string; value: unknown }[] = []
    try {
      if (await dbAvailable()) {
        rows = await db.systemConfig.findMany({
          where: { id: { startsWith: CMS_PREFIX } },
          select: { id: true, value: true },
        })
      }
    } catch (e) {
      console.warn("[cms] override read failed, using defaults:", e instanceof Error ? e.message : e)
    }
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

/** Overrides for one language — injected into I18nProvider by the [lang] layout. */
export async function getCmsOverrides(lang: Lang): Promise<Record<string, string>> {
  try {
    return (await readOverrides())[lang] ?? {}
  } catch {
    return {} // DB down → site renders coded defaults, never 500s on copy
  }
}

/**
 * Server-component read for marketing blocks. Server-rendered sections have
 * no per-request locale yet (ka SSR), so lang defaults to "ka".
 * Falls back: lang override → ka override → registry default.
 */
export async function getCmsBlock(key: CmsBlockKey, lang: Lang = "ka"): Promise<string> {
  try {
    const map = await readOverrides()
    return map[lang]?.[`block.${key}`] ?? map.ka?.[`block.${key}`] ?? CMS_BLOCKS[key]
  } catch {
    return CMS_BLOCKS[key]
  }
}
