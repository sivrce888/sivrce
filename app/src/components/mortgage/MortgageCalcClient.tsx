'use client'

import { useMemo, useState } from 'react'
import { monthlyPayment } from '@/lib/finance'
import { formatUSD } from '@/data/listings'

const PRESETS = [
  { label: '$80,000', price: 80_000 },
  { label: '$120,000', price: 120_000 },
  { label: '$180,000', price: 180_000 },
  { label: '$250,000', price: 250_000 },
]

export default function MortgageCalcClient() {
  const [price, setPrice] = useState(120_000)
  const [downPct, setDownPct] = useState(25)
  const [rate, setRate] = useState(10)
  const [years, setYears] = useState(20)

  const { monthly, principal, totalInterest, totalPaid } = useMemo(() => {
    const principal = Math.max(0, price * (1 - downPct / 100))
    const monthly = monthlyPayment(principal, rate, years)
    const totalPaid = monthly * years * 12
    const totalInterest = totalPaid - principal
    return { monthly, principal, totalInterest, totalPaid }
  }, [price, downPct, rate, years])

  return (
    <div className="rounded-tile border border-sv-ink/[0.06] bg-sv-surface p-6 shadow-card md:p-10">
      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        {/* Inputs */}
        <div className="space-y-6">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="mc-price" className="text-[13px] font-black uppercase tracking-wide text-sv-ink/55">
                ბინის ფასი
              </label>
              <span className="text-[14px] font-black text-sv-ink">{formatUSD(price)}</span>
            </div>
            <input
              id="mc-price"
              type="range" min={20_000} max={500_000} step={5_000}
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
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="mc-down" className="text-[13px] font-black uppercase tracking-wide text-sv-ink/55">
                პირველი შენატრება ({downPct}%)
              </label>
              <span className="text-[14px] font-black text-sv-ink">{formatUSD(price * downPct / 100)}</span>
            </div>
            <input
              id="mc-down"
              type="range" min={0} max={70} step={5}
              value={downPct}
              onChange={(e) => setDownPct(Number(e.target.value))}
              className="w-full accent-sv-blue"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="mc-rate" className="text-[13px] font-black uppercase tracking-wide text-sv-ink/55">
                წლიური პროცენტი
              </label>
              <span className="text-[14px] font-black text-sv-ink">{rate.toFixed(1)}%</span>
            </div>
            <input
              id="mc-rate"
              type="range" min={4} max={18} step={0.1}
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              className="w-full accent-sv-blue"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="mc-years" className="text-[13px] font-black uppercase tracking-wide text-sv-ink/55">
                ვადა
              </label>
              <span className="text-[14px] font-black text-sv-ink">{years} წელი</span>
            </div>
            <input
              id="mc-years"
              type="range" min={5} max={25} step={1}
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
              className="w-full accent-sv-blue"
            />
          </div>
        </div>

        {/* Result */}
        <div className="flex flex-col justify-center rounded-module bg-sv-navy p-6 text-white md:p-8">
          <div className="text-[12px] font-black uppercase tracking-wider text-sv-blue-light">
            ყოველთვიური გადასახადი
          </div>
          <div className="mt-2 text-[36px] font-black leading-none tracking-[-0.02em] md:text-[44px]">
            {formatUSD(monthly)}
          </div>
          <div className="mt-6 space-y-3 border-t border-white/10 pt-4 text-[13px]">
            <div className="flex justify-between">
              <span className="text-white/55">სესხის თანხა</span>
              <span className="font-bold">{formatUSD(principal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/55">პროცენტის ჯამი</span>
              <span className="font-bold text-sv-orange">{formatUSD(totalInterest)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/55">სულ გადასახდელი</span>
              <span className="font-bold">{formatUSD(totalPaid)}</span>
            </div>
          </div>
        </div>
      </div>
      <p className="mt-4 text-[12px] font-semibold text-sv-ink/45">
        ეს არის მაჩვენებელი გამოთვალა სტანდარტული ანუიტეტის ფორმულით და არ წარმოადგენს საბანკო
        წინადადებას.
      </p>
    </div>
  )
}
