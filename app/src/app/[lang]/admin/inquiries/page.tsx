import type { Metadata } from "next"
import { Inbox } from "lucide-react"
import Link from "next/link"

import { DataTable, THeadRow, TRow, td, th } from "@/components/admin/ui/DataTable"
import { EmptyState } from "@/components/admin/ui/EmptyState"
import { PageHeader } from "@/components/admin/ui/PageHeader"
import { Pagination } from "@/components/admin/ui/Pagination"
import { SearchForm } from "@/components/admin/ui/SearchForm"
import { StatusPill } from "@/components/admin/ui/StatusPill"
import { TabLinks } from "@/components/admin/ui/TabLinks"
import { timeAgo } from "@/lib/admin/format"
import { requireAdmin } from "@/lib/admin/guard"
import {
  INQUIRY_STATUSES,
  INQUIRY_STATUS_LABELS,
  inquiryBucketLabel,
  isListingRef,
  listInquiries,
  shortRef,
} from "@/lib/admin/inquiries"
import {
  ADMIN_PAGE_SIZE,
  hrefWithParams,
  mergeParams,
  param,
  parsePage,
  type SearchParams,
} from "@/lib/admin/query"

export const metadata: Metadata = { title: "Inquiries" }

export default async function AdminInquiriesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  await requireAdmin()
  const sp = await searchParams
  const status = param(sp.status)
  const q = param(sp.q)
  const page = parsePage(sp.page)
  const { rows, total, counts, all } = await listInquiries(status, q, page)

  const tabs = [
    {
      href: hrefWithParams("/admin/inquiries", mergeParams(sp, { status: undefined, page: undefined })),
      label: "All",
      active: status === "",
      count: all,
    },
    ...INQUIRY_STATUSES.map((s) => ({
      href: hrefWithParams("/admin/inquiries", mergeParams(sp, { status: s, page: undefined })),
      label: INQUIRY_STATUS_LABELS[s],
      active: status === s,
      count: counts[s] ?? 0,
    })),
  ]

  return (
    <>
      <PageHeader
        title="Inquiries"
        description="Buyer leads submitted on listings and partner profiles"
      />
      <TabLinks items={tabs} />
      <div className="mb-4">
        <SearchForm
          action="/admin/inquiries"
          params={sp}
          placeholder="Search buyer or agent name / email…"
        />
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No inquiries found"
          hint={q ? `Nothing matches “${q}”. Try a different search or clear the status filter.` : "New buyer inquiries will appear here as they arrive."}
        />
      ) : (
        <DataTable>
          <THeadRow>
            <th className={th}>Buyer</th>
            <th className={th}>Listing</th>
            <th className={th}>Agent</th>
            <th className={th}>Deal</th>
            <th className={`${th} text-right`}>Score</th>
            <th className={th}>Status</th>
            <th className={th}>Age</th>
          </THeadRow>
          <tbody>
            {rows.map((inq) => (
              <TRow key={inq.id} href={`/admin/inquiries/${inq.id}`}>
                <td className={td}>
                  <Link href={`/admin/inquiries/${inq.id}`} className="block">
                    <p className="font-bold text-sv-ink">{inq.buyerName}</p>
                    <p className="text-[12px] text-sv-ink/45">{inq.buyerEmail ?? "—"}</p>
                  </Link>
                </td>
                <td className={td}>
                  {isListingRef(inq) ? (
                    <Link
                      href={`/admin/listings/${inq.listingId}`}
                      title={inq.listingId}
                      className="font-mono text-[12px] font-semibold text-sv-blue hover:underline"
                    >
                      {shortRef(inq.listingId)}
                    </Link>
                  ) : (
                    <span className="rounded-full bg-sv-orange/10 px-2.5 py-1 text-[12px] font-bold text-sv-orange">
                      {inquiryBucketLabel(inq.listingId)}
                    </span>
                  )}
                </td>
                <td className={td}>{inq.agentName}</td>
                <td className={td}>
                  <span className="rounded-full bg-sv-cloud px-2.5 py-1 text-[12px] font-bold text-sv-ink/60">
                    {inq.deal}
                  </span>
                </td>
                <td className={`${td} text-right tabular-nums`}>{inq.qualityScore}</td>
                <td className={td}>
                  <StatusPill status={inq.status} />
                </td>
                <td className={`${td} whitespace-nowrap text-sv-ink/50`}>
                  {timeAgo(inq.createdAt)}
                </td>
              </TRow>
            ))}
          </tbody>
        </DataTable>
      )}

      <Pagination
        basePath="/admin/inquiries"
        page={page}
        pageSize={ADMIN_PAGE_SIZE}
        total={total}
        params={sp}
      />
    </>
  )
}
