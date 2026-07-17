import { Check, Star } from "lucide-react"

import { deleteReview, toggleReviewVerified } from "@/app/admin/content/reviews/actions"
import { ContentTabs } from "@/components/admin/content/ContentTabs"
import { ConfirmButton } from "@/components/admin/ui/ConfirmButton"
import { DataTable, THeadRow, TRow, td, th } from "@/components/admin/ui/DataTable"
import { EmptyState } from "@/components/admin/ui/EmptyState"
import { FilterSelect } from "@/components/admin/ui/FilterSelect"
import { PageHeader } from "@/components/admin/ui/PageHeader"
import { Pagination } from "@/components/admin/ui/Pagination"
import { SearchForm } from "@/components/admin/ui/SearchForm"
import type { Prisma } from "@/generated/prisma/client"
import { REVIEW_TARGET_TYPES } from "@/lib/admin/content"
import { fmtDate, fmtNum } from "@/lib/admin/format"
import { shortRef } from "@/lib/admin/moderation"
import { ADMIN_PAGE_SIZE, param, parsePage, type SearchParams } from "@/lib/admin/query"
import { db } from "@/lib/db"

export const metadata = { title: "Reviews" }

const TARGET_TYPE_OPTIONS = REVIEW_TARGET_TYPES.map((v) => ({
  value: v,
  label: v.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()),
}))

const VERIFIED_OPTIONS = [
  { value: "yes", label: "Verified" },
  { value: "no", label: "Unverified" },
] as const

export default async function ReviewsListPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  const page = parsePage(sp.page)
  const q = param(sp.q)
  const targetType = param(sp.targetType)
  const verified = param(sp.verified)

  const where: Prisma.ReviewWhereInput = { deletedAt: null }
  if (q) {
    where.OR = [
      { authorName: { contains: q, mode: "insensitive" } },
      { title: { contains: q, mode: "insensitive" } },
      { body: { contains: q, mode: "insensitive" } },
    ]
  }
  if ((REVIEW_TARGET_TYPES as readonly string[]).includes(targetType)) {
    where.targetType = targetType
  }
  if (verified === "yes") where.verified = true
  if (verified === "no") where.verified = false

  const [total, rows] = await Promise.all([
    db.review.count({ where }),
    db.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
    }),
  ])

  return (
    <>
      <PageHeader
        title="Reviews"
        description={`${fmtNum(total)} reviews · soft-deleted rows are hidden`}
      />
      <ContentTabs active="/admin/content/reviews" />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchForm
          action="/admin/content/reviews"
          params={sp}
          placeholder="Search author, title or text…"
        />
        <FilterSelect
          name="targetType"
          label="Target"
          options={TARGET_TYPE_OPTIONS}
          value={targetType}
        />
        <FilterSelect name="verified" label="Verified" options={VERIFIED_OPTIONS} value={verified} />
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={Star}
          title="No reviews found"
          hint="Try clearing the search query or one of the active filters."
        />
      ) : (
        <DataTable>
          <THeadRow>
            <th className={th}>Author</th>
            <th className={th}>Target</th>
            <th className={th}>Rating</th>
            <th className={th}>Review</th>
            <th className={th}>Verified</th>
            <th className={`${th} text-right`}>Helpful</th>
            <th className={th}>Created</th>
            <th className={th}>Actions</th>
          </THeadRow>
          <tbody>
            {rows.map((r) => (
              <TRow key={r.id}>
                <td className={`${td} whitespace-nowrap`}>
                  <span className="block font-bold text-sv-ink">{r.authorName}</span>
                  <span className="mt-0.5 block text-[12px] text-sv-ink/45 uppercase">
                    {r.locale}
                  </span>
                </td>
                <td className={`${td} whitespace-nowrap`}>
                  <span className="font-bold text-sv-ink">
                    {r.targetType.replaceAll("_", " ")}
                  </span>
                  <span className="mt-0.5 block font-mono text-[12px] text-sv-ink/45">
                    {shortRef(r.targetId)}
                  </span>
                </td>
                <td className={`${td} whitespace-nowrap`}>
                  <span
                    className={`font-bold tabular-nums ${r.rating <= 2 ? "text-rose-600" : "text-sv-ink"}`}
                  >
                    ★ {r.rating}
                  </span>
                </td>
                <td className={td}>
                  <div className="max-w-[320px]">
                    {r.title ? (
                      <span className="block truncate font-bold text-sv-ink">{r.title}</span>
                    ) : null}
                    <span className="mt-0.5 line-clamp-2 block text-[13px] text-sv-ink/60">
                      {r.body}
                    </span>
                  </div>
                </td>
                <td className={td}>
                  {r.verified ? (
                    <Check className="h-4.5 w-4.5 text-emerald-600" aria-label="Verified" />
                  ) : (
                    <span className="text-sv-ink/30">—</span>
                  )}
                </td>
                <td className={`${td} text-right tabular-nums`}>{fmtNum(r.helpfulCount)}</td>
                <td className={`${td} whitespace-nowrap text-sv-ink/55`}>
                  {fmtDate(r.createdAt)}
                </td>
                <td className={td}>
                  <div className="flex flex-wrap gap-1.5">
                    <ConfirmButton
                      action={toggleReviewVerified}
                      fields={{ id: r.id }}
                      label={r.verified ? "Unverify" : "Verify"}
                      tone={r.verified ? "ghost" : "primary"}
                    />
                    <ConfirmButton
                      action={deleteReview}
                      fields={{ id: r.id }}
                      label="Delete"
                      tone="danger"
                      confirm={`Delete the review by ${r.authorName}? It will be hidden from the platform.`}
                    />
                  </div>
                </td>
              </TRow>
            ))}
          </tbody>
        </DataTable>
      )}

      <Pagination
        basePath="/admin/content/reviews"
        page={page}
        pageSize={ADMIN_PAGE_SIZE}
        total={total}
        params={sp}
      />
    </>
  )
}
