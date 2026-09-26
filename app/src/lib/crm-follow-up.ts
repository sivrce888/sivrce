/**
 * CRM follow-ups are day-level ("call back Thursday"), stored at 12:00 UTC so
 * the calendar day is the same for every viewer between UTC−11 and UTC+11 —
 * no client timezone needed, forms stay zero-JS.
 */

const DAY_MS = 86_400_000

/** One-tap follow-up presets, in days from today. 0 = today. */
export const FOLLOW_UP_PRESETS = [0, 1, 3, 7, 14] as const

/** Furthest a follow-up may be scheduled — beyond this it is a typo, not a plan. */
const MAX_AHEAD_DAYS = 730

function utcNoon(y: number, m: number, d: number): Date {
  return new Date(Date.UTC(y, m, d, 12))
}

function dayKey(d: Date): number {
  return Math.floor(d.getTime() / DAY_MS)
}

/**
 * Reads `followUpDays` (a preset button) or `followUpDate` (YYYY-MM-DD) from a
 * form. Preset wins: it is the button the user pressed. Null = leave unset.
 */
export function parseFollowUp(fd: FormData, now = new Date()): Date | null {
  const days = fd.get("followUpDays")
  if (typeof days === "string" && days !== "") {
    const n = Number(days)
    if (!(FOLLOW_UP_PRESETS as readonly number[]).includes(n)) throw new Error("Invalid follow-up preset")
    return utcNoon(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + n)
  }
  const raw = fd.get("followUpDate")
  if (typeof raw !== "string" || raw === "") return null
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw)
  if (!m) throw new Error("Invalid follow-up date")
  const date = utcNoon(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  // Round-trip rejects 2026-02-31 style dates that Date.UTC silently rolls over.
  if (date.toISOString().slice(0, 10) !== raw) throw new Error("Invalid follow-up date")
  const ahead = dayKey(date) - dayKey(now)
  if (ahead < 0 || ahead > MAX_AHEAD_DAYS) throw new Error("Follow-up date out of range")
  return date
}

export type FollowUpState = "none" | "overdue" | "today" | "upcoming"

export function followUpState(d: Date | null, now = new Date()): FollowUpState {
  if (!d) return "none"
  const diff = dayKey(d) - dayKey(now)
  return diff < 0 ? "overdue" : diff === 0 ? "today" : "upcoming"
}

/** End of today (UTC) — the `lte` bound for "due now" queries. */
export function endOfToday(now = new Date()): Date {
  return new Date((dayKey(now) + 1) * DAY_MS - 1)
}

/** `<input type="date">` value for a stored follow-up. */
export function followUpInputValue(d: Date | null): string {
  return d ? d.toISOString().slice(0, 10) : ""
}
