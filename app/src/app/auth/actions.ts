"use server"

import { randomBytes } from "node:crypto"
import { AuthError } from "next-auth"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { signIn, signOut } from "@/auth"
import { sendPhoneOtp } from "@/lib/auth-phone-otp"
import { isCredentialId } from "@/lib/auth-passkey"
import { isSelfServeRole, isProRole, profileSetupPathFor } from "@/lib/auth-roles"
import { db } from "@/lib/db"
import { sendEmail, sendWelcomeEmail } from "@/lib/email"
import { dashboardPathFor, requireUser } from "@/lib/guards"
import { parsePersonaIntent, roleForPersona } from "@/lib/workspace"
import { writePersonaCookie } from "@/lib/workspace-cookie"
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

  const persona = parsePersonaIntent(
    String(formData.get("persona") ?? formData.get("role") ?? ""),
  )
  if (!persona || persona === "admin") redirect("/settings")
  const role = roleForPersona(persona)

  if (user.role !== role) {
    await db.user.update({ where: { id: user.id }, data: { role } })
  }
  await writePersonaCookie(persona)

  revalidatePath("/settings")
  revalidatePath("/", "layout")

  if (isSelfServeRole(role) && isProRole(role)) {
    const profile =
      role === "agent"
        ? await db.agentProfile.findFirst({
            where: { ownerId: user.id, deletedAt: null },
            select: { id: true },
          })
        : role === "agency"
          ? await db.agencyProfile.findFirst({
              where: { ownerId: user.id, deletedAt: null },
              select: { id: true },
            })
          : await db.developerProfile.findFirst({
              where: { ownerId: user.id, deletedAt: null },
              select: { id: true },
            })
    const setup = profileSetupPathFor(role)
    if (setup && !profile) redirect(setup)
  }

  redirect(dashboardPathFor(role))
}

export type AuthActionState =
  | { error?: string; ok?: string; phone?: string; sentAt?: number }
  | undefined

export async function requestPhoneCode(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const result = await sendPhoneOtp(String(formData.get("phone") ?? ""), await headers())
  if (!result.ok) return { error: result.error }
  return { ok: "კოდი გაიგზავნა SMS-ით", phone: result.phone, sentAt: Date.now() }
}

export async function signInWithPasskey(
  callbackUrl: string,
  cred: string,
): Promise<AuthActionState> {
  const target =
    callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")
      ? callbackUrl
      : "/dashboard"
  if (!cred) return { error: "Passkey ვერ წაიკითხა" }
  try {
    await signIn("passkey", { cred, redirectTo: target })
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "Passkey ვერ დადასტურდა — სცადე თავიდან" }
    }
    throw err
  }
}

export async function deletePasskey(credentialID: string) {
  const user = await requireUser("/settings")
  if (!isCredentialId(credentialID)) return
  await db.authenticator.deleteMany({
    where: { userId: user.id, credentialID },
  })
  revalidatePath("/settings")
  revalidatePath("/account")
}

export async function signInWithPhone(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const phone = String(formData.get("phone") ?? "")
  const code = String(formData.get("code") ?? "")
  const callbackUrl = safeCallback(formData.get("callbackUrl")) ?? "/dashboard"
  if (!phone || !code) return { error: "შეიყვანე ნომერი და კოდი" }

  try {
    await signIn("phone", { phone, code, redirectTo: callbackUrl })
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "კოდი არასწორია ან ვადაგასულია" }
    }
    throw err
  }
}

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

  const callbackUrl = safeCallback(formData.get("callbackUrl")) ?? "/"

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: callbackUrl,
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
