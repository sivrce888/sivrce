/**
 * Chat library — SSE-based real-time messaging.
 * Uses the existing Prisma client from src/lib/db.ts.
 * ponytail: no Redis pub/sub yet; SSE polling fallback built into stream route.
 */

import { db } from "@/lib/db"
import { Prisma } from "@/generated/prisma/client"

// ---------------------------------------------------------------------------
// Chat rooms
// ---------------------------------------------------------------------------

/** True iff the user is a participant of the room. */
export async function isChatParticipant(roomId: string, userId: string): Promise<boolean> {
  const p = await db.chatParticipant.findUnique({
    where: { roomId_userId: { roomId, userId } },
    select: { userId: true },
  })
  return p !== null
}

const ROOM_INCLUDE = {
  participants: true,
  listing: { select: { title: true, id: true } },
} as const

/** Find existing or create a new chat room for a listing. */
export async function getOrCreateChatRoom(listingId: string, userId: string) {
  // Look for an existing room where this user is already a participant
  const existing = await db.chatRoom.findFirst({
    where: {
      listingId,
      participants: { some: { userId } },
      status: "active",
    },
    include: ROOM_INCLUDE,
  })

  if (existing) return existing

  // Fetch listing title for the room name + owner for the counterparty seat
  const listing = await db.listing.findUnique({
    where: { id: listingId },
    select: { title: true, ownerId: true },
  })

  const title = listing?.title ?? `Chat ${listingId.slice(0, 8)}`

  return db.chatRoom.create({
    data: {
      listingId,
      title,
      participants: {
        create: [
          { userId, role: "member" },
          // The listing owner is the other side of the conversation.
          ...(listing?.ownerId && listing.ownerId !== userId
            ? [{ userId: listing.ownerId, role: "owner" }]
            : []),
        ],
      },
    },
    include: ROOM_INCLUDE,
  })
}

/** Participant role reserved for the sivrce support team. */
export const SUPPORT_ROLE = "support"
const SUPPORT_TITLE = "Sivrce Support"
const MAX_SUPPORT_SEATS = 10

/**
 * Find or create the user's direct line to the sivrce team: a listing-less
 * room where every active admin joins as a "support" participant, so any of
 * them can answer from the regular chat surface (and /admin/chats sees it).
 */
export async function getOrCreateSupportRoom(userId: string) {
  const existing = await db.chatRoom.findFirst({
    where: {
      status: "active",
      listingId: null,
      AND: [
        { participants: { some: { userId } } },
        { participants: { some: { role: SUPPORT_ROLE } } },
      ],
    },
    include: ROOM_INCLUDE,
  })
  if (existing) return existing

  const admins = await db.user.findMany({
    where: { role: "admin" },
    select: { id: true },
    take: MAX_SUPPORT_SEATS,
  })

  return db.chatRoom.create({
    data: {
      title: SUPPORT_TITLE,
      participants: {
        create: [
          { userId, role: "member" },
          ...admins
            .filter((a) => a.id !== userId)
            .map((a) => ({ userId: a.id, role: SUPPORT_ROLE })),
        ],
      },
    },
    include: ROOM_INCLUDE,
  })
}

/** Find or create a private user-to-user room (no listing attached). */
export async function getOrCreateDirectRoom(userId: string, peerId: string) {
  if (userId === peerId) throw new Error("self_chat")

  const peer = await db.user.findUnique({
    where: { id: peerId },
    select: { name: true },
  })
  if (!peer) throw new Error("peer_not_found")

  // The role:"support" guard keeps a direct room with an admin from colliding
  // with their support room.
  const existing = await db.chatRoom.findFirst({
    where: {
      status: "active",
      listingId: null,
      AND: [
        { participants: { some: { userId } } },
        { participants: { some: { userId: peerId } } },
        { participants: { none: { role: SUPPORT_ROLE } } },
      ],
    },
    include: ROOM_INCLUDE,
  })
  if (existing) return existing

  return db.chatRoom.create({
    data: {
      title: peer.name ?? "Chat",
      participants: {
        create: [
          { userId, role: "member" },
          { userId: peerId, role: "member" },
        ],
      },
    },
    include: ROOM_INCLUDE,
  })
}

/** Counterparty identity for room lists — feeds the shared monogram avatar. */
export interface ChatCounterpart {
  id: string
  name: string | null
  image: string | null
  avatarStyle: number | null
  avatarColor: string | null
  avatarIcon: string | null
}

export interface ChatRoomSummary {
  id: string
  listingId: string | null
  title: string
  status: string
  updatedAt: string
  listing: { id: string; title: string } | null
  counterpart: ChatCounterpart | null
  /** True for the listing-less sivrce support line. */
  isSupport: boolean
  lastMessage: {
    content: string
    createdAt: string
    senderId: string
    kind: string
  } | null
}

/** All active chat rooms for a user, newest activity first. */
export async function getUserChats(userId: string): Promise<ChatRoomSummary[]> {
  const rooms = await db.chatRoom.findMany({
    where: {
      participants: { some: { userId } },
      status: "active",
    },
    include: {
      listing: { select: { title: true, id: true } },
      participants: { select: { userId: true, role: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { content: true, createdAt: true, senderId: true, kind: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  })

  // One extra query for every counterparty's display identity
  const otherIds = [
    ...new Set(
      rooms
        .map((r) => r.participants.find((p) => p.userId !== userId)?.userId)
        .filter((id): id is string => !!id),
    ),
  ]
  const users = otherIds.length
    ? await db.user.findMany({
        where: { id: { in: otherIds } },
        select: {
          id: true,
          name: true,
          image: true,
          avatarStyle: true,
          avatarColor: true,
          avatarIcon: true,
        },
      })
    : []
  const byId = new Map(users.map((u) => [u.id, u]))

  return rooms.map((r) => ({
    id: r.id,
    listingId: r.listingId,
    title: r.title,
    status: r.status,
    updatedAt: r.updatedAt.toISOString(),
    listing: r.listing,
    counterpart: byId.get(r.participants.find((p) => p.userId !== userId)?.userId ?? "") ?? null,
    isSupport: r.participants.some((p) => p.userId !== userId && p.role === SUPPORT_ROLE),
    lastMessage: r.messages[0]
      ? {
          content: r.messages[0].content,
          createdAt: r.messages[0].createdAt.toISOString(),
          senderId: r.messages[0].senderId,
          kind: r.messages[0].kind,
        }
      : null,
  }))
}

/** Per-room unread counts for a user in one indexed query. */
export async function getChatUnread(userId: string): Promise<Record<string, number>> {
  const rows = await db.$queryRaw<{ room_id: string; unread: number }[]>`
    SELECT m.room_id, COUNT(*)::int AS unread
    FROM chat_messages m
    JOIN chat_participants p ON p.room_id = m.room_id AND p.user_id = ${userId}
    WHERE m.sender_id <> ${userId}
      AND (p.last_read_at IS NULL OR m.created_at > p.last_read_at)
    GROUP BY m.room_id
  `
  const counts: Record<string, number> = {}
  for (const row of rows) counts[row.room_id] = row.unread
  return counts
}

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

export const CHAT_MESSAGE_MAX = 2000
const MESSAGES_PAGE_SIZE = 50
const FLOOD_WINDOW_MS = 10_000
const FLOOD_MAX = 8

const MESSAGE_SELECT = {
  id: true,
  roomId: true,
  senderId: true,
  content: true,
  kind: true,
  metadata: true,
  createdAt: true,
} as const

/** Get paginated messages for a chat room (cursor-based), oldest first. */
export async function getChatMessages(roomId: string, cursor?: string) {
  const where = cursor
    ? { roomId, createdAt: { lt: new Date(cursor) } }
    : { roomId }

  const messages = await db.chatMessage.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: MESSAGES_PAGE_SIZE,
    select: MESSAGE_SELECT,
  })

  return {
    messages: messages.reverse(), // oldest first for display
    nextCursor: messages.length === MESSAGES_PAGE_SIZE
      ? messages[messages.length - 1]?.createdAt.toISOString() ?? null
      : null,
    hasMore: messages.length === MESSAGES_PAGE_SIZE,
  }
}

/** Messages newer than a (createdAt, id) position — the SSE poller's delta read. */
export async function getChatMessagesAfter(roomId: string, afterId: string, afterAt: Date) {
  return db.chatMessage.findMany({
    where: {
      roomId,
      OR: [{ createdAt: { gt: afterAt } }, { createdAt: afterAt, id: { gt: afterId } }],
    },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    take: 20,
    select: MESSAGE_SELECT,
  })
}

/**
 * Send a message to a chat room. Throws "not_participant" | "too_long" |
 * "rate_limited" — the route maps them to 403/400/429.
 */
export async function sendMessage(
  roomId: string,
  senderId: string,
  text: string,
  kind: "text" | "image" | "file" | "system" = "text",
  metadata: Record<string, unknown> = {},
) {
  // Verify sender is a participant
  const participant = await db.chatParticipant.findUnique({
    where: { roomId_userId: { roomId, userId: senderId } },
  })

  if (!participant) {
    // Rooms are private: membership is granted at room creation only.
    throw new Error("not_participant")
  }

  if (text.length > CHAT_MESSAGE_MAX) throw new Error("too_long")

  const recent = await db.chatMessage.count({
    where: { roomId, senderId, createdAt: { gt: new Date(Date.now() - FLOOD_WINDOW_MS) } },
  })
  if (recent >= FLOOD_MAX) throw new Error("rate_limited")

  const [message] = await Promise.all([
    db.chatMessage.create({
      data: {
        roomId,
        senderId,
        content: text,
        kind,
        metadata: metadata as Prisma.InputJsonValue,
      },
    }),
    // Touch room's updatedAt so it sorts to top
    db.chatRoom.update({
      where: { id: roomId },
      data: { updatedAt: new Date() },
    }),
  ])

  return message
}

/** Mark all messages in a room as read for a given user. */
export async function markRead(roomId: string, userId: string) {
  await db.chatParticipant.updateMany({
    where: { roomId, userId },
    data: { lastReadAt: new Date() },
  })
}

/** The counterparty's newest read position — powers ✓✓ receipts. */
export async function getPeerLastReadAt(roomId: string, userId: string): Promise<string | null> {
  const peers = await db.chatParticipant.findMany({
    where: { roomId, userId: { not: userId } },
    select: { lastReadAt: true },
  })
  const max = peers.reduce<Date | null>(
    (acc, p) => (p.lastReadAt && (!acc || p.lastReadAt > acc) ? p.lastReadAt : acc),
    null,
  )
  return max ? max.toISOString() : null
}

// ---------------------------------------------------------------------------
// Typing
// ---------------------------------------------------------------------------

/** A typing heartbeat counts for this long after its last touch. */
export const TYPING_TTL_MS = 5000

/** Record/refresh the user's typing heartbeat (upsert, no history). */
export async function setChatTyping(roomId: string, userId: string) {
  await db.chatTyping.upsert({
    where: { roomId_userId: { roomId, userId } },
    create: { roomId, userId },
    update: { updatedAt: new Date() },
  })
}

/** True iff the counterparty sent a live typing heartbeat. */
export async function isPeerTyping(roomId: string, userId: string): Promise<boolean> {
  const row = await db.chatTyping.findFirst({
    where: {
      roomId,
      userId: { not: userId },
      updatedAt: { gt: new Date(Date.now() - TYPING_TTL_MS) },
    },
    select: { userId: true },
  })
  return row !== null
}
