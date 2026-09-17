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
  /** Set once the author unsent it — the body arrives empty, render a tombstone. */
  deletedAt?: string | null
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
 * Merge server messages into the local list: reconcile optimistic temps via
 * metadata.clientId, replace any row the server re-sends (an unsend arrives as
 * the same id with deletedAt set), keep (createdAt, id) order.
 * ponytail: linear scan, no map — page size is ≤50 messages.
 */
export function mergeMessages(prev: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
  const next = [...prev]
  for (const msg of incoming) {
    const known = next.findIndex((m) => m.id === msg.id && !m.id.startsWith("tmp_"))
    if (known >= 0) {
      next[known] = msg // server truth wins — this is how a tombstone lands
      continue
    }
    const clientId = clientIdOf(msg)
    const idx = clientId ? next.findIndex((m) => m.clientId === clientId) : -1
    if (idx >= 0) next[idx] = msg
    else next.push(msg)
  }
  return next.sort((a, b) => earlier(a, b))
}

/**
 * Index of the first message the reader has not seen — where the "New
 * messages" divider goes. -1 when everything is already read, when the
 * unseen run starts with my own message (I was the last to speak), or when
 * there is no read position yet (a brand-new room needs no divider).
 */
export function unreadDividerIndex(
  messages: readonly ChatMessage[],
  lastReadAt: string | null | undefined,
  meId: string,
): number {
  if (!lastReadAt) return -1
  const readMs = new Date(lastReadAt).getTime()
  if (!Number.isFinite(readMs)) return -1
  const idx = messages.findIndex((m) => new Date(m.createdAt).getTime() > readMs)
  if (idx < 0) return -1
  return messages[idx]!.senderId === meId ? -1 : idx
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

/**
 * Per-room composer draft. Switching rooms mid-sentence and coming back to an
 * empty box is the oldest way to lose a message; sessionStorage costs nothing
 * and dies with the tab.
 */
const ROOM_DRAFT_PREFIX = "sv-chat-draft:"

export function readRoomDraft(roomId: string): string {
  if (!roomId) return ""
  try {
    return (sessionStorage.getItem(ROOM_DRAFT_PREFIX + roomId) ?? "").slice(0, 2000)
  } catch {
    return "" // private mode / quota — the composer just starts empty
  }
}

export function writeRoomDraft(roomId: string, text: string) {
  if (!roomId) return
  try {
    const trimmed = text.slice(0, 2000)
    if (trimmed.trim()) sessionStorage.setItem(ROOM_DRAFT_PREFIX + roomId, trimmed)
    else sessionStorage.removeItem(ROOM_DRAFT_PREFIX + roomId)
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
