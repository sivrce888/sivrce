"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import {
  Crown,
  Flame,
  Loader2,
  ChevronRight,
  RotateCw,
  Palette,
  Share2,
  Zap,
  TrendingDown,
  Rocket,
  CircleDot,
} from "lucide-react"
import {
  ADDON_TETRI,
  PROMO_DAY_OPTIONS,
  PROMO_INTENT_KEY,
  TIER_DURATION_DAYS,
  TIER_MONTHLY_TETRI,
  clampPromoDays,
  formatGel,
  tierCheckoutTetri,
  type CheckoutAddon,
} from "@/lib/promo-pricing"

interface TierInfo {
  key: string
  label: string
  priceTetri: number
  icon: typeof Crown
  gradient: string
  description: string
}

const TIERS: TierInfo[] = [
  {
    key: "vip",
    label: "VIP",
    priceTetri: TIER_MONTHLY_TETRI.vip,
    icon: Flame,
    gradient: "from-sv-navy to-sv-navy-soft",
    description: "სიაში სტანდარტულებზე წინ · VIP ნიშანი",
  },
  {
    key: "super_vip",
    label: "VIP+",
    priceTetri: TIER_MONTHLY_TETRI.super_vip,
    icon: Flame,
    gradient: "from-sv-blue to-sv-violet",
    description: "VIP+ კარუსელი · სიაში VIP-ზე წინ",
  },
  {
    key: "diamond",
    label: "SUPER VIP",
    priceTetri: TIER_MONTHLY_TETRI.diamond,
    icon: Crown,
    gradient: "from-sv-orange to-sv-orange-deep",
    description: "ტოპი ყველას თავზე · მთავარი სლაიდერი",
  },
]

const ADDONS: Array<{
  key: CheckoutAddon
  label: string
  description: string
  priceTetri: number
  icon: typeof Crown
}> = [
  {
    key: "turbo_7",
    label: "Turbo · 7 დღე",
    description: "SUPER VIP + ფერი + სასწრაფოდ + bump",
    priceTetri: ADDON_TETRI.turbo_7,
    icon: Rocket,
  },
  {
    key: "story",
    label: "სთორი · 1 დღე",
    description: "მთავარი გვერდის Stories ზოლი · 3₾",
    priceTetri: ADDON_TETRI.story,
    icon: CircleDot,
  },
  {
    key: "sticker_urgent",
    label: "სასწრაფოდ · 1 დღე",
    description: "ნარინჯისფერი სტიკერი ბარათზე",
    priceTetri: ADDON_TETRI.sticker_urgent,
    icon: Zap,
  },
  {
    key: "sticker_price_drop",
    label: "ფასი დაწეულია · 7 დღე",
    description: "ფასის შემცირების ნიშანი",
    priceTetri: ADDON_TETRI.sticker_price_drop,
    icon: TrendingDown,
  },
  {
    key: "refresh_once",
    label: "განახლება",
    description: "აწიე სიაში ახალივით",
    priceTetri: ADDON_TETRI.refresh_once,
    icon: RotateCw,
  },
  {
    key: "color",
    label: "ფერი · 7 დღე",
    description: "გამორჩეული ჩარჩო ძიებაში",
    priceTetri: ADDON_TETRI.color,
    icon: Palette,
  },
  {
    key: "facebook",
    label: "Facebook · 3 დღე",
    description: "სოციალური გავრცელება · ops რიგი",
    priceTetri: ADDON_TETRI.facebook,
    icon: Share2,
  },
]
// ponytail: turbo_14/30 + FB 7d/XL stay in API + pricing page; hide from quick menu until volume justifies them.

interface TierPurchaseButtonProps {
  listingId: string
  currentTier: string
  className?: string
  /** Open menu on mount — publish-success screen. */
  defaultOpen?: boolean
}

export default function TierPurchaseButton({
  listingId,
  currentTier,
  className = "",
  defaultOpen = false,
}: TierPurchaseButtonProps) {
  const [open, setOpen] = useState(defaultOpen)
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [days, setDays] = useState(() => {
    if (typeof window === "undefined") return TIER_DURATION_DAYS
    try {
      const raw = sessionStorage.getItem(PROMO_INTENT_KEY)
      if (!raw) return TIER_DURATION_DAYS
      const intent = JSON.parse(raw) as { tier?: string; days?: number }
      return intent.days ? clampPromoDays(intent.days) : TIER_DURATION_DAYS
    } catch {
      return TIER_DURATION_DAYS
    }
  })
  const [prices, setPrices] = useState<{
    tiers?: Record<string, { priceTetri: number; byDays?: Record<string, number> }>
    addons?: Record<string, number>
  } | null>(null)

  useEffect(() => {
    try {
      sessionStorage.removeItem(PROMO_INTENT_KEY)
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    if (!open || prices) return
    fetch("/api/payments/create-order")
      .then((r) => (r.ok ? r.json() : null))
      .then(
        (
          d: {
            tiers?: Record<string, { priceTetri: number; byDays?: Record<string, number> }>
            addons?: Record<string, { priceTetri: number }>
          } | null,
        ) => {
          if (!d) return
          setPrices({
            tiers: d.tiers,
            addons: d.addons
              ? Object.fromEntries(
                  Object.entries(d.addons).map(([k, v]) => [k, v.priceTetri]),
                )
              : undefined,
          })
        },
      )
      .catch(() => {}) // ponytail: hardcoded fallback when offline
  }, [open, prices])

  const purchase = async (body: { tier?: string; addon?: string; days?: number }) => {
    const key = body.tier ?? body.addon ?? ""
    setLoading(key)
    setError(null)
    try {
      const res = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, ...body }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.error === "refresh_cooldown") {
          setError("განახლება ხელმისაწვდომია 1 საათში")
        } else {
          setError(data.error ?? "შეცდომა")
        }
        return
      }
      if (data.order?.redirectUrl) {
        window.location.assign(data.order.redirectUrl)
      }
    } catch {
      setError("ქსელის შეცდომა")
    } finally {
      setLoading(null)
    }
  }

  const tierRank: Record<string, number> = { standard: 0, vip: 1, super_vip: 2, diamond: 3 }
  const currentRank = tierRank[currentTier] ?? 0
  const available = TIERS.filter((t) => (tierRank[t.key] ?? 0) >= currentRank)

  const priceFor = (tierKey: string) => {
    const fromApi = prices?.tiers?.[tierKey]?.byDays?.[String(days)]
    if (fromApi != null) return fromApi
    return (
      tierCheckoutTetri(tierKey, days, prices?.tiers?.[tierKey]?.priceTetri) ??
      TIERS.find((t) => t.key === tierKey)?.priceTetri ??
      0
    )
  }

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-control bg-gradient-to-r from-sv-blue to-sv-violet px-4 py-2 text-[13px] font-extrabold text-white shadow-glow-blue-sm transition-all hover:shadow-glow-blue active:scale-95"
      >
        <Rocket className="h-4 w-4" />
        ბუსტი
      </button>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.2 }}
          className={`absolute top-full z-50 mt-2 w-80 rounded-card border border-sv-ink/[0.08] bg-sv-surface p-4 shadow-panel-dark ${
            defaultOpen ? "left-0" : "right-0"
          }`}
        >
          <h3 className="text-[14px] font-black text-sv-ink">აირჩიეთ პაკეტი</h3>

          {error && (
            <p className="mt-2 rounded-control bg-sv-orange/10 px-3 py-2 text-[12px] font-bold text-sv-orange">
              {error}
            </p>
          )}

          {available.length > 0 ? (
            <>
              <p className="mt-2 text-[11px] font-bold uppercase tracking-wide text-sv-ink/40">
                VIP · ხანგრძლივობა
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {PROMO_DAY_OPTIONS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDays(d)}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold transition ${
                      days === d
                        ? "bg-sv-blue text-white"
                        : "bg-sv-cloud text-sv-ink/55 hover:text-sv-blue"
                    }`}
                  >
                    {d}დ
                  </button>
                ))}
              </div>
              <div className="mt-2 space-y-2">
                {available.map((tier) => {
                  const renew = currentRank > 0 && tierRank[tier.key] === currentRank
                  return (
                    <button
                      key={tier.key}
                      type="button"
                      onClick={() => purchase({ tier: tier.key, days })}
                      disabled={loading !== null}
                      className={`flex w-full items-center gap-3 rounded-module border p-3 text-left transition-all ${
                        loading === tier.key
                          ? "border-sv-blue/30 bg-sv-blue/[0.06]"
                          : "border-sv-ink/[0.06] hover:border-sv-blue/20 hover:bg-sv-blue/[0.04]"
                      }`}
                    >
                      <span
                        className={`grid h-9 w-9 shrink-0 place-items-center rounded-control bg-gradient-to-br ${tier.gradient} text-white`}
                      >
                        <tier.icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-extrabold text-sv-ink">
                          {renew ? `${tier.label} · გაგრძელება` : tier.label}
                        </div>
                        <div className="truncate text-[11px] font-medium text-sv-ink/45">
                          {renew
                            ? `დაემატება +${days} დღე მიმდინარე ვადას`
                            : tier.description}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-[15px] font-black text-sv-ink">
                          {formatGel(priceFor(tier.key))}
                        </div>
                        {loading === tier.key ? (
                          <Loader2 className="ml-auto h-4 w-4 animate-spin text-sv-blue" />
                        ) : (
                          <ChevronRight className="ml-auto h-4 w-4 text-sv-ink/30" />
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </>
          ) : (
            <div className="mt-2 rounded-control bg-gradient-to-r from-sv-orange to-sv-orange-deep px-3 py-2 text-[11px] font-black text-white">
              <Crown className="mr-1 inline h-3.5 w-3.5" />
              მაქსიმალური ტირი აქტიურია
            </div>
          )}

          <p className="mt-4 text-[11px] font-bold uppercase tracking-wide text-sv-ink/40">
            დამატებითი
          </p>
          <div className="mt-2 space-y-2">
            {ADDONS.map((a) => (
              <button
                key={a.key}
                type="button"
                onClick={() => purchase({ addon: a.key })}
                disabled={loading !== null}
                className={`flex w-full items-center gap-3 rounded-module border p-2.5 text-left transition-all ${
                  loading === a.key
                    ? "border-sv-blue/30 bg-sv-blue/[0.06]"
                    : "border-sv-ink/[0.06] hover:border-sv-blue/20 hover:bg-sv-blue/[0.04]"
                }`}
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-control bg-sv-cloud text-sv-blue">
                  <a.icon className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[12.5px] font-extrabold text-sv-ink">{a.label}</div>
                  <div className="truncate text-[10.5px] font-medium text-sv-ink/45">
                    {a.description}
                  </div>
                </div>
                <div className="shrink-0 text-[13px] font-black text-sv-ink">
                  {loading === a.key ? (
                    <Loader2 className="h-4 w-4 animate-spin text-sv-blue" />
                  ) : (
                    formatGel(prices?.addons?.[a.key] ?? a.priceTetri)
                  )}
                </div>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-3 w-full rounded-control py-2 text-[12px] font-bold text-sv-ink/45 transition-colors hover:bg-sv-ink/[0.04]"
          >
            დახურვა
          </button>
        </motion.div>
      )}
    </div>
  )
}
