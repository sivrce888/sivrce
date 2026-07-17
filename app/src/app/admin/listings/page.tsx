import { Building2, Check } from "lucide-react"
import Link from "next/link"

import { DataTable, THeadRow, TRow, td, th } from "@/components/admin/ui/DataTable"
import { EmptyState } from "@/components/admin/ui/EmptyState"
import { FilterSelect } from "@/components/admin/ui/FilterSelect"
import { PageHeader } from "@/components/admin/ui/PageHeader"
import { Pagination } from "@/components/admin/ui/Pagination"
import { SearchForm } from "@/components/admin/ui/SearchForm"
import { StatusPill } from "@/components/admin/ui/StatusPill"
import { fmtDate, fmtMoney, fmtNum } from "@/lib/admin/format"
import {
  DEAL_TYPE_OPTIONS,
  PROPERTY_TYPE_OPTIONS,
  STATUS_OPTIONS,
  TIER_OPTIONS,
  VERIFIED_OPTIONS,
  listingListWhere,
  optionLabel,
} from "@/lib/admin/listings"
import { ADMIN_PAGE_SIZE, param, parsePage, type SearchParams } from "@/lib/admin/query"
import { db } from "@/lib/db"

export const metadata = { title: "Listings" }

const TIER_CLS: Record<string, string> = {
  standard: "bg-sv-ink/6 text-sv-ink/60",
  vip: "bg-sv-blue/10 text-sv-blue",
  super_vip: "bg-violet-50 text-violet-700",
  diamond: "bg-amber-50 text-amber-700",
}

function TierBadge({ tier }: { tier: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[12px] font-bold whitespace-nowrap ${TIER_CLS[tier] ?? TIER_CLS.standard}`}
    >
      {optionLabel(TIER_OPTIONS, tier)}
    </span>
  )
}

export default async function AdminListingsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  const page = parsePage(sp.page)
  const where = listingListWhere(sp)
  const [rows, total] = await Promise.all([
    db.listing.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: ADMIN_PAGE_SIZE,
      skip: (page - 1) * ADMIN_PAGE_SIZE,
    }),
    db.listing.count({ where }),
  ])

  return (
    <>
      <PageHeader
        title="Listings"
        description={`${fmtNum(total)} listings · soft-deleted rows are hidden`}
      />

      <div className="mb-4 flex flex-wrap items-end gap-x-6 gap-y-3">
        <SearchForm
          action="/admin/listings"
          params={sp}
          placeholder="Search title, slug or ID…"
        />
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <FilterSelect name="dealType" label="Deal" options={DEAL_TYPE_OPTIONS} value={param(sp.dealType)} />
          <FilterSelect name="propertyType" label="Type" options={PROPERTY_TYPE_OPTIONS} value={param(sp.propertyType)} />
          <FilterSelect name="status" label="Status" options={STATUS_OPTIONS} value={param(sp.status)} />
          <FilterSelect name="tier" label="Tier" options={TIER_OPTIONS} value={param(sp.tier)} />
          <FilterSelect name="verified" label="Verified" options={VERIFIED_OPTIONS} value={param(sp.verified)} />
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No listings found"
          hint="Try clearing the search query or one of the active filters."
        />
      ) : (
        <DataTable>
          <THeadRow>
            <th className={th}>Listing</th>
            <th className={th}>Deal / Type</th>
            <th className={`${th} text-right`}>Price</th>
            <th className={th}>Tier</th>
            <th className={`${th} text-right`}>Trust</th>
            <th className={th}>Status</th>
            <th className={th}>Verified</th>
            <th className={`${th} text-right`}>Views</th>
            <th className={th}>Created</th>
          </THeadRow>
          <tbody>
            {rows.map((l) => (
              <TRow key={l.id} href={`/admin/listings/${l.id}`}>
                <td className={td}>
                  <Link href={`/admin/listings/${l.id}`} className="block max-w-[300px]">
                    <span className="block truncate font-bold text-sv-ink transition-colors hover:text-sv-blue">
                      {l.title}
                    </span>
                    <span className="mt-0.5 block text-[12px] text-sv-ink/45">
                      {l.city} · {l.district}
                    </span>
                  </Link>
                </td>
                <td className={`${td} whitespace-nowrap`}>
                  {optionLabel(DEAL_TYPE_OPTIONS, l.dealType)} ·{" "}
                  {optionLabel(PROPERTY_TYPE_OPTIONS, l.propertyType)}
                </td>
                <td className={`${td} text-right font-bold whitespace-nowrap tabular-nums`}>
                  {fmtMoney(l.price, l.currency)}
                </td>
                <td className={td}>
                  <TierBadge tier={l.tier} />
                </td>
                <td className={`${td} text-right tabular-nums`}>{fmtNum(l.trustScore)}</td>
                <td className={td}>
                  <StatusPill status={l.status} />
                </td>
                <td className={td}>
                  {l.verified ? (
                    <Check className="h-4.5 w-4.5 text-emerald-600" aria-label="Verified" />
                  ) : (
                    <span className="text-sv-ink/30">—</span>
                  )}
                </td>
                <td className={`${td} text-right tabular-nums`}>{fmtNum(l.views)}</td>
                <td className={`${td} whitespace-nowrap text-sv-ink/55`}>{fmtDate(l.createdAt)}</td>
              </TRow>
            ))}
          </tbody>
        </DataTable>
      )}

      <Pagination
        basePath="/admin/listings"
        page={page}
        pageSize={ADMIN_PAGE_SIZE}
        total={total}
        params={sp}
      />
    </>
  )
}
