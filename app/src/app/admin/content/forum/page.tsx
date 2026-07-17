import { MessagesSquare } from "lucide-react"

import { restoreThread, softDeleteThread } from "@/app/admin/content/forum/actions"
import { ContentTabs } from "@/components/admin/content/ContentTabs"
import { ConfirmButton } from "@/components/admin/ui/ConfirmButton"
import { DataTable, THeadRow, TRow, td, th } from "@/components/admin/ui/DataTable"
import { EmptyState } from "@/components/admin/ui/EmptyState"
import { FilterSelect } from "@/components/admin/ui/FilterSelect"
import { PageHeader } from "@/components/admin/ui/PageHeader"
import { Pagination } from "@/components/admin/ui/Pagination"
import { SearchForm } from "@/components/admin/ui/SearchForm"
import { StatusPill } from "@/components/admin/ui/StatusPill"
import type { Prisma } from "@/generated/prisma/client"
import { fmtDate, fmtNum, timeAgo } from "@/lib/admin/format"
import { ADMIN_PAGE_SIZE, param, parsePage, type SearchParams } from "@/lib/admin/query"
import { db } from "@/lib/db"

export const metadata = { title: "Forum" }

const STATE_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "deleted", label: "Deleted" },
  { value: "all", label: "All" },
] as const

export default async function ForumListPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  const page = parsePage(sp.page)
  const q = param(sp.q)
  const state = param(sp.state) || "active"

  const where: Prisma.ForumThreadWhereInput = {}
  if (q) where.title = { contains: q, mode: "insensitive" }
  if (state === "active") where.deletedAt = null
  if (state === "deleted") where.deletedAt = { not: null }

  const [total, rows] = await Promise.all([
    db.forumThread.count({ where }),
    db.forumThread.findMany({
      where,
      orderBy: { lastActivityAt: "desc" },
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
    }),
  ])

  return (
    <>
      <PageHeader
        title="Forum"
        description={`${fmtNum(total)} threads · ${state === "all" ? "including deleted" : state}`}
      />
      <ContentTabs active="/admin/content/forum" />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchForm
          action="/admin/content/forum"
          params={sp}
          placeholder="Search thread title…"
        />
        <FilterSelect name="state" label="State" options={STATE_OPTIONS} value={state} />
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={MessagesSquare}
          title="No threads found"
          hint="Try widening the search or switching the state filter."
        />
      ) : (
        <DataTable>
          <THeadRow>
            <th className={th}>Title</th>
            <th className={`${th} text-right`}>Replies</th>
            <th className={`${th} text-right`}>Verified responses</th>
            <th className={th}>Last activity</th>
            <th className={th}>Created</th>
            <th className={th}>State</th>
            <th className={th}>Actions</th>
          </THeadRow>
          <tbody>
            {rows.map((t) => (
              <TRow key={t.id}>
                <td className={td}>
                  <div className="max-w-[340px]">
                    <span className="block truncate font-bold text-sv-ink">{t.title}</span>
                    <span className="mt-0.5 block text-[12px] text-sv-ink/45">{t.district}</span>
                    {t.tags.length > 0 ? (
                      <span className="mt-1.5 flex flex-wrap gap-1">
                        {t.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-sv-ink/6 px-2 py-0.5 text-[11px] font-bold text-sv-ink/55"
                          >
                            {tag}
                          </span>
                        ))}
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className={`${td} text-right tabular-nums`}>{fmtNum(t.replies)}</td>
                <td className={`${td} text-right tabular-nums`}>
                  {fmtNum(t.verifiedResponses)}
                </td>
                <td className={`${td} whitespace-nowrap text-sv-ink/55`}>
                  {timeAgo(t.lastActivityAt)}
                </td>
                <td className={`${td} whitespace-nowrap text-sv-ink/55`}>
                  {fmtDate(t.createdAt)}
                </td>
                <td className={td}>
                  <StatusPill status={t.deletedAt ? "archived" : "active"} />
                </td>
                <td className={td}>
                  {t.deletedAt ? (
                    <ConfirmButton
                      action={restoreThread}
                      fields={{ id: t.id }}
                      label="Restore"
                    />
                  ) : (
                    <ConfirmButton
                      action={softDeleteThread}
                      fields={{ id: t.id }}
                      label="Delete"
                      tone="danger"
                      confirm={`Delete the thread "${t.title}"? It will be hidden from the forum.`}
                    />
                  )}
                </td>
              </TRow>
            ))}
          </tbody>
        </DataTable>
      )}

      <Pagination
        basePath="/admin/content/forum"
        page={page}
        pageSize={ADMIN_PAGE_SIZE}
        total={total}
        params={sp}
      />
    </>
  )
}
