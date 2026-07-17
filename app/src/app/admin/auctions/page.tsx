import { Gavel } from "lucide-react"
import Link from "next/link"

import { DataTable, THeadRow, TRow, td, th } from "@/components/admin/ui/DataTable"
import { EmptyState } from "@/components/admin/ui/EmptyState"
import { PageHeader } from "@/components/admin/ui/PageHeader"
import { Pagination } from "@/components/admin/ui/Pagination"
import { StatusPill } from "@/components/admin/ui/StatusPill"
import { TabLinks } from "@/components/admin/ui/TabLinks"
import { AUCTION_STATUS_TABS, listAuctions } from "@/lib/admin/auctions"
import { fmtDateTime, fmtNum, fmtTetri } from "@/lib/admin/format"
import {
  ADMIN_PAGE_SIZE,
  hrefWithParams,
  mergeParams,
  param,
  parsePage,
  type SearchParams,
} from "@/lib/admin/query"

export default async function AdminAuctionsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  const status = param(sp.status)
  const page = parsePage(sp.page)
  const { rows, total, counts, all } = await listAuctions(status, page)

  const tabs = AUCTION_STATUS_TABS.map((t) => ({
    href: hrefWithParams(
      "/admin/auctions",
      mergeParams(sp, { status: t.value || undefined, page: undefined }),
    ),
    label: t.label,
    active: status === t.value,
    count: t.value === "" ? all : (counts[t.value] ?? 0),
  }))

  return (
    <div>
      <PageHeader
        title="Auctions"
        description="Monitor live and scheduled auctions, bids and deposits"
      />
      <TabLinks items={tabs} />
      {rows.length === 0 ? (
        <EmptyState
          icon={Gavel}
          title="No auctions found"
          hint="Auctions will appear here once organizers create them."
        />
      ) : (
        <>
          <DataTable>
            <THeadRow>
              <th className={th}>Code</th>
              <th className={th}>Listing</th>
              <th className={`${th} text-right`}>Current price</th>
              <th className={`${th} text-right`}>Bids</th>
              <th className={`${th} text-right`}>Bidders</th>
              <th className={th}>Ends</th>
              <th className={th}>Status</th>
            </THeadRow>
            <tbody>
              {rows.map((a) => (
                <TRow key={a.id} href={`/admin/auctions/${a.id}`}>
                  <td className={td}>
                    <Link
                      href={`/admin/auctions/${a.id}`}
                      className="font-bold text-sv-blue hover:underline"
                    >
                      {a.shortPublicCode}
                    </Link>
                  </td>
                  <td className={`${td} max-w-[280px] truncate`}>{a.listing.title}</td>
                  <td className={`${td} text-right tabular-nums`}>
                    {fmtTetri(a.currentPriceTetri, a.currency)}
                  </td>
                  <td className={`${td} text-right tabular-nums`}>{fmtNum(a.totalBids)}</td>
                  <td className={`${td} text-right tabular-nums`}>{fmtNum(a.uniqueBidders)}</td>
                  <td className={`${td} whitespace-nowrap`}>{fmtDateTime(a.endsAt)}</td>
                  <td className={td}>
                    <StatusPill status={a.status} />
                  </td>
                </TRow>
              ))}
            </tbody>
          </DataTable>
          <Pagination
            basePath="/admin/auctions"
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
