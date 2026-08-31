/**
 * Phone OTP send/verify + find-or-create. Twilio Verify in prod;
 * in-memory OTP when SMS is not configured (non-production).
 */
import { createHash, randomInt, timingSafeEqual } from "node:crypto"

import { OTP_LEN, OTP_TTL_MS, normalizePhone, phoneEmail } from "@/lib/auth-phone"
import { db, dbAvailable } from "@/lib/db"
import { clientIp, rateLimitOk } from "@/lib/reviews/rate-limit"
import { checkVerifySms, sendVerifySms, smsReady, toE164 } from "@/lib/sms/twilio-verify"

export type OtpResult = { ok: true; phone: string } | { ok: false; error: string }

function hashOtp(e164: string, code: string): string {
  return createHash("sha256").update(`sivrce-otp:${e164}:${code}`).digest("hex")
}

function codesEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ba.length !== bb.length) return false
  return timingSafeEqual(ba, bb)
}

// ponytail: process-local store for local/dev without Twilio. Lost on restart;
// Twilio Verify is the store in production.
const memOtp = new Map<string, { hash: string; exp: number }>()

function storeMemOtp(e164: string, code: string) {
  memOtp.set(e164, { hash: hashOtp(e164, code), exp: Date.now() + OTP_TTL_MS })
}

function checkMemOtp(e164: string, code: string): boolean {
  const row = memOtp.get(e164)
  if (!row || row.exp < Date.now()) {
    if (row) memOtp.delete(e164)
    return false
  }
  const ok = codesEqual(row.hash, hashOtp(e164, code))
  if (ok) memOtp.delete(e164)
  return ok
}

async function isBlocked(phone: string, e164: string): Promise<boolean> {
  if (!(await dbAvailable())) return false
  try {
    const row = await db.blocklistPhone.findFirst({
      where: { phone: { in: [phone, e164] } },
      select: { phone: true, expiresAt: true },
    })
    if (!row) return false
    if (row.expiresAt && row.expiresAt < new Date()) return false
    return true
  } catch {
    return false
  }
}

export async function sendPhoneOtp(raw: string, headers: Headers): Promise<OtpResult> {
  const phone = normalizePhone(raw)
  const e164 = phone ? toE164(phone) : null
  if (!phone || !e164) return { ok: false, error: "შეიყვანე სწორი მობილურის ნომერი" }

  const ip = clientIp(headers)
  if (!rateLimitOk(`otp-ip:${ip}`) || !rateLimitOk(`otp-phone:${e164}`)) {
    return { ok: false, error: "ზედმეტად ბევრი მცდელობა — სცადე რამდენიმე წუთში" }
  }

  if (await isBlocked(phone, e164)) {
    return { ok: false, error: "ეს ნომერი დაბლოკილია" }
  }

  if (smsReady()) {
    const sent = await sendVerifySms(phone)
    if (!sent.ok) {
      const msg =
        sent.error === "send_failed"
          ? "კოდი ვერ გაიგზავნა — სცადე თავიდან"
          : "შეიყვანე სწორი მობილურის ნომერი"
      return { ok: false, error: msg }
    }
    return { ok: true, phone }
  }

  if (process.env.NODE_ENV === "production") {
    return { ok: false, error: "SMS დროებით მიუწვდომელია — სცადე ელფოსტით ან Google-ით" }
  }

  const code = randomInt(0, 10 ** OTP_LEN)
    .toString()
    .padStart(OTP_LEN, "0")
  storeMemOtp(e164, code)
  console.info(`[auth-phone] DEV OTP ${phone} → ${code}`)
  return { ok: true, phone }
}

export async function verifyPhoneOtp(raw: string, code: string): Promise<OtpResult> {
  const phone = normalizePhone(raw)
  const e164 = phone ? toE164(phone) : null
  const trimmed = code.replace(/\D/g, "")
  if (!phone || !e164) return { ok: false, error: "შეიყვანე სწორი მობილურის ნომერი" }
  if (trimmed.length < 4 || trimmed.length > 8) {
    return { ok: false, error: "შეიყვანე SMS კოდი" }
  }

  if (smsReady()) {
    const checked = await checkVerifySms(phone, trimmed)
    if (!checked.ok) {
      return {
        ok: false,
        error: checked.error === "invalid_code" ? "კოდი არასწორია ან ვადაგასულია" : "კოდის შემოწმება ვერ მოხერხდა",
      }
    }
    return { ok: true, phone }
  }

  if (process.env.NODE_ENV === "production") {
    return { ok: false, error: "SMS დროებით მიუწვდომელია" }
  }

  if (!checkMemOtp(e164, trimmed)) {
    return { ok: false, error: "კოდი არასწორია ან ვადაგასულია" }
  }
  return { ok: true, phone }
}

export async function findOrCreatePhoneUser(phone: string) {
  const existing = await db.user.findFirst({ where: { phone } })
  if (existing) {
    if (!existing.phoneVerifiedAt) {
      await db.user.update({
        where: { id: existing.id },
        data: { phoneVerifiedAt: new Date() },
      })
    }
    return existing
  }

  try {
    return await db.user.create({
      data: {
        email: phoneEmail(phone),
        phone,
        phoneVerifiedAt: new Date(),
        role: "buyer",
      },
    })
  } catch {
    const again = await db.user.findFirst({ where: { phone } })
    if (again) return again
    throw new Error("phone_user_create_failed")
  }
}
