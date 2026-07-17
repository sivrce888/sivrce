import { CalendarCheck, CalendarClock, CalendarDays, CheckCircle2 } from "lucide-react"
import Link from "next/link"

import { setTourStatus } from "@/app/admin/tours/actions"
import { ConfirmButton } from "@/components/admin/ui/ConfirmButton"
import { DataTable, THeadRow, TRow, td, th } from "@/components/admin/ui/DataTable"
import { EmptyState } from "@/components/admin/ui/EmptyState"
import { FilterSelect } from "@/components/admin/ui/FilterSelect"
import { PageHeader } from "@/components/admin/ui/PageHeader"
import { Pagination } from "@/components/admin/ui/Pagination"
import { SearchForm } from "@/components/admin/ui/SearchForm"
import { StatCard } from "@/components/admin/ui/StatCard"
import { StatusPill } from "@/components/admin/ui/StatusPill"
import type { Prisma } from "@/generated/prisma/client"
import { TourStatus } from "@/generated/prisma/enums"
import { fmtDate, fmtNum, timeAgo } from "@/lib/admin/format"
import { ADMIN_PAGE_SIZE, param, parsePage, type SearchParams } from "@/lib/admin/query"
import { db } from "@/lib/db"

export const metadata = { title: "Tours" }

const TOUR_STATUSES = Object.values(TourStatus) as string[]
const TOUR_STATUS_OPTIONS = Object.values(TourStatus).map((v) => ({
  value: v,
  label: v.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()),
}))

export default async function AdminToursPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  const page = parsePage(sp.page)
  const status = param(sp.status)
  const q = param(sp.q)

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrow = new Date(today.getTime() + 86_400_000)
  const last30Days = new Date(today.getTime() - 30 * 86_400_000)

  const where: Prisma.PropertyTourWhereInput = {}
  if (TOUR_STATUSES.includes(status)) where.status = status as TourStatus
  if (q) {
    where.OR = [
      { guestName: { contains: q, mode: "insensitive" } },
      { guestPhone: { contains: q, mode: "insensitive" } },
    ]
  }

  const [pendingCount, todayCount, upcomingCount, completedCount, rows, total] =
    await Promise.all([
      db.propertyTour.count({ where: { status: TourStatus.pending } }),
      db.propertyTour.count({ where: { tourDate: { gte: today, lt: tomorrow } } }),
      db.propertyTour.count({ where: { status: TourStatus.confirmed, tourDate: { gte: today } } }),
      db.propertyTour.count({
        where: { status: TourStatus.completed, tourDate: { gte: last30Days } },
      }),
      db.propertyTour.findMany({
        where,
        include: {
          listing: { select: { id: true, title: true } },
          agent: { select: { name: true } },
        },
        orderBy: [{ tourDate: "desc" }, { createdAt: "desc" }],
        take: ADMIN_PAGE_SIZE,
        skip: (page - 1) * ADMIN_PAGE_SIZE,
      }),
      db.propertyTour.count({ where }),
    ])

  return (
    <div>
      <PageHeader
        title="Property tours"
        description={`${fmtNum(total)} tour requests · confirm, complete or cancel bookings`}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Pending requests"
          value={fmtNum(pendingCount)}
          hint="Awaiting confirmation"
          icon={CalendarClock}
          tone={pendingCount > 0 ? "orange" : "ink"}
        />
        <StatCard
          label="Tours today"
          value={fmtNum(todayCount)}
          hint="Scheduled for today, any status"
          icon={CalendarDays}
          tone="blue"
        />
        <StatCard
          label="Upcoming confirmed"
          value={fmtNum(upcomingCount)}
          hint="Confirmed tours from today"
          icon={CalendarCheck}
          tone="ink"
        />
        <StatCard
          label="Completed · last 30 days"
          value={fmtNum(completedCount)}
          hint="Tours marked completed"
          icon={CheckCircle2}
          tone="success"
        />
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-x-6 gap-y-3">
        <SearchForm
          action="/admin/tours"
          params={sp}
          placeholder="Search guest name or phone…"
        />
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <FilterSelect name="status" label="Status" options={TOUR_STATUS_OPTIONS} value={status} />
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No tours found"
          hint="Tour requests booked by guests will appear here."
        />
      ) : (
        <>
          <DataTable>
            <THeadRow>
              <th className={th}>Guest</th>
              <th className={th}>Listing</th>
              <th className={th}>Agent</th>
              <th className={th}>Date</th>
              <th className={th}>Status</th>
              <th className={th}>Booked</th>
              <th className={th}>Actions</th>
            </THeadRow>
            <tbody>
              {rows.map((t) => (
                <TRow key={t.id}>
                  <td className={`${td} whitespace-nowrap`}>
                    <span className="block font-bold text-sv-ink">{t.guestName}</span>
                    <span className="mt-0.5 block text-[12px] text-sv-ink/45">{t.guestPhone}</span>
                  </td>
                  <td className={`${td} max-w-[240px]`}>
                    <Link
                      href={`/admin/listings/${t.listing.id}`}
                      className="block truncate font-semibold text-sv-ink transition-colors hover:text-sv-blue"
                    >
                      {t.listing.title}
                    </Link>
                  </td>
                  <td className={`${td} whitespace-nowrap`}>{t.agent.name}</td>
                  <td className={`${td} whitespace-nowrap`}>
                    <span className="block">{fmtDate(t.tourDate)}</span>
                    <span className="mt-0.5 block text-[12px] text-sv-ink/45">{t.tourTime}</span>
                  </td>
                  <td className={td}>
                    <StatusPill status={t.status} />
                  </td>
                  <td className={`${td} whitespace-nowrap text-sv-ink/55`}>
                    {timeAgo(t.createdAt)}
                  </td>
                  <td className={td}>
                    {t.status === "pending" || t.status === "confirmed" ? (
                      <div className="flex flex-wrap gap-1.5">
                        {t.status === "pending" ? (
                          <ConfirmButton
                            action={setTourStatus}
                            fields={{ id: t.id, status: "confirmed" }}
                            label="Confirm"
                            tone="primary"
                          />
                        ) : (
                          <>
                            <ConfirmButton
                              action={setTourStatus}
                              fields={{ id: t.id, status: "completed" }}
                              label="Complete"
                              tone="primary"
                            />
                            <ConfirmButton
                              action={setTourStatus}
                              fields={{ id: t.id, status: "no_show" }}
                              label="No-show"
                              tone="warning"
                              confirm="Mark this tour as no-show?"
                            />
                          </>
                        )}
                        <ConfirmButton
                          action={setTourStatus}
                          fields={{ id: t.id, status: "cancelled_by_agent" }}
                          label="Cancel"
                          tone="danger"
                          confirm="Cancel this tour?"
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
            basePath="/admin/tours"
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
