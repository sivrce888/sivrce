import type { Metadata } from "next"

import DashboardShell from "@/components/dashboard/DashboardShell"
import MyListingsManager, {
  type ManagedListing,
} from "@/components/my-listings/MyListingsManager"
import { developerNav } from "@/components/developer-dashboard/nav"
import { db } from "@/lib/db"
import { requireRole, safeQuery } from "@/lib/guards"
import { phoneRevealsOf } from "@/lib/inquiries/phone"
import { effectiveTierKey } from "@/lib/promo-pricing"
import { isValidLang } from "@/lib/i18n/core"

export const dynamic = "force-dynamic"

const L = {
  ka: {
    metaTitle: "ჩემი განცხადებები",
    title: "დეველოპერის პანელი",
    subtitle: "განცხადებები",
  },
  en: {
    metaTitle: "My listings",
    title: "Developer dashboard",
    subtitle: "Listings",
  },
  de: {
    metaTitle: "Meine Inserate",
    title: "Developer-Dashboard",
    subtitle: "Inserate",
  },
} as const
type Loc = keyof typeof L

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang: raw } = await params
  const loc: Loc = raw === "en" ? "en" : raw === "de" ? "de" : "ka"
  return { title: L[loc].metaTitle, robots: { index: false } }
}

export default async function DeveloperListingsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params
  const lang = isValidLang(raw) ? raw : "ka"
  const loc = lang === "en" ? "en" : lang === "de" ? "de" : "ka"
  const T = L[loc]
  const user = await requireRole("developer", "/developer")

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
      nav={developerNav(lang)}
      title={T.title}
      subtitle={T.subtitle}
      userLabel={user.name ?? user.email}
    >
      <MyListingsManager
        listings={managed}
        addHref="/add-listing?deal=sale&propType=apartment"
      />
    </DashboardShell>
  )
}
