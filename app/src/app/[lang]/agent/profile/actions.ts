"use server"

import { revalidatePath } from "next/cache"

import { BRAND } from "@/lib/brand"
import { db } from "@/lib/db"
import { requireRole, safeQuery } from "@/lib/guards"

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100)
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "AG"
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase()
}

/** Update (or create) the signed-in agent's public profile. */
export async function saveAgentProfile(formData: FormData): Promise<void> {
  const user = await requireRole("agent", "/agent/profile")

  const name = String(formData.get("name") ?? "").trim().slice(0, 160)
  const agency = String(formData.get("agency") ?? "").trim().slice(0, 160)
  const avatarText = String(formData.get("avatarText") ?? "").trim().slice(0, 24)
  const languagesRaw = String(formData.get("languages") ?? "").trim()
  const specialtiesRaw = String(formData.get("specialties") ?? "").trim()

  if (!name || !agency) return

  const languages = languagesRaw
    ? languagesRaw.split(/[,;|]/).map((s) => s.trim()).filter(Boolean).slice(0, 12)
    : []
  const specialties = specialtiesRaw
    ? specialtiesRaw.split(/[,;|]/).map((s) => s.trim()).filter(Boolean).slice(0, 12)
    : []

  const existing = await safeQuery(
    () => db.agentProfile.findFirst({ where: { ownerId: user.id, deletedAt: null } }),
    null,
  )

  if (existing) {
    await db.agentProfile.update({
      where: { id: existing.id },
      data: {
        name,
        agency,
        avatarText: avatarText || existing.avatarText || initials(name),
        languages,
        specialties,
      },
    })
  } else {
    const base = slugify(name) || `agent-${user.id.slice(0, 8)}`
    let slug = base
    // ponytail: rare slug clash; bump suffix instead of UUID soup
    for (let i = 0; i < 8; i++) {
      const clash = await db.agentProfile.findUnique({ where: { slug } })
      if (!clash) break
      slug = `${base}-${i + 2}`
    }
    await db.agentProfile.create({
      data: {
        id: `agent_${user.id.slice(0, 16)}`,
        ownerId: user.id,
        slug,
        name,
        agency,
        avatarText: avatarText || initials(name),
        languages,
        specialties,
        color: BRAND.colors.blue,
      },
    })
  }

  revalidatePath("/agent/profile")
  revalidatePath("/agent")
  revalidatePath("/agents")
}
