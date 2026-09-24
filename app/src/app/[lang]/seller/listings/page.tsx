import type { Metadata } from "next"

import DashboardShell from "@/components/dashboard/DashboardShell"
import MyListingsManager, {
  type ManagedListing,
} from "@/components/my-listings/MyListingsManager"
import { sellerNav } from "@/components/seller-dashboard/nav"
import { db } from "@/lib/db"
import { requireRole, safeQuery } from "@/lib/guards"
import { savedCounts } from "@/lib/saved-listings"
import { phoneRevealsOf } from "@/lib/inquiries/phone"
import { effectiveTierKey } from "@/lib/promo-pricing"
import { addListingHref, isRentFocus, panelTitle } from "@/lib/workspace"
import { readPersona } from "@/lib/workspace-cookie"
import { isValidLang, panelLang } from "@/lib/i18n/core"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "განცხადებები · გამყიდველი",
  robots: { index: false },
}

const L = {
  ka: { subtitle: "განცხადებები" },
  en: { subtitle: "Listings" },
  de: { subtitle: "Inserate" },
} as const

export default async function SellerListingsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params
  const lang = isValidLang(raw) ? raw : "ka"
  const c = L[panelLang(lang)]
  const user = await requireRole("seller", "/seller")
  const persona = await readPersona(user.role)

  const listings = await safeQuery(
    () =>
      db.listing.findMany({
        where: { ownerId: user.id, deletedAt: null },
        orderBy: { updatedAt: "desc" },
        take: 100,
      }),
    [],
  )

  const ids = listings.map((l) => l.id)
  const savesP = safeQuery(() => savedCounts(ids), new Map<string, number>())
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
  const savesById = await savesP

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
    saves: savesById.get(l.id) ?? 0,
    phoneReveals: phoneRevealsOf(l.extendedFields),
    image: l.images[0] ?? "/images/p1.webp",
    createdAt: l.createdAt.toISOString(),
    updatedAt: l.updatedAt.toISOString(),
  }))

  return (
    <DashboardShell
      nav={sellerNav(lang)}
      title={panelTitle(persona, lang)}
      subtitle={c.subtitle}
      userLabel={user.name ?? user.email}
    >
      <MyListingsManager
        listings={managed}
        addHref={addListingHref(persona)}
        focusRent={isRentFocus(persona)}
      />
    </DashboardShell>
  )
}
