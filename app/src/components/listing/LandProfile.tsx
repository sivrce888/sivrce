'use client'

import { useMemo } from 'react'
import { Mountain } from 'lucide-react'
import { useI18n, type DictKey } from '@/lib/i18n/context'
import type { LandInsights } from '@/lib/land'

/**
 * Land profile card for plot listings — renders the server-fetched Open-Meteo
 * terrain + climate readout (lib/land.ts). Units come from Intl unit formatting,
 * so no per-locale unit strings are needed. Hue is the locked land amber
 * (category-brand.ts), applied as alpha steps of #d97706 only.
 */

/** "3.2° · 7%" — degrees with the builder-grade percent equivalent. */
function slopeValue(deg: number, lang: string): string {
  const d = new Intl.NumberFormat(lang, { style: 'unit', unit: 'degree', unitDisplay: 'narrow', maximumFractionDigits: deg < 10 ? 1 : 0 })
  const pct = Math.round(Math.tan((deg * Math.PI) / 180) * 100)
  return `${d.format(deg)} · ${pct}%`
}

/** Locale-correct compact unit: 590 მ / 590 m / ٥٩٠ م … */
function unit(value: number, unit: 'meter' | 'millimeter' | 'celsius', lang: string): string {
  return new Intl.NumberFormat(lang, { style: 'unit', unit, unitDisplay: 'narrow', maximumFractionDigits: 1 }).format(value)
}

export default function LandProfile({ data }: { data: LandInsights }) {
  const { t, lang } = useI18n()

  // keys exist for every aspect — land.check asserts label coverage per locale
  const facing = data.aspect === 'flat' ? t('detail.landFlat') : t(`detail.land${data.aspect}` as DictKey)

  const hints = useMemo(() => {
    const out: string[] = []
    if (data.slopeDeg < 2) out.push(t('detail.landHintFlat'))
    else if (data.slopeDeg < 8) out.push(t('detail.landHintSoft'))
    else out.push(t('detail.landHintSteep'))
    if (data.aspect === 'S' || data.aspect === 'SE' || data.aspect === 'SW') out.push(t('detail.landHintSun'))
    else if (data.aspect === 'N' || data.aspect === 'NE' || data.aspect === 'NW') out.push(t('detail.landHintShade'))
    return out
  }, [data.slopeDeg, data.aspect, t])

  const stats: [string, string][] = [
    [t('detail.landElev'), unit(data.elev, 'meter', lang)],
    [t('detail.landSlope'), slopeValue(data.slopeDeg, lang)],
    [t('detail.landFacing'), facing],
    [t('detail.landPrecip'), unit(data.precipMm, 'millimeter', lang)],
    [t('detail.landTemp'), unit(data.meanTemp, 'celsius', lang)],
  ]

  return (
    <div className="mt-8 rounded-card border border-sv-ink/[0.06] bg-sv-surface p-6 shadow-card md:p-8">
      <div className="flex items-center gap-2.5">
        <span className="grid h-10 w-10 place-items-center rounded-control bg-[#d97706]/10">
          <Mountain className="h-5 w-5 text-[#d97706]" aria-hidden />
        </span>
        <div>
          <h2 className="text-[20px] font-black tracking-[-0.02em] text-sv-ink">{t('detail.landTitle')}</h2>
          <p className="text-[12px] font-bold text-sv-ink/60">{t('detail.landNote')}</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
        {stats.map(([label, value]) => (
          <div key={label}>
            <div className="text-[11px] font-black uppercase tracking-wider text-sv-ink/60">{label}</div>
            <div className="mt-0.5 text-[16px] font-black tabular-nums tracking-tight text-sv-ink">{value}</div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {hints.map((hint) => (
          <span
            key={hint}
            className="flex items-center gap-2 rounded-full bg-sv-ink/[0.04] px-3.5 py-1.5 text-[12px] font-extrabold text-sv-ink/75"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#d97706]" aria-hidden />
            {hint}
          </span>
        ))}
      </div>
    </div>
  )
}
