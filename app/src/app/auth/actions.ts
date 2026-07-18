"use server"

import { randomBytes } from "node:crypto"
import { AuthError } from "next-auth"
import { redirect } from "next/navigation"

import { signIn, signOut } from "@/auth"
import { isSelfServeRole } from "@/lib/auth-roles"
import { db } from "@/lib/db"
import { sendEmail, sendWelcomeEmail } from "@/lib/email"
import { dashboardPathFor, requireUser } from "@/lib/guards"
import { hashPassword, validatePassword } from "@/lib/password"

function safeCallback(raw: FormDataEntryValue | null): string | undefined {
  const v = String(raw ?? "")
  return v.startsWith("/") && !v.startsWith("//") ? v : undefined
}

function normalizeEmail(raw: FormDataEntryValue | null): string {
  return String(raw ?? "")
    .trim()
    .toLowerCase()
}

export async function signOutToHome() {
  await signOut({ redirectTo: "/" })
}

export async function signInWithGoogle(formData: FormData) {
  const raw = String(formData.get("redirectTo") ?? "/dashboard")
  const redirectTo =
    raw.startsWith("/") && !raw.startsWith("//") ? raw : "/dashboard"
  await signIn("google", { redirectTo })
}

export async function chooseSelfRole(formData: FormData) {
  const user = await requireUser("/settings")
  if (user.role === "admin") redirect(dashboardPathFor("admin"))

  const raw = String(formData.get("role") ?? "")
  if (!isSelfServeRole(raw)) {
    throw new Error("Invalid role")
  }

  if (user.role !== raw) {
    await db.user.update({ where: { id: user.id }, data: { role: raw } })
  }

  redirect(dashboardPathFor(raw))
}

export type AuthActionState = { error?: string; ok?: string } | undefined

export async function registerWithEmail(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const name = String(formData.get("name") ?? "").trim()
  const email = normalizeEmail(formData.get("email"))
  const password = String(formData.get("password") ?? "")
  const confirm = String(formData.get("confirm") ?? "")

  if (!name || name.length < 2) return { error: "შეიყვანე სახელი" }
  if (!email.includes("@")) return { error: "შეიყვანე სწორი ელფოსტა" }
  const pwErr = validatePassword(password)
  if (pwErr) return { error: pwErr }
  if (password !== confirm) return { error: "პაროლები არ ემთხვევა" }

  const existing = await db.user.findUnique({ where: { email } })
  if (existing?.passwordHash) {
    return { error: "ეს ელფოსტა უკვე რეგისტრირებულია — სცადე შესვლა" }
  }

  const passwordHash = await hashPassword(password)

  if (existing) {
    // OAuth-only user adding a password.
    await db.user.update({
      where: { id: existing.id },
      data: { passwordHash, name: existing.name || name },
    })
  } else {
    const created = await db.user.create({
      data: { email, name, passwordHash, role: "buyer" },
    })
    sendWelcomeEmail({ to: email, name })
    if (process.env.ADMIN_EMAILS?.toLowerCase().includes(email)) {
      await db.user.update({ where: { id: created.id }, data: { role: "admin" } })
    }
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/",
    })
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "რეგისტრაცია შედგა, მაგრამ შესვლა ვერ მოხერხდა — სცადე ხელახლა" }
    }
    throw err
  }
}

export async function signInWithEmail(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = normalizeEmail(formData.get("email"))
  const password = String(formData.get("password") ?? "")
  const callbackUrl = safeCallback(formData.get("callbackUrl")) ?? "/dashboard"

  if (!email.includes("@") || !password) {
    return { error: "შეიყვანე ელფოსტა და პაროლი" }
  }

  try {
    await signIn("credentials", { email, password, redirectTo: callbackUrl })
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "ელფოსტა ან პაროლი არასწორია" }
    }
    throw err
  }
}

export async function requestPasswordReset(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = normalizeEmail(formData.get("email"))
  if (!email.includes("@")) return { error: "შეიყვანე სწორი ელფოსტა" }

  // Always show success — don't leak whether the email exists.
  const okMsg = "თუ ანგარიში არსებობს, აღდგენის ბმული გაიგზავნა ელფოსტაზე"

  const user = await db.user.findUnique({ where: { email } })
  if (!user) return { ok: okMsg }

  const token = randomBytes(32).toString("hex")
  const expires = new Date(Date.now() + 60 * 60 * 1000)

  await db.verificationToken.deleteMany({ where: { identifier: email } })
  await db.verificationToken.create({
    data: { identifier: email, token, expires },
  })

  const base = (process.env.AUTH_URL || "https://sivrce.ge").replace(/\/$/, "")
  const link = `${base}/auth/reset?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`

  await sendEmail({
    to: email,
    subject: "პაროლის აღდგენა — sivrce",
    html: `
      <h2>პაროლის აღდგენა</h2>
      <p>დააჭირე ბმულს ახალი პაროლის დასაყენებლად (მოქმედებს 1 საათი):</p>
      <p><a href="${link}" style="color:#2E6BFF;font-weight:700">პაროლის შეცვლა →</a></p>
      <p style="color:#666;font-size:13px">თუ შენ არ მოითხოვე — უგულებელყავი ეს წერილი.</p>
    `,
  })

  return { ok: okMsg }
}

export async function resetPassword(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = normalizeEmail(formData.get("email"))
  const token = String(formData.get("token") ?? "")
  const password = String(formData.get("password") ?? "")
  const confirm = String(formData.get("confirm") ?? "")

  const pwErr = validatePassword(password)
  if (pwErr) return { error: pwErr }
  if (password !== confirm) return { error: "პაროლები არ ემთხვევა" }
  if (!email || !token) return { error: "ბმული არასწორია ან ვადაგასულია" }

  const row = await db.verificationToken.findUnique({
    where: { identifier_token: { identifier: email, token } },
  })
  if (!row || row.expires < new Date()) {
    return { error: "ბმული არასწორია ან ვადაგასულია — მოითხოვე ახალი" }
  }

  const passwordHash = await hashPassword(password)
  await db.user.update({ where: { email }, data: { passwordHash } })
  await db.verificationToken.delete({
    where: { identifier_token: { identifier: email, token } },
  })

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    })
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: "პაროლი შეიცვალა — შედი ხელახლა" }
    }
    throw err
  }
}
