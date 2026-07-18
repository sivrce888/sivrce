import type { Metadata } from "next"
import Link from "next/link"

import DashboardShell from "@/components/dashboard/DashboardShell"
import EmptyState from "@/components/dashboard/EmptyState"
import { developerNav } from "@/components/developer-dashboard/nav"
import { db } from "@/lib/db"
import { requireRole, safeQuery } from "@/lib/guards"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "ჩემი განცხადებები",
  robots: { index: false },
}

const fmt = new Intl.NumberFormat("ka-GE")

const STATUS_KA: Record<string, string> = {
  active: "აქტიური",
  sold: "გაყიდული",
  pending: "მოლოდინში",
  expired: "ვადაგასული",
  withdrawn: "მოხსნილი",
}

export default async function DeveloperListingsPage() {
  const user = await requireRole("developer", "/developer")

  // ponytail: schema has no Listing↔Project link; tie by ownerId (ceiling: join via project when schema grows one)
  const listings = await safeQuery(
    () =>
      db.listing.findMany({
        where: { ownerId: user.id, deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    [],
  )

  return (
    <DashboardShell
      nav={developerNav}
      title="დეველოპერის პანელი"
      subtitle="განცხადებები"
      userLabel={user.name ?? user.email}
    >
      <h1 className="mb-5 text-[22px] font-black tracking-tight text-sv-ink">
        განცხადებები
      </h1>

      {listings.length === 0 ? (
        <EmptyState
          title="განცხადებები ჯერ არ გაქვს"
          body="დაამატე შენი პროექტების ბინების განცხადებები — ისინი აქ გამოჩნდება სტატუსითა და ნახვების სტატისტიკით."
          actionHref="/add-listing"
          actionLabel="განცხადების დამატება"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {listings.map((l) => (
            <Link
              key={l.id}
              href={`/listing/${l.id}`}
              className="rounded-2xl border border-sv-ink/6 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="line-clamp-1 text-[15px] font-extrabold text-sv-ink">
                  {l.title}
                </p>
                <span className="shrink-0 rounded-full bg-sv-blue/8 px-2.5 py-1 text-[11px] font-bold text-sv-blue">
                  {STATUS_KA[l.status] ?? l.status}
                </span>
              </div>
              <p className="mt-1 text-[12.5px] font-medium text-sv-ink/55">
                {l.city} · {l.district} · {l.rooms} ოთახი · {l.area} მ²
              </p>
              <div className="mt-3 flex items-baseline justify-between gap-2">
                <span className="text-[15px] font-black text-sv-ink">
                  {fmt.format(l.price)} {l.currency === "USD" ? "$" : "₾"}
                </span>
                <span className="text-[12px] font-semibold text-sv-ink/45">
                  {l.views} ნახვა
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </DashboardShell>
  )
}
