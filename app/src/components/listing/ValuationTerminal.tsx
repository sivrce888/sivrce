'use client'

import { useState, useMemo, useEffect } from 'react'
import { calculateValuation10x } from '@/lib/valuation-10x'
import { usePostHog } from '@/lib/posthog'
import { ShieldCheck, AlertTriangle, Calculator } from 'lucide-react'

interface ValuationTerminalProps {
  priceUSD: number
  areaSqm: number
  monthlyRentUSD: number
  countryCode?: string
  lang?: string
}

export default function ValuationTerminal({
  priceUSD,
  areaSqm,
  monthlyRentUSD,
  countryCode = 'GE',
  lang = 'ka',
}: ValuationTerminalProps) {
  const [selectedScenario, setSelectedScenario] = useState<'BEAR' | 'BASE' | 'BULL'>('BASE')
  const isKa = lang === 'ka'
  // Tri-lang chrome (ka/de/en) — matches the de-market overlay ceiling.
  const T = (ka: string, de: string, en: string) => (isKa ? ka : lang === 'de' ? de : en)

  const report = useMemo(() => {
    return calculateValuation10x({
      priceUSD,
      areaSqm,
      monthlyRentUSD,
      countryCode,
    })
  }, [priceUSD, areaSqm, monthlyRentUSD, countryCode])

  // The terminal is lazy-loaded (ssr:false), so a mount IS a visitor seeing
  // the verdict — count it once; props are stable per listing.
  const { capture: captureEvent } = usePostHog()
  useEffect(() => {
    captureEvent('valuation_viewed', { verdict: report.dealVerdict, country: countryCode })
  }, [captureEvent, report.dealVerdict, countryCode])

  // ponytail: inferred from report.scenarios — the annotation named a type this
  // file never imported, which is why the build was red.
  const scenario = report.scenarios[selectedScenario.toLowerCase() as 'bear' | 'base' | 'bull']

  const verdictColor =
    report.dealVerdict === 'EXCEPTIONAL'
      ? 'text-sv-accent bg-sv-accent/10 border-sv-accent/20'
      : report.dealVerdict === 'GOOD'
        ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
        : report.dealVerdict === 'OVERPRICED'
          ? 'text-sv-red bg-sv-red/10 border-sv-red/20'
          : 'text-sv-ink-soft bg-sv-ink/[0.04] border-sv-ink/[0.08]'

  const verdictLabel = isKa
    ? report.dealVerdict === 'EXCEPTIONAL'
      ? 'საუკეთესო შეთავაზება (Underpriced)'
      : report.dealVerdict === 'GOOD'
        ? 'ხელსაყრელი ფასი (Good Value)'
        : report.dealVerdict === 'OVERPRICED'
          ? 'მაღალი ფასი (Overpriced)'
          : 'სამართლიანი საბაზრო ფასი'
    : lang === 'de'
    ? report.dealVerdict === 'EXCEPTIONAL'
      ? 'Außergewöhnliche Gelegenheit'
      : report.dealVerdict === 'GOOD'
        ? 'Guter Marktwert'
        : report.dealVerdict === 'OVERPRICED'
          ? 'Über Marktpreis'
          : 'Fairer Marktwert'
    : report.dealVerdict === 'EXCEPTIONAL'
      ? 'Exceptional Opportunity'
      : report.dealVerdict === 'GOOD'
        ? 'Good Market Value'
        : report.dealVerdict === 'OVERPRICED'
          ? 'Priced Above Market'
          : 'Fair Market Value'

  return (
    <section
      aria-labelledby="valuation-terminal-heading"
      className="mt-8 rounded-card border border-sv-ink/[0.06] bg-sv-surface p-5 sm:p-6 shadow-card transition-all"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-sv-ink/[0.06] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-sv-accent" aria-hidden />
            <h2 id="valuation-terminal-heading" className="text-base font-bold text-sv-ink">
              {T('ინსტიტუციური შეფასება და 3 სცენარი', 'Institutionelle Bewertung & Szenarien', 'Institutional Valuation & Scenarios')}
            </h2>
          </div>
          <p className="mt-1 text-xs text-sv-ink-soft">
            {T(
              'Bear / Base / Bull ფულადი ნაკადების, NOI-სა და 5-წლიანი IRR-ის გაანგარიშება',
              'Institutionelle Cashflows, Net Operating Income, Cap Rate & 5-Jahres-IRR',
              'Institutional cash flows, Net Operating Income, Cap Rate & 5-year IRR projection',
            )}
          </p>
        </div>

        <div className={`inline-flex items-center self-start sm:self-center rounded-lg border px-3 py-1 text-xs font-semibold uppercase tracking-wider gap-1.5 ${verdictColor}`}>
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>{verdictLabel}</span>
        </div>
      </div>

      {/* Scenario Selector Tabs */}
      <div className="mt-5 flex items-center gap-2 rounded-control bg-sv-ink/[0.03] p-1 border border-sv-ink/[0.04]">
        {(['BEAR', 'BASE', 'BULL'] as const).map((s) => {
          const active = selectedScenario === s
          const label = isKa
            ? s === 'BEAR'
              ? 'კონსერვატიული (Bear)'
              : s === 'BASE'
                ? 'საბაზისო (Base)'
                : 'ოპტიმისტური (Bull)'
            : lang === 'de'
            ? s === 'BEAR'
              ? 'Konservativ (Bear)'
              : s === 'BASE'
                ? 'Basis­szenario'
                : 'Wachstum (Bull)'
            : s === 'BEAR'
              ? 'Conservative (Bear)'
              : s === 'BASE'
                ? 'Base Scenario'
                : 'Growth (Bull)'

          return (
            <button
              key={s}
              type="button"
              onClick={() => setSelectedScenario(s)}
              className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all ${
                active
                  ? 'bg-sv-surface text-sv-ink shadow-sm border border-sv-ink/[0.06]'
                  : 'text-sv-ink-soft hover:text-sv-ink'
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* Key Metrics Grid */}
      <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-control border border-sv-ink/[0.05] bg-sv-ink/[0.01] p-3.5">
          <span className="text-[11px] font-medium text-sv-ink-soft uppercase tracking-wider block">
            {T('5-წლიანი საპროგნოზო IRR', '5-Jahres-Prognose-IRR', '5-Year Forecast IRR')}
          </span>
          <span className="mt-1 text-lg font-bold text-sv-accent flex items-baseline gap-0.5">
            {scenario.year5IrrPct}%
          </span>
          <span className="text-[10px] text-sv-ink-soft">
            {T('წლიური შიდა მომგებიანობა', 'Annualisierte Rendite', 'Annualized return')}
          </span>
        </div>

        <div className="rounded-control border border-sv-ink/[0.05] bg-sv-ink/[0.01] p-3.5">
          <span className="text-[11px] font-medium text-sv-ink-soft uppercase tracking-wider block">
            {T('Net Cap Rate (წმინდა)', 'Net Cap Rate (netto)', 'Net Cap Rate')}
          </span>
          <span className="mt-1 text-lg font-bold text-sv-ink flex items-baseline gap-0.5">
            {scenario.year1CapRatePct}%
          </span>
          <span className="text-[10px] text-sv-ink-soft">
            {isKa ? `NOI: $${scenario.year1NoiUSD.toLocaleString()}/წ` : `NOI: $${scenario.year1NoiUSD.toLocaleString()}${lang === 'de' ? '/Jahr' : '/yr'}`}
          </span>
        </div>

        <div className="rounded-control border border-sv-ink/[0.05] bg-sv-ink/[0.01] p-3.5">
          <span className="text-[11px] font-medium text-sv-ink-soft uppercase tracking-wider block">
            {T('5 წლის ღირებულება', 'Immobilienwert nach 5 Jahren', '5-Yr Property Value')}
          </span>
          <span className="mt-1 text-lg font-bold text-sv-ink">
            ${scenario.year5PropertyValueUSD.toLocaleString()}
          </span>
          <span className="text-[10px] text-sv-ink-soft">
            +{scenario.annualAppreciationPct}% {T('ზრდა/წ', 'Steigerung/Jahr', 'growth/yr')}
          </span>
        </div>

        <div className="rounded-control border border-sv-ink/[0.05] bg-sv-ink/[0.01] p-3.5">
          <span className="text-[11px] font-medium text-sv-ink-soft uppercase tracking-wider block">
            {T('5-წლ. წმინდა იჯარა', '5-Jahres-Nettomietzahlung', '5-Yr Net Cash Flow')}
          </span>
          <span className={`mt-1 text-lg font-bold ${scenario.year5TotalNetCashFlowUSD >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
            {scenario.year5TotalNetCashFlowUSD >= 0
              ? `$${scenario.year5TotalNetCashFlowUSD.toLocaleString()}`
              : `−$${Math.abs(scenario.year5TotalNetCashFlowUSD).toLocaleString()}`}
          </span>
          <span className="text-[10px] text-sv-ink-soft block">
            {scenario.vacancyRatePct}% {T('ვაკანტურობა', 'Leerstand', 'vacancy')}
          </span>
        </div>
      </div>

      {/* Why Sivrce Recommends & Risk Factors */}
      <div className="mt-5 grid sm:grid-cols-2 gap-3 pt-3 border-t border-sv-ink/[0.04]">
        <div className="rounded-control bg-emerald-500/[0.03] border border-emerald-500/10 p-3.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            <ShieldCheck className="h-4 w-4" />
            <span>{T('რატომ გვირჩევს სივრცე', 'Warum SIVRCE empfiehlt', 'Why SIVRCE Recommends')}</span>
          </div>
          <ul className="mt-2 space-y-1.5 text-xs text-sv-ink">
            {(isKa
              ? report.recommendations.whyBuyKa
              : lang === 'de'
              ? report.recommendations.whyBuyDe
              : report.recommendations.whyBuyEn
            ).map((point, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-emerald-500 font-bold">•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-control bg-amber-500/[0.03] border border-amber-500/10 p-3.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
            <AlertTriangle className="h-4 w-4" />
            <span>{T('რისკ-ფაქტორები და შენიშვნები', 'Risikofaktoren & Sorgfaltspflicht', 'Risk Factors & Diligence')}</span>
          </div>
          <ul className="mt-2 space-y-1.5 text-xs text-sv-ink">
            {(isKa
              ? report.recommendations.risksKa
              : lang === 'de'
              ? report.recommendations.risksDe
              : report.recommendations.risksEn
            ).map((risk, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-amber-500 font-bold">•</span>
                <span>{risk}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
