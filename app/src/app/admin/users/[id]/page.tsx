import type { Metadata } from "next"
import { Building2, Gavel, Inbox, MessageSquareText, MonitorSmartphone } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

import { RoleSelectForm } from "@/components/admin/users/RoleSelectForm"
import { DataTable, THeadRow, TRow, td, th } from "@/components/admin/ui/DataTable"
import { EmptyState } from "@/components/admin/ui/EmptyState"
import { PageHeader } from "@/components/admin/ui/PageHeader"
import { StatCard } from "@/components/admin/ui/StatCard"
import { StatusPill } from "@/components/admin/ui/StatusPill"
import { UserRole } from "@/generated/prisma/enums"
import { fmtDate, fmtDateTime, fmtMoney, fmtNum } from "@/lib/admin/format"
import { db } from "@/lib/db"

import { setUserRole, setUserTrustScore } from "../actions"

export const metadata: Metadata = { title: "User" }

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const user = await db.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      trustScore: true,
      createdAt: true,
      updatedAt: true,
      emailVerified: true,
      phoneVerifiedAt: true,
    },
  })
  if (!user) notFound()

  const [sessions, reviews, inquiries, bids, listings, listingsTotal] = await Promise.all([
    db.session.count({ where: { userId: id } }),
    db.review.count({ where: { authorId: id, deletedAt: null } }),
    // Inquiry has no user FK — matched by the account email.
    db.inquiry.count({ where: { buyerEmail: user.email, deletedAt: null } }),
    db.bid.count({ where: { bidderId: id } }),
    db.listing.findMany({
      where: { ownerId: id, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 25,
      select: {
        id: true,
        slug: true,
        title: true,
        status: true,
        price: true,
        currency: true,
      },
    }),
    db.listing.count({ where: { ownerId: id, deletedAt: null } }),
  ])

  const displayName = user.name ?? user.email
  const initials = displayName
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <>
      <PageHeader title={displayName} description={`User ID ${user.id}`} />

      {/* Profile header */}
      <div className="mb-5 rounded-[var(--radius-tile)] border border-sv-ink/6 bg-white p-6 shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-center gap-5">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-sv-navy text-[20px] font-extrabold text-white">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <p className="text-[18px] font-extrabold text-sv-ink">{displayName}</p>
              <StatusPill status={user.role} />
            </div>
            <p className="mt-1 text-[13.5px] text-sv-ink/55">
              {user.email}
              {user.emailVerified ? " · verified" : ""}
              {"  ·  "}
              {user.phone ?? "no phone"}
              {user.phoneVerifiedAt ? " · verified" : ""}
            </p>
            <p className="mt-1 text-[12.5px] text-sv-ink/40">
              Trust score <span className="font-bold text-sv-ink/70">{user.trustScore}/100</span>
              {" · "}Joined {fmtDate(user.createdAt)}
              {" · "}Updated {fmtDateTime(user.updatedAt)}
            </p>
          </div>
        </div>
      </div>

      {/* Activity stats */}
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Sessions" value={fmtNum(sessions)} icon={MonitorSmartphone} />
        <StatCard label="Reviews" value={fmtNum(reviews)} icon={MessageSquareText} hint="Authored, visible" />
        <StatCard label="Inquiries" value={fmtNum(inquiries)} icon={Inbox} hint="Matched by email" />
        <StatCard label="Bids" value={fmtNum(bids)} icon={Gavel} hint="Auction bids placed" />
      </div>

      {/* Admin actions */}
      <div className="mb-5 rounded-[var(--radius-tile)] border border-sv-ink/6 bg-white p-5 shadow-[var(--shadow-card)]">
        <p className="mb-3 text-[12px] font-bold tracking-[0.08em] text-sv-ink/45 uppercase">
          Admin actions
        </p>
        <div className="flex flex-wrap items-end gap-x-8 gap-y-3">
          <RoleSelectForm
            userId={user.id}
            currentRole={user.role}
            roles={Object.values(UserRole)}
            action={setUserRole}
          />
          <form action={setUserTrustScore} className="flex flex-wrap items-end gap-2">
            <input type="hidden" name="id" value={user.id} />
            <label className="text-[12.5px] font-semibold text-sv-ink/50">
              Trust score (0–100)
              <input
                type="number"
                name="trustScore"
                defaultValue={user.trustScore}
                min={0}
                max={100}
                step={1}
                required
                className="mt-1 block h-9 w-24 rounded-[var(--radius-control)] border border-sv-ink/10 bg-white px-3 text-[13.5px] font-semibold text-sv-ink tabular-nums outline-none focus:border-sv-blue"
              />
            </label>
            <button
              type="submit"
              className="inline-flex h-9 items-center justify-center rounded-[var(--radius-control)] bg-sv-blue px-3.5 text-[12.5px] font-bold whitespace-nowrap text-white transition-colors hover:bg-sv-blue-deep"
            >
              Update score
            </button>
          </form>
        </div>
      </div>

      {/* Listings */}
      <div className="mb-3 flex items-center gap-2">
        <Building2 className="h-4 w-4 text-sv-ink/40" />
        <h2 className="text-[15px] font-extrabold text-sv-ink">
          Listings <span className="text-sv-ink/40">· {fmtNum(listingsTotal)}</span>
        </h2>
      </div>
      {listings.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No listings"
          hint="This user hasn't published any listings yet."
        />
      ) : (
        <DataTable>
          <THeadRow>
            <th className={th}>ID</th>
            <th className={th}>Title</th>
            <th className={th}>Status</th>
            <th className={`${th} text-right`}>Price</th>
          </THeadRow>
          <tbody>
            {listings.map((l) => (
              <TRow key={l.id} href={`/listing/${l.slug}`}>
                <td className={`${td} font-mono text-[12px] text-sv-ink/45`}>
                  {l.id.slice(0, 8)}
                </td>
                <td className={td}>
                  <Link
                    href={`/listing/${l.slug}`}
                    className="font-semibold text-sv-ink hover:text-sv-blue"
                  >
                    {l.title}
                  </Link>
                </td>
                <td className={td}>
                  <StatusPill status={l.status} />
                </td>
                <td className={`${td} text-right tabular-nums`}>
                  {fmtMoney(l.price, l.currency)}
                </td>
              </TRow>
            ))}
          </tbody>
        </DataTable>
      )}
      {listingsTotal > listings.length ? (
        <p className="mt-3 text-[12.5px] text-sv-ink/45">
          Showing latest {listings.length} of {fmtNum(listingsTotal)} listings.
        </p>
      ) : null}
    </>
  )
}
