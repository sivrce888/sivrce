'use client'

import { useMemo, useState } from 'react'
import { deBuyCostsPct, deRentVsBuy, DE_RENT_BUY_STATES, DE_RENT_BUY_DEFAULT_STATE } from '@/lib/countries/de-rent-buy'
import { formatEur } from '@/lib/countries/de-expose'

const pct1 = (n: number) => n.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

const PRESETS = [
  { label: '300.000 €', price: 300_000 },
  { label: '450.000 €', price: 450_000 },
  { label: '600.000 €', price: 600_000 },
]

export default function RentBuyCalcDe() {
  const [price, setPrice] = useState(450_000)
  const [rentMonthly, setRentMonthly] = useState(1_400)
  const [horizonYears, setHorizonYears] = useState(10)
  const [downPct, setDownPct] = useState(20)
  const [ratePct, setRatePct] = useState(3.5)
  const [appreciationPct, setAppreciationPct] = useState(3)
  const [altReturnPct, setAltReturnPct] = useState(3)
  const [state, setState] = useState(DE_RENT_BUY_DEFAULT_STATE)

  const buyCosts = useMemo(() => deBuyCostsPct(price, state), [price, state])
  const out = useMemo(
    () =>
      deRentVsBuy({
        price, rentMonthly, horizonYears, downPct, ratePct, appreciationPct, altReturnPct,
        buyCostsPct: buyCosts.pct,
      }),
    [price, rentMonthly, horizonYears, downPct, ratePct, appreciationPct, altReturnPct, buyCosts.pct],
  )

  const maxWorth = Math.max(out.buyNetWorth, out.rentNetWorth, 1)

  return (
    <div className="rounded-tile border border-sv-ink/[0.06] bg-sv-surface p-6 shadow-card md:p-10">
      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        {/* Inputs */}
        <div className="space-y-6">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="rbd-price" className="text-[13px] font-black uppercase tracking-wide text-sv-ink/70">
                Kaufpreis
              </label>
              <span className="text-[14px] font-black text-sv-ink">{formatEur(price)}</span>
            </div>
            <input
              id="rbd-price"
              type="range" min={100_000} max={1_500_000} step={10_000}
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="w-full accent-sv-blue"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setPrice(p.price)}
                  className="rounded-full border border-sv-ink/10 bg-white px-3 py-1 text-[12px] font-bold text-sv-ink/70 transition-colors hover:border-sv-blue/40 hover:text-sv-blue"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="rbd-state" className="mb-2 block text-[13px] font-black uppercase tracking-wide text-sv-ink/70">
              Bundesland (Grunderwerbsteuer)
            </label>
            <select
              id="rbd-state"
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="h-11 w-full rounded-module border border-sv-ink/10 bg-white px-3 text-[14px] font-bold text-sv-ink focus:border-sv-blue focus:outline-none"
            >
              {DE_RENT_BUY_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="rbd-rent" className="text-[13px] font-black uppercase tracking-wide text-sv-ink/70">
                Miete kalt im Monat (vergleichbare Wohnung)
              </label>
              <span className="text-[14px] font-black text-sv-ink">{formatEur(rentMonthly)}</span>
            </div>
            <input
              id="rbd-rent"
              type="range" min={300} max={3_000} step={25}
              value={rentMonthly}
              onChange={(e) => setRentMonthly(Number(e.target.value))}
              className="w-full accent-sv-blue"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="rbd-horizon" className="text-[13px] font-black uppercase tracking-wide text-sv-ink/70">
                Wie lange bleiben Sie
              </label>
              <span className="text-[14px] font-black text-sv-ink">{horizonYears} {horizonYears === 1 ? 'Jahr' : 'Jahre'}</span>
            </div>
            <input
              id="rbd-horizon"
              type="range" min={1} max={30} step={1}
              value={horizonYears}
              onChange={(e) => setHorizonYears(Number(e.target.value))}
              className="w-full accent-sv-blue"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="rbd-down" className="text-[13px] font-black uppercase tracking-wide text-sv-ink/70">
                Eigenkapital ({pct1(downPct)} %)
              </label>
              <span className="text-[14px] font-black text-sv-ink">{formatEur((price * downPct) / 100)}</span>
            </div>
            <input
              id="rbd-down"
              type="range" min={0} max={50} step={5}
              value={downPct}
              onChange={(e) => setDownPct(Number(e.target.value))}
              className="w-full accent-sv-blue"
            />
            <p className="mt-2 text-[12px] font-bold text-sv-ink/60">
              + Kaufnebenkosten {state}: {pct1(buyCosts.pct)} % ({formatEur(buyCosts.totalEur)}) — Gesamtkapitalbedarf {formatEur((price * downPct) / 100 + buyCosts.totalEur)}
            </p>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="rbd-rate" className="text-[13px] font-black uppercase tracking-wide text-sv-ink/70">
                Bauzins
              </label>
              <span className="text-[14px] font-black text-sv-ink">{pct1(ratePct)} %</span>
            </div>
            <input
              id="rbd-rate"
              type="range" min={1.5} max={8} step={0.1}
              value={ratePct}
              onChange={(e) => setRatePct(Number(e.target.value))}
              className="w-full accent-sv-blue"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="rbd-app" className="text-[13px] font-black uppercase tracking-wide text-sv-ink/70">
                Preissteigerung pro Jahr
              </label>
              <span className="text-[14px] font-black text-sv-ink">{pct1(appreciationPct)} %</span>
            </div>
            <input
              id="rbd-app"
              type="range" min={-2} max={8} step={0.5}
              value={appreciationPct}
              onChange={(e) => setAppreciationPct(Number(e.target.value))}
              className="w-full accent-sv-blue"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="rbd-alt" className="text-[13px] font-black uppercase tracking-wide text-sv-ink/70">
                Rendite angelegten Ersparnisses
              </label>
              <span className="text-[14px] font-black text-sv-ink">{pct1(altReturnPct)} %</span>
            </div>
            <input
              id="rbd-alt"
              type="range" min={0} max={10} step={0.5}
              value={altReturnPct}
              onChange={(e) => setAltReturnPct(Number(e.target.value))}
              className="w-full accent-sv-blue"
            />
          </div>
        </div>

        {/* Result */}
        <div className="flex flex-col justify-center rounded-module bg-sv-navy p-6 text-white md:p-8">
          <div
            className={`text-[12px] font-black uppercase tracking-wider ${out.buyWins ? 'text-sv-blue-light' : 'text-sv-orange'}`}
          >
            {out.buyWins
              ? `Kaufen gewinnt — am Ende ${formatEur(Math.max(0, out.delta))} reicher`
              : `Mieten gewinnt — am Ende ${formatEur(Math.max(0, -out.delta))} reicher`}
          </div>
          <div className="mt-6 space-y-3 border-t border-white/10 pt-4 text-[13px]">
            <div className="flex justify-between">
              <span className="text-white/55">Monatliche Kosten im Eigentum</span>
              <span className="font-bold">{formatEur(out.ownFirstMonth)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/55">Monatliche Kosten zur Miete</span>
              <span className="font-bold">{formatEur(out.rentFirstMonth)}</span>
            </div>
          </div>

          <div className="mt-6 space-y-3 border-t border-white/10 pt-4">
            <div>
              <div className="flex justify-between text-[13px]">
                <span className="text-white/55">Ihr Vermögen beim Kauf</span>
                <span className="font-black text-sv-blue-light">{formatEur(out.buyNetWorth)}</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-sv-blue-light" style={{ width: `${Math.max(2, (out.buyNetWorth / maxWorth) * 100)}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[13px]">
                <span className="text-white/55">Ihr Vermögen zur Miete</span>
                <span className="font-black text-sv-orange">{formatEur(out.rentNetWorth)}</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-sv-orange" style={{ width: `${Math.max(2, (out.rentNetWorth / maxWorth) * 100)}%` }} />
              </div>
            </div>
            <div className="pt-1 text-[12px] font-bold text-white/60">
              {out.breakEvenYear !== null
                ? `Kaufen zieht ab Jahr ${out.breakEvenYear} vorbei`
                : 'Kaufen holt in diesem Zeitraum nicht auf'}
            </div>
          </div>
        </div>
      </div>
      <p className="mt-4 text-[12px] font-semibold text-sv-ink/60">
        Das Modell ist keine Prognose — das Ergebnis folgt Ihren Annahmen (Mietsteigerung 2,5 % p. a., Verkaufsnebenkosten 4 %, Bewirtschaftung 1,2 % p. a., Kaufnebenkosten nach Bundesland). Keine Finanzberatung.
      </p>
    </div>
  )
}
