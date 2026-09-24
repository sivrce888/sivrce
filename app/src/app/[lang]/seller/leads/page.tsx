import type { Metadata } from "next"

import DashboardShell from "@/components/dashboard/DashboardShell"
import EmptyState from "@/components/dashboard/EmptyState"
import LeadInbox from "@/components/dashboard/LeadInbox"
import { sellerNav } from "@/components/seller-dashboard/nav"
import { db } from "@/lib/db"
import { requireRole, safeQuery } from "@/lib/guards"
import { inquiryWhere, listingOwnerWhere } from "@/lib/pro-leads"
import { isRentFocus, panelTitle } from "@/lib/workspace"
import { readPersona } from "@/lib/workspace-cookie"
import { isValidLang, panelLang } from "@/lib/i18n/core"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "ლიდები · გამყიდველი",
  robots: { index: false },
}

const L = {
  ka: {
    subtitle: "ლიდები",
    all: "ყველა ლიდი",
    emptyTitle: "ლიდები ჯერ არ გაქვს",
    emptyRent: "ახალი მოთხოვნები აქ გამოჩნდება, როცა დამქირავებელი დაინტერესდება შენი განცხადებით.",
    emptySale: "ახალი მოთხოვნები აქ გამოჩნდება, როცა მყიდველი დაინტერესდება შენი განცხადებით.",
    addAction: "განცხადების დამატება",
  },
  en: {
    subtitle: "Leads",
    all: "All leads",
    emptyTitle: "You have no leads yet",
    emptyRent: "New requests will appear here when a renter is interested in your listing.",
    emptySale: "New requests will appear here when a buyer is interested in your listing.",
    addAction: "Add a listing",
  },
  de: {
    subtitle: "Anfragen",
    all: "Alle Anfragen",
    emptyTitle: "Noch keine Anfragen",
    emptyRent:
      "Neue Anfragen erscheinen hier, sobald sich ein Mieter für Ihr Inserat interessiert.",
    emptySale:
      "Neue Anfragen erscheinen hier, sobald sich ein Käufer für Ihr Inserat interessiert.",
    addAction: "Inserat hinzufügen",
  },
} as const

export default async function SellerLeadsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params
  const lang = isValidLang(raw) ? raw : "ka"
  const c = L[panelLang(lang)]
  const user = await requireRole("seller", "/seller")
  const persona = await readPersona(user.role)
  const rent = isRentFocus(persona)

  // ponytail: sellers share Inquiry model (no seller CRM); ceiling = CrmLead when seller CRM ships
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
        where: inquiryWhere(listingIds, user.email),
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    [],
  )

  return (
    <DashboardShell
      nav={sellerNav(lang)}
      title={panelTitle(persona, lang)}
      subtitle={c.subtitle}
      userLabel={user.name ?? user.email}
    >
      <h2 className="mb-6 text-[18px] font-extrabold tracking-tight text-sv-ink">
        {c.all} ({leads.length})
      </h2>

      {leads.length === 0 ? (
        <EmptyState
          title={c.emptyTitle}
          body={rent ? c.emptyRent : c.emptySale}
          actionHref="/add-listing"
          actionLabel={c.addAction}
        />
      ) : (
        <LeadInbox leads={leads} titles={titles} lang={lang} />
      )}
    </DashboardShell>
  )
}
