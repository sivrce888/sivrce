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
  if (parts.length === 0) return "DV"
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase()
}

/** Update (or create) the signed-in developer's public profile. */
export async function saveDeveloperProfile(formData: FormData): Promise<void> {
  const user = await requireRole("developer", "/developer/profile")

  const name = String(formData.get("name") ?? "").trim().slice(0, 160)
  const headquarters = String(formData.get("headquarters") ?? "").trim().slice(0, 160)
  const description = String(formData.get("description") ?? "").trim().slice(0, 4000)
  const logoText = String(formData.get("logoText") ?? "").trim().slice(0, 40)

  if (!name || !headquarters || !description) return

  const existing = await safeQuery(
    () => db.developerProfile.findFirst({ where: { ownerId: user.id, deletedAt: null } }),
    null,
  )

  if (existing) {
    await db.developerProfile.update({
      where: { id: existing.id },
      data: {
        name,
        headquarters,
        description,
        logoText: logoText || existing.logoText || initials(name),
      },
    })
  } else {
    const base = slugify(name) || `dev-${user.id.slice(0, 8)}`
    let slug = base
    // ponytail: rare slug clash; bump suffix instead of UUID soup
    for (let i = 0; i < 8; i++) {
      const clash = await db.developerProfile.findUnique({ where: { slug } })
      if (!clash) break
      slug = `${base}-${i + 2}`
    }
    await db.developerProfile.create({
      data: {
        id: `dev_${user.id.slice(0, 16)}`,
        ownerId: user.id,
        slug,
        name,
        logoText: logoText || initials(name),
        headquarters,
        description,
        color: BRAND.colors.blue,
      },
    })
  }

  revalidatePath("/developer/profile")
  revalidatePath("/developer")
  revalidatePath("/developers")
}
