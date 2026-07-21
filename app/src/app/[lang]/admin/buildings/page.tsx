import { Download, MapPinned, Plus, Star } from "lucide-react"
import Link from "next/link"

import { DataTable, THeadRow, TRow, td, th } from "@/components/admin/ui/DataTable"
import { EmptyState } from "@/components/admin/ui/EmptyState"
import { FilterSelect } from "@/components/admin/ui/FilterSelect"
import { PageHeader } from "@/components/admin/ui/PageHeader"
import { Pagination } from "@/components/admin/ui/Pagination"
import { SearchForm } from "@/components/admin/ui/SearchForm"
import { StatusPill } from "@/components/admin/ui/StatusPill"
import { fmtDate, fmtNum } from "@/lib/admin/format"
import { requireAdmin } from "@/lib/admin/guard"
import { ADMIN_PAGE_SIZE, param, parsePage, type SearchParams } from "@/lib/admin/query"
import { db } from "@/lib/db"

import { importProjectPins } from "./actions"

export const metadata = { title: "Map buildings" }

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "construction", label: "Construction" },
  { value: "completed", label: "Completed" },
  { value: "hidden", label: "Hidden" },
]

export default async function AdminBuildingsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  await requireAdmin()
  const sp = await searchParams
  const page = parsePage(sp.page)
  const q = param(sp.q)
  const status = param(sp.status)
  const imported = param(sp.imported)

  const where = {
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" as const } },
            { slug: { contains: q, mode: "insensitive" as const } },
            { code: { contains: q, mode: "insensitive" as const } },
            { address: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  }

  const [rows, total] = await Promise.all([
    db.mapBuilding.findMany({
      where,
      include: { developer: { select: { name: true } } },
      orderBy: [{ popular: "desc" }, { updatedAt: "desc" }],
      take: ADMIN_PAGE_SIZE,
      skip: (page - 1) * ADMIN_PAGE_SIZE,
    }),
    db.mapBuilding.count({ where }),
  ])

  return (
    <>
      <PageHeader
        title="Map buildings"
        description={`${fmtNum(total)} buildings editable on the 3D map · hidden rows stay off the map`}
        actions={
          <>
            <form action={importProjectPins}>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-full border border-sv-ink/12 px-4 py-2 text-[13px] font-extrabold text-sv-ink/70 transition hover:border-sv-blue/40 hover:text-sv-blue"
              >
                <Download className="h-4 w-4" /> Import all projects
              </button>
            </form>
            <Link
              href="/admin/buildings/new"
              className="inline-flex items-center gap-1.5 rounded-full bg-sv-blue px-4 py-2 text-[13px] font-extrabold text-white transition hover:bg-sv-blue-deep"
            >
              <Plus className="h-4 w-4" /> Add building
            </Link>
          </>
        }
      />

      {imported ? (
        <p className="mb-4 rounded-module border border-sv-blue/20 bg-sv-blue/5 px-4 py-2.5 text-[13px] font-bold text-sv-blue">
          +{imported} project pin(s) added — click any row to edit lat/lng.
        </p>
      ) : null}

      <div className="mb-4 flex flex-wrap items-end gap-x-6 gap-y-3">
        <SearchForm
          action="/admin/buildings"
          params={sp}
          placeholder="Search name, slug, code or address…"
        />
        <FilterSelect name="status" label="Status" options={STATUS_OPTIONS} value={status} />
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={MapPinned}
          title="No buildings found"
          hint='Click "Import all projects" to pull every map pin into this list for editing.'
        />
      ) : (
        <DataTable>
          <THeadRow>
            <th className={th}>Building</th>
            <th className={th}>Code</th>
            <th className={th}>Lat / Lng</th>
            <th className={th}>Developer</th>
            <th className={`${th} text-right`}>Floors</th>
            <th className={th}>Status</th>
            <th className={th}>Popular</th>
            <th className={th}>Updated</th>
          </THeadRow>
          <tbody>
            {rows.map((b) => (
              <TRow key={b.id} href={`/admin/buildings/${b.id}`}>
                <td className={td}>
                  <Link href={`/admin/buildings/${b.id}`} className="block max-w-[280px]">
                    <span className="block truncate font-bold text-sv-ink transition-colors hover:text-sv-blue">
                      {b.title}
                    </span>
                    <span className="mt-0.5 block truncate text-[12px] text-sv-ink/45">
                      {b.address ?? "—"}
                    </span>
                  </Link>
                </td>
                <td className={`${td} whitespace-nowrap text-sv-ink/55`}>{b.code ?? "—"}</td>
                <td className={`${td} whitespace-nowrap tabular-nums text-sv-ink/55`}>
                  {b.lat.toFixed(4)}, {b.lng.toFixed(4)}
                </td>
                <td className={`${td} whitespace-nowrap`}>{b.developer?.name ?? "—"}</td>
                <td className={`${td} text-right tabular-nums`}>{b.floors || "—"}</td>
                <td className={td}>
                  <StatusPill status={b.status} />
                </td>
                <td className={td}>
                  {b.popular ? (
                    <Star className="h-4.5 w-4.5 fill-sv-orange text-sv-orange" aria-label="Popular" />
                  ) : (
                    <span className="text-sv-ink/30">—</span>
                  )}
                </td>
                <td className={`${td} whitespace-nowrap text-sv-ink/55`}>{fmtDate(b.updatedAt)}</td>
              </TRow>
            ))}
          </tbody>
        </DataTable>
      )}

      <Pagination
        basePath="/admin/buildings"
        page={page}
        pageSize={ADMIN_PAGE_SIZE}
        total={total}
        params={sp}
      />
    </>
  )
}
