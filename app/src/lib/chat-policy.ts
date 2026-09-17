/**
 * Chat policy — pure, dependency-free decisions shared by the API routes, the
 * chat library and the client. No Prisma, no React: everything here is
 * check-covered by chat-policy.check.ts and safe to import from either side.
 */

/**
 * How long an author may unsend their own message. Long enough to undo a
 * wrong price or a mis-pasted phone number, short enough that an old thread
 * cannot be quietly rewritten weeks later.
 */
export const UNSEND_WINDOW_MS = 24 * 60 * 60_000

/** True iff `userId` may unsend this message right now. */
export function canUnsend(
  msg: { senderId: string; createdAt: string; deletedAt?: string | null },
  userId: string,
  nowMs: number = Date.now(),
): boolean {
  if (!userId || msg.senderId !== userId) return false
  if (msg.deletedAt) return false
  const sentAt = new Date(msg.createdAt).getTime()
  if (!Number.isFinite(sentAt)) return false
  return nowMs - sentAt <= UNSEND_WINDOW_MS
}

/**
 * Presence buckets derived from `User.lastSeenAt` (a 5-min throttled
 * heartbeat, so "now" must tolerate one missed beat).
 * `unknown` renders nothing — a stale or absent heartbeat must never be
 * dressed up as an answer about whether someone is around.
 */
export type PresenceState = "online" | "min" | "hour" | "day" | "unknown"

/** Bucket + magnitude; the component maps them onto chat.presence* dict keys. */
export function presenceOf(
  lastSeenAt: string | null | undefined,
  nowMs: number = Date.now(),
): { state: PresenceState; n: number } {
  if (!lastSeenAt) return { state: "unknown", n: 0 }
  const seen = new Date(lastSeenAt).getTime()
  if (!Number.isFinite(seen)) return { state: "unknown", n: 0 }
  const mins = Math.floor((nowMs - seen) / 60_000)
  if (mins < 0) return { state: "online", n: 0 }
  if (mins <= 6) return { state: "online", n: 0 }
  if (mins < 60) return { state: "min", n: mins }
  const hours = Math.floor(mins / 60)
  if (hours < 24) return { state: "hour", n: hours }
  const days = Math.floor(hours / 24)
  return days <= 7 ? { state: "day", n: days } : { state: "unknown", n: 0 }
}

/**
 * Blocking is one-way in storage but two-way in effect: if either side has
 * blocked the other, the conversation is frozen for both. Anything else leaks
 * "you have been blocked" through a one-sided send that silently vanishes.
 */
export function isConversationBlocked(
  blocks: readonly { blockerId: string; blockedId: string }[],
  a: string,
  b: string,
): boolean {
  return blocks.some(
    (x) =>
      (x.blockerId === a && x.blockedId === b) || (x.blockerId === b && x.blockedId === a),
  )
}

/** True iff `me` is the one who pressed Block (the only side that can undo it). */
export function iBlockedThem(
  blocks: readonly { blockerId: string; blockedId: string }[],
  me: string,
  peer: string,
): boolean {
  return blocks.some((x) => x.blockerId === me && x.blockedId === peer)
}
