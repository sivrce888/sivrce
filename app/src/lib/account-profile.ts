/**
 * Account settings parsers — name / phone / delete-confirm.
 * Trust boundary for /settings profile writes.
 */
import { normalizePhone } from "@/lib/auth-phone"

export const DELETE_CONFIRM = "წაშლა"

export function parseDisplayName(raw: string): { ok: true; name: string } | { ok: false; error: string } {
  const name = raw.trim().replace(/\s+/g, " ").slice(0, 160)
  if (name.length < 2) return { ok: false, error: "შეიყვანე სახელი და გვარი" }
  return { ok: true, name }
}

/** Empty string clears phone. Invalid non-empty input is an error. */
export function parseAccountPhone(
  raw: string,
): { ok: true; phone: string | null } | { ok: false; error: string } {
  const t = raw.trim()
  if (!t) return { ok: true, phone: null }
  const phone = normalizePhone(t)
  if (!phone) return { ok: false, error: "შეიყვანე სწორი მობილურის ნომერი" }
  return { ok: true, phone }
}

export function isDeleteConfirm(raw: string): boolean {
  return raw.trim() === DELETE_CONFIRM
}
