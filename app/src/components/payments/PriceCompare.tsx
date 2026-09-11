import { Check } from "lucide-react"
import { Reveal } from "@/components/Reveal"
import {
  ADDON_TETRI,
  COMPETITOR,
  COMPETITOR_CHECKED_AT,
  dailyRateTetri,
  formatGel,
} from "@/lib/promo-pricing"

/**
 * Public price comparison vs SS.ge / MyHome.ge — rates come straight from
 * COMPETITOR (verified public tariffs) and our own bracket tables, so this
 * can never drift from the pricing source of truth. Server-rendered, zero JS.
 */

type CompareLang = "ka" | "en" | "ru"

type RowCopy = { label: string; ours: number; ss: number | null; mh: number | null }

const STR: Record<
  CompareLang,
  {
    kicker: string
    title: string
    sub: string
    bestBadge: string
    rows: (vip: number, vipPlus: number, superVip: number) => RowCopy[]
    ssNote: string
    tieNote: string
  }
> = {
  ka: {
    kicker: "ფასების შედარება",
    title: "იგივე პრემიუმ — უფრო იაფი",
    sub: `ოფიციალური დღიური ტარიფები · უძრავი ქონება · 30 დღიანი პაკეტი · გადამოწმებულია ${COMPETITOR_CHECKED_AT}`,
    bestBadge: "ჩვენ",
    rows: (vip, vipPlus, superVip) => [
      { label: "VIP", ours: vip, ss: COMPETITOR.ss.vip_re, mh: COMPETITOR.myhome.vip_re },
      { label: "VIP+", ours: vipPlus, ss: COMPETITOR.ss.vip_plus_re[1], mh: COMPETITOR.myhome.vip_plus_re },
      { label: "SUPER VIP", ours: superVip, ss: COMPETITOR.ss.super_vip_re[3], mh: COMPETITOR.myhome.super_vip_re },
      { label: "განახლება", ours: ADDON_TETRI.refresh_once, ss: null, mh: COMPETITOR.myhome.refresh_once },
      { label: "ფერი", ours: ADDON_TETRI.color, ss: null, mh: COMPETITOR.myhome.color },
    ],
    ssNote: "SS.ge-ს ცალკე განახლება/ფერი არ ყიდა — „—“.",
    tieNote: "✓ = ყველაზე დაბალი ფასი რიგში.",
  },
  en: {
    kicker: "Price comparison",
    title: "Same premium, lower price",
    sub: `Official daily rates · residential · 30-day bracket · checked ${COMPETITOR_CHECKED_AT}`,
    bestBadge: "Us",
    rows: (vip, vipPlus, superVip) => [
      { label: "VIP", ours: vip, ss: COMPETITOR.ss.vip_re, mh: COMPETITOR.myhome.vip_re },
      { label: "VIP+", ours: vipPlus, ss: COMPETITOR.ss.vip_plus_re[1], mh: COMPETITOR.myhome.vip_plus_re },
      { label: "SUPER VIP", ours: superVip, ss: COMPETITOR.ss.super_vip_re[3], mh: COMPETITOR.myhome.super_vip_re },
      { label: "Refresh", ours: ADDON_TETRI.refresh_once, ss: null, mh: COMPETITOR.myhome.refresh_once },
      { label: "Color frame", ours: ADDON_TETRI.color, ss: null, mh: COMPETITOR.myhome.color },
    ],
    ssNote: "SS.ge does not sell refresh/color separately — “—”.",
    tieNote: "✓ = lowest price in the row.",
  },
  ru: {
    kicker: "Сравнение цен",
    title: "Тот же премиум — дешевле",
    sub: `Официальные дневные тарифы · недвижимость · пакет 30 дней · проверено ${COMPETITOR_CHECKED_AT}`,
    bestBadge: "Мы",
    rows: (vip, vipPlus, superVip) => [
      { label: "VIP", ours: vip, ss: COMPETITOR.ss.vip_re, mh: COMPETITOR.myhome.vip_re },
      { label: "VIP+", ours: vipPlus, ss: COMPETITOR.ss.vip_plus_re[1], mh: COMPETITOR.myhome.vip_plus_re },
      { label: "SUPER VIP", ours: superVip, ss: COMPETITOR.ss.super_vip_re[3], mh: COMPETITOR.myhome.super_vip_re },
      { label: "Обновление", ours: ADDON_TETRI.refresh_once, ss: null, mh: COMPETITOR.myhome.refresh_once },
      { label: "Цвет", ours: ADDON_TETRI.color, ss: null, mh: COMPETITOR.myhome.color },
    ],
    ssNote: "SS.ge не продаёт обновление/цвет отдельно — «—».",
    tieNote: "✓ = самая низкая цена в строке.",
  },
}

export default function PriceCompare({ lang }: { lang: string }) {
  const t = STR[lang === "en" || lang === "ru" ? lang : "ka"]
  const vip = dailyRateTetri("vip", "real_estate", 30)
  const vipPlus = dailyRateTetri("vip_plus", "real_estate", 30)
  const superVip = dailyRateTetri("super_vip", "real_estate", 30)
  if (vip == null || vipPlus == null || superVip == null) return null
  const rows = t.rows(vip, vipPlus, superVip)

  return (
    <section className="mx-auto max-w-4xl px-6 pb-16" aria-labelledby="price-compare-title">
      <Reveal>
        <p className="inline-flex items-center gap-2 text-[12px] font-black uppercase tracking-wider text-sv-blue">
          {t.kicker}
        </p>
        <h2
          id="price-compare-title"
          className="mt-2 text-[22px] font-black tracking-[-0.02em] text-sv-ink md:text-[28px]"
        >
          {t.title}
        </h2>
        <p className="mt-2 text-[13px] font-medium text-sv-ink/55">{t.sub}</p>

        <div className="mt-6 overflow-x-auto rounded-card bg-sv-surface shadow-card ring-1 ring-sv-ink/5">
          <table className="w-full min-w-[420px] border-collapse text-[14px]">
            <caption className="sr-only">{t.title}</caption>
            <thead>
              <tr className="border-b border-sv-ink/5 text-left">
                <th scope="col" className="px-5 py-4 text-[12px] font-bold uppercase tracking-wider text-sv-ink/45" />
                <th
                  scope="col"
                  className="bg-sv-blue/[0.06] px-4 py-4 text-[13px] font-black text-sv-blue-deep"
                >
                  Sivrce{" "}
                  <span className="ml-1 rounded-full bg-sv-orange/15 px-2 py-0.5 text-[10px] font-black uppercase text-sv-blue-deep">
                    {t.bestBadge}
                  </span>
                </th>
                <th scope="col" className="px-4 py-4 text-[13px] font-bold text-sv-ink/55">
                  SS.ge
                </th>
                <th scope="col" className="px-4 py-4 text-[13px] font-bold text-sv-ink/55">
                  MyHome.ge
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const min = Math.min(r.ours, ...(r.ss != null ? [r.ss] : []), ...(r.mh != null ? [r.mh] : []))
                return (
                  <tr key={r.label} className="border-b border-sv-ink/5 last:border-0">
                    <th scope="row" className="px-5 py-3.5 text-left text-[13px] font-bold text-sv-ink/70">
                      {r.label}
                    </th>
                    <td className="bg-sv-blue/[0.06] px-4 py-3.5">
                      <span className="inline-flex items-center gap-1.5 text-[15px] font-black text-sv-blue-deep">
                        {r.ours === min && <Check className="h-4 w-4 text-sv-success" aria-hidden />}
                        {formatGel(r.ours)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-[14px] font-semibold text-sv-ink/50">
                      {r.ss != null ? formatGel(r.ss) : "—"}
                    </td>
                    <td className="px-4 py-3.5 text-[14px] font-semibold text-sv-ink/50">
                      {r.mh != null ? formatGel(r.mh) : "—"}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[12px] font-medium text-sv-ink/50">
          {t.tieNote} {t.ssNote}
        </p>
      </Reveal>
    </section>
  )
}
