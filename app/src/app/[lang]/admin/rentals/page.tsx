import { BedDouble } from "lucide-react"
import Link from "next/link"

import { setDailyBookingStatus } from "@/app/[lang]/admin/rentals/actions"
import { ConfirmButton } from "@/components/admin/ui/ConfirmButton"
import { DataTable, THeadRow, TRow, td, th } from "@/components/admin/ui/DataTable"
import { EmptyState } from "@/components/admin/ui/EmptyState"
import { PageHeader } from "@/components/admin/ui/PageHeader"
import { Pagination } from "@/components/admin/ui/Pagination"
import { SearchForm } from "@/components/admin/ui/SearchForm"
import { StatusPill } from "@/components/admin/ui/StatusPill"
import { TabLinks } from "@/components/admin/ui/TabLinks"
import type { Prisma } from "@/generated/prisma/client"
import { BookingStatus } from "@/generated/prisma/enums"
import { fmtDate, fmtNum, fmtTetri, timeAgo } from "@/lib/admin/format"
import { requireAdmin } from "@/lib/admin/guard"
import {
  ADMIN_PAGE_SIZE,
  hrefWithParams,
  mergeParams,
  param,
  parsePage,
  type SearchParams,
} from "@/lib/admin/query"
import { db } from "@/lib/db"

export const metadata = { title: "Daily rentals" }

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: BookingStatus.pending, label: "Pending" },
  { value: BookingStatus.confirmed, label: "Confirmed" },
  { value: BookingStatus.completed, label: "Completed" },
  { value: BookingStatus.cancelled_by_guest, label: "Guest cancelled" },
  { value: BookingStatus.cancelled_by_host, label: "Host cancelled" },
  { value: BookingStatus.no_show, label: "No-show" },
] as const

const BOOKING_STATUSES = Object.values(BookingStatus) as string[]

export default async function AdminRentalsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  await requireAdmin()
  const sp = await searchParams
  const page = parsePage(sp.page)
  const status = param(sp.status)
  const q = param(sp.q)

  const where: Prisma.DailyRentalBookingWhereInput = {}
  if (BOOKING_STATUSES.includes(status)) where.status = status as BookingStatus
  if (q) {
    where.OR = [
      { guestName: { contains: q, mode: "insensitive" } },
      { guestPhone: { contains: q, mode: "insensitive" } },
    ]
  }

  const [grouped, rows, total] = await Promise.all([
    db.dailyRentalBooking.groupBy({ by: ["status"], _count: { _all: true } }),
    db.dailyRentalBooking.findMany({
      where,
      include: { listing: { select: { id: true, title: true } } },
      orderBy: [{ checkIn: "desc" }, { createdAt: "desc" }],
      take: ADMIN_PAGE_SIZE,
      skip: (page - 1) * ADMIN_PAGE_SIZE,
    }),
    db.dailyRentalBooking.count({ where }),
  ])

  const countOf = (s: string) => grouped.find((g) => g.status === s)?._count._all ?? 0
  const grandTotal = grouped.reduce((acc, g) => acc + g._count._all, 0)

  const tabs = STATUS_TABS.map((t) => ({
    href: hrefWithParams(
      "/admin/rentals",
      mergeParams(sp, { status: t.value || undefined, page: undefined }),
    ),
    label: t.label,
    active: status === t.value,
    count: t.value ? countOf(t.value) : grandTotal,
  }))

  return (
    <div>
      <PageHeader
        title="Daily rentals"
        description={`${fmtNum(total)} bookings · confirm or cancel stays`}
      />

      <TabLinks items={tabs} />

      <div className="mb-4 flex flex-wrap items-end gap-x-6 gap-y-3">
        <SearchForm
          action="/admin/rentals"
          params={sp}
          placeholder="Search guest name or phone…"
        />
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={BedDouble}
          title="No bookings found"
          hint="Daily-rental bookings made by guests will appear here."
        />
      ) : (
        <>
          <DataTable>
            <THeadRow>
              <th className={th}>Guest</th>
              <th className={th}>Listing</th>
              <th className={th}>Stay</th>
              <th className={`${th} text-right`}>Guests</th>
              <th className={`${th} text-right`}>Total</th>
              <th className={th}>Status</th>
              <th className={th}>Booked</th>
              <th className={th}>Actions</th>
            </THeadRow>
            <tbody>
              {rows.map((b) => (
                <TRow key={b.id}>
                  <td className={`${td} whitespace-nowrap`}>
                    <span className="block font-bold text-sv-ink">{b.guestName}</span>
                    <span className="mt-0.5 block text-[12px] text-sv-ink/45">{b.guestPhone}</span>
                  </td>
                  <td className={`${td} max-w-[220px]`}>
                    <Link
                      href={`/admin/listings/${b.listing.id}`}
                      className="block truncate font-semibold text-sv-ink transition-colors hover:text-sv-blue"
                    >
                      {b.listing.title}
                    </Link>
                  </td>
                  <td className={`${td} whitespace-nowrap`}>
                    <span className="block">
                      {fmtDate(b.checkIn)} → {fmtDate(b.checkOut)}
                    </span>
                    <span className="mt-0.5 block text-[12px] text-sv-ink/45">
                      {fmtNum(b.nights)} night{b.nights === 1 ? "" : "s"}
                    </span>
                  </td>
                  <td className={`${td} text-right tabular-nums`}>{fmtNum(b.guestCount)}</td>
                  <td className={`${td} text-right whitespace-nowrap`}>
                    <span className="block font-bold text-sv-ink tabular-nums">
                      {fmtTetri(b.totalTetri, b.currency)}
                    </span>
                    <span className="mt-0.5 block text-[12px] text-sv-ink/45">
                      {b.paidAt ? "Paid" : "Unpaid"}
                    </span>
                  </td>
                  <td className={td}>
                    <StatusPill status={b.status} />
                  </td>
                  <td className={`${td} whitespace-nowrap text-sv-ink/55`}>
                    {timeAgo(b.createdAt)}
                  </td>
                  <td className={td}>
                    {b.status === "pending" || b.status === "confirmed" ? (
                      <div className="flex flex-wrap gap-1.5">
                        {b.status === "pending" ? (
                          <ConfirmButton
                            action={setDailyBookingStatus}
                            fields={{ id: b.id, status: "confirmed" }}
                            label="Confirm"
                            tone="primary"
                          />
                        ) : null}
                        <ConfirmButton
                          action={setDailyBookingStatus}
                          fields={{ id: b.id, status: "cancelled_by_host" }}
                          label="Cancel"
                          tone="danger"
                          confirm="Cancel this booking? It will be recorded as cancelled by host."
                        />
                      </div>
                    ) : (
                      <span className="text-[12px] text-sv-ink/30">—</span>
                    )}
                  </td>
                </TRow>
              ))}
            </tbody>
          </DataTable>
          <Pagination
            basePath="/admin/rentals"
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
