/**
 * Live forum: Prisma threads/replies merged with editorial seed.
 * ponytail: seed stays read-path until first user reply upserts it; no Discourse clone.
 */
import { randomUUID } from "node:crypto"

import {
  FORUM_CATEGORIES,
  FORUM_THREADS,
  excerptFromBody,
  getThread as getSeedThread,
  makeForumSlug,
  relatedThreads as relatedSeed,
  type ForumReply,
  type ForumThread,
} from "@/data/forum"
import type { ForumReply as DbReply, ForumThread as DbThread } from "@/generated/prisma/client"
import { db, dbAvailable } from "@/lib/db"

export { FORUM_CATEGORIES, excerptFromBody, makeForumSlug }
export type { ForumCategory } from "@/data/forum"

const DATE_ONLY = (d: Date) => d.toISOString().slice(0, 10)

function formatViews(n: number): string {
  if (n >= 1000) {
    const k = n / 1000
    return Number.isInteger(k) ? `${k}k` : `${k.toFixed(1)}k`
  }
  return String(n)
}

function parseViewsLabel(label: string): number {
  const m = label.trim().match(/^([\d.]+)\s*k$/i)
  if (m?.[1]) return Math.round(Number.parseFloat(m[1]) * 1000)
  const n = Number.parseInt(label.replace(/\D/g, ""), 10)
  return Number.isFinite(n) ? n : 0
}

function mapDbReply(r: DbReply): ForumReply {
  return {
    id: r.id,
    authorName: r.authorName,
    body: r.body,
    verified: r.verified,
    createdAt: DATE_ONLY(r.createdAt),
    parentId: r.parentId,
    helpfulCount: r.helpfulCount,
  }
}

function mapDbThread(t: DbThread, replies: ForumReply[]): ForumThread {
  return {
    slug: t.slug,
    title: t.title,
    excerpt: t.excerpt || t.body.slice(0, 160),
    body: t.body,
    category: t.category || "ზოგადი",
    district: t.district,
    tags: t.tags,
    badge: t.badge || "ახალი",
    viewsLabel: formatViews(t.views),
    authorName: t.authorName || "მომხმარებელი",
    createdAt: DATE_ONLY(t.createdAt),
    lastActivityAt: DATE_ONLY(t.lastActivityAt),
    replies,
  }
}

async function loadDbReplies(threadId: string): Promise<ForumReply[]> {
  const rows = await db.forumReply.findMany({
    where: { threadId, deletedAt: null },
    orderBy: { createdAt: "asc" },
  })
  return rows.map(mapDbReply)
}

/** Upsert editorial seed into DB so replies can attach to a real threadId. */
export async function ensureThreadRow(slug: string): Promise<DbThread | null> {
  if (!(await dbAvailable())) return null
  const existing = await db.forumThread.findFirst({
    where: { slug, deletedAt: null },
  })
  if (existing) return existing

  const seed = getSeedThread(slug)
  if (!seed) return null

  return db.forumThread.create({
    data: {
      id: randomUUID(),
      slug: seed.slug,
      title: seed.title,
      excerpt: seed.excerpt,
      body: seed.body,
      category: seed.category,
      district: seed.district,
      authorName: seed.authorName,
      badge: seed.badge,
      tags: seed.tags,
      views: parseViewsLabel(seed.viewsLabel),
      replies: seed.replies.length,
      verifiedResponses: seed.replies.filter((r) => r.verified).length,
      lastActivityAt: new Date(`${seed.lastActivityAt}T12:00:00+04:00`),
      createdAt: new Date(`${seed.createdAt}T12:00:00+04:00`),
    },
  })
}

export async function listForumThreads(): Promise<ForumThread[]> {
  const bySlug = new Map<string, ForumThread>()
  for (const t of FORUM_THREADS) bySlug.set(t.slug, t)

  if (await dbAvailable()) {
    try {
      const rows = await db.forumThread.findMany({
        where: { deletedAt: null },
        orderBy: { lastActivityAt: "desc" },
        take: 100,
      })
      const ids = rows.map((r) => r.id)
      const replyRows =
        ids.length === 0
          ? []
          : await db.forumReply.findMany({
              where: { threadId: { in: ids }, deletedAt: null },
              orderBy: { createdAt: "asc" },
            })
      const repliesByThread = new Map<string, ForumReply[]>()
      for (const r of replyRows) {
        const list = repliesByThread.get(r.threadId) ?? []
        list.push(mapDbReply(r))
        repliesByThread.set(r.threadId, list)
      }
      for (const row of rows) {
        const dbReplies = repliesByThread.get(row.id) ?? []
        const seed = getSeedThread(row.slug)
        const seedIds = new Set((seed?.replies ?? []).map((r) => r.id))
        const merged = [...(seed?.replies ?? []), ...dbReplies.filter((r) => !seedIds.has(r.id))]
        bySlug.set(row.slug, mapDbThread(row, merged.length ? merged : dbReplies))
      }
    } catch {
      // fall through with seed only
    }
  }

  return [...bySlug.values()].sort((a, b) => b.lastActivityAt.localeCompare(a.lastActivityAt))
}

export async function getForumThread(slug: string): Promise<ForumThread | null> {
  if (await dbAvailable()) {
    try {
      const row = await db.forumThread.findFirst({ where: { slug, deletedAt: null } })
      if (row) {
        // Fire-and-forget view bump — ignore failures.
        void db.forumThread
          .update({ where: { id: row.id }, data: { views: { increment: 1 } } })
          .catch(() => undefined)
        const dbReplies = await loadDbReplies(row.id)
        const seed = getSeedThread(slug)
        const seedIds = new Set((seed?.replies ?? []).map((r) => r.id))
        const merged = [...(seed?.replies ?? []), ...dbReplies.filter((r) => !seedIds.has(r.id))]
        return mapDbThread({ ...row, views: row.views + 1 }, merged)
      }
    } catch {
      // seed fallback
    }
  }
  return getSeedThread(slug) ?? null
}

export function relatedForumThreads(thread: ForumThread, all: ForumThread[], limit = 3): ForumThread[] {
  const fromLive = all.filter(
    (t) =>
      t.slug !== thread.slug &&
      (t.district === thread.district || t.tags.some((tag) => thread.tags.includes(tag))),
  )
  if (fromLive.length >= limit) return fromLive.slice(0, limit)
  const seedRelated = relatedSeed(thread, limit)
  const seen = new Set(fromLive.map((t) => t.slug))
  for (const t of seedRelated) {
    if (seen.has(t.slug)) continue
    fromLive.push(t)
    if (fromLive.length >= limit) break
  }
  return fromLive.slice(0, limit)
}

export type CreateThreadInput = {
  ownerId: string
  authorName: string
  title: string
  body: string
  category: string
  district: string
  tags: string[]
}

export async function createForumThread(input: CreateThreadInput): Promise<ForumThread> {
  const slug = makeForumSlug(input.title)
  const excerpt = excerptFromBody(input.body)
  const row = await db.forumThread.create({
    data: {
      id: randomUUID(),
      ownerId: input.ownerId,
      slug,
      title: input.title,
      excerpt,
      body: input.body,
      category: input.category,
      district: input.district,
      authorName: input.authorName,
      badge: "ახალი",
      tags: input.tags,
      views: 0,
      replies: 0,
      verifiedResponses: 0,
    },
  })
  return mapDbThread(row, [])
}

export type CreateReplyInput = {
  slug: string
  ownerId: string
  authorName: string
  body: string
  /** Reply-to a top-level reply only (one nest level). */
  parentId?: string | null
}

export async function createForumReply(input: CreateReplyInput): Promise<ForumReply> {
  const thread = await ensureThreadRow(input.slug)
  if (!thread) throw new Error("thread_not_found")

  let parentId: string | null = null
  let parentOwnerId: string | null = null
  if (input.parentId) {
    const parent = await db.forumReply.findFirst({
      where: { id: input.parentId, threadId: thread.id, deletedAt: null },
      select: { id: true, parentId: true, ownerId: true },
    })
    if (!parent) throw new Error("parent_not_found")
    // ponytail: one nest level — no reply-to-child
    if (parent.parentId) throw new Error("nest_too_deep")
    parentId = parent.id
    parentOwnerId = parent.ownerId
  }

  const reply = await db.forumReply.create({
    data: {
      id: randomUUID(),
      threadId: thread.id,
      parentId,
      ownerId: input.ownerId,
      authorName: input.authorName,
      body: input.body,
      verified: false,
      helpfulCount: 0,
    },
  })
  await db.forumThread.update({
    where: { id: thread.id },
    data: {
      replies: { increment: 1 },
      lastActivityAt: new Date(),
    },
  })

  // In-app only — push/email when forum volume justifies fan-out.
  const notify = async (userId: string, title: string, body: string) => {
    if (!userId || userId === input.ownerId) return
    try {
      await db.notification.create({
        data: {
          userId,
          kind: parentId ? "forum_nested_reply" : "forum_reply",
          title,
          body,
          actionUrl: `/forum/${input.slug}`,
          metadata: { threadId: thread.id, replyId: reply.id, slug: input.slug },
        },
      })
    } catch {
      // best-effort
    }
  }
  if (thread.ownerId) {
    await notify(thread.ownerId, "ახალი პასუხი თემაზე", `${input.authorName}: ${input.body.slice(0, 120)}`)
  }
  if (parentOwnerId && parentOwnerId !== thread.ownerId) {
    await notify(parentOwnerId, "პასუხი თქვენს კომენტარზე", `${input.authorName}: ${input.body.slice(0, 120)}`)
  }

  return mapDbReply(reply)
}
