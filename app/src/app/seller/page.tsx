import type { Metadata } from "next"
import Link from "next/link"
import { Building2, DollarSign, TrendingUp, Users } from "lucide-react"

import DashboardShell from "@/components/dashboard/DashboardShell"
import StatCard from "@/components/dashboard/StatCard"
import EmptyState from "@/components/dashboard/EmptyState"
import { sellerNav } from "@/components/seller-dashboard/nav"
import { db } from "@/lib/db"
import { requireRole, safeQuery } from "@/lib/guards"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "გამყიდველის პანელი",
  robots: { index: false },
}

export default async function SellerOverviewPage() {
  const user = await requireRole("seller", "/seller")

  const listingIds = await safeQuery(
    () =>
      db.listing
        .findMany({
          where: { ownerId: user.id, deletedAt: null },
          select: { id: true },
        })
        .then((rows) => rows.map((r) => r.id)),
    [],
  )

  const [activeListings, soldListings, recentLeads, totalLeads] = await Promise.all([
    safeQuery(
      () => db.listing.count({ where: { ownerId: user.id, status: "active", deletedAt: null } }),
      0,
    ),
    safeQuery(
      () => db.listing.count({ where: { ownerId: user.id, status: "sold", deletedAt: null } }),
      0,
    ),
    safeQuery(
      () =>
        db.inquiry.findMany({
          where: {
            deletedAt: null,
            OR: [{ listingId: { in: listingIds } }, { agentEmail: user.email }],
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        }),
      [],
    ),
    safeQuery(
      () =>
        db.inquiry.count({
          where: {
            deletedAt: null,
            OR: [{ listingId: { in: listingIds } }, { agentEmail: user.email }],
          },
        }),
      0,
    ),
  ])

  return (
    <DashboardShell
      nav={sellerNav}
      title="გამყიდველის პანელი"
      subtitle="მიმოხილვა"
      userLabel={user.name ?? user.email}
    >
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          label="აქტიური განცხადებები"
          value={activeListings}
          icon={<Building2 size={18} />}
        />
        <StatCard label="ლიდები" value={totalLeads} icon={<Users size={18} />} />
        <StatCard label="გაყიდული" value={soldListings} icon={<TrendingUp size={18} />} />
        <StatCard
          label="შემოსავალი"
          value="—"
          hint="ანალიტიკა მალე"
          icon={<DollarSign size={18} />}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-card border border-sv-ink/6 bg-sv-surface p-5 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[15px] font-extrabold text-sv-ink">ბოლო ლიდები</h2>
            <Link
              href="/seller/leads"
              className="text-[12px] font-bold text-sv-blue hover:underline"
            >
              ყველა →
            </Link>
          </div>
          {recentLeads.length === 0 ? (
            <EmptyState
              title="ლიდები ჯერ არ გყავს"
              body="ახალი მოთხოვნები აქ გამოჩნდება მაშინვე, როცა მყიდველი დაგიკავშირდება."
            />
          ) : (
            <ul className="divide-y divide-sv-ink/6">
              {recentLeads.map((lead) => (
                <li key={lead.id} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-bold text-sv-ink">{lead.buyerName}</p>
                    <p className="truncate text-[12px] font-medium text-sv-ink/50">
                      {lead.buyerPhone ?? lead.buyerEmail} ·{" "}
                      {new Date(lead.createdAt).toLocaleDateString("ka-GE")}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-card border border-sv-ink/6 bg-sv-surface p-5 shadow-card">
          <div className="mb-4">
            <h2 className="text-[15px] font-extrabold text-sv-ink">სწრაფი ქმედებები</h2>
          </div>
          <div className="flex flex-col gap-3">
            <Link
              href="/add-listing"
              className="rounded-full bg-sv-orange px-5 py-3.5 text-center text-[14px] font-bold text-white shadow-glow-orange transition hover:opacity-95"
            >
              + ახალი განცხადების დამატება
            </Link>
            <Link
              href="/seller/listings"
              className="rounded-full border border-sv-ink/12 bg-sv-surface px-5 py-3.5 text-center text-[14px] font-bold text-sv-ink transition hover:border-sv-blue hover:text-sv-blue"
            >
              განცხადებების მართვა
            </Link>
          </div>
        </section>
      </div>
    </DashboardShell>
  )
}
