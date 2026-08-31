'use client'

import { useMemo, useState } from 'react'
import {
  formatGel,
  pickLocText,
  renoBudget,
  RENO_PACKAGES,
  SERVICE_CITIES,
  type RenoPackageId,
} from '@/lib/services'
import { useI18n } from '@/lib/i18n/context'

export function RenovationCalc() {
  const { lang } = useI18n()
  const [m2, setM2] = useState(65)
  const [pack, setPack] = useState<RenoPackageId>('white')
  const [city, setCity] = useState('თბილისი')
  const pkg = RENO_PACKAGES.find((p) => p.id === pack) ?? RENO_PACKAGES[1]
  const total = useMemo(() => renoBudget(m2, pkg.gelPerM2, city), [m2, pkg.gelPerM2, city])

  return (
    <div className="rounded-tile border border-sv-ink/[0.06] bg-sv-surface p-6 shadow-card md:p-10">
      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="reno-m2" className="text-[13px] font-black uppercase tracking-wide text-sv-ink/70">
                ფართი
              </label>
              <span className="text-[14px] font-black text-sv-ink">{m2} მ²</span>
            </div>
            <input
              id="reno-m2"
              type="range"
              min={15}
              max={250}
              step={5}
              value={m2}
              onChange={(e) => setM2(Number(e.target.value))}
              className="w-full accent-sv-orange"
            />
          </div>

          <div>
            <p className="mb-3 text-[13px] font-black uppercase tracking-wide text-sv-ink/70">
              პაკეტი
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {RENO_PACKAGES.map((p) => {
                const on = p.id === pack
                return (
                  <button
                    key={p.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setPack(p.id)}
                    className={`rounded-control border px-4 py-3 text-left transition ${
                      on
                        ? 'border-sv-orange bg-sv-orange/8 ring-2 ring-sv-orange/20'
                        : 'border-sv-ink/[0.08] bg-sv-cloud hover:border-sv-orange/40'
                    }`}
                  >
                    <span className="block text-[14px] font-extrabold text-sv-ink">
                      {pickLocText(p.name, lang)}
                    </span>
                    <span className="mt-0.5 block text-[12px] font-semibold text-sv-ink/50">
                      {formatGel(p.gelPerM2)} / მ² · {pickLocText(p.hint, lang)}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label htmlFor="reno-city" className="mb-2 block text-[13px] font-black uppercase tracking-wide text-sv-ink/70">
              ქალაქი
            </label>
            <select
              id="reno-city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full rounded-control border border-sv-ink/[0.08] bg-sv-cloud px-4 py-3 text-[15px] font-semibold text-sv-ink outline-none focus:border-sv-blue focus:ring-4 focus:ring-sv-blue/10"
            >
              {SERVICE_CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col justify-center rounded-module bg-sv-navy p-7 text-white">
          <p className="text-[12px] font-black uppercase tracking-[0.16em] text-sv-blue-light">
            ორიენტირი
          </p>
          <p className="mt-3 text-[36px] font-black tracking-[-0.04em] md:text-[44px]">
            {formatGel(total)}
          </p>
          <p className="mt-2 text-[14px] font-semibold text-white/60">
            {m2} მ² · {formatGel(pkg.gelPerM2)} / მ² · {city}
          </p>
          <p className="mt-6 text-[12px] font-medium leading-relaxed text-white/45">
            საბაზრო ორიენტირი 2026, მასალებისა და ბრიგადის გარეშე ცალკე. ზუსტი შეთავაზება — კომპანიისგან ქვემოთ.
          </p>
        </div>
      </div>
    </div>
  )
}
