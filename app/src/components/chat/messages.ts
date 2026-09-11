/**
 * Chat message helpers — pure, i18n-free, check-covered (messages.check.ts).
 */

export interface ChatMessage {
  id: string
  roomId: string
  senderId: string
  content: string
  kind: string
  metadata?: Record<string, unknown> | null
  createdAt: string
  /** Client-side delivery state — never comes from the API. */
  status?: "pending" | "failed"
  /** Optimistic id ("tmp_*") until the server echo replaces it via metadata.clientId. */
  clientId?: string
}

function earlier(a: ChatMessage, b: ChatMessage): number {
  return a.createdAt < b.createdAt || (a.createdAt === b.createdAt && a.id <= b.id) ? -1 : 1
}

function clientIdOf(msg: ChatMessage): string | null {
  return typeof msg.metadata?.clientId === "string" ? msg.metadata.clientId : null
}

/**
 * Merge server messages into the local list: dedupe by id, reconcile
 * optimistic temps via metadata.clientId, keep (createdAt, id) order.
 * ponytail: linear scan, no map — page size is ≤50 messages.
 */
export function mergeMessages(prev: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
  const known = new Set(prev.filter((m) => !m.id.startsWith("tmp_")).map((m) => m.id))
  const next = [...prev]
  for (const msg of incoming) {
    if (known.has(msg.id)) continue
    known.add(msg.id)
    const clientId = clientIdOf(msg)
    const idx = clientId ? next.findIndex((m) => m.clientId === clientId) : -1
    if (idx >= 0) next[idx] = msg
    else next.push(msg)
  }
  return next.sort((a, b) => earlier(a, b))
}

const GROUP_GAP_MS = 5 * 60_000

/** Consecutive bubbles from the same sender within 5 min share a group. */
export function sameGroup(a: ChatMessage, b: ChatMessage): boolean {
  return (
    a.senderId === b.senderId &&
    a.kind === "text" &&
    b.kind === "text" &&
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() < GROUP_GAP_MS
  )
}

export function clockLabel(iso: string, lang: string): string {
  return new Intl.DateTimeFormat(lang, { hour: "2-digit", minute: "2-digit" }).format(new Date(iso))
}

export function dayKey(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

/** "today"/"yesterday" come from t(); older dates format in the room's locale. */
export function dayLabel(
  iso: string,
  lang: string,
  todayLabel: string,
  yesterdayLabel: string,
): string {
  const d = new Date(iso)
  const now = new Date()
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const days = Math.round((startOf(now) - startOf(d)) / 86_400_000)
  if (days <= 0) return todayLabel
  if (days === 1) return yesterdayLabel
  return new Intl.DateTimeFormat(lang, { day: "numeric", month: "long" }).format(d)
}

const URL_RE = /https?:\/\/[^\s<>"']+/gi

/** Split text into plain runs and http(s) links — bubbles render links live. */
export function splitLinks(text: string): { text: string; href?: string }[] {
  const out: { text: string; href?: string }[] = []
  let i = 0
  for (const m of text.matchAll(URL_RE)) {
    const start = m.index ?? 0
    if (start > i) out.push({ text: text.slice(i, start) })
    out.push({ text: m[0], href: m[0] })
    i = start + m[0].length
  }
  if (i < text.length) out.push({ text: text.slice(i) })
  return out.length > 0 ? out : [{ text }]
}

export type AgoUnit = "now" | "min" | "hour" | "day"

/** LeadForm → chat composer continuity. sessionStorage, 2 kB cap. */
export const CHAT_DRAFT_KEY = "sv-chat-draft"

export function parseChatDraft(raw: string | null, listingId: string): string | null {
  if (!raw || !listingId) return null
  try {
    const d = JSON.parse(raw) as { listingId?: unknown; text?: unknown }
    if (d.listingId !== listingId || typeof d.text !== "string") return null
    const t = d.text.trim()
    return t ? t.slice(0, 2000) : null
  } catch {
    return null
  }
}

export function stashChatDraft(listingId: string, text: string) {
  const trimmed = text.trim().slice(0, 2000)
  if (!listingId || !trimmed) return
  try {
    sessionStorage.setItem(CHAT_DRAFT_KEY, JSON.stringify({ listingId, text: trimmed }))
  } catch {
    // ponytail: private-mode / quota — composer stays empty, Inquiry already saved
  }
}

export function peekChatDraft(listingId: string): string | null {
  try {
    return parseChatDraft(sessionStorage.getItem(CHAT_DRAFT_KEY), listingId)
  } catch {
    return null
  }
}

export function clearChatDraft(listingId: string) {
  try {
    const raw = sessionStorage.getItem(CHAT_DRAFT_KEY)
    const d = raw ? (JSON.parse(raw) as { listingId?: unknown }) : null
    if (d?.listingId === listingId) sessionStorage.removeItem(CHAT_DRAFT_KEY)
  } catch {
    // ignore
  }
}

/** Room-list relative time as raw units — the component maps them to t(). */
export function timeAgo(iso: string, nowMs: number = Date.now()): { n: number; unit: AgoUnit } {
  const mins = Math.floor((nowMs - new Date(iso).getTime()) / 60_000)
  if (mins < 1) return { n: 0, unit: "now" }
  if (mins < 60) return { n: mins, unit: "min" }
  const hours = Math.floor(mins / 60)
  if (hours < 24) return { n: hours, unit: "hour" }
  return { n: Math.floor(hours / 24), unit: "day" }
}
