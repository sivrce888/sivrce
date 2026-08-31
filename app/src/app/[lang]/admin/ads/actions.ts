"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { logAdminAction } from "@/lib/admin/audit"
import { requireAdminAction } from "@/lib/admin/guard"
import { optString, reqEnum, reqString } from "@/lib/admin/validate"
import {
  AD_FORMATS,
  AD_SLOTS,
  AD_STATUSES,
  isAdAudience,
  isSafeHref,
  type AdAudience,
} from "@/lib/ads"
import { bustAdsCache } from "@/lib/ads-db"
import { db } from "@/lib/db"
import { LANGS } from "@/lib/i18n/core"

export type AdsFormState = { error: string | null }

function optDate(fd: FormData, name: string): Date | null {
  const s = optString(fd, name, 40)
  if (!s) return null
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) throw new Error(`Invalid date: ${name}`)
  return d
}

function readList(fd: FormData, name: string): string[] {
  return fd
    .getAll(name)
    .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
}

function readFields(fd: FormData) {
  const slot = reqEnum(fd, "slot", AD_SLOTS)
  const href = reqString(fd, "href", 500)
  if (!isSafeHref(href)) throw new Error("Link must be an internal path or http(s) URL")
  const weightRaw = optString(fd, "weight", 8)
  const weight = weightRaw ? Number(weightRaw) : 10
  if (!Number.isInteger(weight) || weight < 1 || weight > 100) {
    throw new Error("Weight must be 1–100")
  }
  const audiencesRaw = readList(fd, "audiences").filter(isAdAudience)
  const langsRaw = readList(fd, "langs").filter(
    (l) => l === "all" || (LANGS as readonly string[]).includes(l),
  )
  const audiences: AdAudience[] = audiencesRaw.length === 0 || audiencesRaw.includes("all")
    ? ["all"]
    : audiencesRaw
  const langs = langsRaw.length === 0 || langsRaw.includes("all") ? ["all"] : langsRaw
  return {
    slot,
    format: reqEnum(fd, "format", AD_FORMATS),
    status: reqEnum(fd, "status", AD_STATUSES),
    title: reqString(fd, "title", 180),
    subtitle: optString(fd, "subtitle", 280),
    ctaLabel: optString(fd, "ctaLabel", 80),
    href,
    imageUrl: optString(fd, "imageUrl", 2000),
    advertiser: optString(fd, "advertiser", 120),
    audiences,
    langs,
    weight,
    startsAt: optDate(fd, "startsAt"),
    endsAt: optDate(fd, "endsAt"),
  }
}

function revalidateAds() {
  bustAdsCache()
  revalidatePath("/", "layout")
  revalidatePath("/admin/ads")
}

export async function saveAdBanner(
  _prev: AdsFormState,
  fd: FormData,
): Promise<AdsFormState> {
  const session = await requireAdminAction()
  const id = optString(fd, "id", 120)
  let data: ReturnType<typeof readFields>
  try {
    data = readFields(fd)
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invalid input" }
  }

  if (id) {
    const before = await db.adBanner.findUnique({ where: { id }, select: { title: true, slot: true } })
    if (!before) return { error: "Banner not found" }
    await db.adBanner.update({ where: { id }, data })
    await logAdminAction(session, "ads.save", "ad_banner", id, {
      slot: data.slot,
      status: data.status,
    })
    revalidateAds()
    return { error: null }
  }

  const created = await db.adBanner.create({
    data: { ...data, createdById: session.user.id },
  })
  await logAdminAction(session, "ads.create", "ad_banner", created.id, { slot: data.slot })
  revalidateAds()
  redirect(`/admin/ads/${created.id}`)
}

export async function deleteAdBanner(fd: FormData): Promise<void> {
  const session = await requireAdminAction()
  const id = reqString(fd, "id", 120)
  await db.adBanner.delete({ where: { id } })
  await logAdminAction(session, "ads.delete", "ad_banner", id)
  revalidateAds()
  redirect("/admin/ads")
}

export async function setAdStatus(fd: FormData): Promise<void> {
  const session = await requireAdminAction()
  const id = reqString(fd, "id", 120)
  const status = reqEnum(fd, "status", AD_STATUSES)
  await db.adBanner.update({ where: { id }, data: { status } })
  await logAdminAction(session, "ads.status", "ad_banner", id, { status })
  revalidateAds()
}
