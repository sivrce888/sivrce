import { Newspaper, Plus } from "lucide-react"
import Link from "next/link"

import { ContentTabs } from "@/components/admin/content/ContentTabs"
import { DataTable, td, th, THeadRow, TRow } from "@/components/admin/ui/DataTable"
import { EmptyState } from "@/components/admin/ui/EmptyState"
import { FilterSelect } from "@/components/admin/ui/FilterSelect"
import { PageHeader } from "@/components/admin/ui/PageHeader"
import { Pagination } from "@/components/admin/ui/Pagination"
import { SearchForm } from "@/components/admin/ui/SearchForm"
import { StatusPill } from "@/components/admin/ui/StatusPill"
import type { Prisma } from "@/generated/prisma/client"
import { BlogPostStatus } from "@/generated/prisma/enums"
import { fmtDate, fmtNum } from "@/lib/admin/format"
import {
  ADMIN_PAGE_SIZE,
  param,
  parsePage,
  type SearchParams,
} from "@/lib/admin/query"
import { db } from "@/lib/db"

export const metadata = { title: "Blog" }

const STATUS_OPTIONS = [
  { value: BlogPostStatus.draft, label: "Draft" },
  { value: BlogPostStatus.published, label: "Published" },
  { value: BlogPostStatus.archived, label: "Archived" },
] as const

export default async function BlogListPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  const page = parsePage(sp.page)
  const q = param(sp.q)
  const status = param(sp.status)

  const where: Prisma.BlogPostWhereInput = {
    ...(q
      ? {
          OR: [
            { titleKa: { contains: q, mode: "insensitive" } },
            { titleEn: { contains: q, mode: "insensitive" } },
            { slug: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(STATUS_OPTIONS.some((o) => o.value === status)
      ? { status: status as BlogPostStatus }
      : {}),
  }

  const [total, posts] = await Promise.all([
    db.blogPost.count({ where }),
    db.blogPost.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
      include: { author: { select: { name: true, email: true } } },
    }),
  ])

  return (
    <>
      <PageHeader
        title="Blog"
        description="Create and manage editorial content across locales"
        actions={
          <Link
            href="/admin/content/blog/new"
            className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-control)] bg-sv-blue px-3.5 text-[12.5px] font-bold text-white transition-colors hover:bg-sv-blue-deep"
          >
            <Plus className="h-4 w-4" /> New post
          </Link>
        }
      />
      <ContentTabs active="/admin/content/blog" />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchForm
          action="/admin/content/blog"
          params={sp}
          placeholder="Search title or slug…"
        />
        <FilterSelect name="status" label="Status" options={STATUS_OPTIONS} value={status} />
      </div>

      {posts.length === 0 ? (
        <EmptyState
          icon={Newspaper}
          title={q || status ? "No posts match these filters" : "No blog posts yet"}
          hint={
            q || status
              ? "Try widening the search or clearing the status filter."
              : "Publish your first article with the New post button above."
          }
        />
      ) : (
        <DataTable>
          <THeadRow>
            <th className={th}>Post</th>
            <th className={th}>Status</th>
            <th className={th}>Author</th>
            <th className={`${th} text-right`}>Views</th>
            <th className={th}>Created</th>
            <th className={`${th} text-right`}>Actions</th>
          </THeadRow>
          <tbody>
            {posts.map((p) => (
              <TRow key={p.id} href={`/admin/content/blog/${p.id}`}>
                <td className={td}>
                  <Link
                    href={`/admin/content/blog/${p.id}`}
                    className="block max-w-[340px]"
                  >
                    <span className="block truncate font-bold text-sv-ink">
                      {p.titleKa}
                    </span>
                    <span className="mt-0.5 block truncate font-mono text-[11.5px] text-sv-ink/40">
                      /{p.slug}
                    </span>
                  </Link>
                </td>
                <td className={td}>
                  <StatusPill status={p.status} />
                </td>
                <td className={td}>
                  {p.author?.name ?? p.author?.email ?? "—"}
                </td>
                <td className={`${td} text-right tabular-nums`}>
                  {fmtNum(p.viewCount)}
                </td>
                <td className={`${td} whitespace-nowrap`}>{fmtDate(p.createdAt)}</td>
                <td className={`${td} text-right`}>
                  <Link
                    href={`/admin/content/blog/${p.id}`}
                    className="inline-flex h-9 items-center rounded-[var(--radius-control)] border border-sv-ink/12 bg-white px-3.5 text-[12.5px] font-bold text-sv-ink/75 transition-colors hover:border-sv-ink/25 hover:text-sv-ink"
                  >
                    Edit
                  </Link>
                </td>
              </TRow>
            ))}
          </tbody>
        </DataTable>
      )}

      <Pagination
        basePath="/admin/content/blog"
        page={page}
        pageSize={ADMIN_PAGE_SIZE}
        total={total}
        params={sp}
      />
    </>
  )
}
