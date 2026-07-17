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

/** Update (or create) the signed-in agency's profile. */
export async function saveAgencyProfile(formData: FormData): Promise<void> {
  const user = await requireRole("agency", "/agency/profile")

  const name = String(formData.get("name") ?? "").trim().slice(0, 180)
  const city = String(formData.get("city") ?? "").trim().slice(0, 100)
  const summary = String(formData.get("summary") ?? "").trim().slice(0, 4000)
  const logoText = String(formData.get("logoText") ?? "").trim().slice(0, 40)

  if (!name || !city || !summary) return

  const existing = await safeQuery(
    () => db.agencyProfile.findFirst({ where: { ownerId: user.id, deletedAt: null } }),
    null,
  )

  if (existing) {
    await db.agencyProfile.update({
      where: { id: existing.id },
      data: {
        name,
        city,
        summary,
        logoText: logoText || existing.logoText || initials(name),
      },
    })
  } else {
    const base = slugify(name) || `agency-${user.id.slice(0, 8)}`
    let slug = base
    // ponytail: rare slug clash; bump suffix instead of UUID soup
    for (let i = 0; i < 8; i++) {
      const clash = await db.agencyProfile.findUnique({ where: { slug } })
      if (!clash) break
      slug = `${base}-${i + 2}`
    }
    await db.agencyProfile.create({
      data: {
        id: `agency_${user.id.slice(0, 16)}`,
        ownerId: user.id,
        slug,
        name,
        logoText: logoText || initials(name),
        city,
        summary,
        color: BRAND.colors.blue,
      },
    })
  }

  revalidatePath("/agency/profile")
  revalidatePath("/agency")
}
