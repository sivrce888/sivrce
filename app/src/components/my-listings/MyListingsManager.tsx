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
  Flame,
  Loader2,
  MessagesSquare,
  Palette,
  Pencil,
  Phone,
  Plus,
  Power,
  RotateCw,
  Search,
  Share2,
  Sparkles,
  Trash2,
  X,
} from "lucide-react"

import LocalizedLink from "@/components/LocalizedLink"
import EmptyState from "@/components/dashboard/EmptyState"
import { CurrencySwitcher } from "@/components/CurrencySwitcher"
import { useCurrency } from "@/lib/currency"
import {
  listingExpiresAt,
  listingFilterStatus,
  listingLifeRemaining,
} from "@/lib/listings/lifetime"
import {
  ADDON_TETRI,
  formatGel,
  tierKeyToBadge,
  type CheckoutAddon,
} from "@/lib/promo-pricing"

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
  phoneReveals: number
  image: string
  createdAt: string
  updatedAt: string
}

type StatusTab = "active" | "pending" | "withdrawn" | "sold" | "expired"

const TABS: { key: StatusTab; label: string }[] = [
  { key: "active", label: "აქტიური" },
  { key: "pending", label: "მოლოდინში" },
  { key: "withdrawn", label: "გამორთული" },
  { key: "sold", label: "გაყიდული" },
  { key: "expired", label: "ვადაგასული" },
]

const SORTS = [
  { key: "updated_desc", label: "განახლება ↓" },
  { key: "created_desc", label: "დამატება ↓" },
  { key: "views_desc", label: "ნახვები ↓" },
  { key: "price_desc", label: "ფასი ↓" },
  { key: "price_asc", label: "ფასი ↑" },
] as const

type SortKey = (typeof SORTS)[number]["key"]

const dateTimeFmt = new Intl.DateTimeFormat("ka-GE", {
  day: "2-digit",
  month: "short",
  year: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
})

const BOOST_PILLS: Array<{
  key: string
  label: string
  kind: "tier" | "addon"
  tier?: string
  addon?: CheckoutAddon
  icon: typeof Sparkles
  className: string
}> = [
  {
    key: "vip",
    label: "VIP",
    kind: "tier",
    tier: "vip",
    icon: Flame,
    className: "bg-sv-navy text-white hover:bg-sv-navy-soft",
  },
  {
    key: "super_vip",
    label: "VIP+",
    kind: "tier",
    tier: "super_vip",
    icon: Sparkles,
    className: "bg-gradient-to-r from-sv-blue to-sv-violet text-white",
  },
  {
    key: "diamond",
    label: "SUPER VIP",
    kind: "tier",
    tier: "diamond",
    icon: Crown,
    className: "bg-gradient-to-r from-sv-orange to-sv-orange-deep text-white shadow-glow-orange",
  },
  {
    key: "color",
    label: "ფერი",
    kind: "addon",
    addon: "color",
    icon: Palette,
    className: "bg-sv-cloud text-sv-ink ring-1 ring-sv-ink/8 hover:bg-sv-blue/8 hover:text-sv-blue",
  },
  {
    key: "refresh_once",
    label: "განახლება",
    kind: "addon",
    addon: "refresh_once",
    icon: RotateCw,
    className: "bg-sv-cloud text-sv-ink ring-1 ring-sv-ink/8 hover:bg-sv-blue/8 hover:text-sv-blue",
  },
  {
    key: "facebook",
    label: "FB",
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
}: {
  listings: ManagedListing[]
  addHref?: string
}) {
  const router = useRouter()
  const { format, rate } = useCurrency()
  const [items, setItems] = useState(initial)
  const [tab, setTab] = useState<StatusTab>("active")
  const [q, setQ] = useState("")
  const [sort, setSort] = useState<SortKey>("updated_desc")
  const [busyId, setBusyId] = useState<string | null>(null)
  const [analyticsId, setAnalyticsId] = useState<string | null>(null)
  const [edit, setEdit] = useState<ManagedListing | null>(null)
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
  }, [items, tab, q, sort])

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
        setError(data.error ?? "შეცდომა")
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
      setError("ქსელის შეცდომა")
      return false
    } finally {
      setBusyId(null)
    }
  }

  async function remove(id: string) {
    if (!window.confirm("წავშალოთ განცხადება? მოქმედება შეუქცევადია.")) return
    setBusyId(id)
    setError(null)
    try {
      const res = await fetch(`/api/listings/${id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "შეცდომა")
        return
      }
      setItems((prev) => prev.filter((l) => l.id !== id))
      startTransition(() => router.refresh())
    } catch {
      setError("ქსელის შეცდომა")
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
        body: JSON.stringify({ listingId, ...body }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(
          data.error === "refresh_cooldown"
            ? "განახლება ხელმისაწვდომია 1 საათში"
            : (data.error ?? "შეცდომა"),
        )
        return
      }
      if (data.order?.redirectUrl) window.location.assign(data.order.redirectUrl)
    } catch {
      setError("ქსელის შეცდომა")
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="min-w-0 text-[18px] font-extrabold tracking-[-0.02em] text-sv-ink sm:text-[20px]">
          ჩემი განცხადებები
          {items.length > 0 ? (
            <span className="ml-2 text-[13px] font-bold text-sv-ink/40">{items.length}</span>
          ) : null}
        </h2>
        <LocalizedLink
          href={addHref}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-sv-orange px-5 py-2.5 text-[13px] font-bold text-white shadow-glow-orange transition hover:opacity-95"
        >
          <Plus size={15} strokeWidth={2.5} />
          დამატება
        </LocalizedLink>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="განცხადებები ჯერ არ გაქვს"
          body="დაამატე შენი პირველი განცხადება და ის აქ გამოჩნდება."
          actionHref={addHref}
          actionLabel="განცხადების დამატება"
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
                placeholder="ID, სიტყვა, უბანი…"
                className="h-11 w-full rounded-full border-0 bg-sv-cloud pl-10 pr-4 text-[13.5px] font-medium text-sv-ink outline-none ring-1 ring-sv-ink/6 placeholder:text-sv-ink/35 focus:ring-sv-blue/25"
              />
            </label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="h-11 shrink-0 rounded-full border-0 bg-sv-cloud px-4 text-[13px] font-bold text-sv-ink outline-none ring-1 ring-sv-ink/6 focus:ring-sv-blue/25"
            >
              {SORTS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
            <CurrencySwitcher light />
          </div>

          <div className="mb-5 flex gap-1 overflow-x-auto border-b border-sv-ink/6 pb-px [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {TABS.map((t) => {
              const active = tab === t.key
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={`shrink-0 border-b-2 px-3.5 py-2.5 text-[13px] font-bold whitespace-nowrap transition ${
                    active
                      ? "border-sv-blue text-sv-blue"
                      : "border-transparent text-sv-ink/45 hover:text-sv-ink/70"
                  }`}
                >
                  {t.label}
                  <span className="ml-1.5 tabular-nums opacity-70">{counts[t.key]}</span>
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
            <p className="rounded-card bg-sv-cloud px-5 py-10 text-center text-[14px] font-semibold text-sv-ink/45">
              ამ ფილტრში განცხადება არ არის
            </p>
          ) : (
            <div className="space-y-3">
              {filtered.map((l) => (
                <ListingManageCard
                  key={l.id}
                  listing={l}
                  busy={busyId === l.id}
                  analyticsOpen={analyticsId === l.id}
                  formatPrice={(n) => format(priceAsGel(n, l.currency, rate))}
                  onToggleAnalytics={() =>
                    setAnalyticsId((id) => (id === l.id ? null : l.id))
                  }
                  onEdit={() => setEdit(l)}
                  onToggle={() =>
                    patch(l.id, {
                      status: l.status === "active" ? "withdrawn" : "active",
                    })
                  }
                  onDelete={() => remove(l.id)}
                  onBoost={(body) => purchase(l.id, body)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {edit ? (
        <EditModal
          listing={edit}
          busy={busyId === edit.id}
          onClose={() => setEdit(null)}
          onSave={async (fields) => {
            const ok = await patch(edit.id, fields)
            if (ok) setEdit(null)
          }}
        />
      ) : null}
    </div>
  )
}

function ListingManageCard({
  listing: l,
  busy,
  analyticsOpen,
  formatPrice,
  onToggleAnalytics,
  onEdit,
  onToggle,
  onDelete,
  onBoost,
}: {
  listing: ManagedListing
  busy: boolean
  analyticsOpen: boolean
  formatPrice: (n: number) => string
  onToggleAnalytics: () => void
  onEdit: () => void
  onToggle: () => void
  onDelete: () => void
  onBoost: (body: { tier?: string; addon?: string }) => void
}) {
  const life = listingLifeRemaining(l.createdAt)
  const expires = listingExpiresAt(l.createdAt)
  const badge = tierKeyToBadge(l.tier)
  const canBoost = l.status === "active" && life > 0

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
            <span className="absolute top-2 left-2 rounded-full bg-gradient-to-r from-sv-orange to-sv-orange-deep px-2 py-0.5 text-[10px] font-black tracking-wide text-white shadow-glow-orange">
              {badge}
            </span>
          ) : null}
        </LocalizedLink>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-bold tabular-nums text-sv-ink/35">ID {l.id}</p>
              <LocalizedLink
                href={`/listing/${l.id}`}
                className="mt-0.5 line-clamp-2 text-[15px] font-extrabold tracking-[-0.02em] text-sv-ink transition hover:text-sv-blue"
              >
                {l.title}
              </LocalizedLink>
              <p className="mt-2 text-[20px] font-black tracking-[-0.03em] text-sv-ink tabular-nums">
                {l.price > 0 ? formatPrice(l.price) : "ფასი მოთხოვნით"}
              </p>
            </div>

            <div className="flex shrink-0 flex-col gap-1.5">
              <IconBtn label="რედაქტირება" onClick={onEdit} disabled={busy}>
                <Pencil size={15} />
              </IconBtn>
              <IconBtn
                label={l.status === "active" ? "გამორთვა" : "ჩართვა"}
                onClick={onToggle}
                disabled={busy || l.status === "sold"}
              >
                {busy ? <Loader2 size={15} className="animate-spin" /> : <Power size={15} />}
              </IconBtn>
              <IconBtn label="წაშლა" onClick={onDelete} disabled={busy} danger>
                <Trash2 size={15} />
              </IconBtn>
            </div>
          </div>

          <div className="mt-auto">
            <div className="mb-1.5 flex items-center justify-between gap-2 text-[11px] font-semibold text-sv-ink/40">
              <span>{dateTimeFmt.format(new Date(l.createdAt))}</span>
              <span>ვადა {dateTimeFmt.format(expires)}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-sv-ink/[0.06]">
              <div
                className={`h-full rounded-full transition-all ${
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
        {canBoost
          ? BOOST_PILLS.map((p) => (
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
                    : undefined
                }
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-extrabold transition active:scale-[0.97] disabled:opacity-50 ${p.className}`}
              >
                <p.icon size={12} strokeWidth={2.4} />
                {p.label}
              </button>
            ))
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
          ანალიტიკა
        </button>
      </div>

      {analyticsOpen ? (
        <div className="grid grid-cols-3 gap-2 border-t border-sv-ink/5 px-3 py-3 sm:px-4">
          <Stat icon={Eye} label="ნახვა" value={l.views} tone="blue" />
          <Stat icon={MessagesSquare} label="ლიდი" value={l.leads} tone="blue" />
          <Stat icon={Phone} label="ნომერი" value={l.phoneReveals} tone="orange" />
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
      <p className="text-[10px] font-bold text-sv-ink/40">{label}</p>
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
          ? "bg-sv-cloud text-sv-ink/55 ring-sv-ink/8 hover:bg-sv-orange/10 hover:text-sv-orange"
          : "bg-sv-cloud text-sv-ink/55 ring-sv-ink/8 hover:bg-sv-blue/10 hover:text-sv-blue"
      }`}
    >
      {children}
    </button>
  )
}

function EditModal({
  listing,
  busy,
  onClose,
  onSave,
}: {
  listing: ManagedListing
  busy: boolean
  onClose: () => void
  onSave: (fields: {
    title: string
    price: number
    description: string
    status: string
  }) => void
}) {
  const [title, setTitle] = useState(listing.title)
  const [price, setPrice] = useState(String(listing.price || ""))
  const [description, setDescription] = useState(listing.description)
  const [status, setStatus] = useState(
    listing.status === "expired" ? "active" : listing.status,
  )

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-sv-navy/45 p-3 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-listing-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-card bg-sv-surface p-5 shadow-panel-dark"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 id="edit-listing-title" className="text-[16px] font-extrabold text-sv-ink">
            რედაქტირება
          </h3>
          <button
            type="button"
            aria-label="დახურვა"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-sv-ink/45 hover:bg-sv-cloud"
          >
            <X size={16} />
          </button>
        </div>

        <label className="block text-[12px] font-bold text-sv-ink/50">
          სათაური
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1.5 h-11 w-full rounded-control bg-sv-cloud px-3.5 text-[14px] font-semibold text-sv-ink outline-none ring-1 ring-sv-ink/6 focus:ring-sv-blue/25"
          />
        </label>

        <label className="mt-3 block text-[12px] font-bold text-sv-ink/50">
          ფასი ({listing.currency === "USD" ? "$" : "₾"})
          <input
            type="number"
            min={0}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="mt-1.5 h-11 w-full rounded-control bg-sv-cloud px-3.5 text-[14px] font-semibold text-sv-ink outline-none ring-1 ring-sv-ink/6 focus:ring-sv-blue/25"
          />
        </label>

        <label className="mt-3 block text-[12px] font-bold text-sv-ink/50">
          სტატუსი
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="mt-1.5 h-11 w-full rounded-control bg-sv-cloud px-3.5 text-[14px] font-semibold text-sv-ink outline-none ring-1 ring-sv-ink/6 focus:ring-sv-blue/25"
          >
            <option value="active">აქტიური</option>
            <option value="withdrawn">გამორთული</option>
            <option value="sold">გაყიდული</option>
            <option value="pending">მოლოდინში</option>
          </select>
        </label>

        <label className="mt-3 block text-[12px] font-bold text-sv-ink/50">
          აღწერა
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            className="mt-1.5 w-full resize-y rounded-control bg-sv-cloud px-3.5 py-2.5 text-[14px] font-medium text-sv-ink outline-none ring-1 ring-sv-ink/6 focus:ring-sv-blue/25"
          />
        </label>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-11 flex-1 rounded-full text-[13px] font-bold text-sv-ink/50 hover:bg-sv-cloud"
          >
            გაუქმება
          </button>
          <button
            type="button"
            disabled={busy || title.trim().length < 3}
            onClick={() =>
              onSave({
                title: title.trim(),
                price: Math.max(0, Math.floor(Number(price) || 0)),
                description: description.trim(),
                status,
              })
            }
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-sv-blue text-[13px] font-bold text-white transition hover:bg-sv-blue-deep disabled:opacity-50"
          >
            {busy ? <Loader2 size={15} className="animate-spin" /> : null}
            შენახვა
          </button>
        </div>
      </div>
    </div>
  )
}
