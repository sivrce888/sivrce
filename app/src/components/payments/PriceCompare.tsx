import { Reveal } from "@/components/Reveal"
import {
  ADDON_TETRI,
  dailyRateTetri,
  formatGel,
} from "@/lib/promo-pricing";

/**
 * Public tariff table — our own daily rates straight from the pricing source
 * of truth. Server-rendered, zero JS.
 */

type CompareLang = "ka" | "en" | "ru" | "de";

type RowCopy = { label: string; ours: number };

const STR: Record<
  CompareLang,
  {
    kicker: string
    title: string
    sub: string
    rows: (vip: number, vipPlus: number, superVip: number) => RowCopy[]
  }
> = {
  ka: {
    kicker: "ტარიფები",
    title: "გამჭვირვალე დღიური ტარიფები",
    sub: "დღიური განაცხადის ტარიფები · უძრავი ქონება · 30 დღიანი პაკეტი",
    rows: (vip, vipPlus, superVip) => [
      { label: "VIP", ours: vip },
      { label: "VIP+", ours: vipPlus },
      { label: "SUPER VIP", ours: superVip },
      { label: "განახლება", ours: ADDON_TETRI.refresh_once },
      { label: "ფერი", ours: ADDON_TETRI.color },
    ],
  },
  en: {
    kicker: "Tariffs",
    title: "Transparent daily rates",
    sub: "Daily listing rates · residential · 30-day bracket",
    rows: (vip, vipPlus, superVip) => [
      { label: "VIP", ours: vip },
      { label: "VIP+", ours: vipPlus },
      { label: "SUPER VIP", ours: superVip },
      { label: "Refresh", ours: ADDON_TETRI.refresh_once },
      { label: "Color frame", ours: ADDON_TETRI.color },
    ],
  },
  ru: {
    kicker: "Тарифы",
    title: "Прозрачные дневные тарифы",
    sub: "Дневные тарифы за объявление · недвижимость · пакет 30 дней",
    rows: (vip, vipPlus, superVip) => [
      { label: "VIP", ours: vip },
      { label: "VIP+", ours: vipPlus },
      { label: "SUPER VIP", ours: superVip },
      { label: "Обновление", ours: ADDON_TETRI.refresh_once },
      { label: "Цвет", ours: ADDON_TETRI.color },
    ],
  },
  de: {
    kicker: "Tarife",
    title: "Transparente Tagestarife",
    sub: "Tägliche Anzeigentarife · Wohnimmobilien · 30-Tage-Paket",
    rows: (vip, vipPlus, superVip) => [
      { label: "VIP", ours: vip },
      { label: "VIP+", ours: vipPlus },
      { label: "SUPER VIP", ours: superVip },
      { label: "Aktualisierung", ours: ADDON_TETRI.refresh_once },
      { label: "Farbframe", ours: ADDON_TETRI.color },
    ],
  },
}

export default function PriceCompare({ lang }: { lang: string }) {
  const t = STR[lang === "en" || lang === "ru" || lang === "de" ? lang : "ka"]
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
          <table className="w-full min-w-[320px] border-collapse text-[14px]">
            <caption className="sr-only">{t.title}</caption>
            <thead>
              <tr className="border-b border-sv-ink/5 text-left">
                <th scope="col" className="px-5 py-4 text-[12px] font-bold uppercase tracking-wider text-sv-ink/45" />
                <th
                  scope="col"
                  className="bg-sv-blue/[0.06] px-4 py-4 text-[13px] font-black text-sv-blue-deep"
                >
                  Sivrce
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label} className="border-b border-sv-ink/5 last:border-0">
                  <th scope="row" className="px-5 py-3.5 text-left text-[13px] font-bold text-sv-ink/70">
                    {r.label}
                  </th>
                  <td className="bg-sv-blue/[0.06] px-4 py-3.5">
                    <span className="text-[15px] font-black text-sv-blue-deep">{formatGel(r.ours)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Reveal>
    </section>
  )
}
