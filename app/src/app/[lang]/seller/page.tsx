import type { Metadata } from "next"
import LocalizedLink from "@/components/LocalizedLink"
import { Building2, Eye, KeyRound, Plus, TrendingUp, Users } from "lucide-react"

import DashboardShell from "@/components/dashboard/DashboardShell"
import StatCard from "@/components/dashboard/StatCard"
import EmptyState from "@/components/dashboard/EmptyState"
import { sellerNav } from "@/components/seller-dashboard/nav"
import { db } from "@/lib/db"
import { requireRole, safeQuery } from "@/lib/guards"
import { phoneRevealsOf } from "@/lib/inquiries/phone"
import { inquiryWhere } from "@/lib/pro-leads"
import {
  addListingHref,
  isRentFocus,
  panelTitle,
} from "@/lib/workspace"
import { readPersona } from "@/lib/workspace-cookie"
import { isValidLang } from "@/lib/i18n/core"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "გამყიდველის პანელი",
  robots: { index: false },
}

const L = {
  ka: {
    subtitle: "მიმოხილვა",
    addRent: "დაამატე გასაქირავებელი",
    add: "დაამატე განცხადება",
    statSale: "იყიდება",
    statRent: "ქირავდება",
    statViews: "ნახვები",
    statLeads: "ლიდები",
    hintActive: "აქტიური",
    hintAll: "ყველა განცხადება",
    hintRequests: "მოთხოვნები",
    closedRent: "გაქირავებული",
    closedSale: "დახურული",
    closedSaleHint: "მათ შორის ქირა:",
    phoneViews: "ნომრის ნახვა:",
    recentLeads: "ბოლო ლიდები",
    all: "ყველა →",
    emptyLeadsTitle: "ლიდები ჯერ არ გაქვს",
    emptyRent: "დამქირავებელის მოთხოვნა აქ გამოჩნდება, როგორც კი დაგიკავშირდება.",
    emptySale: "მყიდველის მოთხოვნა აქ გამოჩნდება, როგორც კი დაგიკავშირდება.",
    quick: "სწრაფი ქმედებები",
    quickRent: "+ ქირის განცხადება",
    quickNew: "+ ახალი განცხადება",
    manage: "განცხადებების მართვა",
    tours: "ვიზიტები",
    vip: "VIP ტარიფები",
  },
  en: {
    subtitle: "Overview",
    addRent: "Add rental",
    add: "Add listing",
    statSale: "For sale",
    statRent: "For rent",
    statViews: "Views",
    statLeads: "Leads",
    hintActive: "Active",
    hintAll: "All listings",
    hintRequests: "Requests",
    closedRent: "Rented",
    closedSale: "Closed",
    closedSaleHint: "incl. rentals:",
    phoneViews: "Phone views:",
    recentLeads: "Recent leads",
    all: "All →",
    emptyLeadsTitle: "You have no leads yet",
    emptyRent: "A renter's request will appear here as soon as they contact you.",
    emptySale: "A buyer's request will appear here as soon as they contact you.",
    quick: "Quick actions",
    quickRent: "+ Rental listing",
    quickNew: "+ New listing",
    manage: "Manage listings",
    tours: "Tours",
    vip: "VIP pricing",
  },
  de: {
    subtitle: "Überblick",
    addRent: "Mietobjekt hinzufügen",
    add: "Inserat hinzufügen",
    statSale: "Zu verkaufen",
    statRent: "Zur Miete",
    statViews: "Aufrufe",
    statLeads: "Anfragen",
    hintActive: "Aktiv",
    hintAll: "Alle Inserate",
    hintRequests: "Anfragen",
    closedRent: "Vermietet",
    closedSale: "Geschlossen",
    closedSaleHint: "davon Miete:",
    phoneViews: "Rufnummernaufrufe:",
    recentLeads: "Letzte Anfragen",
    all: "Alle →",
    emptyLeadsTitle: "Noch keine Anfragen",
    emptyRent: "Die Anfrage eines Mieters erscheint hier, sobald er mit Ihnen Kontakt aufnimmt.",
    emptySale: "Die Anfrage eines Käufers erscheint hier, sobald er mit Ihnen Kontakt aufnimmt.",
    quick: "Schnellaktionen",
    quickRent: "+ Mietinserat",
    quickNew: "+ Neues Inserat",
    manage: "Inserate verwalten",
    tours: "Besichtigungen",
    vip: "VIP-Tarife",
  },
} as const

export default async function SellerOverviewPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params
  const lang = isValidLang(raw) ? raw : "ka"
  const c = L[lang === "en" ? "en" : lang === "de" ? "de" : "ka"]
  const user = await requireRole("seller", "/seller")
  const persona = await readPersona(user.role)
  const rent = isRentFocus(persona)
  const addHref = addListingHref(persona)

  const listings = await safeQuery(
    () =>
      db.listing.findMany({
        where: { ownerId: user.id, deletedAt: null },
        select: {
          id: true,
          status: true,
          views: true,
          dealType: true,
          extendedFields: true,
        },
      }),
    [],
  )

  const listingIds = listings.map((r) => r.id)
  const leadWhere = inquiryWhere(listingIds, user.email)
  const totalViews = listings.reduce((sum, l) => sum + l.views, 0)
  const totalReveals = listings.reduce((sum, l) => sum + phoneRevealsOf(l.extendedFields), 0)
  const activeSale = listings.filter((l) => l.status === "active" && l.dealType === "buy").length
  const activeRent = listings.filter(
    (l) => l.status === "active" && (l.dealType === "rent" || l.dealType === "daily"),
  ).length
  const closedSale = listings.filter((l) => l.status === "sold" && l.dealType === "buy").length
  const closedRent = listings.filter(
    (l) => l.status === "sold" && (l.dealType === "rent" || l.dealType === "daily"),
  ).length

  const [recentLeads, totalLeads] = await Promise.all([
    safeQuery(
      () =>
        db.inquiry.findMany({
          where: leadWhere,
          orderBy: { createdAt: "desc" },
          take: 5,
        }),
      [],
    ),
    safeQuery(() => db.inquiry.count({ where: leadWhere }), 0),
  ])

  return (
    <DashboardShell
      nav={sellerNav(lang)}
      title={panelTitle(persona, lang)}
      subtitle={c.subtitle}
      userLabel={user.name ?? user.email}
    >
      <div className="mb-5 flex justify-end">
        <LocalizedLink
          href={addHref}
          className="inline-flex items-center gap-1.5 rounded-full bg-sv-orange px-5 py-2.5 text-[13px] font-bold text-sv-ink shadow-glow-orange transition hover:opacity-95"
        >
          <Plus size={15} strokeWidth={2.5} />
          {rent ? c.addRent : c.add}
        </LocalizedLink>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-5">
        <StatCard
          label={c.statSale}
          value={activeSale}
          hint={c.hintActive}
          icon={<Building2 size={18} />}
        />
        <StatCard
          label={c.statRent}
          value={activeRent}
          hint={c.hintActive}
          icon={<KeyRound size={18} />}
        />
        <StatCard label={c.statViews} value={totalViews} hint={c.hintAll} icon={<Eye size={18} />} />
        <StatCard
          label={c.statLeads}
          value={totalLeads}
          hint={c.hintRequests}
          icon={<Users size={18} />}
        />
        <StatCard
          label={rent ? c.closedRent : c.closedSale}
          value={rent ? closedRent : closedSale + closedRent}
          hint={rent ? undefined : `${c.closedSaleHint} ${closedRent}`}
          icon={<TrendingUp size={18} />}
        />
      </div>
      {totalReveals > 0 ? (
        <p className="mt-3 text-[12px] font-semibold text-sv-ink/60">
          {c.phoneViews} {totalReveals}
        </p>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-card border border-sv-ink/6 bg-sv-surface p-5 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[15px] font-extrabold text-sv-ink">{c.recentLeads}</h2>
            <LocalizedLink
              href="/seller/leads"
              className="text-[12px] font-bold text-sv-blue hover:underline"
            >
              {c.all}
            </LocalizedLink>
          </div>
          {recentLeads.length === 0 ? (
            <EmptyState
              title={c.emptyLeadsTitle}
              body={rent ? c.emptyRent : c.emptySale}
            />
          ) : (
            <ul className="divide-y divide-sv-ink/6">
              {recentLeads.map((lead) => (
                <li key={lead.id} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-bold text-sv-ink">{lead.buyerName}</p>
                    <p className="truncate text-[12px] font-medium text-sv-ink/60">
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
            <h2 className="text-[15px] font-extrabold text-sv-ink">{c.quick}</h2>
          </div>
          <div className="flex flex-col gap-3">
            <LocalizedLink
              href={addHref}
              className="rounded-full bg-sv-orange px-5 py-3.5 text-center text-[14px] font-bold text-sv-ink shadow-glow-orange transition hover:opacity-95"
            >
              {rent ? c.quickRent : c.quickNew}
            </LocalizedLink>
            <LocalizedLink
              href="/seller/listings"
              className="rounded-full border border-sv-ink/12 bg-sv-surface px-5 py-3.5 text-center text-[14px] font-bold text-sv-ink transition hover:border-sv-blue hover:text-sv-blue"
            >
              {c.manage}
            </LocalizedLink>
            <LocalizedLink
              href="/seller/tours"
              className="rounded-full border border-sv-ink/12 bg-sv-surface px-5 py-3.5 text-center text-[14px] font-bold text-sv-ink transition hover:border-sv-blue hover:text-sv-blue"
            >
              {c.tours}
            </LocalizedLink>
            <LocalizedLink
              href="/advertise"
              className="rounded-full border border-sv-ink/12 bg-sv-surface px-5 py-3.5 text-center text-[14px] font-bold text-sv-ink transition hover:border-sv-blue hover:text-sv-blue"
            >
              {c.vip}
            </LocalizedLink>
          </div>
        </section>
      </div>
    </DashboardShell>
  )
}
