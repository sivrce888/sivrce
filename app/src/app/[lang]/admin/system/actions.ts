"use server"

import { revalidatePath, updateTag } from "next/cache"

import type { Prisma } from "@/generated/prisma/client"
import { logAdminAction } from "@/lib/admin/audit"
import { requireAdminAction } from "@/lib/admin/guard"
import {
  BROADCAST_BATCH_SIZE,
  changedJsonKeys,
  CONFIG_KEY_RE,
  NOTIFICATION_KIND_RE,
  type BroadcastFormState,
  type ConfigFormState,
  type SettingsFormState,
} from "@/lib/admin/system"
import { optString, reqString } from "@/lib/admin/validate"
import {
  CONFIG_KEYS,
  CONFIG_REGISTRY,
  CONFIG_TAG,
  getAllConfig,
  type ConfigKey,
} from "@/lib/config"
import { db } from "@/lib/db"

function revalidate() {
  revalidatePath("/admin/system")
  // Rendered consumer of site.contactEmail / site.contactPhone.
  revalidatePath("/contact")
  updateTag(CONFIG_TAG)
}

export async function upsertConfig(
  _prev: ConfigFormState,
  fd: FormData,
): Promise<ConfigFormState> {
  const session = await requireAdminAction()
  try {
    const id = reqString(fd, "id", 64)
    if (!CONFIG_KEY_RE.test(id)) {
      return { error: "Key may only contain letters, digits and _ . : -", saved: false }
    }
    const description = optString(fd, "description", 500)
    const raw = reqString(fd, "value", 20_000)
    let value: Prisma.InputJsonValue
    try {
      value = JSON.parse(raw) as Prisma.InputJsonValue
    } catch (e) {
      return {
        error: `Invalid JSON: ${e instanceof Error ? e.message : "parse error"}`,
        saved: false,
      }
    }
    const before = await db.systemConfig.findUnique({ where: { id }, select: { value: true } })
    await db.systemConfig.upsert({
      where: { id },
      create: { id, value, description, updatedById: session.user.id },
      update: {
        value,
        ...(description !== null ? { description } : {}),
        updatedById: session.user.id,
      },
    })
    await logAdminAction(session, "system.upsert_config", "system_config", id, {
      created: !before,
      changedKeys: before ? changedJsonKeys(before.value, value) : [],
    })
    revalidate()
    return { error: null, saved: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invalid input", saved: false }
  }
}

export async function deleteConfig(fd: FormData) {
  const session = await requireAdminAction()
  const id = reqString(fd, "id", 64)
  const before = await db.systemConfig.findUnique({ where: { id }, select: { id: true } })
  if (!before) throw new Error("Config not found")
  await db.systemConfig.delete({ where: { id } })
  await logAdminAction(session, "system.delete_config", "system_config", id, {
    before: { id },
    after: null,
  })
  revalidate()
}

export async function sendBroadcast(
  _prev: BroadcastFormState,
  fd: FormData,
): Promise<BroadcastFormState> {
  const session = await requireAdminAction()
  try {
    const kind = reqString(fd, "kind", 40)
    if (!NOTIFICATION_KIND_RE.test(kind)) {
      return { error: "Kind: lowercase letters, digits, _ only", createdCount: null }
    }
    const title = reqString(fd, "title", 240)
    const body = optString(fd, "body", 4000)
    const actionUrl = optString(fd, "actionUrl", 500)
    if (actionUrl && !actionUrl.startsWith("/") && !actionUrl.startsWith("https://")) {
      return { error: "Action URL must start with / or https://", createdCount: null }
    }
    const users = await db.user.findMany({ select: { id: true } })
    let createdCount = 0
    for (let i = 0; i < users.length; i += BROADCAST_BATCH_SIZE) {
      const batch = users.slice(i, i + BROADCAST_BATCH_SIZE)
      const result = await db.notification.createMany({
        data: batch.map((u) => ({ userId: u.id, kind, title, body, actionUrl, metadata: {} })),
      })
      createdCount += result.count
    }
    await logAdminAction(session, "system.broadcast", "notification", kind, {
      kind,
      title,
      createdCount,
    })
    revalidate()
    return { error: null, createdCount }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invalid input", createdCount: null }
  }
}

const MAX_GEL = 1_000_000

type SettingsWrite = string | number | boolean | null

/**
 * Structured settings save — every registry key is validated through
 * CONFIG_REGISTRY. Blank field = revert that key to its default (row removed).
 * Missing keys in FormData are left unchanged (map-only forms).
 */
export async function saveSettings(
  _prev: SettingsFormState,
  fd: FormData,
): Promise<SettingsFormState> {
  const session = await requireAdminAction()
  try {
    const before = await getAllConfig()
    const writes: { key: ConfigKey; value: SettingsWrite }[] = []
    for (const key of CONFIG_KEYS) {
      if (!fd.has(key)) continue
      const entry = CONFIG_REGISTRY[key]
      const raw = fd.get(key)
      const s = typeof raw === "string" ? raw.trim() : ""
      if (!s) {
        writes.push({ key, value: null })
        continue
      }
      if (entry.input === "gel") {
        const gel = Number(s)
        if (!Number.isInteger(gel) || gel < 0 || gel > MAX_GEL) {
          return { error: `${entry.label}: whole GEL amount, 0–${MAX_GEL}`, saved: false }
        }
        writes.push({ key, value: gel * 100 })
        continue
      }
      if (entry.input === "bool") {
        const parsed = entry.parse(s)
        if (parsed === null) {
          return { error: `${entry.label}: choose On or Off`, saved: false }
        }
        writes.push({ key, value: parsed as boolean })
        continue
      }
      if (entry.input === "number") {
        const parsed = entry.parse(Number(s))
        if (parsed === null) {
          return { error: `${entry.label}: invalid number`, saved: false }
        }
        writes.push({ key, value: parsed as number })
        continue
      }
      if (entry.parse(s) === null) {
        return { error: `${entry.label}: invalid value`, saved: false }
      }
      writes.push({ key, value: s })
    }
    if (writes.length === 0) {
      return { error: "No settings fields submitted", saved: false }
    }
    const changed = writes
      .filter((w) => (w.value ?? CONFIG_REGISTRY[w.key].defaultValue) !== before[w.key])
      .map((w) => w.key)
    await db.$transaction(
      writes.map((w) =>
        w.value === null
          ? db.systemConfig.deleteMany({ where: { id: w.key } })
          : db.systemConfig.upsert({
              where: { id: w.key },
              create: { id: w.key, value: w.value, updatedById: session.user.id },
              update: { value: w.value, updatedById: session.user.id },
            }),
      ),
    )
    await logAdminAction(session, "system.save_settings", "system_config", "settings", {
      changed,
    })
    revalidate()
    revalidatePath("/admin/map")
    revalidatePath("/map")
    return { error: null, saved: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invalid input", saved: false }
  }
}
