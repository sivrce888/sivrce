/**
 * SIVRCE — CMS admin editor model (server-side).
 * Row builders for /admin/content — they read dictionaries (translate) and
 * SITE_META, so they live here, not in client-safe ./cms-blocks. Re-exported
 * through ./cms; checks import this file directly (no DB, no next/cache).
 */

import { ka, type DictKey } from "./i18n/ka"
import { translate } from "./i18n/dicts"
import { SITE_META } from "./i18n/server"
import type { Lang } from "./i18n/core"
import {
  CMS_BLOCKS,
  CMS_BLOCKS_GROUP,
  CMS_BLOCK_KEYS,
  CMS_SEO_GROUP,
  CMS_SEO_KEYS,
  type CmsBlockKey,
  type CmsGroup,
  type CmsRow,
  type CmsSeoKey,
} from "./cms-blocks"
import type { StudioPage, StudioSection } from "./cms-studio"

const DICT_KEYS = Object.keys(ka) as DictKey[]

const SEO_DEFAULTS: Record<CmsSeoKey, (lang: Lang) => string> = {
  "seo.site.title": (lang) => SITE_META[lang].title,
  "seo.site.description": (lang) => SITE_META[lang].description,
}

/** Dict-key prefixes in ka order, then the marketing-blocks group, then SEO. */
export function cmsGroups(): CmsGroup[] {
  const groups: CmsGroup[] = []
  for (const key of Object.keys(ka)) {
    const prefix = key.split(".")[0]
    const g = groups.find((x) => x.id === prefix)
    if (g) g.count++
    else groups.push({ id: prefix, label: prefix, count: 1 })
  }
  groups.push({ id: CMS_BLOCKS_GROUP, label: "Homepage blocks", count: CMS_BLOCK_KEYS.length })
  groups.push({ id: CMS_SEO_GROUP, label: "SEO meta", count: CMS_SEO_KEYS.length })
  return groups
}

/** Allowlist for a single-key admin write — dict, homepage block, or SEO. */
export function isKnownCmsKey(key: string): boolean {
  if (key.startsWith("block.")) {
    return (CMS_BLOCK_KEYS as string[]).includes(key.slice("block.".length))
  }
  if ((CMS_SEO_KEYS as readonly string[]).includes(key)) return true
  return (DICT_KEYS as string[]).includes(key)
}

/** One row for a known key. Unknown → null (caller must not write). */
export function cmsRowForKey(
  lang: Lang,
  key: string,
  overrides: Record<string, string>,
): CmsRow | null {
  if (!isKnownCmsKey(key)) return null
  if (key.startsWith("block.")) {
    const block = key.slice("block.".length) as CmsBlockKey
    return { key, defaultText: CMS_BLOCKS[block], value: overrides[key] ?? "" }
  }
  if ((CMS_SEO_KEYS as readonly string[]).includes(key)) {
    const seo = key as CmsSeoKey
    return { key, defaultText: SEO_DEFAULTS[seo](lang), value: overrides[key] ?? "" }
  }
  return { key, defaultText: translate(lang, key as DictKey), value: overrides[key] ?? "" }
}

/** Rows for one group+language. Unknown group → []. Reused by page AND action (never trust client keys). */
export function cmsRowsForGroup(
  lang: Lang,
  group: string,
  overrides: Record<string, string>,
): CmsRow[] {
  if (group === CMS_BLOCKS_GROUP) {
    return CMS_BLOCK_KEYS.map((key) => ({
      key: `block.${key}`,
      defaultText: CMS_BLOCKS[key],
      value: overrides[`block.${key}`] ?? "",
    }))
  }
  if (group === CMS_SEO_GROUP) {
    return CMS_SEO_KEYS.map((key) => ({
      key,
      defaultText: SEO_DEFAULTS[key](lang),
      value: overrides[key] ?? "",
    }))
  }
  return DICT_KEYS.filter((k) => k.split(".")[0] === group).map((k) => ({
    key: k,
    defaultText: translate(lang, k),
    value: overrides[k] ?? "",
  }))
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
