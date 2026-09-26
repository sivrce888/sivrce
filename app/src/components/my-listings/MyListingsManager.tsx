"use client"

/**
 * Owner listings manager — myhome-style control: filters, edit/disable/delete,
 * lifetime bar, boost pills, analytics. Brand tokens only.
 */

import { useMemo, useState, useTransition, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import {
  BarChart3,
  Crown,
  Eye,
  Heart,
  Flame,
  Loader2,
  MessagesSquare,
  MessageCircle,
  Palette,
  Pencil,
  Phone,
  Plus,
  Power,
  Rocket,
  RotateCw,
  Search,
  Share2,
  Sparkles,
  Trash2,
  TrendingDown,
  Zap,
  CircleCheck,
  CircleDot,
} from "lucide-react"

import LocalizedLink, { localizeHref } from "@/components/LocalizedLink"
import EmptyState from "@/components/dashboard/EmptyState"
import { CurrencySwitcher } from "@/components/CurrencySwitcher"
import { openWhatsAppShare } from "@/components/listing/SharePack"
import { listingPriceLabel } from "@/lib/listing-share"
import { useCurrency } from "@/lib/currency"
import { useI18n } from "@/lib/i18n/context"
import {
  listingExpiresAt,
  listingFilterStatus,
  listingLifeRemaining,
} from "@/lib/listings/lifetime"
import {
  ADDON_TETRI,
  formatGel,
  tierKeyToBadge,
  tierRankOf,
  type CheckoutAddon,
} from "@/lib/promo-pricing"
import { panelLang } from "@/lib/i18n/core"

export type ManagedListing = {
  id: string
  title: string
  description: string
  city: string
  district: string
  price: number
  currency: string
  status: string
  tier: string
  tierExpiresAt: string | null
  views: number
  leads: number
  /** Signed-in users who hearted it (saved_listings). */
  saves: number
  phoneReveals: number
    image: string
    createdAt: string
    updatedAt: string
    dealType: string
}

type StatusTab = "active" | "pending" | "withdrawn" | "sold" | "expired"
type DealTab = "all" | "buy" | "rent" | "daily" | "mortgage"

const TABS: StatusTab[] = ["active", "pending", "withdrawn", "sold", "expired"]

const DEAL_TABS: DealTab[] = ["all", "buy", "rent", "daily", "mortgage"]

function isRentDeal(dealType: string): boolean {
  return dealType === "rent" || dealType === "daily"
}

const SORTS = [
  "updated_desc",
  "created_desc",
  "views_desc",
  "price_desc",
  "price_asc",
] as const

type SortKey = (typeof SORTS)[number]

const L = {
  ka: {
    title: "ჩემი განცხადებები",
    add: "დამატება",
    emptyTitle: "განცხადებები ჯერ არ გაქვს",
    emptyRent: "დაამატე ქირის განცხადება და ის აქ გამოჩნდება.",
    emptyFirst: "დაამატე შენი პირველი განცხადება და ის აქ გამოჩნდება.",
    emptyAction: "განცხადების დამატება",
    searchPh: "ID, სიტყვა, უბანი…",
    sortAria: "დალაგება",
    emptyFiltered: "ამ ფილტრში განცხადება არ არის",
    error: "შეცდომა",
    networkError: "ქსელის შეცდომა",
    refreshCooldown: "განახლება ხელმისაწვდომია 1 საათში",
    rateLimited: "ძალიან ბევრი მცდელობა — სცადე 10 წუთში",
    confirmDelete: "წავშალოთ განცხადება? მოქმედება შეუქცევადია.",
    confirmRented: "მოვნიშნოთ გაქირავებულად? განცხადება აღარ გამოჩნდება ძიებაში.",
    confirmSold: "მოვნიშნოთ გაყიდულად? განცხადება აღარ გამოჩნდება ძიებაში.",
    priceOnRequest: "ფასი მოთხოვნით",
    edit: "რედაქტირება",
    disable: "გამორთვა",
    enable: "ჩართვა",
    delete: "წაშლა",
    expires: "ვადა",
    sendToClient: "გაუგზავნე კლიენტს",
    rented: "გაქირავებულია",
    sold: "გაყიდულია",
    renew30: "გაგრძელება +30 დღე",
    analytics: "ანალიტიკა",
    statViews: "ნახვა",
    statLeads: "ლიდი",
    statCalls: "ნომერი",
    statSaves: "შენახვა",
    statusTab: {
      active: "აქტიური",
      pending: "მოლოდინში",
      withdrawn: "გამორთული",
      sold: "დახურული",
      expired: "ვადაგასული",
    },
    dealTab: {
      all: "ყველა",
      buy: "იყიდება",
      rent: "ქირავდება",
      daily: "დღიურად",
      mortgage: "იპოთეკა",
    } as Record<string, string>,
    sort: {
      updated_desc: "განახლება ↓",
      created_desc: "დამატება ↓",
      views_desc: "ნახვები ↓",
      price_desc: "ფასი ↓",
      price_asc: "ფასი ↑",
    },
    boost: {
      vip: "VIP",
      super_vip: "VIP+",
      diamond: "SUPER VIP",
      turbo_7: "Turbo",
      story: "სთორი",
      sticker_urgent: "სასწრაფოდ",
      sticker_price_drop: "ფასი↓",
      color: "ფერი",
      refresh_once: "განახლება",
      facebook: "FB",
    } as Record<string, string>,
  },
  en: {
    title: "My listings",
    add: "Add",
    emptyTitle: "You have no listings yet",
    emptyRent: "Add a rental listing and it will appear here.",
    emptyFirst: "Add your first listing and it will appear here.",
    emptyAction: "Add a listing",
    searchPh: "ID, keyword, area…",
    sortAria: "Sort",
    emptyFiltered: "No listings match these filters",
    error: "Error",
    networkError: "Network error",
    refreshCooldown: "Refresh is available once an hour",
    rateLimited: "Too many attempts — try again in 10 minutes",
    confirmDelete: "Delete this listing? This action cannot be undone.",
    confirmRented: "Mark as rented? The listing will no longer appear in search.",
    confirmSold: "Mark as sold? The listing will no longer appear in search.",
    priceOnRequest: "Price on request",
    edit: "Edit",
    disable: "Disable",
    enable: "Enable",
    delete: "Delete",
    expires: "Expires",
    sendToClient: "To client",
    rented: "Rented",
    sold: "Sold",
    renew30: "Extend +30 days",
    analytics: "Analytics",
    statViews: "Views",
    statLeads: "Leads",
    statCalls: "Calls",
    statSaves: "Saves",
    statusTab: {
      active: "Active",
      pending: "Pending",
      withdrawn: "Disabled",
      sold: "Closed",
      expired: "Expired",
    },
    dealTab: {
      all: "All",
      buy: "For sale",
      rent: "For rent",
      daily: "Daily",
      mortgage: "Mortgage",
    } as Record<string, string>,
    sort: {
      updated_desc: "Updated ↓",
      created_desc: "Newest ↓",
      views_desc: "Views ↓",
      price_desc: "Price ↓",
      price_asc: "Price ↑",
    },
    boost: {
      vip: "VIP",
      super_vip: "VIP+",
      diamond: "SUPER VIP",
      turbo_7: "Turbo",
      story: "Story",
      sticker_urgent: "Urgent",
      sticker_price_drop: "Price↓",
      color: "Color",
      refresh_once: "Refresh",
      facebook: "FB",
    } as Record<string, string>,
  },
  de: {
    title: "Meine Inserate",
    add: "Hinzufügen",
    emptyTitle: "Noch keine Inserate",
    emptyRent: "Fügen Sie ein Mietinserat hinzu — es erscheint hier.",
    emptyFirst: "Fügen Sie Ihr erstes Inserat hinzu — es erscheint hier.",
    emptyAction: "Inserat hinzufügen",
    searchPh: "ID, Stichwort, Ort…",
    sortAria: "Sortieren",
    emptyFiltered: "Keine Inserate für diese Filter",
    error: "Fehler",
    networkError: "Netzwerkfehler",
    refreshCooldown: "Aktualisierung nur einmal pro Stunde möglich",
    rateLimited: "Zu viele Versuche — bitte in 10 Minuten erneut versuchen",
    confirmDelete: "Dieses Inserat löschen? Diese Aktion kann nicht rückgängig gemacht werden.",
    confirmRented: "Als vermietet markieren? Das Inserat erscheint nicht mehr in der Suche.",
    confirmSold: "Als verkauft markieren? Das Inserat erscheint nicht mehr in der Suche.",
    priceOnRequest: "Preis auf Anfrage",
    edit: "Bearbeiten",
    disable: "Deaktivieren",
    enable: "Aktivieren",
    delete: "Löschen",
    expires: "Läuft ab",
    sendToClient: "An Kunden",
    rented: "Vermietet",
    sold: "Verkauft",
    renew30: "Verlängern +30 Tage",
    analytics: "Analysen",
    statViews: "Aufrufe",
    statLeads: "Leads",
    statCalls: "Anrufe",
    statSaves: "Gemerkt",
    statusTab: {
      active: "Aktiv",
      pending: "Ausstehend",
      withdrawn: "Deaktiviert",
      sold: "Geschlossen",
      expired: "Abgelaufen",
    },
    dealTab: {
      all: "Alle",
      buy: "Zu verkaufen",
      rent: "Zur Miete",
      daily: "Täglich",
      mortgage: "Hypothek",
    } as Record<string, string>,
    sort: {
      updated_desc: "Aktualisiert ↓",
      created_desc: "Neueste ↓",
      views_desc: "Aufrufe ↓",
      price_desc: "Preis ↓",
      price_asc: "Preis ↑",
    },
    boost: {
      vip: "VIP",
      super_vip: "VIP+",
      diamond: "SUPER VIP",
      turbo_7: "Turbo",
      story: "Story",
      sticker_urgent: "Dringend",
      sticker_price_drop: "Preis↓",
      color: "Farbe",
      refresh_once: "Aktualisieren",
      facebook: "FB",
    } as Record<string, string>,
  },
} as const

type Loc = keyof typeof L
type Strings = (typeof L)[Loc]

function stringsFor(lang: string): Strings {
  const loc: Loc = panelLang(lang)
  return L[loc]
}

const DT_FMT = {
  ka: new Intl.DateTimeFormat("ka-GE", {
    day: "2-digit", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit",
  }),
  en: new Intl.DateTimeFormat("en-GB", {
    day: "2-digit", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit",
  }),
  de: new Intl.DateTimeFormat("de-DE", {
    day: "2-digit", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit",
  }),
}
function dateTimeFmt(lang: string) {
  return DT_FMT[panelLang(lang)]
}

const BOOST_PILLS: Array<{
  key: string
  kind: "tier" | "addon"
  tier?: string
  addon?: CheckoutAddon
  icon: typeof Sparkles
  className: string
}> = [
  {
    key: "vip",
    kind: "tier",
    tier: "vip",
    icon: Flame,
    className: "bg-sv-navy text-white hover:bg-sv-navy-soft",
  },
  {
    key: "super_vip",
    kind: "tier",
    tier: "super_vip",
    icon: Sparkles,
    className: "bg-gradient-to-r from-sv-blue to-sv-violet text-white",
  },
  {
    key: "diamond",
    kind: "tier",
    tier: "diamond",
    icon: Crown,
    className: "bg-gradient-to-r from-sv-orange to-sv-orange-deep text-sv-ink shadow-glow-orange",
  },
  {
    key: "turbo_7",
    kind: "addon",
    addon: "turbo_7",
    icon: Rocket,
    className: "bg-gradient-to-r from-sv-blue to-sv-violet text-white",
  },
  {
    key: "story",
    kind: "addon",
    addon: "story",
    icon: CircleDot,
    className: "bg-gradient-to-r from-sv-orange to-sv-orange-deep text-sv-ink",
  },
  {
    key: "sticker_urgent",
    kind: "addon",
    addon: "sticker_urgent",
    icon: Zap,
    className: "bg-sv-orange text-sv-ink hover:bg-sv-orange-deep",
  },
  {
    key: "sticker_price_drop",
    kind: "addon",
    addon: "sticker_price_drop",
    icon: TrendingDown,
    className: "bg-sv-navy text-white hover:bg-sv-navy-soft",
  },
  {
    key: "color",
    kind: "addon",
    addon: "color",
    icon: Palette,
    className: "bg-sv-cloud text-sv-ink ring-1 ring-sv-ink/8 hover:bg-sv-blue/8 hover:text-sv-blue",
  },
  {
    key: "refresh_once",
    kind: "addon",
    addon: "refresh_once",
    icon: RotateCw,
    className: "bg-sv-cloud text-sv-ink ring-1 ring-sv-ink/8 hover:bg-sv-blue/8 hover:text-sv-blue",
  },
  {
    key: "facebook",
    kind: "addon",
    addon: "facebook",
    icon: Share2,
    className: "bg-sv-cloud text-sv-ink ring-1 ring-sv-ink/8 hover:bg-sv-blue/8 hover:text-sv-blue",
  },
]

function priceAsGel(price: number, currency: string, rate: number): number {
  if (currency === "USD") return Math.round(price * rate)
  return price
}

export default function MyListingsManager({
  listings: initial,
  addHref = "/add-listing",
  focusRent = false,
}: {
  listings: ManagedListing[]
  addHref?: string
  focusRent?: boolean
}) {
  const router = useRouter()
  const { lang } = useI18n()
  const str = stringsFor(lang)
  const { format, rate } = useCurrency()
  const [items, setItems] = useState(initial)
  // Reset-on-props: patch()/remove() merge locally for instant feedback, then
  // router.refresh() delivers full server truth (auto-expiry, badges) which
  // useState alone would drop.
  const [seeded, setSeeded] = useState(initial)
  if (initial !== seeded) {
    setSeeded(initial)
    setItems(initial)
  }
  const [tab, setTab] = useState<StatusTab>("active")
  const [dealTab, setDealTab] = useState<DealTab>(() =>
    focusRent && initial.some((l) => isRentDeal(l.dealType)) ? "rent" : "all",
  )
  const [q, setQ] = useState("")
  const [sort, setSort] = useState<SortKey>("updated_desc")
  const [busyId, setBusyId] = useState<string | null>(null)
  const [analyticsId, setAnalyticsId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const counts = useMemo(() => {
    const c: Record<StatusTab, number> = {
      active: 0,
      pending: 0,
      withdrawn: 0,
      sold: 0,
      expired: 0,
    }
    for (const l of items) {
      const s = listingFilterStatus(l.status, l.createdAt) as StatusTab
      if (s in c) c[s]++
    }
    return c
  }, [items])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    let rows = items.filter((l) => listingFilterStatus(l.status, l.createdAt) === tab)
    if (dealTab !== "all") {
      rows = rows.filter((l) => l.dealType === dealTab)
    }
    if (needle) {
      rows = rows.filter(
        (l) =>
          l.id.toLowerCase().includes(needle) ||
          l.title.toLowerCase().includes(needle) ||
          l.city.toLowerCase().includes(needle) ||
          l.district.toLowerCase().includes(needle),
      )
    }
    const sorted = [...rows]
    sorted.sort((a, b) => {
      switch (sort) {
        case "created_desc":
          return Date.parse(b.createdAt) - Date.parse(a.createdAt)
        case "views_desc":
          return b.views - a.views
        case "price_desc":
          return b.price - a.price
        case "price_asc":
          return a.price - b.price
        case "updated_desc":
          return Date.parse(b.updatedAt) - Date.parse(a.updatedAt)
        default: {
          const _exhaustive: never = sort
          return _exhaustive
        }
      }
    })
    return sorted
  }, [items, tab, dealTab, q, sort])

  async function patch(id: string, body: Record<string, unknown>) {
    setBusyId(id)
    setError(null)
    try {
      const res = await fetch(`/api/listings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? str.error)
        return false
      }
      setItems((prev) =>
        prev.map((l) =>
          l.id === id
            ? {
                ...l,
                ...(typeof body.status === "string" ? { status: body.status } : {}),
                ...(typeof body.title === "string" ? { title: body.title } : {}),
                ...(typeof body.price === "number" ? { price: body.price } : {}),
                ...(typeof body.description === "string" ? { description: body.description } : {}),
                updatedAt: new Date().toISOString(),
              }
            : l,
        ),
      )
      startTransition(() => router.refresh())
      return true
    } catch {
      setError(str.networkError)
      return false
    } finally {
      setBusyId(null)
    }
  }

  async function remove(id: string) {
    if (!window.confirm(str.confirmDelete)) return
    setBusyId(id)
    setError(null)
    try {
      const res = await fetch(`/api/listings/${id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? str.error)
        return
      }
      setItems((prev) => prev.filter((l) => l.id !== id))
      startTransition(() => router.refresh())
    } catch {
      setError(str.networkError)
    } finally {
      setBusyId(null)
    }
  }

  async function purchase(listingId: string, body: { tier?: string; addon?: string }) {
    setBusyId(listingId)
    setError(null)
    try {
      const res = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          ...body,
          // Seller pills = one-tap 30d packages (day chips live in ბუსტი menu).
          ...(body.tier ? { days: 30 } : {}),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(
          data.error === "refresh_cooldown"
            ? str.refreshCooldown
            : data.error === "rate_limited"
              ? str.rateLimited
              : (data.error ?? str.error),
        )
        return
      }
      if (data.order?.redirectUrl) window.location.assign(data.order.redirectUrl)
    } catch {
      setError(str.networkError)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="min-w-0 text-[18px] font-extrabold tracking-[-0.02em] text-sv-ink sm:text-[20px]">
          {str.title}
          {items.length > 0 ? (
            <span className="ml-2 text-[13px] font-bold text-sv-ink/60">{items.length}</span>
          ) : null}
        </h2>
        <LocalizedLink
          href={addHref}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-sv-orange px-5 py-2.5 text-[13px] font-bold text-sv-ink shadow-glow-orange transition hover:opacity-95"
        >
          <Plus size={15} strokeWidth={2.5} />
          {str.add}
        </LocalizedLink>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title={str.emptyTitle}
          body={focusRent ? str.emptyRent : str.emptyFirst}
          actionHref={addHref}
          actionLabel={str.emptyAction}
        />
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="relative min-w-0 flex-1">
              <Search
                size={15}
                className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-sv-ink/35"
              />
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={str.searchPh}
                className="h-11 w-full rounded-full border-0 bg-sv-cloud pl-10 pr-4 text-[13.5px] font-medium text-sv-ink outline-none ring-1 ring-sv-ink/6 placeholder:text-sv-ink/35 focus:ring-sv-blue/25"
              />
            </label>
            <select
              aria-label={str.sortAria}
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="h-11 shrink-0 rounded-full border-0 bg-sv-cloud px-4 text-[13px] font-bold text-sv-ink outline-none ring-1 ring-sv-ink/6 focus:ring-sv-blue/25"
            >
              {SORTS.map((key) => (
                <option key={key} value={key}>
                  {str.sort[key]}
                </option>
              ))}
            </select>
            <CurrencySwitcher light />
          </div>

          <div className="mb-3 flex gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {DEAL_TABS.map((d) => {
              const active = dealTab === d
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDealTab(d)}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-[12.5px] font-bold transition ${
                    active
                      ? "bg-sv-blue text-white"
                      : "bg-sv-cloud text-sv-ink/60 hover:text-sv-ink"
                  }`}
                >
                  {str.dealTab[d]}
                </button>
              )
            })}
          </div>

          <div className="mb-5 flex gap-1 overflow-x-auto border-b border-sv-ink/6 pb-px [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {TABS.map((t) => {
              const active = tab === t
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`shrink-0 border-b-2 px-3.5 py-2.5 text-[13px] font-bold whitespace-nowrap transition ${
                    active
                      ? "border-sv-blue text-sv-blue"
                      : "border-transparent text-sv-ink/60 hover:text-sv-ink/70"
                  }`}
                >
                  {str.statusTab[t]}
                  <span className="ml-1.5 tabular-nums opacity-70">{counts[t]}</span>
                </button>
              )
            })}
          </div>

          {error ? (
            <p className="mb-3 rounded-control bg-sv-orange/10 px-3 py-2 text-[12.5px] font-bold text-sv-orange">
              {error}
            </p>
          ) : null}

          {filtered.length === 0 ? (
            <p className="rounded-card bg-sv-cloud px-5 py-10 text-center text-[14px] font-semibold text-sv-ink/60">
              {str.emptyFiltered}
            </p>
          ) : (
            <div className="space-y-3">
              {filtered.map((l) => (
                <ListingManageCard
                  key={l.id}
                  listing={l}
                  busy={busyId === l.id}
                  analyticsOpen={analyticsId === l.id}
                  str={str}
                  lang={lang}
                  formatPrice={(n) => format(priceAsGel(n, l.currency, rate))}
                  onToggleAnalytics={() =>
                    setAnalyticsId((id) => (id === l.id ? null : l.id))
                  }
                  onEdit={() =>
                    router.push(
                      localizeHref(`/add-listing?edit=${encodeURIComponent(l.id)}`, lang),
                    )
                  }
                  onToggle={() =>
                    patch(l.id, {
                      status: l.status === "active" ? "withdrawn" : "active",
                    })
                  }
                  onSend={() =>
                    openWhatsAppShare(
                      {
                        title: l.title,
                        district: l.district,
                        city: l.city,
                        priceLabel: listingPriceLabel(l.price, l.currency),
                      },
                      `/listing/${l.id}`,
                      lang,
                    )
                  }
                  onSold={() => {
                    const rent = isRentDeal(l.dealType)
                    if (!window.confirm(rent ? str.confirmRented : str.confirmSold)) return
                    void patch(l.id, { status: "sold" })
                  }}
                  onDelete={() => remove(l.id)}
                  onBoost={(body) => purchase(l.id, body)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function ListingManageCard({
  listing: l,
  busy,
  analyticsOpen,
  str,
  lang,
  formatPrice,
  onToggleAnalytics,
  onEdit,
  onToggle,
  onSend,
  onSold,
  onDelete,
  onBoost,
}: {
  listing: ManagedListing
  busy: boolean
  analyticsOpen: boolean
  str: Strings
  lang: string
  formatPrice: (n: number) => string
  onToggleAnalytics: () => void
  onEdit: () => void
  onToggle: () => void
  onSend: () => void
  onSold: () => void
  onDelete: () => void
  onBoost: (body: { tier?: string; addon?: string }) => void
}) {
  const life = listingLifeRemaining(l.createdAt)
  const expires = listingExpiresAt(l.createdAt)
  const badge = tierKeyToBadge(l.tier)
  const canBoost = l.status === "active" && life > 0
  const currentRank = tierRankOf(l.tier, l.tierExpiresAt)
  const boostPills = BOOST_PILLS.filter(
    (p) =>
      p.kind !== "tier" ||
      tierRankOf(p.tier ?? "standard") >= currentRank,
  )

  return (
    <article className="overflow-hidden rounded-card border border-sv-ink/6 bg-sv-surface shadow-card transition duration-300 ease-[cubic-bezier(0.21,0.65,0.2,1)] hover:shadow-card-hover">
      <div className="flex flex-col gap-4 p-3 sm:flex-row sm:items-stretch sm:gap-4 sm:p-4">
        <LocalizedLink
          href={`/listing/${l.id}`}
          className="relative block aspect-[16/10] w-full shrink-0 overflow-hidden rounded-module bg-sv-cloud sm:aspect-square sm:h-[112px] sm:w-[112px]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary upload hosts */}
          <img src={l.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
          {badge ? (
            <span className="absolute top-2 left-2 rounded-full bg-gradient-to-r from-sv-orange to-sv-orange-deep px-2 py-0.5 text-[10px] font-black tracking-wide text-sv-ink shadow-glow-orange">
              {badge}
            </span>
          ) : null}
        </LocalizedLink>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-bold tabular-nums text-sv-ink/35">
                ID {l.id}
                {str.dealTab[l.dealType] ? (
                  <span className="ml-2 font-extrabold text-sv-blue/70">
                    {str.dealTab[l.dealType]}
                  </span>
                ) : null}
              </p>
              <LocalizedLink
                href={`/listing/${l.id}`}
                className="mt-0.5 line-clamp-2 text-[15px] font-extrabold tracking-[-0.02em] text-sv-ink transition hover:text-sv-blue"
              >
                {l.title}
              </LocalizedLink>
              <p className="mt-2 text-[20px] font-black tracking-[-0.03em] text-sv-ink tabular-nums">
                {l.price > 0 ? formatPrice(l.price) : str.priceOnRequest}
              </p>
            </div>

            <div className="flex shrink-0 flex-col gap-1.5">
              <IconBtn label={str.edit} onClick={onEdit} disabled={busy}>
                <Pencil size={15} />
              </IconBtn>
              <IconBtn
                label={l.status === "active" ? str.disable : str.enable}
                onClick={onToggle}
                disabled={busy || l.status === "sold"}
              >
                {busy ? <Loader2 size={15} className="animate-spin" /> : <Power size={15} />}
              </IconBtn>
              <IconBtn label={str.delete} onClick={onDelete} disabled={busy} danger>
                <Trash2 size={15} />
              </IconBtn>
            </div>
          </div>

          <div className="mt-auto">
            <div className="mb-1.5 flex items-center justify-between gap-2 text-[11px] font-semibold text-sv-ink/60">
              <span>{dateTimeFmt(lang).format(new Date(l.createdAt))}</span>
              <span>
                {str.expires} {dateTimeFmt(lang).format(expires)}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-sv-ink/[0.06]">
              <div
                className={`h-full rounded-full transition-[width] ${
                  life > 0.25
                    ? "bg-gradient-to-r from-sv-blue to-sv-blue-light"
                    : life > 0
                      ? "bg-sv-orange"
                      : "bg-sv-ink/25"
                }`}
                style={{ width: `${Math.max(life * 100, life > 0 ? 4 : 0)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-sv-ink/5 bg-sv-cloud/40 px-3 py-2.5 sm:px-4">
        {l.status === "active" ? (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={onSend}
              className="inline-flex items-center gap-1 rounded-full bg-sv-orange px-2.5 py-1.5 text-[11px] font-extrabold text-sv-ink shadow-glow-orange transition hover:opacity-95 disabled:opacity-50"
            >
              <MessageCircle size={12} strokeWidth={2.4} />
              {str.sendToClient}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={onSold}
              className="inline-flex items-center gap-1 rounded-full bg-sv-navy px-2.5 py-1.5 text-[11px] font-extrabold text-white transition hover:bg-sv-navy-soft disabled:opacity-50"
            >
              <CircleCheck size={12} strokeWidth={2.4} />
              {isRentDeal(l.dealType) ? str.rented : str.sold}
            </button>
          </>
        ) : null}
        {canBoost
          ? boostPills.map((p) => {
              const renew =
                p.kind === "tier" &&
                currentRank > 0 &&
                tierRankOf(p.tier ?? "standard") === currentRank
              return (
              <button
                key={p.key}
                type="button"
                disabled={busy}
                onClick={() =>
                  onBoost(p.kind === "tier" ? { tier: p.tier } : { addon: p.addon })
                }
                title={
                  p.kind === "addon" && p.addon
                    ? formatGel(ADDON_TETRI[p.addon])
                    : renew
                      ? str.renew30
                      : undefined
                }
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-extrabold transition active:scale-[0.97] disabled:opacity-50 ${p.className}`}
              >
                <p.icon size={12} strokeWidth={2.4} />
                {renew ? `${str.boost[p.key]}+` : str.boost[p.key]}
              </button>
              )
            })
          : null}
        <button
          type="button"
          onClick={onToggleAnalytics}
          className={`ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-extrabold transition ${
            analyticsOpen
              ? "bg-sv-blue text-white"
              : "bg-sv-surface text-sv-ink ring-1 ring-sv-ink/8 hover:text-sv-blue"
          }`}
        >
          <BarChart3 size={13} />
          {str.analytics}
        </button>
      </div>

      {analyticsOpen ? (
        <div className="grid grid-cols-2 gap-2 border-t border-sv-ink/5 px-3 py-3 sm:grid-cols-4 sm:px-4">
          <Stat icon={Eye} label={str.statViews} value={l.views} tone="blue" />
          <Stat icon={Heart} label={str.statSaves} value={l.saves} tone="orange" />
          <Stat icon={MessagesSquare} label={str.statLeads} value={l.leads} tone="blue" />
          <Stat icon={Phone} label={str.statCalls} value={l.phoneReveals} tone="orange" />
        </div>
      ) : null}
    </article>
  )
}

function Stat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Eye
  label: string
  value: number
  tone: "blue" | "orange"
}) {
  return (
    <div className="rounded-control bg-sv-cloud/80 px-2.5 py-2 text-center ring-1 ring-sv-ink/[0.04]">
      <Icon size={13} className={tone === "orange" ? "mx-auto text-sv-orange" : "mx-auto text-sv-blue"} />
      <p className="mt-1 text-[13px] font-extrabold tabular-nums text-sv-ink">{value}</p>
      <p className="text-[10px] font-bold text-sv-ink/60">{label}</p>
    </div>
  )
}

function IconBtn({
  children,
  label,
  onClick,
  disabled,
  danger,
}: {
  children: ReactNode
  label: string
  onClick: () => void
  disabled?: boolean
  danger?: boolean
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`grid h-9 w-9 place-items-center rounded-control ring-1 transition disabled:opacity-40 ${
        danger
          ? "bg-sv-cloud text-sv-ink/60 ring-sv-ink/8 hover:bg-sv-orange/10 hover:text-sv-orange"
          : "bg-sv-cloud text-sv-ink/60 ring-sv-ink/8 hover:bg-sv-blue/10 hover:text-sv-blue-deep"
      }`}
    >
      {children}
    </button>
  )
}

