/**
 * Chat library — SSE-based real-time messaging.
 * Uses the existing Prisma client from src/lib/db.ts.
 * ponytail: no Redis pub/sub yet; SSE polling fallback built into stream route.
 */

import { db } from "@/lib/db"

// ---------------------------------------------------------------------------
// Chat rooms
// ---------------------------------------------------------------------------

/** Find existing or create a new chat room for a listing. */
export async function getOrCreateChatRoom(listingId: string, userId: string) {
  // Look for an existing room where this user is already a participant
  const existing = await db.chatRoom.findFirst({
    where: {
      listingId,
      participants: { some: { userId } },
      status: "active",
    },
    include: {
      participants: true,
      listing: { select: { title: true, id: true } },
    },
  })

  if (existing) return existing

  // Fetch listing title for the room name
  const listing = await db.listing.findUnique({
    where: { id: listingId },
    select: { title: true },
  })

  const title = listing?.title ?? `Chat ${listingId.slice(0, 8)}`

  return db.chatRoom.create({
    data: {
      listingId,
      title,
      participants: {
        create: { userId, role: "member" },
      },
    },
    include: {
      participants: true,
      listing: { select: { title: true, id: true } },
    },
  })
}

/** Get all active chat rooms for a user, ordered by recent activity. */
export async function getUserChats(userId: string) {
  return db.chatRoom.findMany({
    where: {
      participants: { some: { userId } },
      status: "active",
    },
    include: {
      listing: { select: { title: true, id: true } },
      participants: { select: { userId: true, role: true, lastReadAt: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { content: true, createdAt: true, senderId: true, kind: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  })
}

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

const MESSAGES_PAGE_SIZE = 50

/** Get paginated messages for a chat room (cursor-based). */
export async function getChatMessages(roomId: string, cursor?: string) {
  const where = cursor
    ? { roomId, createdAt: { lt: new Date(cursor) } }
    : { roomId }

  const messages = await db.chatMessage.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: MESSAGES_PAGE_SIZE,
    select: {
      id: true,
      roomId: true,
      senderId: true,
      content: true,
      kind: true,
      metadata: true,
      createdAt: true,
    },
  })

  return {
    messages: messages.reverse(), // oldest first for display
    nextCursor: messages.length === MESSAGES_PAGE_SIZE
      ? messages[messages.length - 1]?.createdAt.toISOString() ?? null
      : null,
    hasMore: messages.length === MESSAGES_PAGE_SIZE,
  }
}

/** Send a message to a chat room. Updates room's updatedAt for ordering. */
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
    // ponytail: auto-join if not a participant yet (open chat model)
    await db.chatParticipant.create({
      data: { roomId, userId: senderId, role: "member" },
    })
  }

  const [message] = await Promise.all([
    db.chatMessage.create({
      data: {
        roomId,
        senderId,
        content: text,
        kind,
        metadata: metadata as any,
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

/** Count unread messages for a user in a room. */
export async function unreadCount(roomId: string, userId: string) {
  const participant = await db.chatParticipant.findUnique({
    where: { roomId_userId: { roomId, userId } },
    select: { lastReadAt: true },
  })

  if (!participant) return 0

  const where = participant.lastReadAt
    ? { roomId, createdAt: { gt: participant.lastReadAt } }
    : { roomId }

  return db.chatMessage.count({ where })
}

/** Get unread counts for all of a user's rooms. */
export async function allUnreadCounts(userId: string) {
  const rooms = await db.chatParticipant.findMany({
    where: { userId },
    select: {
      roomId: true,
      lastReadAt: true,
      room: {
        select: {
          _count: { select: { messages: true } },
        },
      },
    },
  })

  const counts: Record<string, number> = {}
  for (const p of rooms) {
    if (!p.lastReadAt) {
      counts[p.roomId] = p.room._count.messages
    } else {
      const count = await db.chatMessage.count({
        where: { roomId: p.roomId, createdAt: { gt: p.lastReadAt } },
      })
      if (count > 0) counts[p.roomId] = count
    }
  }

  return counts
}
