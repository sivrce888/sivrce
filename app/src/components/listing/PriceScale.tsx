/**
 * MyHome-style price scale bar — where this listing sits vs district peers.
 */

import type { PriceScaleResult } from "@/lib/price-scale"

const TICKS = [
  { at: 10, label: "დაბალი" },
  { at: 30, label: "საშუალოზე დაბალი" },
  { at: 50, label: "საშუალო" },
  { at: 70, label: "საშუალოზე მაღალი" },
  { at: 90, label: "მაღალი" },
] as const

const BAND_CHIP: Record<PriceScaleResult["band"], string> = {
  low: "bg-sv-blue/10 text-sv-blue-deep",
  mediumLow: "bg-sv-blue/10 text-sv-blue-deep",
  average: "bg-sv-ink/[0.06] text-sv-ink/70",
  aboveAverage: "bg-sv-orange/10 text-sv-orange-deep",
  high: "bg-sv-orange/15 text-sv-orange-deep",
}

export default function PriceScale({
  scale,
  priceLabel,
}: {
  scale: PriceScaleResult
  priceLabel: string
}) {
  return (
    <section
      className="mt-6 rounded-card border border-sv-ink/[0.06] bg-sv-surface p-5 shadow-card sm:p-6"
      aria-label="ღირებულების შკალა"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[13px] font-black uppercase tracking-wider text-sv-ink/55">
          ღირებულების შკალა
        </h2>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${BAND_CHIP[scale.band]}`}>
          {scale.labelKa}
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

      <div className="mt-4 flex justify-between gap-1 text-[10px] font-bold text-sv-ink/40">
        {TICKS.map((t) => (
          <span key={t.at} className="max-w-[4.5rem] text-center leading-tight">
            {t.label}
          </span>
        ))}
      </div>
    </section>
  )
}
