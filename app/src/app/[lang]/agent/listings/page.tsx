import type { Metadata } from "next"
import Link from "next/link"
import { Plus } from "lucide-react"

import DashboardShell from "@/components/dashboard/DashboardShell"
import EmptyState from "@/components/dashboard/EmptyState"
import Badge from "@/components/agent-dashboard/Badge"
import { agentNav } from "@/components/agent-dashboard/nav"
import {
  fmtDate,
  fmtPrice,
  listingStatusLabel,
  listingStatusTone,
  tierLabel,
} from "@/components/agent-dashboard/format"
import { db } from "@/lib/db"
import { requireRole, safeQuery } from "@/lib/guards"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "ჩემი განცხადებები — აგენტის პანელი",
  robots: { index: false },
}

export default async function AgentListingsPage() {
  const user = await requireRole("agent", "/agent")

  const listings = await safeQuery(
    () =>
      db.listing.findMany({
        where: { ownerId: user.id, deletedAt: null },
        orderBy: { createdAt: "desc" },
      }),
    [],
  )

  return (
    <DashboardShell
      nav={agentNav}
      title="აგენტის პანელი"
      subtitle="განცხადებები"
      userLabel={user.name ?? user.email}
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <h1 className="text-xl font-black tracking-tight text-sv-ink">
          ჩემი განცხადებები
          <span className="ml-2 text-[13px] font-bold text-sv-ink/40">{listings.length}</span>
        </h1>
        <Link
          href="/add-listing"
          className="inline-flex items-center gap-1.5 rounded-full bg-sv-blue px-5 py-2.5 text-[13px] font-bold text-white transition hover:bg-sv-blue-deep"
        >
          <Plus size={15} />
          დამატება
        </Link>
      </div>

      {listings.length === 0 ? (
        <EmptyState
          title="განცხადებები ჯერ არ გაქვს"
          body="დაამატე პირველი განცხადება — რამდენიმე წუთში გამოქვეყნდება sivrce-ზე."
          actionHref="/add-listing"
          actionLabel="განცხადების დამატება"
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-sv-ink/6 bg-white shadow-sm">
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="border-b border-sv-ink/8 text-[11px] font-bold uppercase tracking-wide text-sv-ink/45">
                <th className="px-5 py-3.5">განცხადება</th>
                <th className="px-4 py-3.5">სტატუსი</th>
                <th className="px-4 py-3.5">ტირი</th>
                <th className="px-4 py-3.5">ფასი</th>
                <th className="px-4 py-3.5">ნახვები</th>
                <th className="px-4 py-3.5">დამატებული</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sv-ink/6">
              {listings.map((l) => (
                <tr key={l.id} className="transition hover:bg-sv-cloud/40">
                  <td className="max-w-64 px-5 py-3.5">
                    <Link
                      href={`/listing/${l.id}`}
                      className="block truncate text-[13.5px] font-bold text-sv-ink hover:text-sv-blue"
                    >
                      {l.title}
                    </Link>
                    <p className="truncate text-[12px] font-medium text-sv-ink/50">
                      {l.city} · {l.district}
                    </p>
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge
                      label={listingStatusLabel[l.status] ?? l.status}
                      tone={listingStatusTone[l.status] ?? "neutral"}
                    />
                  </td>
                  <td className="px-4 py-3.5 text-[12.5px] font-bold text-sv-ink/70">
                    {tierLabel[l.tier] ?? l.tier}
                  </td>
                  <td className="px-4 py-3.5 text-[13.5px] font-extrabold text-sv-ink">
                    {fmtPrice(l.price, l.currency)}
                  </td>
                  <td className="px-4 py-3.5 text-[13px] font-semibold text-sv-ink/60">
                    {l.views}
                  </td>
                  <td className="px-4 py-3.5 text-[12.5px] font-medium text-sv-ink/50">
                    {fmtDate(l.createdAt)}
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
