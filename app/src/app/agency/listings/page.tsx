import type { Metadata } from "next"

import { getAgencyContext } from "@/components/agency-dashboard/data"
import {
  AGENCY_NAV,
  DEAL_TYPE_LABELS,
  LISTING_STATUS_CLASSES,
  LISTING_STATUS_LABELS,
  formatPrice,
} from "@/components/agency-dashboard/nav"
import DashboardShell from "@/components/dashboard/DashboardShell"
import EmptyState from "@/components/dashboard/EmptyState"
import { db } from "@/lib/db"
import { requireRole, safeQuery } from "@/lib/guards"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "სააგენტოს განცხადებები",
  robots: { index: false },
}

export default async function AgencyListingsPage() {
  const user = await requireRole("agency", "/agency")
  const { ownerIds } = await getAgencyContext(user)
  const listings = await safeQuery(
    () =>
      db.listing.findMany({
        where: { ownerId: { in: ownerIds }, deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    [],
  )

  return (
    <DashboardShell
      nav={AGENCY_NAV}
      title="სააგენტოს პანელი"
      subtitle="განცხადებები"
      userLabel={user.name ?? user.email}
    >
      {listings.length === 0 ? (
        <EmptyState
          title="განცხადებები ჯერ არ არის"
          body="სააგენტოს განცხადებები აქ გამოჩნდება მათი დამატებისთანავე."
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-sv-ink/6 bg-white shadow-sm">
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="border-b border-sv-ink/8 text-[11px] font-bold uppercase tracking-wide text-sv-ink/45">
                <th className="px-5 py-3.5">განცხადება</th>
                <th className="px-5 py-3.5">ტიპი</th>
                <th className="px-5 py-3.5">ფასი</th>
                <th className="px-5 py-3.5">ნახვები</th>
                <th className="px-5 py-3.5">სტატუსი</th>
                <th className="px-5 py-3.5">თარიღი</th>
              </tr>
            </thead>
            <tbody>
              {listings.map((l) => (
                <tr key={l.id} className="border-b border-sv-ink/5 last:border-0">
                  <td className="max-w-64 px-5 py-3.5">
                    <p className="truncate text-[13.5px] font-bold text-sv-ink">{l.title}</p>
                    <p className="truncate text-[11.5px] font-medium text-sv-ink/50">
                      {l.city} · {l.district}
                    </p>
                  </td>
                  <td className="px-5 py-3.5 text-[12.5px] font-semibold text-sv-ink/65">
                    {DEAL_TYPE_LABELS[l.dealType]}
                  </td>
                  <td className="px-5 py-3.5 text-[13.5px] font-black tabular-nums text-sv-ink">
                    {formatPrice(l.price, l.currency)}
                  </td>
                  <td className="px-5 py-3.5 text-[12.5px] font-semibold tabular-nums text-sv-ink/65">
                    {l.views}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${LISTING_STATUS_CLASSES[l.status]}`}
                    >
                      {LISTING_STATUS_LABELS[l.status]}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-[12px] font-medium text-sv-ink/50">
                    {l.createdAt.toLocaleDateString("ka-GE")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardShell>
  )
}
