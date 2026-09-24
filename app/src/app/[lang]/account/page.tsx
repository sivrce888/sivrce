import type { Metadata } from "next"
import { Heart, KeyRound, Search } from "lucide-react"

import FavoritesCard from "@/components/account/FavoritesCard"
import MyInquiries from "@/components/account/MyInquiries"
import MyReviews from "@/components/account/MyReviews"
import MyTours from "@/components/account/MyTours"
import RecentlyViewed from "@/components/account/RecentlyViewed"
import SavedSearchesCard from "@/components/account/SavedSearchesCard"
import DashboardShell from "@/components/dashboard/DashboardShell"
import LocalizedLink from "@/components/LocalizedLink"
import { buyerNav } from "@/lib/dashboard-nav"
import { requireUser } from "@/lib/guards"
import { isRentFocus, panelTitle, searchHref } from "@/lib/workspace"
import { readPersona } from "@/lib/workspace-cookie"
import { isValidLang, panelLang } from "@/lib/i18n/core"

export const dynamic = "force-dynamic"

const L = {
  ka: {
    meta: "ჩემი სივრცე",
    hi: "გამარჯობა",
    overview: "მიმოხილვა",
    findRent: "ქირის ძიება",
    findHome: "სახლის ძიება",
    rentDesc: "შენახული ქირები, ვიზიტები და შეტყობინებები — ერთ ადგილას.",
    homeDesc: "ფავორიტები, შედარება, ვიზიტები — ყველაფერი, რაც ძიებას სჭირდება.",
    toBuy: "საყიდლად",
    toRent: "ქირით",
    favorites: "ფავორიტები",
  },
  en: {
    meta: "My space",
    hi: "Hi",
    overview: "Overview",
    findRent: "Find a rental",
    findHome: "Find a home",
    rentDesc: "Saved rentals, viewings and alerts — in one place.",
    homeDesc: "Favorites, compare, viewings — everything your search needs.",
    toBuy: "To buy",
    toRent: "To rent",
    favorites: "Favorites",
  },
  de: {
    meta: "Mein Bereich",
    hi: "Hallo",
    overview: "Überblick",
    findRent: "Mietwohnung finden",
    findHome: "Zuhause finden",
    rentDesc: "Gemerkte Mietobjekte, Besichtigungen und Benachrichtigungen — an einem Ort.",
    homeDesc: "Favoriten, Vergleich, Besichtigungen — alles für Ihre Suche.",
    toBuy: "Kaufen",
    toRent: "Mieten",
    favorites: "Favoriten",
  },
} as const

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang } = await params
  return {
    title: L[panelLang(lang)].meta,
    robots: { index: false, follow: true },
  }
}

export default async function AccountPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params
  const lang = isValidLang(raw) ? raw : "ka"
  const c = L[panelLang(lang)]
  const user = await requireUser("/account")
  const rawPersona = await readPersona(user.role)
  const persona = user.role === "buyer" ? rawPersona : "buyer"
  const rent = isRentFocus(persona)
  const first = user.name?.trim().split(/\s+/)[0]
  const hello = first ? `${c.hi}, ${first}` : rent ? c.findRent : c.findHome

  return (
    <DashboardShell
      nav={buyerNav(lang)}
      title={panelTitle(persona, lang)}
      subtitle={c.overview}
      userLabel={user.name ?? user.email}
    >
      <div className="mb-6">
        <h1 className="text-[22px] font-black tracking-[-0.03em] text-sv-ink">{hello}</h1>
        <p className="mt-1 text-[13.5px] font-medium text-sv-ink/60">
          {rent ? c.rentDesc : c.homeDesc}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <LocalizedLink
            href={searchHref(rent ? "rent" : "sale")}
            className="inline-flex h-11 items-center gap-1.5 rounded-full bg-sv-orange px-5 text-[13px] font-extrabold text-sv-ink shadow-glow-orange transition hover:opacity-95"
          >
            <Search size={15} strokeWidth={2.5} aria-hidden />
            {rent ? c.findRent : c.findHome}
          </LocalizedLink>
          <LocalizedLink
            href={searchHref(rent ? "sale" : "rent")}
            className="inline-flex h-11 items-center gap-1.5 rounded-full border border-sv-ink/12 bg-sv-surface px-5 text-[13px] font-extrabold text-sv-ink transition hover:border-sv-blue hover:text-sv-blue"
          >
            <KeyRound size={15} aria-hidden />
            {rent ? c.toBuy : c.toRent}
          </LocalizedLink>
          <LocalizedLink
            href="/favorites"
            className="inline-flex h-11 items-center gap-1.5 rounded-full border border-sv-ink/12 bg-sv-surface px-5 text-[13px] font-extrabold text-sv-ink transition hover:border-sv-blue hover:text-sv-blue"
          >
            <Heart size={15} aria-hidden />
            {c.favorites}
          </LocalizedLink>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <FavoritesCard />
        <SavedSearchesCard />
        <MyTours />
        <MyInquiries />
      </div>
      <div className="mt-6 grid gap-6">
        <MyReviews signedIn />
        <RecentlyViewed hideWhenEmpty={false} />
      </div>
    </DashboardShell>
  )
}
