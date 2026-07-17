"use server"

import { revalidatePath } from "next/cache"

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
} from "@/lib/admin/system"
import { optString, reqString } from "@/lib/admin/validate"
import { db } from "@/lib/db"

function revalidate() {
  revalidatePath("/admin/system")
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
