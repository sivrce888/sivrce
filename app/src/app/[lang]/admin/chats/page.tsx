import { MessagesSquare, MessageSquareText, Radio } from "lucide-react"
import Link from "next/link"

import { DataTable, THeadRow, TRow, td, th } from "@/components/admin/ui/DataTable"
import { EmptyState } from "@/components/admin/ui/EmptyState"
import { FilterSelect } from "@/components/admin/ui/FilterSelect"
import { PageHeader } from "@/components/admin/ui/PageHeader"
import { Pagination } from "@/components/admin/ui/Pagination"
import { SearchForm } from "@/components/admin/ui/SearchForm"
import { StatCard } from "@/components/admin/ui/StatCard"
import { StatusPill } from "@/components/admin/ui/StatusPill"
import type { Prisma } from "@/generated/prisma/client"
import { fmtDate, fmtNum, timeAgo } from "@/lib/admin/format"
import { requireAdmin } from "@/lib/admin/guard"
import { userLabel } from "@/lib/admin/moderation"
import { ADMIN_PAGE_SIZE, param, parsePage, type SearchParams } from "@/lib/admin/query"
import { db } from "@/lib/db"

export const metadata = { title: "Chats" }

const STATE_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "all", label: "All" },
] as const

/**
 * Read-only chat monitoring. ChatRoom.status is a free string (only "active"
 * is ever written in the codebase) and no flagged/reported field exists, so
 * there is deliberately no close/flag mutation here. Message bodies are never
 * rendered on this page.
 */
export default async function AdminChatsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  await requireAdmin()
  const sp = await searchParams
  const page = parsePage(sp.page)
  const state = param(sp.state) || "active"
  const q = param(sp.q)

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const where: Prisma.ChatRoomWhereInput = {}
  if (state === "active") where.status = "active"
  if (q) where.title = { contains: q, mode: "insensitive" }

  const [activeCount, activeTodayCount, messageCount, rows, total] = await Promise.all([
    db.chatRoom.count({ where: { status: "active" } }),
    db.chatRoom.count({ where: { updatedAt: { gte: today } } }),
    db.chatMessage.count(),
    db.chatRoom.findMany({
      where,
      include: {
        listing: { select: { id: true, title: true } },
        participants: { select: { userId: true, role: true } },
        _count: { select: { messages: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: ADMIN_PAGE_SIZE,
      skip: (page - 1) * ADMIN_PAGE_SIZE,
    }),
    db.chatRoom.count({ where }),
  ])

  // Participants carry bare userIds — resolve display names for the page batch.
  const userIds = [...new Set(rows.flatMap((r) => r.participants.map((p) => p.userId)))]
  const users = await db.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true },
  })
  const userNames = new Map(users.map((u) => [u.id, userLabel(u)]))

  return (
    <div>
      <PageHeader
        title="Chats"
        description={`${fmtNum(total)} chat rooms · read-only monitoring, message content is not shown`}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Active rooms"
          value={fmtNum(activeCount)}
          hint="Rooms currently open"
          icon={MessagesSquare}
          tone="blue"
        />
        <StatCard
          label="Active today"
          value={fmtNum(activeTodayCount)}
          hint="Rooms with activity since midnight"
          icon={Radio}
          tone="ink"
        />
        <StatCard
          label="Messages total"
          value={fmtNum(messageCount)}
          hint="Across all rooms"
          icon={MessageSquareText}
          tone="ink"
        />
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-x-6 gap-y-3">
        <SearchForm action="/admin/chats" params={sp} placeholder="Search room title…" />
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <FilterSelect name="state" label="State" options={STATE_OPTIONS} value={state} />
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={MessagesSquare}
          title="No chat rooms found"
          hint="Rooms started between buyers and listing owners will appear here."
        />
      ) : (
        <>
          <DataTable>
            <THeadRow>
              <th className={th}>Room</th>
              <th className={th}>Participants</th>
              <th className={`${th} text-right`}>Messages</th>
              <th className={th}>Status</th>
              <th className={th}>Last activity</th>
              <th className={th}>Created</th>
            </THeadRow>
            <tbody>
              {rows.map((r) => {
                const names = r.participants.map((p) => userNames.get(p.userId) ?? "Unknown user")
                return (
                  <TRow key={r.id}>
                    <td className={td}>
                      <div className="max-w-[260px]">
                        <span className="block truncate font-bold text-sv-ink">{r.title}</span>
                        {r.listing ? (
                          <Link
                            href={`/admin/listings/${r.listing.id}`}
                            className="mt-0.5 block truncate text-[12px] text-sv-ink/45 transition-colors hover:text-sv-blue"
                          >
                            {r.listing.title}
                          </Link>
                        ) : (
                          <span className="mt-0.5 block text-[12px] text-sv-ink/45">
                            No listing attached
                          </span>
                        )}
                      </div>
                    </td>
                    <td className={td}>
                      <div className="max-w-[240px]">
                        <span className="block truncate">{names.slice(0, 2).join(", ")}</span>
                        {names.length > 2 ? (
                          <span className="mt-0.5 block text-[12px] text-sv-ink/45">
                            +{names.length - 2} more
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className={`${td} text-right tabular-nums`}>{fmtNum(r._count.messages)}</td>
                    <td className={td}>
                      <StatusPill status={r.status} />
                    </td>
                    <td className={`${td} whitespace-nowrap text-sv-ink/55`}>
                      {timeAgo(r.updatedAt)}
                    </td>
                    <td className={`${td} whitespace-nowrap text-sv-ink/55`}>
                      {fmtDate(r.createdAt)}
                    </td>
                  </TRow>
                )
              })}
            </tbody>
          </DataTable>
          <Pagination
            basePath="/admin/chats"
            page={page}
            pageSize={ADMIN_PAGE_SIZE}
            total={total}
            params={sp}
          />
        </>
      )}
    </div>
  )
}
