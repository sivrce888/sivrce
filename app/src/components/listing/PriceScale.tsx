/**
 * MyHome-style price scale bar — where this listing sits vs district peers.
 */

import type { Lang } from "@/lib/i18n/core"
import type { PriceScaleBand, PriceScaleResult } from "@/lib/price-scale"

const LABELS: Record<Lang, Record<PriceScaleBand, string> & { heading: string; ticks: [string, string, string, string, string] }> = {
  ka: {
    heading: "ღირებულების შკალა",
    ticks: ["დაბალი", "საშუალოზე დაბალი", "საშუალო", "საშუალოზე მაღალი", "მაღალი"],
    low: "დაბალი ფასი",
    mediumLow: "საშუალოზე დაბალი",
    average: "საშუალო ფასი",
    aboveAverage: "საშუალოზე მაღალი",
    high: "მაღალი ფასი",
  },
  en: {
    heading: "Price scale",
    ticks: ["Low", "Below average", "Average", "Above average", "High"],
    low: "Low price",
    mediumLow: "Below average",
    average: "Average price",
    aboveAverage: "Above average",
    high: "High price",
  },
  ru: {
    heading: "Шкала цен",
    ticks: ["Низкая", "Ниже средней", "Средняя", "Выше средней", "Высокая"],
    low: "Низкая цена",
    mediumLow: "Ниже средней",
    average: "Средняя цена",
    aboveAverage: "Выше средней",
    high: "Высокая цена",
  },
  de: {
    heading: "Preisskala",
    ticks: ["Niedrig", "Unterchnittlich", "Durchschnitt", "Überdurchschnittlich", "Hoch"],
    low: "Niedriger Preis",
    mediumLow: "Unter dem Durchschnitt",
    average: "Durchschnittspreis",
    aboveAverage: "Über dem Durchschnitt",
    high: "Hoher Preis",
  },
  tr: {
    heading: "Fiyat ölçeği",
    ticks: ["Düşük", "Ortalama altı", "Ortalama", "Ortalama üstü", "Yüksek"],
    low: "Düşük fiyat",
    mediumLow: "Ortalama altı",
    average: "Ortalama fiyat",
    aboveAverage: "Ortalama üstü",
    high: "Yüksek fiyat",
  },
  he: {
    heading: "סולם מחירים",
    ticks: ["נמוך", "מתחת לממוצע", "ממוצע", "מעל הממוצע", "גבוה"],
    low: "מחיר נמוך",
    mediumLow: "מתחת לממוצע",
    average: "מחיר ממוצע",
    aboveAverage: "מעל הממוצע",
    high: "מחיר גבוה",
  },
  ar: {
    heading: "مقياس الأسعار",
    ticks: ["منخفض", "أقل من المتوسط", "متوسط", "أعلى من المتوسط", "مرتفع"],
    low: "سعر منخفض",
    mediumLow: "أقل من المتوسط",
    average: "سعر متوسط",
    aboveAverage: "أعلى من المتوسط",
    high: "سعر مرتفع",
  },
  uk: {
    heading: "Шкала цін",
    ticks: ["Низька", "Нижче середньої", "Середня", "Вище середньої", "Висока"],
    low: "Низька ціна",
    mediumLow: "Нижче середньої",
    average: "Середня ціна",
    aboveAverage: "Вище середньої",
    high: "Висока ціна",
  },
  hy: {
    heading: "Գների սանդղակ",
    ticks: ["Ցածր", "Միջինից ցածր", "Միջին", "Միջինից բարձր", "Բարձր"],
    low: "Ցածր գին",
    mediumLow: "Միջինից ցածր",
    average: "Միջին գին",
    aboveAverage: "Միջինից բարձր",
    high: "Բարձր գին",
  },
  az: {
    heading: "Qiymət şkalası",
    ticks: ["Aşağı", "Ortalamanın altında", "Orta", "Ortalamanın üstündə", "Yüksək"],
    low: "Aşağı qiymət",
    mediumLow: "Ortalamanın altında",
    average: "Orta qiymət",
    aboveAverage: "Ortalamanın üstündə",
    high: "Yüksək qiymət",
  },
}

const BAND_CHIP: Record<PriceScaleBand, string> = {
  low: "bg-sv-blue/10 text-sv-blue-deep",
  mediumLow: "bg-sv-blue/10 text-sv-blue-deep",
  average: "bg-sv-ink/[0.06] text-sv-ink/70",
  aboveAverage: "bg-sv-orange/10 text-sv-orange-deep",
  high: "bg-sv-orange/15 text-sv-orange-deep",
}

export default function PriceScale({
  scale,
  priceLabel,
  lang,
}: {
  scale: PriceScaleResult
  priceLabel: string
  lang: Lang
}) {
  const L = LABELS[lang]
  return (
    <section
      className="mt-6 rounded-card border border-sv-ink/[0.06] bg-sv-surface p-5 shadow-card sm:p-6"
      aria-label={L.heading}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[13px] font-black uppercase tracking-wider text-sv-ink/60">
          {L.heading}
        </h2>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${BAND_CHIP[scale.band]}`}>
          {L[scale.band]}
        </span>
      </div>

      <div className="relative mt-5 px-1">
        {/* Brand tokens only — sv-blue → sv-orange */}
        <div
          className="h-2.5 w-full rounded-full"
          style={{
            background:
              "linear-gradient(90deg, var(--color-sv-blue-light) 0%, var(--color-sv-blue) 45%, var(--color-sv-orange-light) 72%, var(--color-sv-orange-deep) 100%)",
          }}
        />
        <div
          className="absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${scale.pct}%` }}
        >
          <div className="flex flex-col items-center">
            <span className="mb-1 whitespace-nowrap rounded-lg bg-sv-navy px-2 py-0.5 text-[11px] font-black text-white shadow-sm">
              {priceLabel}
            </span>
            <span className="h-3.5 w-3.5 rounded-full border-2 border-white bg-sv-navy shadow-md" />
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-between gap-1 text-[10px] font-bold text-sv-ink/60">
        {L.ticks.map((label, i) => (
          <span key={i} className="max-w-[4.5rem] text-center leading-tight">
            {label}
          </span>
        ))}
      </div>
    </section>
  )
}
