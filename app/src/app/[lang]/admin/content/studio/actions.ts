"use server"

import { revalidatePath, updateTag } from "next/cache"

import { logAdminAction } from "@/lib/admin/audit"
import { requireAdminAction } from "@/lib/admin/guard"
import {
  buildCmsId,
  CMS_MAX_VALUE_LEN,
  CMS_TAG,
  cmsRowForKey,
  getCmsOverrides,
  getHomeLayout,
  type PagesFormState,
} from "@/lib/cms"
import { CMS_LAYOUT_ID, parseHomeLayout } from "@/lib/cms-studio"
import { db } from "@/lib/db"
import { LANGS, type Lang } from "@/lib/i18n/core"

/**
 * Save one CMS text key. Blank = revert to coded default. Key must be
 * allowlisted (dict / block / seo) — never trust a client-invented key.
 */
export async function saveCmsKey(
  langRaw: string,
  key: string,
  valueRaw: string,
): Promise<PagesFormState> {
  const session = await requireAdminAction()
  try {
    if (!(LANGS as readonly string[]).includes(langRaw)) {
      return { error: "Invalid language", saved: false }
    }
    const lang = langRaw as Lang
    const value = valueRaw.trim()
    if (value.length > CMS_MAX_VALUE_LEN) {
      return { error: `Too long (max ${CMS_MAX_VALUE_LEN} chars)`, saved: false }
    }
    const overrides = await getCmsOverrides(lang)
    const row = cmsRowForKey(lang, key, overrides)
    if (!row) return { error: "Unknown content key", saved: false }
    if (value === (overrides[key] ?? "")) return { error: null, saved: true }

    const id = buildCmsId(lang, key)
    if (!id) return { error: "Key too long", saved: false }

    if (value === "") {
      await db.systemConfig.deleteMany({ where: { id } })
    } else {
      await db.systemConfig.upsert({
        where: { id },
        create: { id, value, updatedById: session.user.id },
        update: { value, updatedById: session.user.id },
      })
    }
    await logAdminAction(session, "cms.save_key", "system_config", id, { key })
    updateTag(CMS_TAG)
    revalidatePath("/", "layout")
    return { error: null, saved: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Save failed", saved: false }
  }
}

/** Persist homepage section order + visibility. */
export async function saveHomeLayout(raw: unknown): Promise<PagesFormState> {
  const session = await requireAdminAction()
  try {
    const items = parseHomeLayout(raw)
    const prev = await getHomeLayout()
    if (JSON.stringify(items) === JSON.stringify(prev)) return { error: null, saved: true }

    await db.systemConfig.upsert({
      where: { id: CMS_LAYOUT_ID },
      create: { id: CMS_LAYOUT_ID, value: items, updatedById: session.user.id },
      update: { value: items, updatedById: session.user.id },
    })
    await logAdminAction(session, "cms.save_home_layout", "system_config", CMS_LAYOUT_ID, {
      order: items.map((i) => i.id),
    })
    updateTag(CMS_TAG)
    revalidatePath("/", "layout")
    return { error: null, saved: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Layout save failed", saved: false }
  }
}
