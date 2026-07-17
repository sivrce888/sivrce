import { Check, Star } from "lucide-react"

import {
  deleteReview,
  deleteServiceProviderReview,
  toggleReviewVerified,
} from "@/app/admin/content/reviews/actions"
import { ContentTabs } from "@/components/admin/content/ContentTabs"
import { ConfirmButton } from "@/components/admin/ui/ConfirmButton"
import { DataTable, THeadRow, TRow, td, th } from "@/components/admin/ui/DataTable"
import { EmptyState } from "@/components/admin/ui/EmptyState"
import { FilterSelect } from "@/components/admin/ui/FilterSelect"
import { PageHeader } from "@/components/admin/ui/PageHeader"
import { Pagination } from "@/components/admin/ui/Pagination"
import { SearchForm } from "@/components/admin/ui/SearchForm"
import { TabLinks } from "@/components/admin/ui/TabLinks"
import type { Prisma } from "@/generated/prisma/client"
import { REVIEW_TARGET_TYPES } from "@/lib/admin/content"
import { fmtDate, fmtNum } from "@/lib/admin/format"
import { requireAdmin } from "@/lib/admin/guard"
import { shortRef, userLabel } from "@/lib/admin/moderation"
import {
  ADMIN_PAGE_SIZE,
  hrefWithParams,
  mergeParams,
  param,
  parsePage,
  type SearchParams,
} from "@/lib/admin/query"
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
  await requireAdmin()
  const sp = await searchParams
  const page = parsePage(sp.page)
  const q = param(sp.q)
  const targetType = param(sp.targetType)
  const verified = param(sp.verified)
  const tab = param(sp.tab) === "providers" ? "providers" : "reviews"

  const tabs = [
    {
      href: hrefWithParams(
        "/admin/content/reviews",
        mergeParams(sp, {
          tab: undefined,
          page: undefined,
          q: undefined,
          targetType: undefined,
          verified: undefined,
        }),
      ),
      label: "Reviews",
      active: tab === "reviews",
    },
    {
      href: hrefWithParams(
        "/admin/content/reviews",
        mergeParams(sp, {
          tab: "providers",
          page: undefined,
          q: undefined,
          targetType: undefined,
          verified: undefined,
        }),
      ),
      label: "Provider reviews",
      active: tab === "providers",
    },
  ]

  return (
    <>
      <PageHeader title="Reviews" description="Listing reviews and service-provider feedback" />
      <ContentTabs active="/admin/content/reviews" />
      <TabLinks items={tabs} />

      {tab === "reviews" ? (
        <ReviewsTab page={page} q={q} targetType={targetType} verified={verified} sp={sp} />
      ) : (
        <ProvidersTab page={page} q={q} sp={sp} />
      )}
    </>
  )
}

/* --------------------------------- reviews --------------------------------- */

async function ReviewsTab({
  page,
  q,
  targetType,
  verified,
  sp,
}: {
  page: number
  q: string
  targetType: string
  verified: string
  sp: SearchParams
}) {
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

/* ----------------------------- provider reviews ---------------------------- */

async function ProvidersTab({
  page,
  q,
  sp,
}: {
  page: number
  q: string
  sp: SearchParams
}) {
  const where: Prisma.ServiceProviderReviewWhereInput = {}
  if (q) {
    where.OR = [
      { comment: { contains: q, mode: "insensitive" } },
      { provider: { name: { contains: q, mode: "insensitive" } } },
    ]
  }

  const [total, rows] = await Promise.all([
    db.serviceProviderReview.count({ where }),
    db.serviceProviderReview.findMany({
      where,
      include: { provider: { select: { id: true, name: true, category: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
    }),
  ])

  // authorId is a bare id (no relation) — resolve display names in batch.
  const authorIds = [...new Set(rows.map((r) => r.authorId))]
  const authors = await db.user.findMany({
    where: { id: { in: authorIds } },
    select: { id: true, name: true, email: true },
  })
  const authorNames = new Map(authors.map((u) => [u.id, userLabel(u)]))

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchForm
          action="/admin/content/reviews"
          params={sp}
          placeholder="Search comment or provider…"
        />
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={Star}
          title="No provider reviews found"
          hint="Reviews left on service providers will appear here."
        />
      ) : (
        <DataTable>
          <THeadRow>
            <th className={th}>Provider</th>
            <th className={th}>Author</th>
            <th className={th}>Rating</th>
            <th className={th}>Comment</th>
            <th className={th}>Created</th>
            <th className={th}>Actions</th>
          </THeadRow>
          <tbody>
            {rows.map((r) => (
              <TRow key={r.id}>
                <td className={`${td} whitespace-nowrap`}>
                  <span className="block font-bold text-sv-ink">{r.provider.name}</span>
                  <span className="mt-0.5 block text-[12px] text-sv-ink/45 capitalize">
                    {r.provider.category.replaceAll("_", " ")}
                  </span>
                </td>
                <td className={`${td} whitespace-nowrap`}>
                  {authorNames.get(r.authorId) ?? shortRef(r.authorId)}
                </td>
                <td className={`${td} whitespace-nowrap`}>
                  <span
                    className={`font-bold tabular-nums ${r.rating <= 2 ? "text-rose-600" : "text-sv-ink"}`}
                  >
                    ★ {r.rating}
                  </span>
                </td>
                <td className={td}>
                  <span className="line-clamp-2 block max-w-[360px] text-[13px] text-sv-ink/60">
                    {r.comment}
                  </span>
                </td>
                <td className={`${td} whitespace-nowrap text-sv-ink/55`}>
                  {fmtDate(r.createdAt)}
                </td>
                <td className={td}>
                  <ConfirmButton
                    action={deleteServiceProviderReview}
                    fields={{ id: r.id }}
                    label="Delete"
                    tone="danger"
                    confirm="Permanently delete this provider review? This cannot be undone."
                  />
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
