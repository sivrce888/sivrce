import { Check, Wrench } from "lucide-react"

import {
  softDeleteProvider,
  toggleProviderActive,
  toggleProviderVerified,
} from "@/app/admin/content/services/actions"
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
import { fmtDate, fmtMoney, fmtNum } from "@/lib/admin/format"
import { ADMIN_PAGE_SIZE, param, parsePage, type SearchParams } from "@/lib/admin/query"
import { db } from "@/lib/db"

export const metadata = { title: "Service providers" }

const VERIFIED_OPTIONS = [
  { value: "yes", label: "Verified" },
  { value: "no", label: "Unverified" },
] as const

const STATE_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "all", label: "All" },
] as const

function humanize(v: string): string {
  return v.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

function priceRange(min: number | null, max: number | null, currency: string): string {
  if (min === null && max === null) return "—"
  const lo = min === null ? "—" : fmtMoney(min, currency)
  const hi = max === null ? "—" : fmtMoney(max, currency)
  return `${lo}–${hi}`
}

export default async function ServicesListPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  const page = parsePage(sp.page)
  const q = param(sp.q)
  const category = param(sp.category)
  const verified = param(sp.verified)
  const state = param(sp.state) || "active"

  const where: Prisma.ServiceProviderWhereInput = {}
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
    ]
  }
  if (category) where.category = category
  if (verified === "yes") where.verified = true
  if (verified === "no") where.verified = false
  if (state === "inactive") {
    where.AND = [{ OR: [{ isActive: false }, { deletedAt: { not: null } }] }]
  } else if (state === "all") {
    // no state constraint
  } else {
    where.isActive = true
    where.deletedAt = null
  }

  const [total, rows, categories] = await Promise.all([
    db.serviceProvider.count({ where }),
    db.serviceProvider.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
    }),
    db.serviceProvider.findMany({ select: { category: true }, distinct: ["category"] }),
  ])
  const categoryOptions = categories
    .map((c) => c.category)
    .sort()
    .map((c) => ({ value: c, label: humanize(c) }))

  return (
    <>
      <PageHeader
        title="Service providers"
        description={`${fmtNum(total)} providers · verify, suspend or delete`}
      />
      <ContentTabs active="/admin/content/services" />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchForm
          action="/admin/content/services"
          params={sp}
          placeholder="Search name or phone…"
        />
        <FilterSelect
          name="category"
          label="Category"
          options={categoryOptions}
          value={category}
        />
        <FilterSelect name="verified" label="Verified" options={VERIFIED_OPTIONS} value={verified} />
        <FilterSelect name="state" label="State" options={STATE_OPTIONS} value={state} />
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="No providers found"
          hint="Try clearing the search query or one of the active filters."
        />
      ) : (
        <DataTable>
          <THeadRow>
            <th className={th}>Name</th>
            <th className={th}>Category</th>
            <th className={th}>Phone</th>
            <th className={th}>Price range</th>
            <th className={th}>Rating</th>
            <th className={th}>Verified</th>
            <th className={th}>Active</th>
            <th className={th}>Created</th>
            <th className={th}>Actions</th>
          </THeadRow>
          <tbody>
            {rows.map((p) => {
              const live = p.isActive && !p.deletedAt
              return (
                <TRow key={p.id}>
                  <td className={td}>
                    <div className="max-w-[220px]">
                      <span className="block truncate font-bold text-sv-ink">{p.name}</span>
                      <span className="mt-0.5 block text-[12px] text-sv-ink/45">
                        {[p.city, p.district].filter(Boolean).join(" · ")}
                      </span>
                    </div>
                  </td>
                  <td className={`${td} whitespace-nowrap`}>
                    <span className="block">{humanize(p.category)}</span>
                    {p.subcategory ? (
                      <span className="mt-0.5 block text-[12px] text-sv-ink/45">
                        {humanize(p.subcategory)}
                      </span>
                    ) : null}
                  </td>
                  <td className={`${td} whitespace-nowrap`}>{p.phone}</td>
                  <td className={`${td} whitespace-nowrap tabular-nums`}>
                    {priceRange(p.priceRangeMin, p.priceRangeMax, p.currency)}
                  </td>
                  <td className={`${td} whitespace-nowrap`}>
                    <span className="block font-bold text-sv-ink tabular-nums">
                      ★ {p.rating.toFixed(1)}
                    </span>
                    <span className="mt-0.5 block text-[12px] text-sv-ink/45 tabular-nums">
                      {fmtNum(p.reviewCount)} reviews
                    </span>
                  </td>
                  <td className={td}>
                    {p.verified ? (
                      <Check className="h-4.5 w-4.5 text-emerald-600" aria-label="Verified" />
                    ) : (
                      <span className="text-sv-ink/30">—</span>
                    )}
                  </td>
                  <td className={td}>
                    <StatusPill status={live ? "active" : "suspended"} />
                  </td>
                  <td className={`${td} whitespace-nowrap text-sv-ink/55`}>
                    {fmtDate(p.createdAt)}
                  </td>
                  <td className={td}>
                    <div className="flex flex-wrap gap-1.5">
                      <ConfirmButton
                        action={toggleProviderVerified}
                        fields={{ id: p.id }}
                        label={p.verified ? "Unverify" : "Verify"}
                        tone={p.verified ? "ghost" : "primary"}
                      />
                      {p.isActive ? (
                        <ConfirmButton
                          action={toggleProviderActive}
                          fields={{ id: p.id }}
                          label="Deactivate"
                          tone="warning"
                          confirm={`Deactivate ${p.name}? It will be hidden from the directory.`}
                        />
                      ) : (
                        <ConfirmButton
                          action={toggleProviderActive}
                          fields={{ id: p.id }}
                          label="Activate"
                        />
                      )}
                      {!p.deletedAt ? (
                        <ConfirmButton
                          action={softDeleteProvider}
                          fields={{ id: p.id }}
                          label="Delete"
                          tone="danger"
                          confirm={`Delete ${p.name}? It will be removed from the directory.`}
                        />
                      ) : null}
                    </div>
                  </td>
                </TRow>
              )
            })}
          </tbody>
        </DataTable>
      )}

      <Pagination
        basePath="/admin/content/services"
        page={page}
        pageSize={ADMIN_PAGE_SIZE}
        total={total}
        params={sp}
      />
    </>
  )
}
