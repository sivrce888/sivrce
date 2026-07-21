'use client'

import { useState } from 'react'
import LocalizedLink from '@/components/LocalizedLink'
import { Landmark, ArrowRight, ShieldCheck, DollarSign } from 'lucide-react'
import { Reveal } from '@/components/Reveal'
import { SERVICE_BRAND } from '@/lib/category-brand'

export default function MortgageWidget() {
  const [propertyPrice, setPropertyPrice] = useState<number>(75000)
  const [downPaymentPct, setDownPaymentPct] = useState<number>(20)
  const [termYears, setTermYears] = useState<number>(15)

  const annualRate = 0.105 // 10.5% average annual mortgage rate
  const downPaymentUSD = Math.round(propertyPrice * (downPaymentPct / 100))
  const loanAmountUSD = propertyPrice - downPaymentUSD

  const monthlyRate = annualRate / 12
  const totalMonths = termYears * 12
  const monthlyPaymentUSD = Math.round(
    (loanAmountUSD * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths))) /
      (Math.pow(1 + monthlyRate, totalMonths) - 1)
  )
  const monthlyPaymentGEL = Math.round(monthlyPaymentUSD * 2.7)

  return (
    <section className="relative overflow-hidden bg-sv-cloud py-16 md:py-24">
      <div className="mx-auto max-w-[1440px] px-5 md:px-10">
        <Reveal className="mb-10 text-center">
          <span
            className="mb-3 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[12px] font-black uppercase tracking-wider"
            style={{ backgroundColor: SERVICE_BRAND.mortgage.chip, color: SERVICE_BRAND.mortgage.hue }}
          >
            <Landmark className="h-3.5 w-3.5" /> იპოთეკა და ფინანსები
          </span>
          <h2 className="text-balance text-[28px] font-black tracking-[-0.02em] text-sv-ink md:text-[38px]">
            გამოითვალე იპოთეკური სესხის ყოველთვიური შენატანი
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-[14px] font-semibold text-sv-ink/65 md:text-[16px]">
            შედარება TBC, BoG, Liberty და ტერაბანკის პირობების მიხედვით
          </p>
        </Reveal>

        <div className="mx-auto max-w-4xl overflow-hidden rounded-card border border-sv-ink/[0.08] bg-sv-surface p-6 md:p-10 shadow-card">
          <div className="grid gap-8 lg:grid-cols-12">
            {/* Input Controls */}
            <div className="space-y-6 lg:col-span-7">
              {/* Property Price Slider */}
              <div>
                <div className="flex items-center justify-between text-[14px] font-extrabold text-sv-ink">
                  <span>ქონების ღირებულება</span>
                  <span className="text-[18px] font-black text-sv-blue">${propertyPrice.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min={20000}
                  max={300000}
                  step={5000}
                  value={propertyPrice}
                  onChange={(e) => setPropertyPrice(Number(e.target.value))}
                  className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-sv-ink/10 accent-sv-blue"
                />
              </div>

              {/* Down Payment Slider */}
              <div>
                <div className="flex items-center justify-between text-[14px] font-extrabold text-sv-ink">
                  <span>თანამონაწილეობა ({downPaymentPct}%)</span>
                  <span className="text-[15px] font-black text-sv-ink/70">${downPaymentUSD.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={50}
                  step={5}
                  value={downPaymentPct}
                  onChange={(e) => setDownPaymentPct(Number(e.target.value))}
                  className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-sv-ink/10 accent-sv-blue"
                />
              </div>

              {/* Term Selector Buttons */}
              <div>
                <label className="mb-2.5 block text-[14px] font-extrabold text-sv-ink">
                  სესხის ვადა (წელი)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[5, 10, 15, 20].map((years) => {
                    const active = years === termYears
                    return (
                      <button
                        key={years}
                        type="button"
                        onClick={() => setTermYears(years)}
                        className={`rounded-control py-2.5 text-center text-[13px] font-black transition-all ${
                          active
                            ? 'bg-sv-blue text-white shadow-glow-blue-sm'
                            : 'bg-sv-cloud text-sv-ink/75 border border-sv-ink/10 hover:border-sv-blue/30'
                        }`}
                      >
                        {years} წელი
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Results Box */}
            <div className="flex flex-col justify-between rounded-module border border-sv-blue/20 bg-sv-navy p-6 text-white lg:col-span-5">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-sv-blue/20 px-3 py-1 text-[11px] font-extrabold text-sv-blue-light">
                  <DollarSign className="h-3 w-3" /> ყოველთვიური გადასახადი
                </span>
                <div className="mt-4">
                  <div className="text-[32px] font-black text-white md:text-[38px]">
                    ${monthlyPaymentUSD.toLocaleString()}<span className="text-[14px] font-bold text-white/60">/თვე</span>
                  </div>
                  <div className="text-[18px] font-extrabold text-sv-blue-light">
                    ≈ {monthlyPaymentGEL.toLocaleString()} ₾ /თვეში
                  </div>
                </div>
                <p className="mt-3 text-[12px] font-medium leading-relaxed text-white/60">
                  სესხის თანხა: ${loanAmountUSD.toLocaleString()} • ვადა {termYears} წელი • 10.5% წლიური.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10">
                <LocalizedLink
                  href="/mortgage-calculator"
                  className="flex w-full items-center justify-center gap-2 rounded-control bg-sv-blue px-5 py-3 text-[14px] font-black text-white shadow-glow-blue transition-all hover:-translate-y-0.5 hover:bg-sv-blue-deep"
                >
                  სრული კალკულატორი
                  <ArrowRight className="h-4 w-4" />
                </LocalizedLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
