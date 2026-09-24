import type { Metadata } from "next"

import { getAgencyContext } from "@/components/agency-dashboard/data"
import { AGENCY_NAV } from "@/components/agency-dashboard/nav"
import DashboardShell from "@/components/dashboard/DashboardShell"
import EmptyState from "@/components/dashboard/EmptyState"
import LeadInbox from "@/components/dashboard/LeadInbox"
import { db } from "@/lib/db"
import { requireRole, safeQuery } from "@/lib/guards"
import { inquiryWhere, listingOwnerWhere } from "@/lib/pro-leads"
import { isValidLang, panelLang } from "@/lib/i18n/core"

export const dynamic = "force-dynamic"

const L = {
  ka: {
    metaTitle: "სააგენტოს ლიდები",
    title: "სააგენტოს პანელი",
    subtitle: "ლიდები",
    emptyTitle: "ლიდები ჯერ არ არის",
    emptyBody: "ახალი მოთხოვნები აქ გამოჩნდება მათი შემოსვლისთანავე. ზარი და WhatsApp — ერთი შეხებით.",
  },
  en: {
    metaTitle: "Agency leads",
    title: "Agency dashboard",
    subtitle: "Leads",
    emptyTitle: "No leads yet",
    emptyBody: "New inquiries will appear here as soon as they arrive. Call or WhatsApp in one tap.",
  },
  de: {
    metaTitle: "Agentur-Leads",
    title: "Agentur-Dashboard",
    subtitle: "Leads",
    emptyTitle: "Noch keine Leads",
    emptyBody:
      "Neue Anfragen erscheinen hier sofort nach Eingang. Anruf und WhatsApp mit einem Tipp.",
  },
} as const
type Loc = keyof typeof L

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang: raw } = await params
  const loc: Loc = panelLang(raw)
  return { title: L[loc].metaTitle, robots: { index: false } }
}

export default async function AgencyLeadsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params
  const lang = isValidLang(raw) ? raw : "ka"
  const loc = panelLang(lang)
  const T = L[loc]
  const user = await requireRole("agency", "/agency")
  const { ownerIds } = await getAgencyContext(user)

  const listingRows = await safeQuery(
    () =>
      db.listing.findMany({
        where: listingOwnerWhere(ownerIds),
        select: { id: true, title: true },
      }),
    [],
  )
  const listingIds = listingRows.map((l) => l.id)
  const titles = Object.fromEntries(listingRows.map((l) => [l.id, l.title]))

  const leads = await safeQuery(
    () =>
      db.inquiry.findMany({
        where: inquiryWhere(listingIds, user.email),
        orderBy: { createdAt: "desc" },
        take: 120,
      }),
    [],
  )

  return (
    <DashboardShell
      nav={AGENCY_NAV(lang)}
      title={T.title}
      subtitle={T.subtitle}
      userLabel={user.name ?? user.email}
    >
      {leads.length === 0 ? (
        <EmptyState title={T.emptyTitle} body={T.emptyBody} />
      ) : (
        <LeadInbox leads={leads} titles={titles} layout="board" lang={lang} />
      )}
    </DashboardShell>
  )
}
