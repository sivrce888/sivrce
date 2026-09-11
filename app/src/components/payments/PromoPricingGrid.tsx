"use client"

import { useState } from "react"
import { Check, Flame, Crown, type LucideIcon } from "lucide-react"
import LocalizedLink from "@/components/LocalizedLink"
import { Reveal } from "@/components/Reveal"
import { BRAND } from "@/lib/brand"
import {
  ADDON_TETRI,
  DEFAULT_PROMO_DAYS,
  PRODUCT_TO_TIER,
  PROMO_DAY_OPTIONS,
  PROMO_INTENT_KEY,
  dailyRateTetri,
  formatGel,
  savingsPct,
  totalTetri,
  type PromoProduct,
} from "@/lib/promo-pricing"

type GridLang = "ka" | "en" | "ru"

/** день / дня / дней */
const ruDays = (d: number) =>
  d % 10 === 1 && d % 100 !== 11
    ? "день"
    : d % 10 >= 2 && d % 10 <= 4 && (d % 100 < 12 || d % 100 > 14)
      ? "дня"
      : "дней"

interface TierCard {
  product: PromoProduct | "free"
  name: string
  features: string[]
  badge?: { style: string; icon: LucideIcon; label: string }
  recommended?: boolean
}

const BADGES: Partial<Record<PromoProduct, TierCard["badge"]>> = {
  vip: { style: BRAND.vipTiers.VIP.style, icon: Flame, label: "VIP" },
  vip_plus: { style: BRAND.vipTiers["VIP+"].style, icon: Flame, label: "VIP+" },
  super_vip: { style: BRAND.vipTiers["SUPER VIP"].style, icon: Crown, label: "SUPER VIP" },
}

type GridCopy = {
  pickDays: string
  dayOpt: (d: number, save: number) => string
  per: (d: number) => string
  perDay: string
  save: (p: number) => string
  recommended: string
  ctaPaid: (name: string, d: number) => string
  ctaFree: string
  footnote: string
  addonsHead: string
  addonsTail: string
  freeName: string
  cards: Record<"vip" | "vip_plus" | "super_vip", { name?: string; features: string[] }>
}

const GRID: Record<GridLang, GridCopy> = {
  ka: {
    pickDays: "აირჩიეთ დღეების რაოდენობა",
    dayOpt: (d, save) => `${d} დღე${save ? ` · −${save}% SUPER VIP` : ""}`,
    per: (d) => `/ ${d} დღე`,
    perDay: "/დღე",
    save: (p) => ` · დაზოგე ${p}%`,
    recommended: "რეკომენდებული",
    ctaPaid: (n, d) => `განთავსება · ${d}დ ${n}`,
    ctaFree: "უფასოდ განთავსება",
    footnote:
      "მითითებული ფასი საბოლოოა. სთორი და სასწრაფოდ 24 საათით მოქმედებს. გამოქვეყნების შემდეგ აირჩიე ბუსტი იმავე ხანგრძლივობით.",
    addonsHead: "ტარიფები უძრავი ქონებისთვის. ",
    addonsTail: " · სხვა რუბრიკები — უფრო იაფი.",
    freeName: "უფასო",
    cards: {
      vip: {
        features: [
          "სიაში სტანდარტულებზე წინ",
          "VIP ნიშანი განცხადებაზე",
          "კატეგორიის VIP ბლოკში",
          "2× მეტი ნახვა საშუალოდ",
        ],
      },
      vip_plus: {
        features: [
          "VIP-ის ყველა უპირატესობა",
          "სიაში VIP-ებზე წინ",
          "VIP+ კარუსელი მთავარ გვერდზე",
          "3× მეტი ნახვა საშუალოდ",
        ],
      },
      super_vip: {
        features: [
          "VIP+-ის ყველა უპირატესობა",
          "ტოპი ყველა განცხადებაზე",
          "SUPER VIP სლაიდერი მთავარზე",
          "5× მეტი ნახვა საშუალოდ",
        ],
      },
    },
  },
  en: {
    pickDays: "Choose duration",
    dayOpt: (d, save) => `${d} ${d === 1 ? "day" : "days"}${save ? ` · −${save}% SUPER VIP` : ""}`,
    per: (d) => `/ ${d} ${d === 1 ? "day" : "days"}`,
    perDay: "/day",
    save: (p) => ` · save ${p}%`,
    recommended: "Recommended",
    ctaPaid: (n, d) => `Post · ${d}d ${n}`,
    ctaFree: "Post for free",
    footnote:
      "Prices shown are final. Story and Urgent last 24 hours. After publishing, pick the boost with the same duration.",
    addonsHead: "Rates for residential property. ",
    addonsTail: " · Other categories — cheaper.",
    freeName: "Free",
    cards: {
      vip: {
        features: [
          "Ahead of standard listings",
          "VIP badge on your listing",
          "Featured in the category VIP block",
          "2× more views on average",
        ],
      },
      vip_plus: {
        features: [
          "Everything in VIP",
          "Ahead of VIP listings",
          "VIP+ carousel on the homepage",
          "3× more views on average",
        ],
      },
      super_vip: {
        features: [
          "Everything in VIP+",
          "Top position on every list",
          "SUPER VIP slider on the homepage",
          "5× more views on average",
        ],
      },
    },
  },
  ru: {
    pickDays: "Выберите длительность",
    dayOpt: (d, save) => `${d} ${ruDays(d)}${save ? ` · −${save}% SUPER VIP` : ""}`,
    per: (d) => `/ ${d} ${ruDays(d)}`,
    perDay: "/день",
    save: (p) => ` · экономия ${p}%`,
    recommended: "Рекомендуем",
    ctaPaid: (n, d) => `Разместить · ${d}д ${n}`,
    ctaFree: "Разместить бесплатно",
    footnote:
      "Указанная цена итоговая. Стори и «Срочно» действуют 24 часа. После публикации выберите буст той же длительности.",
    addonsHead: "Тарифы для недвижимости. ",
    addonsTail: " · Другие рубрики — дешевле.",
    freeName: "Бесплатно",
    cards: {
      vip: {
        features: [
          "Выше обычных объявлений",
          "Значок VIP на объявлении",
          "В VIP-блоке категории",
          "В среднем 2× больше просмотров",
        ],
      },
      vip_plus: {
        features: [
          "Все преимущества VIP",
          "Выше VIP-объявлений",
          "VIP+ карусель на главной",
          "В среднем 3× больше просмотров",
        ],
      },
      super_vip: {
        features: [
          "Все преимущества VIP+",
          "Топ-позиция во всех списках",
          "SUPER VIP слайдер на главной",
          "В среднем 5× больше просмотров",
        ],
      },
    },
  },
}

const FREE_FEATURES: Record<GridLang, string[]> = {
  ka: [
    "სტანდარტული განთავსება",
    "აქტიურია 30 დღე",
    "ძიების შედეგებში გამოჩენა",
    "პირდაპირი შეტყობინებები",
  ],
  en: [
    "Standard placement",
    "Active for 30 days",
    "Appears in search results",
    "Direct messages",
  ],
  ru: [
    "Стандартное размещение",
    "Активно 30 дней",
    "Показ в результатах поиска",
    "Прямые сообщения",
  ],
}

export default function PromoPricingGrid({ lang = "ka" }: { lang?: GridLang }) {
  const t = GRID[lang] ?? GRID.ka
  const [days, setDays] = useState<number>(DEFAULT_PROMO_DAYS)

  const cards: TierCard[] = [
    { product: "free", name: t.freeName, features: FREE_FEATURES[lang] ?? FREE_FEATURES.ka },
    { product: "vip", name: "VIP", badge: BADGES.vip, features: t.cards.vip.features },
    {
      product: "vip_plus",
      name: "VIP+",
      recommended: true,
      badge: BADGES.vip_plus,
      features: t.cards.vip_plus.features,
    },
    { product: "super_vip", name: "SUPER VIP", badge: BADGES.super_vip, features: t.cards.super_vip.features },
  ]

  return (
    <div>
      <div className="mb-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <label htmlFor="promo-days" className="text-[13px] font-bold text-sv-ink/60">
          {t.pickDays}
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
                {t.dayOpt(d, save ?? 0)}
              </option>
            )
          })}
        </select>
      </div>
      <p className="mb-8 text-center text-[12px] font-semibold text-sv-ink/60">{t.footnote}</p>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((tier, i) => {
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
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-sv-orange px-4 py-1.5 text-xs font-bold text-sv-ink shadow-glow-orange">
                    {t.recommended}
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
                      <span className={`text-sm font-semibold ${highlight ? "text-white/60" : "text-sv-ink/60"}`}>
                        {t.per(days)}
                      </span>
                    )}
                  </div>
                  {paid && rate != null && (
                    <p className={`mt-1 text-[13px] font-semibold ${highlight ? "text-white/55" : "text-sv-ink/60"}`}>
                      {formatGel(rate)}{t.perDay}
                      {save ? (
                        <span className={highlight ? " text-sv-success" : " text-sv-blue"}>{t.save(save)}</span>
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
                  onClick={() => {
                    if (product === "free") return
                    try {
                      sessionStorage.setItem(
                        PROMO_INTENT_KEY,
                        JSON.stringify({
                          tier: PRODUCT_TO_TIER[product],
                          days,
                        }),
                      )
                    } catch {
                      /* private mode */
                    }
                  }}
                  className={`mt-8 inline-flex items-center justify-center rounded-full px-6 py-3.5 text-sm font-bold transition hover:-translate-y-0.5 ${
                    highlight
                      ? "bg-sv-orange text-sv-ink shadow-glow-orange hover:shadow-glow-orange-lg"
                      : "bg-sv-ink text-white shadow-glow-navy hover:bg-sv-navy"
                  }`}
                >
                  {/* ponytail: publish free; days/tier intent → TierPurchaseButton after publish */}
                  {paid ? t.ctaPaid(tier.name, days) : t.ctaFree}
                </LocalizedLink>
              </div>
            </Reveal>
          )
        })}
      </div>

      <p className="mx-auto mt-8 max-w-2xl text-center text-[12px] font-medium text-sv-ink/60">
        {t.addonsHead}
        Turbo {formatGel(ADDON_TETRI.turbo_7)} / {formatGel(ADDON_TETRI.turbo_14)} /{" "}
        {formatGel(ADDON_TETRI.turbo_30)} · {lang === "ka" ? "სასწრაფოდ" : lang === "ru" ? "Срочно" : "Urgent"}{" "}
        {formatGel(ADDON_TETRI.sticker_urgent)} ·{" "}
        {lang === "ka" ? "ფასი↓" : lang === "ru" ? "Цена↓" : "Price↓"}{" "}
        {formatGel(ADDON_TETRI.sticker_price_drop)} ·{" "}
        {lang === "ka" ? "სთორი" : lang === "ru" ? "Стори" : "Story"}{" "}
        {formatGel(ADDON_TETRI.story)} ·{" "}
        {lang === "ka" ? "განახლება" : lang === "ru" ? "Обновление" : "Refresh"}{" "}
        {formatGel(ADDON_TETRI.refresh_once)} ·{" "}
        {lang === "ka" ? "ფერი" : lang === "ru" ? "Цвет" : "Color"} {formatGel(ADDON_TETRI.color)} · Facebook{" "}
        {formatGel(ADDON_TETRI.facebook)}+{t.addonsTail}
      </p>
    </div>
  )
}
