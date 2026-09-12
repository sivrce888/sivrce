'use client'

/**
 * InvestmentCalculator — rental yield, cap rate, cash-on-cash, appreciation projection.
 * Self-contained, no external APIs. Works on all devices.
 */

import { useMemo, useState } from 'react'
import { TrendingUp, Percent, DollarSign, Calendar, BarChart3 } from 'lucide-react'
import { formatUSD } from '@/lib/listing-format'

interface InvestmentCalculatorProps {
  priceUSD: number
  area?: number
  city?: string
  lang?: 'en' | 'de' | 'ka'
  className?: string
}

interface Projection {
  year: number
  value: number
  equity: number
  rent: number
  cumulativeYield: number
}

export function InvestmentCalculator({
  priceUSD,
  area,
  city,
  lang = 'en',
  className = '',
}: InvestmentCalculatorProps) {
  const [monthlyRent, setMonthlyRent] = useState(() => estimateRent(priceUSD))
  const [appreciation, setAppreciation] = useState(5)
  const [downPct, setDownPct] = useState(20)
  const [interestRate, setInterestRate] = useState(6)
  const [years, setYears] = useState(10)

  const metrics = useMemo(() => {
    const downPayment = priceUSD * (downPct / 100)
    const loanAmount = priceUSD - downPayment
    const annualRent = monthlyRent * 12
    const grossYield = priceUSD > 0 ? (annualRent / priceUSD) * 100 : 0
    const capRate = priceUSD > 0 ? (annualRent / priceUSD) * 100 : 0

    // Mortgage calculation
    const monthlyRate = interestRate / 100 / 12
    const numPayments = years * 12
    const monthlyMortgage =
      monthlyRate > 0
        ? loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1)
        : loanAmount / numPayments

    const annualMortgage = monthlyMortgage * 12
    const netOperatingIncome = annualRent - annualMortgage
    const cashOnCash = downPayment > 0 ? (netOperatingIncome / downPayment) * 100 : 0

    // Projection
    const projection: Projection[] = []
    let currentValue = priceUSD
    let totalEquity = 0
    for (let y = 1; y <= years; y++) {
      currentValue *= 1 + appreciation / 100
      const equity = currentValue - Math.max(0, loanAmount - (loanAmount * y) / years)
      totalEquity += annualRent
      projection.push({
        year: y,
        value: Math.round(currentValue),
        equity: Math.round(equity),
        rent: Math.round(annualRent),
        cumulativeYield: Math.round(((currentValue - priceUSD + totalEquity) / downPayment) * 100),
      })
    }

    return {
      grossYield: Math.round(grossYield * 10) / 10,
      capRate: Math.round(capRate * 10) / 10,
      cashOnCash: Math.round(cashOnCash * 10) / 10,
      monthlyMortgage: Math.round(monthlyMortgage),
      netOperatingIncome: Math.round(netOperatingIncome),
      downPayment: Math.round(downPayment),
      projection,
    }
  }, [priceUSD, monthlyRent, appreciation, downPct, interestRate, years])

  const labels = {
    en: {
      title: 'Investment Analysis',
      subtitle: 'Rental yield, appreciation, and ROI projections',
      monthlyRent: 'Expected Monthly Rent',
      appreciation: 'Annual Appreciation %',
      downPayment: 'Down Payment %',
      interestRate: 'Interest Rate %',
      mortgageTerm: 'Mortgage Term (years)',
      grossYield: 'Gross Yield',
      capRate: 'Cap Rate',
      cashOnCash: 'Cash-on-Cash Return',
      monthlyMortgage: 'Monthly Mortgage',
      netIncome: 'Net Annual Income',
      projection: 'Value Projection',
      year: 'Year',
      value: 'Property Value',
      totalReturn: 'Total Return',
    },
    de: {
      title: 'Investitionsanalyse',
      subtitle: 'Mietrendite, Wertsteigerung und ROI-Prognosen',
      monthlyRent: 'Erwartete Monatsmiete',
      appreciation: 'Jährliche Wertsteigerung %',
      downPayment: 'Eigenkapital %',
      interestRate: 'Zinssatz %',
      mortgageTerm: 'Kreditlaufzeit (Jahre)',
      grossYield: 'Bruttorendite',
      capRate: 'Kapitalrendite',
      cashOnCash: 'Cash-on-Cash-Rendite',
      monthlyMortgage: 'Monatliche Rate',
      netIncome: 'Jährliches Nettoeinkommen',
      projection: 'Wertprognose',
      year: 'Jahr',
      value: 'Immobilienwert',
      totalReturn: 'Gesamtrendite',
    },
    ka: {
      title: 'საინვესტიციო ანალიზი',
      subtitle: 'ქირავების შემოსავალი და ღირებულების პროგნოზი',
      monthlyRent: 'მოსალოდნელი თვიური ქირა',
      appreciation: 'წლიური ზრდა %',
      downPayment: 'წინასწარი გადახდა %',
      interestRate: 'საპროცენტო განაკვეთი %',
      mortgageTerm: 'იპოთეკის ვადა (წლები)',
      grossYield: 'მთლიანი შემოსავალი',
      capRate: 'კაპიტალიზაციის მაჩვენებელი',
      cashOnCash: 'Cash-on-Cash უკან დაბრუნება',
      monthlyMortgage: 'თვიური იპოთეკა',
      netIncome: 'წლიური წმინდა შემოსავალი',
      projection: 'ღირებულების პროგნოზი',
      year: 'წელი',
      value: 'ქონების ღირებულება',
      totalReturn: 'მთლიანი დაბრუნება',
    },
  }[lang]

  return (
    <div className={`rounded-card border border-sv-ink/[0.06] bg-sv-surface p-5 shadow-card md:p-6 ${className}`}>
      <div className="mb-5">
        <h3 className="flex items-center gap-2 text-[17px] font-black text-sv-ink">
          <BarChart3 className="h-5 w-5 text-sv-blue" aria-hidden />
          {labels.title}
        </h3>
        <p className="mt-1 text-[12px] font-bold text-sv-ink/50">{labels.subtitle}</p>
      </div>

      {/* Inputs */}
      <div className="mb-5 grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-bold text-sv-ink/60">{labels.monthlyRent}</span>
          <input
            type="number"
            value={monthlyRent}
            onChange={(e) => setMonthlyRent(Math.max(0, Number(e.target.value)))}
            className="rounded-module border border-sv-ink/10 bg-sv-cloud px-3 py-2 text-[14px] font-bold text-sv-ink outline-none transition-colors focus:border-sv-blue"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-bold text-sv-ink/60">{labels.appreciation}</span>
          <input
            type="number"
            value={appreciation}
            onChange={(e) => setAppreciation(Number(e.target.value))}
            step={0.5}
            className="rounded-module border border-sv-ink/10 bg-sv-cloud px-3 py-2 text-[14px] font-bold text-sv-ink outline-none transition-colors focus:border-sv-blue"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-bold text-sv-ink/60">{labels.downPayment}</span>
          <input
            type="number"
            value={downPct}
            onChange={(e) => setDownPct(Math.min(100, Math.max(0, Number(e.target.value))))}
            className="rounded-module border border-sv-ink/10 bg-sv-cloud px-3 py-2 text-[14px] font-bold text-sv-ink outline-none transition-colors focus:border-sv-blue"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-bold text-sv-ink/60">{labels.interestRate}</span>
          <input
            type="number"
            value={interestRate}
            onChange={(e) => setInterestRate(Math.max(0, Number(e.target.value)))}
            step={0.25}
            className="rounded-module border border-sv-ink/10 bg-sv-cloud px-3 py-2 text-[14px] font-bold text-sv-ink outline-none transition-colors focus:border-sv-blue"
          />
        </label>
      </div>

      {/* Key metrics */}
      <div className="mb-5 grid grid-cols-3 gap-3">
        {[
          { label: labels.grossYield, value: `${metrics.grossYield}%`, icon: Percent, color: metrics.grossYield >= 6 ? '#007a33' : metrics.grossYield >= 4 ? '#ffd700' : '#e8421e' },
          { label: labels.capRate, value: `${metrics.capRate}%`, icon: TrendingUp, color: '#0066FF' },
          { label: labels.cashOnCash, value: `${metrics.cashOnCash}%`, icon: DollarSign, color: metrics.cashOnCash >= 0 ? '#007a33' : '#e8421e' },
        ].map((m) => (
          <div key={m.label} className="rounded-module border border-sv-ink/[0.06] bg-sv-cloud p-3 text-center">
            <m.icon className="mx-auto mb-1 h-4 w-4" style={{ color: m.color }} aria-hidden />
            <div className="text-[16px] font-black" style={{ color: m.color }}>{m.value}</div>
            <div className="text-[10px] font-bold uppercase tracking-wide text-sv-ink/40">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Projection table */}
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-sv-ink/[0.06]">
              <th className="py-2 text-left font-bold text-sv-ink/50">{labels.year}</th>
              <th className="py-2 text-right font-bold text-sv-ink/50">{labels.value}</th>
              <th className="py-2 text-right font-bold text-sv-ink/50">{labels.totalReturn}</th>
            </tr>
          </thead>
          <tbody>
            {metrics.projection.filter((_, i) => i % Math.max(1, Math.floor(years / 5)) === 0 || i === years - 1).map((p) => (
              <tr key={p.year} className="border-b border-sv-ink/[0.03]">
                <td className="py-1.5 font-bold text-sv-ink">{p.year}</td>
                <td className="py-1.5 text-right font-bold text-sv-ink">{formatUSD(p.value)}</td>
                <td className="py-1.5 text-right font-black" style={{ color: p.cumulativeYield >= 0 ? '#007a33' : '#e8421e' }}>
                  {p.cumulativeYield > 0 ? '+' : ''}{p.cumulativeYield}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/** Estimate monthly rent from sale price (rough market heuristic). */
function estimateRent(priceUSD: number): number {
  // Rule of thumb: monthly rent ≈ 0.5-0.8% of price in emerging markets
  return Math.round(priceUSD * 0.005 / 100) * 100
}
