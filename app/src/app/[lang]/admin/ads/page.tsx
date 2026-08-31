import { Megaphone, Plus } from "lucide-react"
import Link from "next/link"

import { DataTable, td, th, THeadRow, TRow } from "@/components/admin/ui/DataTable"
import { EmptyState } from "@/components/admin/ui/EmptyState"
import { FilterSelect } from "@/components/admin/ui/FilterSelect"
import { PageHeader } from "@/components/admin/ui/PageHeader"
import { StatusPill } from "@/components/admin/ui/StatusPill"
import type { Prisma } from "@/generated/prisma/client"
import { fmtDate, fmtNum } from "@/lib/admin/format"
import { requireAdmin } from "@/lib/admin/guard"
import { param, type SearchParams } from "@/lib/admin/query"
import { AD_SLOTS, AD_STATUSES, isAdSlot, isAdStatus, SLOT_META } from "@/lib/ads"
import { db } from "@/lib/db"

export const metadata = { title: "Banners" }

export default async function AdminAdsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  await requireAdmin()
  const sp = await searchParams
  const slot = param(sp.slot)
  const status = param(sp.status)

  const where: Prisma.AdBannerWhereInput = {
    ...(isAdSlot(slot) ? { slot } : {}),
    ...(isAdStatus(status) ? { status } : {}),
  }

  const banners = await db.adBanner.findMany({
    where,
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    take: 200,
  })

  return (
    <>
      <PageHeader
        title="Banners"
        description="Every paid surface on sivrce — homepage, search, listing, directories, mortgage. Live creatives rotate by weight and audience."
        actions={
          <Link
            href="/admin/ads/new"
            className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-control)] bg-sv-blue px-3.5 text-[12.5px] font-bold text-white transition-colors hover:bg-sv-blue-deep"
          >
            <Plus className="h-4 w-4" /> New banner
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <FilterSelect
          name="slot"
          label="Slot"
          value={slot}
          options={AD_SLOTS.map((s) => ({ value: s, label: SLOT_META[s].label }))}
        />
        <FilterSelect
          name="status"
          label="Status"
          value={status}
          options={AD_STATUSES.map((s) => ({ value: s, label: s }))}
        />
      </div>

      {banners.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title={slot || status ? "No banners match these filters" : "No banners yet"}
          hint="Create a live creative for the homepage or search grid. Empty slots stay invisible — never a placeholder."
        />
      ) : (
        <DataTable>
          <THeadRow>
            <th className={th}>Banner</th>
            <th className={th}>Slot</th>
            <th className={th}>Status</th>
            <th className={th}>Audience</th>
            <th className={`${th} text-right`}>Clicks</th>
            <th className={th}>Updated</th>
          </THeadRow>
          <tbody>
            {banners.map((b) => (
              <TRow key={b.id} href={`/admin/ads/${b.id}`}>
                <td className={td}>
                  <Link href={`/admin/ads/${b.id}`} className="font-bold text-sv-ink hover:text-sv-blue">
                    {b.title}
                  </Link>
                  <p className="mt-0.5 text-[12px] font-medium text-sv-ink/40">
                    {b.advertiser || b.format}
                  </p>
                </td>
                <td className={td}>
                  {isAdSlot(b.slot) ? SLOT_META[b.slot].label : b.slot}
                </td>
                <td className={td}>
                  <StatusPill status={b.status} />
                </td>
                <td className={`${td} text-[12px]`}>{b.audiences.join(", ")}</td>
                <td className={`${td} text-right font-bold`}>{fmtNum(b.clicks)}</td>
                <td className={td}>{fmtDate(b.updatedAt)}</td>
              </TRow>
            ))}
          </tbody>
        </DataTable>
      )}
    </>
  )
}
