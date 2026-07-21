"use server"

import { revalidatePath, updateTag } from "next/cache"
import { randomUUID } from "crypto"
import sharp from "sharp"

import { logAdminAction } from "@/lib/admin/audit"
import { requireAdminAction } from "@/lib/admin/guard"
import type { SettingsFormState } from "@/lib/admin/system"
import { reqString } from "@/lib/admin/validate"
import { CONFIG_TAG } from "@/lib/config"
import { PROJECTS } from "@/data/professionals"
import { db } from "@/lib/db"
import { uploadFile } from "@/lib/storage"
import { saveSettings as saveSystemSettings } from "@/app/[lang]/admin/system/actions"

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"])
const MAX_SIZE = 10 * 1024 * 1024

export type RenderFormState = { error: string | null; savedUrl: string | null }

/** Re-export so map-only settings form can share the validated writer. */
export async function saveMapSettings(
  prev: SettingsFormState,
  fd: FormData,
): Promise<SettingsFormState> {
  return saveSystemSettings(prev, fd)
}

/**
 * Admin hand-in: normalize image → R2 CDN → ProjectDirectory.image (+ MapBuilding.img).
 * Live directory merge prefers non-placeholder DB image over catalog stock.
 */
export async function uploadProjectRender(
  _prev: RenderFormState,
  fd: FormData,
): Promise<RenderFormState> {
  const session = await requireAdminAction()
  try {
    const slug = reqString(fd, "slug", 140).toLowerCase()
    if (!SLUG_RE.test(slug)) {
      return { error: "Slug: lowercase letters, digits, hyphens only", savedUrl: null }
    }
    const file = fd.get("file")
    if (!(file instanceof File)) {
      return { error: "Choose an image file", savedUrl: null }
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return { error: "Allowed: JPEG, PNG, WebP, AVIF", savedUrl: null }
    }
    if (file.size > MAX_SIZE) {
      return { error: "Max 10 MB", savedUrl: null }
    }

    const key = `projects/renders/${slug}/${randomUUID()}.webp`
    const master = await sharp(Buffer.from(await file.arrayBuffer()))
      .rotate()
      .resize({ width: 1920, withoutEnlargement: true })
      .webp({ quality: 84 })
      .toBuffer()
    const { url } = await uploadFile({ key, body: master, contentType: "image/webp" })
    if (!url || url.includes("placeholder")) {
      return { error: "R2 upload failed — check storage env", savedUrl: null }
    }

    const catalog = PROJECTS.find((p) => p.slug === slug)
    const existing = await db.projectDirectory.findUnique({ where: { slug } })
    if (existing) {
      await db.projectDirectory.update({
        where: { slug },
        data: { image: url },
      })
    } else if (catalog) {
      await db.projectDirectory.create({
        data: {
          id: `admin-render-${slug}`,
          slug,
          name: catalog.name,
          developer: catalog.developerSlug || "unknown",
          city: catalog.city,
          district: catalog.location.slice(0, 120) || catalog.city,
          address: catalog.location.slice(0, 240),
          lat: Number.isFinite(catalog.coords.lat) ? catalog.coords.lat : null,
          lng: Number.isFinite(catalog.coords.lng) ? catalog.coords.lng : null,
          status: catalog.done >= 100 ? "completed" : "construction",
          readyBy: catalog.finish || "",
          image: url,
          units: catalog.flats || 1,
        },
      })
    } else {
      return { error: `Unknown project slug: ${slug}`, savedUrl: null }
    }

    await db.mapBuilding.updateMany({
      where: { projectSlug: slug },
      data: { img: url },
    })

    await logAdminAction(session, "map.upload_render", "project", slug, {
      url,
      createdDirectory: !existing,
    })
    updateTag(CONFIG_TAG)
    revalidatePath("/admin/map")
    revalidatePath("/projects")
    revalidatePath(`/projects/${slug}`)
    revalidatePath("/map")
    return { error: null, savedUrl: url }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Upload failed", savedUrl: null }
  }
}

/** Set render URL without file (CDN path or existing /images/projects/…). */
export async function setProjectRenderUrl(
  _prev: RenderFormState,
  fd: FormData,
): Promise<RenderFormState> {
  const session = await requireAdminAction()
  try {
    const slug = reqString(fd, "slug", 140).toLowerCase()
    if (!SLUG_RE.test(slug)) {
      return { error: "Slug: lowercase letters, digits, hyphens only", savedUrl: null }
    }
    const url = reqString(fd, "url", 320)
    const ok =
      url.startsWith("/images/projects/") ||
      url.includes("cdn.sivrce.ge") ||
      url.includes("images.sivrce.ge")
    if (!ok) {
      return {
        error: "URL must be /images/projects/… or sivrce CDN",
        savedUrl: null,
      }
    }

    const catalog = PROJECTS.find((p) => p.slug === slug)
    const existing = await db.projectDirectory.findUnique({ where: { slug } })
    if (existing) {
      await db.projectDirectory.update({ where: { slug }, data: { image: url } })
    } else if (catalog) {
      await db.projectDirectory.create({
        data: {
          id: `admin-render-${slug}`,
          slug,
          name: catalog.name,
          developer: catalog.developerSlug || "unknown",
          city: catalog.city,
          district: catalog.location.slice(0, 120) || catalog.city,
          address: catalog.location.slice(0, 240),
          lat: Number.isFinite(catalog.coords.lat) ? catalog.coords.lat : null,
          lng: Number.isFinite(catalog.coords.lng) ? catalog.coords.lng : null,
          status: catalog.done >= 100 ? "completed" : "construction",
          readyBy: catalog.finish || "",
          image: url,
          units: catalog.flats || 1,
        },
      })
    } else {
      return { error: `Unknown project slug: ${slug}`, savedUrl: null }
    }

    await db.mapBuilding.updateMany({ where: { projectSlug: slug }, data: { img: url } })
    await logAdminAction(session, "map.set_render_url", "project", slug, { url })
    revalidatePath("/admin/map")
    revalidatePath("/projects")
    revalidatePath(`/projects/${slug}`)
    revalidatePath("/map")
    return { error: null, savedUrl: url }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Save failed", savedUrl: null }
  }
}
