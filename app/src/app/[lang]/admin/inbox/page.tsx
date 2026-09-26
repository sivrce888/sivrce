import { Inbox, MessagesSquare } from "lucide-react"
import Link from "next/link"

import { assignLead, setLeadStage } from "./actions"
import { DataTable, THeadRow, TRow, td, th } from "@/components/admin/ui/DataTable"
import { EmptyState } from "@/components/admin/ui/EmptyState"
import { FilterSelect } from "@/components/admin/ui/FilterSelect"
import { PageHeader } from "@/components/admin/ui/PageHeader"
import { Pagination } from "@/components/admin/ui/Pagination"
import { SearchForm } from "@/components/admin/ui/SearchForm"
import { StatCard } from "@/components/admin/ui/StatCard"
import { TabLinks } from "@/components/admin/ui/TabLinks"
import type { Prisma } from "@/generated/prisma/client"
import { fmtNum, timeAgo } from "@/lib/admin/format"
import { listAssignees } from "@/lib/admin/crm"
import { requireAdmin } from "@/lib/admin/guard"
import { INQUIRY_STATUSES, INQUIRY_STATUS_LABELS } from "@/lib/admin/inquiries"
import { ADMIN_PAGE_SIZE, param, parsePage, type SearchParams } from "@/lib/admin/query"
import { db } from "@/lib/db"
import { OPEN_INQUIRY_STATUSES } from "@/lib/pro-leads"

export const metadata = { title: "Inbox" }

const STAGE_OPTIONS = [
  { value: "", label: "All stages" },
  ...INQUIRY_STATUSES.map((s) => ({ value: s, label: INQUIRY_STATUS_LABELS[s] })),
]

export default async function AdminInboxPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  await requireAdmin()
  const sp = await searchParams
  const page = parsePage(sp.page)
  const tab = param(sp.tab) === "rooms" ? "rooms" : "leads"
  const stage = param(sp.stage)
  const q = param(sp.q)
  const owner = param(sp.owner)

  const where: Prisma.InquiryWhereInput = { deletedAt: null }
  if (INQUIRY_STATUSES.includes(stage as (typeof INQUIRY_STATUSES)[number])) {
    where.status = stage
  }
  if (owner) where.assignedToId = owner === "none" ? null : owner
  if (q) {
    where.OR = [
      { buyerName: { contains: q, mode: "insensitive" } },
      { buyerEmail: { contains: q, mode: "insensitive" } },
      { agentName: { contains: q, mode: "insensitive" } },
    ]
  }

  const dayAgo = new Date(new Date().getTime() - 86_400_000)
  const today = new Date(new Date().toDateString())

  const [rows, total, openLeads, roomRows, roomTotal, assignees] = await Promise.all([
    db.inquiry.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: ADMIN_PAGE_SIZE,
      skip: (page - 1) * ADMIN_PAGE_SIZE,
    }),
    db.inquiry.count({ where }),
    // Open pipeline only — the SLA stats live on alive leads, not dead ones.
    db.inquiry.findMany({
      where: { deletedAt: null, status: { in: [...OPEN_INQUIRY_STATUSES] } },
      select: { status: true, assignedToId: true, meta: true, createdAt: true },
      take: 500,
    }),
    db.chatRoom.findMany({
      where: { status: "active" },
      orderBy: { updatedAt: "desc" },
      take: ADMIN_PAGE_SIZE,
      include: {
        listing: { select: { title: true } },
        participants: { select: { role: true } },
        _count: { select: { messages: true } },
      },
    }),
    db.chatRoom.count({ where: { status: "active" } }),
    listAssignees(),
  ])

  const newToday = openLeads.filter((l) => l.createdAt >= today).length
  const unassigned = openLeads.filter((l) => !l.assignedToId).length
  const unanswered = openLeads.filter(
    (l) =>
      !(l.meta as { firstResponseAt?: string } | null)?.firstResponseAt &&
      l.createdAt < dayAgo,
  ).length

  const listingIds = [...new Set(rows.map((r) => r.listingId))]
  const listings = await db.listing.findMany({
    where: { id: { in: listingIds } },
    select: { id: true, title: true },
  })
  const listingTitles = new Map(listings.map((l) => [l.id, l.title]))

  return (
    <div>
      <PageHeader
        title="Inbox"
        description={`${fmtNum(total)} leads · ${fmtNum(roomTotal)} active conversations — one pipeline for the Sivrce team`}
      />

      {tab === "leads" ? (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Open leads" value={fmtNum(openLeads.length)} hint="Alive pipeline stages" icon={Inbox} tone="blue" />
            <StatCard label="New today" value={fmtNum(newToday)} hint="Arrived since midnight" icon={Inbox} tone="ink" />
            <StatCard label="Unassigned" value={fmtNum(unassigned)} hint="Open leads with no owner" icon={Inbox} tone="ink" />
            <StatCard label="No reply > 24h" value={fmtNum(unanswered)} hint="Open leads without a first response" icon={Inbox} tone="ink" />
          </div>

          <TabLinks
            items={[
              { href: "/admin/inbox", label: "Leads", active: true, count: total },
              { href: "/admin/inbox?tab=rooms", label: "Conversations", active: false, count: roomTotal },
            ]}
          />

          <div className="mb-4 flex flex-wrap items-end gap-x-6 gap-y-3">
            <SearchForm action="/admin/inbox" params={sp} placeholder="Search buyer, email, agent…" />
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <FilterSelect name="stage" label="Stage" options={STAGE_OPTIONS} value={stage} />
              <FilterSelect
                name="owner"
                label="Assigned"
                options={[
                  { value: "none", label: "Unassigned" },
                  ...assignees.map((a) => ({ value: a.id, label: a.label })),
                ]}
                value={owner}
              />
            </div>
          </div>

          {rows.length === 0 ? (
            <EmptyState icon={Inbox} title="No leads found" hint="Chat and form leads land here with their full conversation context." />
          ) : (
            <>
              <DataTable>
                <THeadRow>
                  <th className={th}>Lead</th>
                  <th className={th}>Listing</th>
                  <th className={th}>Stage</th>
                  <th className={th}>Source</th>
                  <th className={th}>Assigned</th>
                  <th className={th}>Updated</th>
                  <th className={th}>Thread</th>
                </THeadRow>
                <tbody>
                  {rows.map((l) => (
                    <TRow key={l.id}>
                      <td className={td}>
                        <div className="max-w-[220px]">
                          <span className="block truncate font-bold text-sv-ink">{l.buyerName}</span>
                          <span className="block truncate text-[12px] text-sv-ink/60">{l.buyerEmail}</span>
                        </div>
                      </td>
                      <td className={td}>
                        <div className="max-w-[220px]">
                          {listingTitles.has(l.listingId) ? (
                            <Link
                              href={`/admin/listings/${l.listingId}`}
                              className="block truncate text-[12.5px] font-semibold text-sv-ink transition-colors hover:text-sv-blue"
                            >
                              {listingTitles.get(l.listingId)}
                            </Link>
                          ) : (
                            <span className="block truncate text-[12.5px] text-sv-ink/60">{l.agentName}</span>
                          )}
                          <span className="text-[11.5px] font-bold text-sv-ink/50 uppercase">{l.deal}</span>
                        </div>
                      </td>
                      <td className={td}>
                        <form action={setLeadStage} className="flex items-center gap-1.5">
                          <input type="hidden" name="id" value={l.id} />
                          <select
                            name="status"
                            defaultValue={l.status}
                            aria-label="Lead stage"
                            className="rounded-control border border-sv-ink/10 bg-sv-surface px-2 py-1 text-[12px] font-bold text-sv-ink"
                          >
                            {INQUIRY_STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {INQUIRY_STATUS_LABELS[s]}
                              </option>
                            ))}
                          </select>
                          <button type="submit" className="text-[12px] font-bold text-sv-blue hover:underline">
                            Set
                          </button>
                        </form>
                      </td>
                      <td className={td}>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-black ${
                            l.source === "chat" ? "bg-sv-blue/10 text-sv-blue" : "bg-sv-ink/6 text-sv-ink/60"
                          }`}
                        >
                          {l.source === "chat" ? "chat" : "form"}
                        </span>
                      </td>
                      <td className={td}>
                        <form action={assignLead} className="flex items-center gap-1.5">
                          <input type="hidden" name="id" value={l.id} />
                          <select
                            name="assignedTo"
                            defaultValue={l.assignedToId ?? ""}
                            aria-label="Assigned to"
                            className="max-w-[130px] rounded-control border border-sv-ink/10 bg-sv-surface px-2 py-1 text-[12px] font-bold text-sv-ink"
                          >
                            <option value="">—</option>
                            {assignees.map((a) => (
                              <option key={a.id} value={a.id}>
                                {a.label}
                              </option>
                            ))}
                          </select>
                          <button type="submit" className="text-[12px] font-bold text-sv-blue hover:underline">
                            Set
                          </button>
                        </form>
                      </td>
                      <td className={`${td} whitespace-nowrap text-sv-ink/60`}>{timeAgo(l.updatedAt)}</td>
                      <td className={td}>
                        {l.roomId ? (
                          <Link
                            href={`/admin/inbox/${l.roomId}`}
                            className="text-[12.5px] font-bold text-sv-blue hover:underline"
                          >
                            Open thread
                          </Link>
                        ) : (
                          <Link href={`/admin/inquiries/${l.id}`} className="text-[12.5px] font-bold text-sv-ink/60 hover:text-sv-blue">
                            Detail
                          </Link>
                        )}
                      </td>
                    </TRow>
                  ))}
                </tbody>
              </DataTable>
              <Pagination basePath="/admin/inbox" page={page} pageSize={ADMIN_PAGE_SIZE} total={total} params={sp} />
            </>
          )}
        </>
      ) : (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Active rooms" value={fmtNum(roomTotal)} hint="Conversations currently open" icon={MessagesSquare} tone="blue" />
          </div>

          <TabLinks
            items={[
              { href: "/admin/inbox", label: "Leads", active: false },
              { href: "/admin/inbox?tab=rooms", label: "Conversations", active: true, count: roomTotal },
            ]}
          />

          {roomRows.length === 0 ? (
            <EmptyState icon={MessagesSquare} title="No conversations" hint="Buyer ↔ seller and support threads appear here." />
          ) : (
            <DataTable>
              <THeadRow>
                <th className={th}>Room</th>
                <th className={th}>Type</th>
                <th className={`${th} text-right`}>Messages</th>
                <th className={th}>Last activity</th>
                <th className={th}>Thread</th>
              </THeadRow>
              <tbody>
                {roomRows.map((r) => {
                  const isSupport = r.participants.some((p) => p.role === "support")
                  const kind = r.listingId ? "listing" : r.projectSlug ? "project" : isSupport ? "support" : "direct"
                  return (
                    <TRow key={r.id}>
                      <td className={td}>
                        <span className="block max-w-[260px] truncate font-bold text-sv-ink">{r.title}</span>
                      </td>
                      <td className={td}>
                        <span className="rounded-full bg-sv-ink/6 px-2 py-0.5 text-[11px] font-black text-sv-ink/60">{kind}</span>
                      </td>
                      <td className={`${td} text-right tabular-nums`}>{fmtNum(r._count.messages)}</td>
                      <td className={`${td} whitespace-nowrap text-sv-ink/60`}>{timeAgo(r.updatedAt)}</td>
                      <td className={td}>
                        <Link href={`/admin/inbox/${r.id}`} className="text-[12.5px] font-bold text-sv-blue hover:underline">
                          Open thread
                        </Link>
                      </td>
                    </TRow>
                  )
                })}
              </tbody>
            </DataTable>
          )}
        </>
      )}
    </div>
  )
}
