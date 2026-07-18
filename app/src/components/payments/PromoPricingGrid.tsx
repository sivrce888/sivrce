"use client"

import { useState } from "react"
import { Check, Flame, Crown, type LucideIcon } from "lucide-react"
import LocalizedLink from "@/components/LocalizedLink"
import { Reveal } from "@/components/Reveal"
import { BRAND } from "@/lib/brand"
import {
  ADDON_TETRI,
  DEFAULT_PROMO_DAYS,
  PROMO_DAY_OPTIONS,
  dailyRateTetri,
  formatGel,
  savingsPct,
  totalTetri,
  type PromoProduct,
} from "@/lib/promo-pricing"

interface TierCard {
  product: PromoProduct | "free"
  name: string
  features: string[]
  badge?: { style: string; icon: LucideIcon; label: string }
  recommended?: boolean
}

const CARDS: TierCard[] = [
  {
    product: "free",
    name: "უფასო",
    features: [
      "სტანდარტული განთავსება",
      "აქტიურია 30 დღე",
      "ძიების შედეგებში გამოჩენა",
      "პირდაპირი შეტყობინებები",
    ],
  },
  {
    product: "vip",
    name: "VIP",
    badge: { style: BRAND.vipTiers.VIP.style, icon: Flame, label: "VIP" },
    features: [
      "სიაში სტანდარტულებზე წინ",
      "VIP ნიშანი განცხადებაზე",
      "კატეგორიის VIP ბლოკში",
      "2× მეტი ნახვა საშუალოდ",
    ],
  },
  {
    product: "vip_plus",
    name: "VIP+",
    recommended: true,
    badge: { style: BRAND.vipTiers["VIP+"].style, icon: Flame, label: "VIP+" },
    features: [
      "ყველაფერი VIP-დან",
      "სიაში VIP-ებზე წინ",
      "VIP+ კარუსელი მთავარ გვერდზე",
      "3× მეტი ნახვა საშუალოდ",
    ],
  },
  {
    product: "super_vip",
    name: "SUPER VIP",
    badge: { style: BRAND.vipTiers["SUPER VIP"].style, icon: Crown, label: "SUPER VIP" },
    features: [
      "ყველაფერი VIP+-დან",
      "ტოპი ყველა განცხადებაზე",
      "SUPER VIP სლაიდერი მთავარზე",
      "5× მეტი ნახვა საშუალოდ",
    ],
  },
]

export default function PromoPricingGrid() {
  const [days, setDays] = useState<number>(DEFAULT_PROMO_DAYS)

  return (
    <div>
      <div className="mb-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <label htmlFor="promo-days" className="text-[13px] font-bold text-sv-ink/55">
          აირჩიეთ დღეების რაოდენობა
        </label>
        <select
          id="promo-days"
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="rounded-full border border-sv-ink/10 bg-sv-surface px-5 py-2.5 text-[14px] font-extrabold text-sv-ink shadow-card outline-none focus:border-sv-blue/40"
        >
          {PROMO_DAY_OPTIONS.map((d) => {
            const save = savingsPct("super_vip", "real_estate", d)
            return (
              <option key={d} value={d}>
                {d} დღე{save ? ` · −${save}% SUPER VIP` : ""}
              </option>
            )
          })}
        </select>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {CARDS.map((tier, i) => {
          const product = tier.product
          const paid = product !== "free"
          const rate = product !== "free" ? dailyRateTetri(product, "real_estate", days) : 0
          const total = product !== "free" ? totalTetri(product, "real_estate", days) : 0
          const save = product !== "free" ? savingsPct(product, "real_estate", days) : null
          const highlight = Boolean(tier.recommended)

          return (
            <Reveal key={tier.name} delay={i * 0.07}>
              <div
                className={`relative flex h-full flex-col rounded-card p-7 transition hover:-translate-y-1.5 ${
                  highlight
                    ? "bg-sv-navy shadow-soft ring-1 ring-sv-orange/30"
                    : "bg-sv-surface shadow-card ring-1 ring-sv-ink/5 hover:shadow-card-hover"
                }`}
              >
                {highlight && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-sv-orange px-4 py-1.5 text-xs font-bold text-white shadow-glow-orange">
                    რეკომენდებული
                  </span>
                )}
                {tier.badge && (
                  <span
                    className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold ${tier.badge.style}`}
                  >
                    <tier.badge.icon className="h-3.5 w-3.5" />
                    {tier.badge.label}
                  </span>
                )}
                <div className="mt-4">
                  <div className="flex items-baseline gap-1">
                    <span
                      className={`text-4xl font-black tracking-[-0.02em] ${highlight ? "text-white" : "text-sv-ink"}`}
                    >
                      {paid && rate != null && total != null ? formatGel(total) : "0₾"}
                    </span>
                    {paid && (
                      <span className={`text-sm font-semibold ${highlight ? "text-white/60" : "text-sv-ink/50"}`}>
                        / {days} დღე
                      </span>
                    )}
                  </div>
                  {paid && rate != null && (
                    <p className={`mt-1 text-[13px] font-semibold ${highlight ? "text-white/55" : "text-sv-ink/45"}`}>
                      {formatGel(rate)}/დღე
                      {save ? (
                        <span className={highlight ? " text-sv-success" : " text-sv-blue"}> · დაზოგე {save}%</span>
                      ) : null}
                    </p>
                  )}
                </div>
                <ul className="mt-6 flex-1 space-y-3">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Check
                        className={`mt-0.5 h-4 w-4 shrink-0 ${highlight ? "text-sv-success" : "text-sv-blue"}`}
                      />
                      <span
                        className={`text-[14px] font-medium ${highlight ? "text-white/75" : "text-sv-ink/65"}`}
                      >
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>
                <LocalizedLink
                  href="/add-listing"
                  className={`mt-8 inline-flex items-center justify-center rounded-full px-6 py-3.5 text-sm font-bold transition hover:-translate-y-0.5 ${
                    highlight
                      ? "bg-sv-orange text-white shadow-glow-orange hover:shadow-glow-orange-lg"
                      : "bg-sv-ink text-white shadow-glow-navy hover:bg-sv-navy"
                  }`}
                >
                  {paid && total != null ? `განთავსება · ${formatGel(total)}` : "უფასოდ განთავსება"}
                </LocalizedLink>
              </div>
            </Reveal>
          )
        })}
      </div>

      <p className="mx-auto mt-8 max-w-2xl text-center text-[12px] font-medium text-sv-ink/40">
        ტარიფები უძრავი ქონებისთვის. Turbo {formatGel(ADDON_TETRI.turbo_7)} /{" "}
        {formatGel(ADDON_TETRI.turbo_14)} / {formatGel(ADDON_TETRI.turbo_30)} · სასწრაფოდ{" "}
        {formatGel(ADDON_TETRI.sticker_urgent)} · ფასი↓ {formatGel(ADDON_TETRI.sticker_price_drop)} ·
        სთორი {formatGel(ADDON_TETRI.story)} · განახლება {formatGel(ADDON_TETRI.refresh_once)} · ფერი{" "}
        {formatGel(ADDON_TETRI.color)} · Facebook {formatGel(ADDON_TETRI.facebook)}+. სხვა რუბრიკები —
        უფრო იაფი.
      </p>
    </div>
  )
}
