"use server"

import { randomUUID } from "node:crypto"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import sharp from "sharp"

import {
  canMutateProject,
  isOwnedCover,
  parseProjectFields,
  PROJECT_PLACEHOLDER_IMG,
  slugifyProject,
} from "@/lib/developer-project"
import { db } from "@/lib/db"
import { requireRole, safeQuery } from "@/lib/guards"
import { uploadFile } from "@/lib/storage"

const ALLOWED_COVER = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"])
const MAX_COVER = 10 * 1024 * 1024

function fdStr(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "")
}

async function coverUrl(fd: FormData, fallback: string): Promise<string> {
  const file = fd.get("cover")
  if (file instanceof File && file.size > 0) {
    if (!ALLOWED_COVER.has(file.type) || file.size > MAX_COVER) return fallback
    try {
      const key = `uploads/projects/${randomUUID()}.webp`
      const master = await sharp(Buffer.from(await file.arrayBuffer()))
        .rotate()
        .resize({ width: 1920, withoutEnlargement: true })
        .webp({ quality: 84 })
        .toBuffer()
      const { url } = await uploadFile({ key, body: master, contentType: "image/webp" })
      if (url && isOwnedCover(url)) return url
    } catch {
      return fallback
    }
  }
  const typed = fdStr(fd, "image").trim()
  return typed && isOwnedCover(typed) ? typed : fallback
}

async function uniqueSlug(base: string, keepId?: string): Promise<string> {
  let slug = base || `p-${randomUUID().slice(0, 8)}`
  for (let i = 0; i < 8; i++) {
    const clash = await db.projectDirectory.findUnique({ where: { slug }, select: { id: true } })
    if (!clash || clash.id === keepId) return slug
    slug = `${base}-${i + 2}`.slice(0, 140)
  }
  return `${base}-${randomUUID().slice(0, 6)}`.slice(0, 140)
}

function revalidateProject(slug: string) {
  revalidatePath("/developer/projects")
  revalidatePath("/developer")
  revalidatePath("/projects")
  revalidatePath(`/projects/${slug}`)
  revalidatePath("/developers")
  revalidatePath("/map")
}

export async function saveDeveloperProject(formData: FormData): Promise<void> {
  const user = await requireRole("developer", "/developer/projects")
  const parsed = parseProjectFields({
    name: fdStr(formData, "name"),
    city: fdStr(formData, "city"),
    district: fdStr(formData, "district"),
    address: fdStr(formData, "address"),
    status: fdStr(formData, "status"),
    readyBy: fdStr(formData, "readyBy"),
    priceFrom: fdStr(formData, "priceFrom"),
    pricePerSqmFrom: fdStr(formData, "pricePerSqmFrom"),
    units: fdStr(formData, "units"),
    body: fdStr(formData, "body"),
    lat: fdStr(formData, "lat"),
    lng: fdStr(formData, "lng"),
    image: fdStr(formData, "image"),
  })
  const id = fdStr(formData, "id").trim().slice(0, 120)
  if (!parsed) {
    redirect(id ? `/developer/projects?edit=${encodeURIComponent(id)}&err=1` : "/developer/projects?new=1&err=1")
  }

  const profile = await safeQuery(
    () => db.developerProfile.findFirst({ where: { ownerId: user.id, deletedAt: null } }),
    null,
  )
  const developerName = profile?.name || user.name || "დეველოპერი"

  const existing = id
    ? await safeQuery(() => db.projectDirectory.findFirst({ where: { id, deletedAt: null } }), null)
    : null

  if (existing && !canMutateProject(existing, user.id, profile?.name ?? null)) {
    redirect("/developer/projects")
  }

  const image = await coverUrl(formData, existing?.image || parsed.image || PROJECT_PLACEHOLDER_IMG)
  const data = {
    name: parsed.name,
    developer: developerName,
    city: parsed.city,
    district: parsed.district,
    address: parsed.address || null,
    status: parsed.status,
    readyBy: parsed.readyBy,
    priceFrom: parsed.priceFrom,
    pricePerSqmFrom: parsed.pricePerSqmFrom,
    units: parsed.units,
    body: parsed.body || null,
    lat: parsed.lat,
    lng: parsed.lng,
    image,
    ownerId: user.id,
  }

  if (existing) {
    const wasCompleted = existing.status === "completed"
    await db.projectDirectory.update({ where: { id: existing.id }, data })
    if (profile) {
      const nowCompleted = parsed.status === "completed"
      if (!wasCompleted && nowCompleted) {
        await db.developerProfile.update({
          where: { id: profile.id },
          data: { completedCount: { increment: 1 } },
        })
      } else if (wasCompleted && !nowCompleted) {
        await db.developerProfile.update({
          where: { id: profile.id },
          data: { completedCount: { decrement: 1 } },
        })
      }
    }
    revalidateProject(existing.slug)
    redirect("/developer/projects")
  }

  const slug = await uniqueSlug(slugifyProject(parsed.name) || `p-${user.id.slice(0, 8)}`)
  await db.projectDirectory.create({
    data: {
      id: `p-${slug}`.slice(0, 120),
      slug,
      ...data,
    },
  })
  if (profile) {
    await db.developerProfile.update({
      where: { id: profile.id },
      data: {
        projectsCount: { increment: 1 },
        ...(parsed.status === "completed" ? { completedCount: { increment: 1 } } : {}),
      },
    })
  }
  revalidateProject(slug)
  redirect("/developer/projects")
}

export async function deleteDeveloperProject(formData: FormData): Promise<void> {
  const user = await requireRole("developer", "/developer/projects")
  const id = fdStr(formData, "id").trim().slice(0, 120)
  if (!id) redirect("/developer/projects")

  const profile = await safeQuery(
    () => db.developerProfile.findFirst({ where: { ownerId: user.id, deletedAt: null } }),
    null,
  )
  const row = await safeQuery(
    () => db.projectDirectory.findFirst({ where: { id, deletedAt: null } }),
    null,
  )
  if (!row || !canMutateProject(row, user.id, profile?.name ?? null)) {
    redirect("/developer/projects")
  }

  await db.projectDirectory.update({ where: { id: row.id }, data: { deletedAt: new Date() } })
  if (profile && row.id.startsWith("p-")) {
    await db.developerProfile.update({
      where: { id: profile.id },
      data: {
        projectsCount: { decrement: 1 },
        ...(row.status === "completed" ? { completedCount: { decrement: 1 } } : {}),
      },
    })
  }
  revalidateProject(row.slug)
  redirect("/developer/projects")
}
