/**
 * Chat library — SSE-based real-time messaging.
 * Uses the existing Prisma client from src/lib/db.ts.
 * ponytail: no Redis pub/sub yet; SSE polling fallback built into stream route.
 */

import { db } from "@/lib/db"
import { Prisma } from "@/generated/prisma/client"
import { inquiryDealOf, shouldRecordChatLead } from "@/lib/chat-lead"
import { canUnsend, isConversationBlocked } from "@/lib/chat-policy"
import { getConfig } from "@/lib/config"
import { sendInquiryNotification } from "@/lib/email"

// ---------------------------------------------------------------------------
// Blocks
// ---------------------------------------------------------------------------

/**
 * True iff either side has blocked the other — the room-open gate. One
 * indexed read covering both directions.
 */
export async function isPairBlocked(a: string, b: string): Promise<boolean> {
  const rows = await db.chatBlock.findMany({
    where: {
      OR: [
        { blockerId: a, blockedId: b },
        { blockerId: b, blockedId: a },
      ],
    },
    select: { blockerId: true, blockedId: true },
  })
  return isConversationBlocked(rows, a, b)
}

/** Block a peer. Idempotent; self-block is refused. */
export async function blockUser(blockerId: string, blockedId: string) {
  if (blockerId === blockedId) throw new Error("self_block")
  await db.chatBlock.upsert({
    where: { blockerId_blockedId: { blockerId, blockedId } },
    create: { blockerId, blockedId },
    update: {},
  })
}

/** Undo my own block. A block placed by the peer is theirs to lift. */
export async function unblockUser(blockerId: string, blockedId: string) {
  await db.chatBlock.deleteMany({ where: { blockerId, blockedId } })
}

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
  if (!listing) throw new Error("listing_not_found")
  if (!listing.ownerId) throw new Error("no_owner")
  if (listing.ownerId === userId) throw new Error("self_chat")
  if (await isPairBlocked(userId, listing.ownerId)) throw new Error("blocked")

  return db.chatRoom.create({
    data: {
      listingId,
      title: listing.title,
      participants: {
        create: [
          { userId, role: "member" },
          { userId: listing.ownerId, role: "owner" },
        ],
      },
    },
    include: ROOM_INCLUDE,
  })
}

/** Participant role reserved for the sivrce support team. */
export const SUPPORT_ROLE = "support"
const SUPPORT_TITLE = "Sivrce Support"

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

  // Every admin gets a seat — a silently dropped admin is a dropped answer.
  const admins = await db.user.findMany({
    where: { role: "admin" },
    select: { id: true },
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
  if (await isPairBlocked(userId, peerId)) throw new Error("blocked")

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
  /** 5-min throttled heartbeat — drives the header presence line. */
  lastSeenAt: string | null
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
  /** I hold the "owner" seat — unlocks the seller-side quick replies. */
  iAmOwner: boolean
  /** Either side blocked the other — the thread is frozen for both. */
  blocked: boolean
  /** I am the blocker, so the Unblock action is mine to take. */
  blockedByMe: boolean
  lastMessage: {
    content: string
    createdAt: string
    senderId: string
    kind: string
    deleted: boolean
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
        select: {
          content: true,
          createdAt: true,
          senderId: true,
          kind: true,
          deletedAt: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  })

  // Two batched reads for the whole list: counterparty identities, and every
  // block row touching me (both directions).
  const otherIds = [
    ...new Set(
      rooms
        .map((r) => r.participants.find((p) => p.userId !== userId)?.userId)
        .filter((id): id is string => !!id),
    ),
  ]
  const [users, blocks] = await Promise.all([
    otherIds.length
      ? db.user.findMany({
          where: { id: { in: otherIds } },
          select: {
            id: true,
            name: true,
            image: true,
            avatarStyle: true,
            avatarColor: true,
            avatarIcon: true,
            lastSeenAt: true,
          },
        })
      : Promise.resolve([]),
    otherIds.length
      ? db.chatBlock.findMany({
          where: {
            OR: [
              { blockerId: userId, blockedId: { in: otherIds } },
              { blockerId: { in: otherIds }, blockedId: userId },
            ],
          },
          select: { blockerId: true, blockedId: true },
        })
      : Promise.resolve([]),
  ])
  const byId = new Map(
    users.map((u) => [
      u.id,
      { ...u, lastSeenAt: u.lastSeenAt ? u.lastSeenAt.toISOString() : null },
    ]),
  )
  const blockedByMe = new Set(blocks.filter((b) => b.blockerId === userId).map((b) => b.blockedId))
  const blockedMe = new Set(blocks.filter((b) => b.blockedId === userId).map((b) => b.blockerId))

  return rooms.map((r) => {
    const peerId = r.participants.find((p) => p.userId !== userId)?.userId ?? ""
    const last = r.messages[0]
    return {
      id: r.id,
      listingId: r.listingId,
      title: r.title,
      status: r.status,
      updatedAt: r.updatedAt.toISOString(),
      listing: r.listing,
      counterpart: byId.get(peerId) ?? null,
      isSupport: r.participants.some((p) => p.userId !== userId && p.role === SUPPORT_ROLE),
      iAmOwner: r.participants.some((p) => p.userId === userId && p.role === "owner"),
      blocked: blockedByMe.has(peerId) || blockedMe.has(peerId),
      blockedByMe: blockedByMe.has(peerId),
      lastMessage: last
        ? {
            // Unsent bodies never leave the server, not even as a list preview.
            content: last.deletedAt ? "" : last.content,
            createdAt: last.createdAt.toISOString(),
            senderId: last.senderId,
            kind: last.kind,
            deleted: last.deletedAt !== null,
          }
        : null,
    }
  })
}

/** Per-room unread counts for a user in one indexed query. */
export async function getChatUnread(userId: string): Promise<Record<string, number>> {
  const rows = await db.$queryRaw<{ room_id: string; unread: number }[]>`
    SELECT m.room_id, COUNT(*)::int AS unread
    FROM chat_messages m
    JOIN chat_participants p ON p.room_id = m.room_id AND p.user_id = ${userId}
    WHERE m.sender_id <> ${userId}
      AND m.deleted_at IS NULL
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
  deletedAt: true,
} as const

type MessageRow = {
  id: string
  roomId: string
  senderId: string
  content: string
  kind: string
  metadata: Prisma.JsonValue
  createdAt: Date
  deletedAt: Date | null
}

export interface ChatMessageDto {
  id: string
  roomId: string
  senderId: string
  content: string
  kind: string
  metadata: Prisma.JsonValue
  createdAt: Date
  /** ISO string when the author unsent it; the client renders a tombstone. */
  deletedAt: string | null
}

/**
 * The only place a message row becomes client-visible. An unsent body stays in
 * the database for the moderation queue that may already hold a Complaint
 * about it, but it never crosses the wire again.
 */
function redact(m: MessageRow): ChatMessageDto {
  return m.deletedAt
    ? { ...m, content: "", metadata: {}, deletedAt: m.deletedAt.toISOString() }
    : { ...m, deletedAt: null }
}

/** Get paginated messages for a chat room (cursor-based), oldest first. */
export async function getChatMessages(roomId: string, cursor?: string) {
  const where = cursor
    ? { roomId, createdAt: { lt: new Date(cursor) } }
    : { roomId }

  const newestFirst = await db.chatMessage.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: MESSAGES_PAGE_SIZE,
    select: MESSAGE_SELECT,
  })
  const hasMore = newestFirst.length === MESSAGES_PAGE_SIZE

  return {
    messages: newestFirst.map(redact).reverse(), // oldest first for display
    // The next page walks backwards, so the cursor is the OLDEST row here —
    // the newest would re-serve this same page one row at a time.
    nextCursor: hasMore
      ? (newestFirst[newestFirst.length - 1]?.createdAt.toISOString() ?? null)
      : null,
    hasMore,
  }
}

/**
 * One batched round-trip per SSE tick: new messages after the (createdAt, id)
 * cursor, tombstones for messages unsent since the last tick, the peer's read
 * position and their typing flag. Four statements, one database request —
 * SSE runs for as long as the panel is open, so the round-trip count is the
 * cost that matters.
 */
export async function getRoomTick(
  roomId: string,
  userId: string,
  cursor: { id: string; at: Date } | null,
  since: Date,
) {
  const [fresh, unsent, peers, typing] = await db.$transaction([
    db.chatMessage.findMany({
      // The caller always has a cursor by the time it polls (an empty room gets
      // a connect-time one); the null branch is a belt-and-braces no-op.
      where: cursor
        ? {
            roomId,
            OR: [
              { createdAt: { gt: cursor.at } },
              { createdAt: cursor.at, id: { gt: cursor.id } },
            ],
          }
        : { roomId, id: "" },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: 20,
      select: MESSAGE_SELECT,
    }),
    db.chatMessage.findMany({
      where: { roomId, deletedAt: { gt: since } },
      orderBy: { createdAt: "asc" },
      take: 20,
      select: MESSAGE_SELECT,
    }),
    db.chatParticipant.findMany({
      where: { roomId, userId: { not: userId } },
      select: { lastReadAt: true },
    }),
    db.chatTyping.findMany({
      where: {
        roomId,
        userId: { not: userId },
        updatedAt: { gt: new Date(Date.now() - TYPING_TTL_MS) },
      },
      take: 1,
      select: { userId: true },
    }),
  ])

  const maxRead = peers.reduce<Date | null>(
    (acc, p) => (p.lastReadAt && (!acc || p.lastReadAt > acc) ? p.lastReadAt : acc),
    null,
  )
  return {
    fresh: fresh.map(redact),
    unsent: unsent.map(redact),
    peerReadAt: maxRead ? maxRead.toISOString() : null,
    typing: typing.length > 0,
  }
}

/**
 * Unsend one's own message inside UNSEND_WINDOW_MS. Throws "forbidden" when
 * the caller is not the author or the window has closed.
 */
export async function unsendMessage(roomId: string, messageId: string, userId: string) {
  const msg = await db.chatMessage.findUnique({
    where: { id: messageId },
    select: { id: true, roomId: true, senderId: true, createdAt: true, deletedAt: true },
  })
  if (!msg || msg.roomId !== roomId) throw new Error("not_found")
  if (
    !canUnsend(
      {
        senderId: msg.senderId,
        createdAt: msg.createdAt.toISOString(),
        deletedAt: msg.deletedAt?.toISOString() ?? null,
      },
      userId,
    )
  ) {
    throw new Error("forbidden")
  }
  await db.chatMessage.update({
    where: { id: messageId },
    data: { deletedAt: new Date() },
  })
}

/**
 * Send a message to a chat room. Throws "not_participant" | "too_long" |
 * "rate_limited" | "blocked" — the route maps them to 403/400/429.
 */
export async function sendMessage(
  roomId: string,
  senderId: string,
  text: string,
  kind: "text" | "image" | "file" | "system" = "text",
  metadata: Record<string, unknown> = {},
) {
  // Free check first — no database round-trip to reject an oversized body.
  if (text.length > CHAT_MESSAGE_MAX) throw new Error("too_long")

  // Send is the hottest write path: seat, block gate and flood counter travel
  // as one batched round-trip. The block join covers both directions, so a
  // block by either side freezes the thread — enforced here, at the write,
  // where no client state can talk its way past it.
  const [participant, blocks, recent] = await db.$transaction([
    db.chatParticipant.findUnique({
      where: { roomId_userId: { roomId, userId: senderId } },
      select: { userId: true },
    }),
    db.$queryRaw<{ ok: number }[]>`
      SELECT 1 AS ok
      FROM chat_blocks b
      JOIN chat_participants p
        ON p.room_id = ${roomId} AND p.user_id <> ${senderId}
      WHERE (b.blocker_id = ${senderId} AND b.blocked_id = p.user_id)
         OR (b.blocker_id = p.user_id AND b.blocked_id = ${senderId})
      LIMIT 1
    `,
    db.chatMessage.count({
      where: { roomId, senderId, createdAt: { gt: new Date(Date.now() - FLOOD_WINDOW_MS) } },
    }),
  ])

  // Rooms are private: membership is granted at room creation only.
  if (!participant) throw new Error("not_participant")
  if (blocks.length > 0) throw new Error("blocked")
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

  // First buyer message on a listing room → Inquiry. Never fail the send.
  void recordChatLead(roomId, senderId, message.id, text).catch(() => {})

  return message
}

const CHAT_LEAD_DEDUP_MS = 7 * 86_400_000

/**
 * One Inquiry per buyer×listing per week. Fire-and-forget from sendMessage —
 * LeadInbox + email already exist; chat is the conversation, this is the lead.
 */
async function recordChatLead(
  roomId: string,
  senderId: string,
  messageId: string,
  text: string,
) {
  const room = await db.chatRoom.findUnique({
    where: { id: roomId },
    select: {
      listingId: true,
      participants: { select: { userId: true, role: true } },
    },
  })
  const listingId = room?.listingId
  const ownerId = room?.participants.find((p) => p.role === "owner")?.userId
  const prior = await db.chatMessage.findFirst({
    where: { roomId, senderId, NOT: { id: messageId } },
    select: { id: true },
  })
  if (
    !shouldRecordChatLead({
      listingId,
      ownerId,
      senderId,
      isFirstFromSender: !prior,
    })
  ) {
    return
  }

  const [sender, listing, owner] = await Promise.all([
    db.user.findUnique({
      where: { id: senderId },
      select: { name: true, email: true, phone: true },
    }),
    db.listing.findUnique({
      where: { id: listingId! },
      select: {
        title: true,
        dealType: true,
        city: true,
        district: true,
        price: true,
        listingPhone: true,
        agent: true,
      },
    }),
    db.user.findUnique({
      where: { id: ownerId! },
      select: { email: true, name: true },
    }),
  ])
  if (!sender?.email || !listing) return

  const since = new Date(Date.now() - CHAT_LEAD_DEDUP_MS)
  const dup = await db.inquiry.findFirst({
    where: {
      listingId: listingId!,
      buyerEmail: sender.email,
      createdAt: { gt: since },
      deletedAt: null,
    },
    select: { id: true },
  })
  if (dup) return

  const agent = listing.agent as { name?: unknown; phone?: unknown } | null
  const agentName =
    (typeof agent?.name === "string" && agent.name) || owner?.name || "sivrce"
  const agentPhone =
    listing.listingPhone ||
    (typeof agent?.phone === "string" && !agent.phone.includes("*") ? agent.phone : null)
  const buyerName = sender.name?.trim() || sender.email.split("@")[0] || "sivrce"
  const siteEmail = await getConfig("site.contactEmail")
  const notifyEmail = owner?.email || siteEmail

  await db.inquiry.create({
    data: {
      id: crypto.randomUUID(),
      listingId: listingId!,
      agentName,
      agentEmail: owner?.email ?? null,
      agentPhone,
      buyerName,
      buyerEmail: sender.email,
      buyerPhone: sender.phone,
      message: text,
      deal: inquiryDealOf(listing.dealType),
      city: listing.city,
      district: listing.district,
      price: listing.price,
    },
  })

  sendInquiryNotification({
    agentEmail: notifyEmail,
    agentName,
    buyerName,
    buyerPhone: sender.phone,
    buyerEmail: sender.email,
    message: text,
    listingTitle: listing.title,
    subject: `ახალი მოთხოვნა (ჩატი) — ${buyerName}`,
  })
}

/** Mark all messages in a room as read for a given user. */
export async function markRead(roomId: string, userId: string) {
  await db.chatParticipant.updateMany({
    where: { roomId, userId },
    data: { lastReadAt: new Date() },
  })
}

/**
 * My own read position, read before the thread marks itself read — this is
 * what draws the "New messages" divider in the right place.
 */
export async function getMyLastReadAt(roomId: string, userId: string): Promise<string | null> {
  const p = await db.chatParticipant.findUnique({
    where: { roomId_userId: { roomId, userId } },
    select: { lastReadAt: true },
  })
  return p?.lastReadAt ? p.lastReadAt.toISOString() : null
}

const SUPPORT_BACKFILL_TTL_MS = 10 * 60_000
const supportBackfillAt = new Map<string, number>()

/**
 * Seat any admin who joined after a support room was opened. Without this an
 * admin hired on Tuesday is blind to every conversation started on Monday —
 * a silently unanswered support line is worse than none.
 */
export async function backfillSupportSeats(adminId: string) {
  // The rooms poll runs every 15–45 s; the backfill only needs to be eventually
  // true. Per-instance throttle keeps it near-free.
  const last = supportBackfillAt.get(adminId) ?? 0
  if (Date.now() - last < SUPPORT_BACKFILL_TTL_MS) return
  supportBackfillAt.set(adminId, Date.now())

  const missing = await db.chatRoom.findMany({
    where: {
      status: "active",
      listingId: null,
      participants: { some: { role: SUPPORT_ROLE }, none: { userId: adminId } },
    },
    select: { id: true },
    take: 200,
  })
  if (missing.length === 0) return
  await db.chatParticipant.createMany({
    data: missing.map((r) => ({ roomId: r.id, userId: adminId, role: SUPPORT_ROLE })),
    skipDuplicates: true,
  })
}

/**
 * Leave a room: drop the caller's participant seat (zero-migration soft
 * leave — history stays for the other side; reopening recreates the seat).
 * Support seats are sticky: leaving the support line just hides it until the
 * user contacts support again.
 */
export async function leaveChatRoom(roomId: string, userId: string): Promise<boolean> {
  const res = await db.chatParticipant.deleteMany({ where: { roomId, userId } })
  // Dropping my typing heartbeat too — no ghost "typing…" for the peer.
  await db.chatTyping.deleteMany({ where: { roomId, userId } }).catch(() => {})
  return res.count > 0
}

/** Peer seats + sender display name for the new-message push fan-out. */
export async function getRoomPushPeers(roomId: string, senderId: string) {
  const [peers, sender] = await Promise.all([
    db.chatParticipant.findMany({ where: { roomId, userId: { not: senderId } }, select: { userId: true } }),
    db.user.findUnique({ where: { id: senderId }, select: { name: true } }),
  ])
  return { peerIds: peers.map((p) => p.userId), senderName: sender?.name ?? "sivrce" }
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

// The typing read lives inside getRoomTick — it rides the same batched
// round-trip as messages and read receipts, so no standalone reader exists.
