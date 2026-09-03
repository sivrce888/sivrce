"use server"

import { revalidatePath } from "next/cache"

import { signOut } from "@/auth"
import {
  isDeleteConfirm,
  parseAccountPhone,
  parseDisplayName,
} from "@/lib/account-profile"
import { isPhoneEmail, phoneEmail } from "@/lib/auth-phone"
import { BRAND } from "@/lib/brand"
import { db } from "@/lib/db"
import { requireRole, requireUser, safeQuery } from "@/lib/guards"
import { hashPassword, validatePassword, verifyPassword } from "@/lib/password"

export type AccountActionState = { error?: string; ok?: string } | undefined

function isUniqueClash(e: unknown): boolean {
  return typeof e === "object" && e !== null && (e as { code?: string }).code === "P2002"
}

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

/** Toggle email listing alerts for the signed-in user. */
export async function toggleListingAlerts(formData: FormData): Promise<void> {
  const user = await requireUser("/settings")
  const want = String(formData.get("enabled") ?? "") === "1"

  const existing = await safeQuery(
    () =>
      db.listingAlertSubscription.findFirst({
        where: { email: user.email },
        orderBy: { createdAt: "desc" },
      }),
    null,
  )

  if (want) {
    if (existing && !existing.unsubscribedAt) return
    if (existing) {
      await db.listingAlertSubscription.update({
        where: { id: existing.id },
        data: { unsubscribedAt: null, confirmedAt: new Date() },
      })
    } else {
      await db.listingAlertSubscription.create({
        data: {
          email: user.email,
          source: "settings",
          confirmedAt: new Date(),
        },
      })
    }
  } else if (existing && !existing.unsubscribedAt) {
    await db.listingAlertSubscription.update({
      where: { id: existing.id },
      data: { unsubscribedAt: new Date() },
    })
  }

  revalidatePath("/settings")
}

export async function updateProfile(
  _prev: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const user = await requireUser("/settings")
  const parsedName = parseDisplayName(String(formData.get("name") ?? ""))
  if (!parsedName.ok) return { error: parsedName.error }

  const parsedPhone = parseAccountPhone(String(formData.get("phone") ?? ""))
  if (!parsedPhone.ok) return { error: parsedPhone.error }

  const row = await db.user.findUnique({
    where: { id: user.id },
    select: { email: true, phone: true },
  })
  if (!row) return { error: "ანგარიში ვერ მოიძებნა" }

  const phoneAccount = isPhoneEmail(row.email)
  if (phoneAccount && !parsedPhone.phone) {
    return { error: "ტელეფონის ნომერი სავალდებულოა" }
  }

  const data: { name: string; phone: string | null; email?: string; phoneVerifiedAt?: Date | null } = {
    name: parsedName.name,
    phone: parsedPhone.phone,
  }

  if (phoneAccount && parsedPhone.phone && parsedPhone.phone !== row.phone) {
    data.email = phoneEmail(parsedPhone.phone)
    data.phoneVerifiedAt = null
  }

  try {
    await db.user.update({ where: { id: user.id }, data })
  } catch (e) {
    if (isUniqueClash(e)) return { error: "ეს ნომერი უკვე გამოყენებულია" }
    throw e
  }

  revalidatePath("/settings")
  revalidatePath("/account")
  revalidatePath("/", "layout")
  return { ok: "პროფილი შენახულია" }
}

export async function changePassword(
  _prev: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const user = await requireUser("/settings")
  const current = String(formData.get("current") ?? "")
  const password = String(formData.get("password") ?? "")
  const confirm = String(formData.get("confirm") ?? "")

  const pwErr = validatePassword(password)
  if (pwErr) return { error: pwErr }
  if (password !== confirm) return { error: "პაროლები არ ემთხვევა" }

  const row = await db.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true },
  })
  if (!row) return { error: "ანგარიში ვერ მოიძებნა" }

  if (row.passwordHash) {
    if (!current) return { error: "შეიყვანე ახლანდელი პაროლი" }
    if (!(await verifyPassword(current, row.passwordHash))) {
      return { error: "ახლანდელი პაროლი არასწორია" }
    }
  }

  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(password) },
  })

  revalidatePath("/settings")
  return { ok: row.passwordHash ? "პაროლი შეიცვალა" : "პაროლი დაყენებულია" }
}

export async function deleteAccount(
  _prev: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const user = await requireUser("/settings")
  if (user.role === "admin") {
    return { error: "ადმინ ანგარიშის წაშლა აქ შეუძლებელია" }
  }
  if (!isDeleteConfirm(String(formData.get("confirm") ?? ""))) {
    return { error: 'დასადასტურებლად ჩაწერე „წაშლა"' }
  }

  const row = await db.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true },
  })
  if (!row) return { error: "ანგარიში ვერ მოიძებნა" }

  if (row.passwordHash) {
    const password = String(formData.get("password") ?? "")
    if (!password || !(await verifyPassword(password, row.passwordHash))) {
      return { error: "პაროლი არასწორია" }
    }
  }

  const now = new Date()
  try {
    await db.$transaction(async (tx) => {
      await tx.listing.updateMany({
        where: { ownerId: user.id, deletedAt: null },
        data: { deletedAt: now, status: "withdrawn" },
      })
      await tx.agentProfile.updateMany({
        where: { ownerId: user.id, deletedAt: null },
        data: { deletedAt: now },
      })
      await tx.agencyProfile.updateMany({
        where: { ownerId: user.id, deletedAt: null },
        data: { deletedAt: now },
      })
      await tx.developerProfile.updateMany({
        where: { ownerId: user.id, deletedAt: null },
        data: { deletedAt: now },
      })
      await tx.user.delete({ where: { id: user.id } })
    })
  } catch {
    return { error: "ანგარიში ვერ წაიშალა — მოგვწერე" }
  }

  await signOut({ redirectTo: "/" })
  return { error: "გასვლა ვერ მოხერხდა" }
}
