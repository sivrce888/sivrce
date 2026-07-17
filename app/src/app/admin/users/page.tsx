import type { Metadata } from "next"
import { Users } from "lucide-react"
import Link from "next/link"

import { DataTable, THeadRow, TRow, td, th } from "@/components/admin/ui/DataTable"
import { EmptyState } from "@/components/admin/ui/EmptyState"
import { FilterSelect } from "@/components/admin/ui/FilterSelect"
import { PageHeader } from "@/components/admin/ui/PageHeader"
import { Pagination } from "@/components/admin/ui/Pagination"
import { SearchForm } from "@/components/admin/ui/SearchForm"
import { StatusPill } from "@/components/admin/ui/StatusPill"
import { UserRole } from "@/generated/prisma/enums"
import { fmtDate, fmtNum } from "@/lib/admin/format"
import { ADMIN_PAGE_SIZE, param, parsePage, type SearchParams } from "@/lib/admin/query"
import { db } from "@/lib/db"
import type { Prisma } from "@/generated/prisma/client"

export const metadata: Metadata = { title: "Users" }

const ROLE_OPTIONS = Object.values(UserRole).map((r) => ({
  value: r,
  label: r[0].toUpperCase() + r.slice(1),
}))

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  const q = param(sp.q)
  const role = param(sp.role)
  const page = parsePage(sp.page)

  const where: Prisma.UserWhereInput = {
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { phone: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(role && (Object.values(UserRole) as readonly string[]).includes(role)
      ? { role: role as UserRole }
      : {}),
  }

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: ADMIN_PAGE_SIZE,
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        trustScore: true,
        createdAt: true,
      },
    }),
    db.user.count({ where }),
  ])

  // Listing has no FK relation back to User, so count per owner in one groupBy.
  const grouped = users.length
    ? await db.listing.groupBy({
        by: ["ownerId"],
        where: { ownerId: { in: users.map((u) => u.id) }, deletedAt: null },
        _count: { _all: true },
      })
    : []
  const listingCounts = new Map(grouped.map((g) => [g.ownerId, g._count._all]))

  return (
    <>
      <PageHeader
        title="Users"
        description={`${fmtNum(total)} registered accounts`}
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchForm action="/admin/users" params={sp} placeholder="Name, email or phone…" />
        <FilterSelect name="role" label="Role" options={ROLE_OPTIONS} value={role} />
      </div>

      {users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No users found"
          hint={q || role ? "Try a different search or clear the role filter." : "Registered users will appear here."}
        />
      ) : (
        <DataTable>
          <THeadRow>
            <th className={th}>User</th>
            <th className={th}>Role</th>
            <th className={`${th} text-right`}>Trust</th>
            <th className={th}>Phone</th>
            <th className={`${th} text-right`}>Listings</th>
            <th className={th}>Joined</th>
          </THeadRow>
          <tbody>
            {users.map((u) => (
              <TRow key={u.id} href={`/admin/users/${u.id}`}>
                <td className={td}>
                  <Link
                    href={`/admin/users/${u.id}`}
                    className="block font-bold text-sv-ink hover:text-sv-blue"
                  >
                    {u.name ?? "—"}
                  </Link>
                  <span className="text-[12.5px] text-sv-ink/45">{u.email}</span>
                </td>
                <td className={td}>
                  <StatusPill status={u.role} />
                </td>
                <td className={`${td} text-right tabular-nums`}>{u.trustScore}</td>
                <td className={td}>{u.phone ?? "—"}</td>
                <td className={`${td} text-right tabular-nums`}>
                  {fmtNum(listingCounts.get(u.id) ?? 0)}
                </td>
                <td className={`${td} whitespace-nowrap`}>{fmtDate(u.createdAt)}</td>
              </TRow>
            ))}
          </tbody>
        </DataTable>
      )}

      <Pagination
        basePath="/admin/users"
        page={page}
        pageSize={ADMIN_PAGE_SIZE}
        total={total}
        params={sp}
      />
    </>
  )
}
