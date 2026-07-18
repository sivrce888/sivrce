"use server"

import { revalidatePath, updateTag } from "next/cache"

import { logAdminAction } from "@/lib/admin/audit"
import { requireAdminAction } from "@/lib/admin/guard"
import { reqEnum } from "@/lib/admin/validate"
import {
  buildCmsId,
  CMS_MAX_VALUE_LEN,
  CMS_TAG,
  cmsRowsForGroup,
  getCmsOverrides,
  type PagesFormState,
} from "@/lib/cms"
import { db } from "@/lib/db"
import { LANGS } from "@/lib/i18n/core"

/**
 * Save one group of page-content rows for one language. Blank = revert to
 * default (row deleted). Keys are recomputed server-side from lang+group —
 * the client only supplies values, never the key list.
 */
export async function savePageContent(
  _prev: PagesFormState,
  fd: FormData,
): Promise<PagesFormState> {
  const session = await requireAdminAction()
  try {
    const lang = reqEnum(fd, "lang", LANGS)
    const group = String(fd.get("group") ?? "")
    const overrides = await getCmsOverrides(lang)
    const rows = cmsRowsForGroup(lang, group, overrides)
    if (rows.length === 0) return { error: "Unknown content group", saved: false }

    const writes: { id: string; value: string | null }[] = []
    const changed: string[] = []
    for (const row of rows) {
      const raw = fd.get(`v.${row.key}`)
      if (typeof raw !== "string") continue // row not in the submitted view (filtered out)
      const value = raw.trim()
      if (value.length > CMS_MAX_VALUE_LEN) {
        return { error: `${row.key}: too long (max ${CMS_MAX_VALUE_LEN} chars)`, saved: false }
      }
      const had = overrides[row.key] ?? ""
      if (value === had) continue
      const id = buildCmsId(lang, row.key)
      if (!id) return { error: `${row.key}: key too long`, saved: false }
      writes.push({ id, value: value === "" ? null : value })
      changed.push(row.key)
    }

    if (writes.length > 0) {
      await db.$transaction(
        writes.map((w) =>
          w.value === null
            ? db.systemConfig.deleteMany({ where: { id: w.id } })
            : db.systemConfig.upsert({
                where: { id: w.id },
                create: { id: w.id, value: w.value, updatedById: session.user.id },
                update: { value: w.value, updatedById: session.user.id },
              }),
        ),
      )
      await logAdminAction(session, "cms.save_page_content", "system_config", `cms.${lang}`, {
        group,
        changed,
      })
      updateTag(CMS_TAG)
      // Public pages read overrides at render — bust the whole tree + ISR homepage.
      revalidatePath("/", "layout")
    }
    return { error: null, saved: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invalid input", saved: false }
  }
}
