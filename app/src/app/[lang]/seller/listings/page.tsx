import type { Metadata } from "next"
import LocalizedLink from "@/components/LocalizedLink"

import DashboardShell from "@/components/dashboard/DashboardShell"
import EmptyState from "@/components/dashboard/EmptyState"
import TierPurchaseButton from "@/components/payments/TierPurchaseButton"
import { sellerNav } from "@/components/seller-dashboard/nav"
import { db } from "@/lib/db"
import { requireRole, safeQuery } from "@/lib/guards"
import { effectiveTierKey } from "@/lib/promo-pricing"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "განცხადებები · გამყიდველი",
  robots: { index: false },
}

const STATUS_LABEL: Record<string, string> = {
  active: "აქტიური",
  sold: "გაყიდული",
  pending: "მოლოდინში",
  expired: "ვადაგასული",
  withdrawn: "მოხსნილი",
}

const STATUS_CLASS: Record<string, string> = {
  active: "bg-sv-blue/10 text-sv-blue",
  sold: "bg-sv-orange/10 text-sv-orange",
  pending: "bg-sv-cloud text-sv-ink/70",
  expired: "bg-sv-ink/6 text-sv-ink/55",
  withdrawn: "bg-sv-ink/8 text-sv-ink/60",
}

const fmt = new Intl.NumberFormat("ka-GE")

export default async function SellerListingsPage() {
  const user = await requireRole("seller", "/seller")

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
      nav={sellerNav}
      title="გამყიდველის პანელი"
      subtitle="განცხადებები"
      userLabel={user.name ?? user.email}
    >
      <div className="mb-6 flex items-center justify-between gap-3">
        <h2 className="text-[18px] font-extrabold tracking-tight text-sv-ink">
          ჩემი განცხადებები
        </h2>
        <LocalizedLink
          href="/add-listing"
          className="rounded-full bg-sv-blue px-5 py-2.5 text-[13px] font-bold text-white transition hover:opacity-90"
        >
          + დამატება
        </LocalizedLink>
      </div>

      {listings.length === 0 ? (
        <EmptyState
          title="განცხადებები ჯერ არ გაქვს"
          body="დაამატე შენი პირველი განცხადება და ის აქ გამოჩნდება."
          actionHref="/add-listing"
          actionLabel="განცხადების დამატება"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {listings.map((listing) => (
            <div
              key={listing.id}
              className="rounded-card border border-sv-ink/6 bg-sv-surface p-5 shadow-card"
            >
              <div className="flex items-start justify-between gap-3">
                <LocalizedLink
                  href={`/listing/${listing.id}`}
                  className="text-[15px] font-extrabold text-sv-ink hover:text-sv-blue"
                >
                  {listing.title}
                </LocalizedLink>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${STATUS_CLASS[listing.status] ?? "bg-sv-ink/6 text-sv-ink/55"}`}
                >
                  {STATUS_LABEL[listing.status] ?? listing.status}
                </span>
              </div>
              <p className="mt-1 text-[12.5px] font-medium text-sv-ink/55">
                {listing.city} · {listing.district}
              </p>
              <p className="mt-2 text-[16px] font-extrabold text-sv-ink">
                {listing.price > 0 ? `${fmt.format(listing.price)} ₾` : "ფასი მოთხოვნით"}
              </p>
              {listing.status === "active" && (
                <div className="mt-4 flex justify-end">
                  <TierPurchaseButton
                    listingId={listing.id}
                    currentTier={effectiveTierKey(listing.tier, listing.tierExpiresAt)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  )
}
