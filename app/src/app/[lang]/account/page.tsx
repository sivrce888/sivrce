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

export const dynamic = "force-dynamic"

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "ჩემი სივრცე",
    robots: { index: false, follow: true },
  }
}

export default async function AccountPage() {
  const user = await requireUser("/account")
  const rawPersona = await readPersona(user.role)
  const persona = user.role === "buyer" ? rawPersona : "buyer"
  const rent = isRentFocus(persona)
  const first = user.name?.trim().split(/\s+/)[0]
  const hello = first ? `გამარჯობა, ${first}` : rent ? "ქირის ძიება" : "სახლის ძიება"

  return (
    <DashboardShell
      nav={buyerNav}
      title={panelTitle(persona)}
      subtitle="მიმოხილვა"
      userLabel={user.name ?? user.email}
    >
      <div className="mb-6">
        <h1 className="text-[22px] font-black tracking-[-0.03em] text-sv-ink">{hello}</h1>
        <p className="mt-1 text-[13.5px] font-medium text-sv-ink/50">
          {rent
            ? "შენახული ქირები, ვიზიტები და შეტყობინებები — ერთ ადგილას."
            : "ფავორიტები, შედარება, ვიზიტები — ყველაფერი რაც ძიებას სჭირდება."}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <LocalizedLink
            href={searchHref(rent ? "rent" : "sale")}
            className="inline-flex h-11 items-center gap-1.5 rounded-full bg-sv-orange px-5 text-[13px] font-extrabold text-white shadow-glow-orange transition hover:opacity-95"
          >
            <Search size={15} strokeWidth={2.5} aria-hidden />
            {rent ? "ქირის ძიება" : "სახლის ძიება"}
          </LocalizedLink>
          <LocalizedLink
            href={searchHref(rent ? "sale" : "rent")}
            className="inline-flex h-11 items-center gap-1.5 rounded-full border border-sv-ink/12 bg-sv-surface px-5 text-[13px] font-extrabold text-sv-ink transition hover:border-sv-blue hover:text-sv-blue"
          >
            <KeyRound size={15} aria-hidden />
            {rent ? "საყიდლად" : "ქირით"}
          </LocalizedLink>
          <LocalizedLink
            href="/favorites"
            className="inline-flex h-11 items-center gap-1.5 rounded-full border border-sv-ink/12 bg-sv-surface px-5 text-[13px] font-extrabold text-sv-ink transition hover:border-sv-blue hover:text-sv-blue"
          >
            <Heart size={15} aria-hidden />
            ფავორიტები
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
