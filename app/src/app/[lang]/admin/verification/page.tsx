import { BadgeCheck, FileCheck, ShieldCheck, XCircle } from "lucide-react"

import {
  approveVerificationRequest,
  rejectVerificationRequest,
} from "@/app/[lang]/admin/verification/actions"
import { ConfirmButton } from "@/components/admin/ui/ConfirmButton"
import { DataTable, THeadRow, TRow, td, th } from "@/components/admin/ui/DataTable"
import { EmptyState } from "@/components/admin/ui/EmptyState"
import { FilterSelect } from "@/components/admin/ui/FilterSelect"
import { PageHeader } from "@/components/admin/ui/PageHeader"
import { Pagination } from "@/components/admin/ui/Pagination"
import { SearchForm } from "@/components/admin/ui/SearchForm"
import { StatCard } from "@/components/admin/ui/StatCard"
import { StatusPill } from "@/components/admin/ui/StatusPill"
import { RejectVerificationButton } from "@/components/admin/verification/RejectVerificationButton"
import type { Prisma } from "@/generated/prisma/client"
import { fmtDate, fmtNum, timeAgo } from "@/lib/admin/format"
import { requireAdmin } from "@/lib/admin/guard"
import { shortRef } from "@/lib/admin/moderation"
import { ADMIN_PAGE_SIZE, param, parsePage, type SearchParams } from "@/lib/admin/query"
import { db } from "@/lib/db"

export const metadata = { title: "Verification" }

// Kept here, not in actions.ts — "use server" files may only export async functions.
const VERIFICATION_SUBJECTS = ["agent", "agency", "developer"] as const
const VERIFICATION_STATUSES = ["pending", "approved", "rejected"] as const

const STATUS_OPTIONS = VERIFICATION_STATUSES.map((v) => ({
  value: v,
  label: v.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()),
}))

const SUBJECT_OPTIONS = VERIFICATION_SUBJECTS.map((v) => ({
  value: v,
  label: v.replace(/\b\w/g, (c) => c.toUpperCase()),
}))

export default async function AdminVerificationPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  await requireAdmin()
  const sp = await searchParams
  const page = parsePage(sp.page)
  const status = param(sp.status)
  const type = param(sp.type)
  const q = param(sp.q)

  const now = new Date()
  const last30Days = new Date(now.getTime() - 30 * 86_400_000)

  const where: Prisma.VerificationRequestWhereInput = { deletedAt: null }
  if ((VERIFICATION_STATUSES as readonly string[]).includes(status)) where.status = status
  if ((VERIFICATION_SUBJECTS as readonly string[]).includes(type)) where.subjectType = type
  if (q) {
    where.OR = [
      { subjectId: { contains: q, mode: "insensitive" } },
      { businessNumber: { contains: q, mode: "insensitive" } },
      { providerReference: { contains: q, mode: "insensitive" } },
    ]
  }

  const [pendingCount, approved30, rejected30, rows, total] = await Promise.all([
    db.verificationRequest.count({ where: { deletedAt: null, status: "pending" } }),
    db.verificationRequest.count({
      where: { deletedAt: null, status: "approved", reviewedAt: { gte: last30Days } },
    }),
    db.verificationRequest.count({
      where: { deletedAt: null, status: "rejected", reviewedAt: { gte: last30Days } },
    }),
    db.verificationRequest.findMany({
      where,
      // Unreviewed requests first, then oldest decisions — the queue stays on top.
      orderBy: [{ reviewedAt: { sort: "asc", nulls: "first" } }, { createdAt: "desc" }],
      take: ADMIN_PAGE_SIZE,
      skip: (page - 1) * ADMIN_PAGE_SIZE,
    }),
    db.verificationRequest.count({ where }),
  ])

  // Subject names live on the profile tables; resolve the page's rows in batch.
  const idsOf = (t: string) => [
    ...new Set(rows.filter((r) => r.subjectType === t).map((r) => r.subjectId)),
  ]
  const [agents, agencies, developers] = await Promise.all([
    db.agentProfile.findMany({ where: { id: { in: idsOf("agent") } }, select: { id: true, name: true } }),
    db.agencyProfile.findMany({ where: { id: { in: idsOf("agency") } }, select: { id: true, name: true } }),
    db.developerProfile.findMany({ where: { id: { in: idsOf("developer") } }, select: { id: true, name: true } }),
  ])
  const subjectNames = new Map<string, string>()
  for (const p of agents) subjectNames.set(`agent:${p.id}`, p.name)
  for (const p of agencies) subjectNames.set(`agency:${p.id}`, p.name)
  for (const p of developers) subjectNames.set(`developer:${p.id}`, p.name)

  return (
    <div>
      <PageHeader
        title="Verification"
        description={`${fmtNum(total)} verification requests · approve to flag the profile as verified`}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Pending review"
          value={fmtNum(pendingCount)}
          hint="Awaiting an admin decision"
          icon={ShieldCheck}
          tone={pendingCount > 0 ? "orange" : "ink"}
        />
        <StatCard
          label="Approved · last 30 days"
          value={fmtNum(approved30)}
          hint="Profiles flagged verified"
          icon={BadgeCheck}
          tone="success"
        />
        <StatCard
          label="Rejected · last 30 days"
          value={fmtNum(rejected30)}
          hint="Requests turned down"
          icon={XCircle}
          tone={rejected30 > 0 ? "danger" : "ink"}
        />
        <StatCard
          label="Total requests"
          value={fmtNum(total)}
          hint="Matching current filters"
          icon={FileCheck}
          tone="blue"
        />
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-x-6 gap-y-3">
        <SearchForm
          action="/admin/verification"
          params={sp}
          placeholder="Search subject ID, business № or reference…"
        />
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <FilterSelect name="status" label="Status" options={STATUS_OPTIONS} value={status} />
          <FilterSelect name="type" label="Subject" options={SUBJECT_OPTIONS} value={type} />
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No verification requests found"
          hint="Requests submitted by agents, agencies and developers will appear here."
        />
      ) : (
        <>
          <DataTable>
            <THeadRow>
              <th className={th}>Subject</th>
              <th className={th}>Verification</th>
              <th className={th}>ID / Reg №</th>
              <th className={th}>Submitted</th>
              <th className={th}>Status</th>
              <th className={th}>Reviewed</th>
              <th className={th}>Actions</th>
            </THeadRow>
            <tbody>
              {rows.map((r) => (
                <TRow key={r.id}>
                  <td className={td}>
                    <span className="block font-bold text-sv-ink">
                      {subjectNames.get(`${r.subjectType}:${r.subjectId}`) ?? shortRef(r.subjectId)}
                    </span>
                    <span className="mt-0.5 block text-[12px] text-sv-ink/45 capitalize">
                      {r.subjectType}
                    </span>
                  </td>
                  <td className={`${td} whitespace-nowrap`}>
                    <span className="block">{r.verificationType.replaceAll("_", " ")}</span>
                    <span className="mt-0.5 block text-[12px] text-sv-ink/45">
                      {fmtNum(r.documentUrls.length)} document{r.documentUrls.length === 1 ? "" : "s"}
                    </span>
                  </td>
                  <td className={`${td} font-mono text-[12.5px] whitespace-nowrap`}>
                    {r.personalId ?? r.businessNumber ?? "—"}
                  </td>
                  <td className={`${td} whitespace-nowrap text-sv-ink/55`}>
                    <span className="block">{fmtDate(r.createdAt)}</span>
                    <span className="mt-0.5 block text-[12px] text-sv-ink/45">
                      {timeAgo(r.createdAt)}
                    </span>
                  </td>
                  <td className={td}>
                    <StatusPill status={r.status} />
                    {r.rejectionReason ? (
                      <span
                        className="mt-1 block max-w-[220px] truncate text-[12px] text-sv-ink/45"
                        title={r.rejectionReason}
                      >
                        {r.rejectionReason}
                      </span>
                    ) : null}
                  </td>
                  <td className={`${td} whitespace-nowrap text-sv-ink/55`}>
                    {r.reviewedAt ? fmtDate(r.reviewedAt) : "—"}
                  </td>
                  <td className={td}>
                    {r.status === "pending" ? (
                      <div className="flex flex-wrap gap-1.5">
                        <ConfirmButton
                          action={approveVerificationRequest}
                          fields={{ id: r.id }}
                          label="Approve"
                          tone="primary"
                          confirm={`Approve this ${r.subjectType} verification? The profile will be flagged as verified.`}
                        />
                        <RejectVerificationButton action={rejectVerificationRequest} id={r.id} />
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
            basePath="/admin/verification"
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
