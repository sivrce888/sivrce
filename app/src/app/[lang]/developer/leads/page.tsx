import type { Metadata } from "next"

import DashboardShell from "@/components/dashboard/DashboardShell"
import EmptyState from "@/components/dashboard/EmptyState"
import LeadInbox, { CrmClients } from "@/components/dashboard/LeadInbox"
import { developerNav } from "@/components/developer-dashboard/nav"
import { db } from "@/lib/db"
import { requireRole, safeQuery } from "@/lib/guards"
import { inquiryWhere, listingOwnerWhere } from "@/lib/pro-leads"
import { isValidLang, panelLang } from "@/lib/i18n/core"

export const dynamic = "force-dynamic"

const L = {
  ka: {
    metaTitle: "ლიდები",
    title: "დეველოპერის პანელი",
    subtitle: "ლიდები",
    h1: "ლიდები",
    emptyTitle: "ლიდები ჯერ არ გაქვს",
    emptyBody:
      "მყიდველების მოთხოვნები შენს განცხადებებზე აქ გამოჩნდება. დაამატე გასაყიდი ბინა, რომ პირველი მოთხოვნები მიიღო.",
    addListing: "განცხადების დამატება",
  },
  en: {
    metaTitle: "Leads",
    title: "Developer dashboard",
    subtitle: "Leads",
    h1: "Leads",
    emptyTitle: "No leads yet",
    emptyBody:
      "Buyer inquiries on your listings will appear here. Add an apartment for sale to receive your first inquiries.",
    addListing: "Add a listing",
  },
  de: {
    metaTitle: "Leads",
    title: "Developer-Dashboard",
    subtitle: "Leads",
    h1: "Leads",
    emptyTitle: "Noch keine Leads",
    emptyBody:
      "Käuferanfragen zu deinen Inseraten erscheinen hier. Füge eine Wohnung zum Verkauf hinzu, um die ersten Anfragen zu erhalten.",
    addListing: "Inserat hinzufügen",
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

export default async function DeveloperLeadsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params
  const lang = isValidLang(raw) ? raw : "ka"
  const loc = panelLang(lang)
  const T = L[loc]
  const user = await requireRole("developer", "/developer")

  const listingRows = await safeQuery(
    () =>
      db.listing.findMany({
        where: listingOwnerWhere([user.id]),
        select: { id: true, title: true },
      }),
    [],
  )
  const listingIds = listingRows.map((l) => l.id)
  const titles = Object.fromEntries(listingRows.map((l) => [l.id, l.title]))

  const leads = await safeQuery(
    () =>
      db.inquiry.findMany({
        where: inquiryWhere(listingIds, user.email, [user.id]),
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    [],
  )

  return (
    <DashboardShell
      nav={developerNav(lang)}
      title={T.title}
      subtitle={T.subtitle}
      userLabel={user.name ?? user.email}
    >
      <h1 className="mb-5 text-[22px] font-black tracking-tight text-sv-ink">
        {T.h1}
      </h1>

      <CrmClients ownerIds={[user.id]} lang={lang} />

      {leads.length === 0 ? (
        <EmptyState
          title={T.emptyTitle}
          body={T.emptyBody}
          actionHref="/add-listing?deal=sale&propType=apartment"
          actionLabel={T.addListing}
        />
      ) : (
        <LeadInbox leads={leads} titles={titles} lang={lang} />
      )}
    </DashboardShell>
  )
}
