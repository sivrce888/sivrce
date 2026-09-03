import type { Metadata } from "next"

import { getAgencyContext } from "@/components/agency-dashboard/data"
import { AGENCY_NAV } from "@/components/agency-dashboard/nav"
import DashboardShell from "@/components/dashboard/DashboardShell"
import MyListingsManager, {
  type ManagedListing,
} from "@/components/my-listings/MyListingsManager"
import { db } from "@/lib/db"
import { requireRole, safeQuery } from "@/lib/guards"
import { phoneRevealsOf } from "@/lib/inquiries/phone"
import { listingOwnerWhere } from "@/lib/pro-leads"
import { effectiveTierKey } from "@/lib/promo-pricing"

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
        where: listingOwnerWhere(ownerIds),
        orderBy: { updatedAt: "desc" },
        take: 100,
      }),
    [],
  )

  const ids = listings.map((l) => l.id)
  const leadGroups = await safeQuery(
    () =>
      ids.length === 0
        ? Promise.resolve([])
        : db.inquiry.groupBy({
            by: ["listingId"],
            where: { listingId: { in: ids }, deletedAt: null },
            _count: { _all: true },
          }),
    [],
  )
  const leadsById = new Map(leadGroups.map((g) => [g.listingId, g._count._all]))

  const managed: ManagedListing[] = listings.map((l) => ({
    id: l.id,
    title: l.title,
    description: l.description,
    city: l.city,
    district: l.district,
    price: l.price,
    currency: l.currency,
    status: l.status,
    dealType: l.dealType,
    tier: effectiveTierKey(l.tier, l.tierExpiresAt),
    tierExpiresAt: l.tierExpiresAt?.toISOString() ?? null,
    views: l.views,
    leads: leadsById.get(l.id) ?? 0,
    phoneReveals: phoneRevealsOf(l.extendedFields),
    image: l.images[0] ?? "/images/p1.webp",
    createdAt: l.createdAt.toISOString(),
    updatedAt: l.updatedAt.toISOString(),
  }))

  return (
    <DashboardShell
      nav={AGENCY_NAV}
      title="სააგენტოს პანელი"
      subtitle="განცხადებები"
      userLabel={user.name ?? user.email}
    >
      <MyListingsManager listings={managed} />
    </DashboardShell>
  )
}
