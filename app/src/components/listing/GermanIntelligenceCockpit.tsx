'use client'

import { useState, useMemo } from 'react'
import {
  underwriteDeProperty,
  type DeHeatingType,
} from '@/lib/countries/de-proptech-os'
import { type DeEnergyClass } from '@/lib/countries/de-expose'
import {
  Zap,
  Building2,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  FileCheck2,
  Flame,
  Leaf,
  Info,
} from 'lucide-react'

interface GermanIntelligenceCockpitProps {
  priceEur: number
  areaSqm: number
  city: string
  district?: string
  yearBuilt?: number
  energyClass?: DeEnergyClass
  kwh?: number
  heatingType?: DeHeatingType
  monthlyColdRentEur?: number
  isSale?: boolean
  lang?: string
  gegDisclosure?: string | null
}

const ENERGY_COLORS: Record<DeEnergyClass, { bg: string; text: string; border: string }> = {
  'A+': { bg: 'bg-emerald-500', text: 'text-emerald-500', border: 'border-emerald-500' },
  A: { bg: 'bg-emerald-400', text: 'text-emerald-400', border: 'border-emerald-400' },
  B: { bg: 'bg-lime-500', text: 'text-lime-500', border: 'border-lime-500' },
  C: { bg: 'bg-yellow-400', text: 'text-yellow-500', border: 'border-yellow-400' },
  D: { bg: 'bg-amber-400', text: 'text-amber-500', border: 'border-amber-400' },
  E: { bg: 'bg-orange-400', text: 'text-orange-500', border: 'border-orange-400' },
  F: { bg: 'bg-orange-600', text: 'text-orange-600', border: 'border-orange-600' },
  G: { bg: 'bg-red-500', text: 'text-red-500', border: 'border-red-500' },
  H: { bg: 'bg-rose-700', text: 'text-rose-700', border: 'border-rose-700' },
}

const ALL_CLASSES: DeEnergyClass[] = ['A+', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

export default function GermanIntelligenceCockpit({
  priceEur,
  areaSqm,
  city,
  yearBuilt = 1990,
  energyClass = 'C',
  heatingType = 'gaszentral',
  monthlyColdRentEur,
  isSale = true,
  lang = 'de',
  gegDisclosure,
}: GermanIntelligenceCockpitProps) {
  const [tab, setTab] = useState<'energy' | 'acquisition' | 'scenarios'>('energy')
  const [scenarioKey, setScenarioKey] = useState<'BEAR' | 'BASE' | 'BULL'>('BASE')

  const isDe = lang === 'de'
  const isKa = lang === 'ka'

  // Default estimated market rent if not specified: ~15 €/m² for major German metros
  const estRent = monthlyColdRentEur && monthlyColdRentEur > 0 ? monthlyColdRentEur : Math.round(areaSqm * 15.5)

  const report = useMemo(() => {
    return underwriteDeProperty({
      purchasePriceEur: priceEur,
      areaSqm,
      monthlyColdRentEur: estRent,
      citySlug: city.toLowerCase(),
      yearBuilt,
      energyClass,
      heatingType,
    })
  }, [priceEur, areaSqm, estRent, city, yearBuilt, energyClass, heatingType])

  const scenario = report.scenarios[scenarioKey.toLowerCase() as 'bear' | 'base' | 'bull']

  const verdictBadge =
    report.dealVerdict === 'EXCELLENT_BUY'
      ? {
          label: isDe ? 'Top Kaufgelegenheit' : isKa ? 'საუკეთესო შენაძენი' : 'Prime Buy Opportunity',
          color: 'bg-sv-blue/10 text-sv-blue-deep dark:text-sv-blue-light border-sv-blue/20',
        }
      : report.dealVerdict === 'FAIR_VALUE'
        ? {
            label: isDe ? 'Marktgerechter Preis' : isKa ? 'სამართლიანი ფასი' : 'Fair Market Value',
            color: 'bg-sv-cloud text-sv-ink border-sv-ink/[0.08]',
          }
        : report.dealVerdict === 'HOLD_ANALYZE'
          ? {
              label: isDe ? 'Prüfung empfohlen' : isKa ? 'დამატებითი ანალიზი' : 'Due Diligence Required',
              color: 'bg-sv-orange/10 text-sv-orange border-sv-orange/20',
            }
          : {
              label: isDe ? 'Überteuert / Risikoreich' : isKa ? 'მაღალი რისკი / ძვირი' : 'Elevated Risk / Overpriced',
              color: 'bg-sv-orange-deep/10 text-sv-orange-deep border-sv-orange-deep/20',
            }

  return (
    <section
      aria-labelledby="de-cockpit-heading"
      className="mt-8 rounded-card border border-sv-ink/[0.06] bg-sv-surface p-5 sm:p-6 shadow-card transition"
    >
      {/* Header with Title & Overall German SPI Score */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-sv-ink/[0.06] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-sv-blue" aria-hidden />
            <h2 id="de-cockpit-heading" className="text-base font-black text-sv-ink">
              {isDe
                ? 'Deutscher Immobilien- & Energie-Cockpit (GEG 2026)'
                : isKa
                  ? 'გერმანული უძრავი ქონებისა და ენერგოეფექტურობის ანალიზი'
                  : 'German Property & Energy Intelligence (GEG 2026)'}
            </h2>
          </div>
          <p className="mt-1 text-xs font-medium text-sv-ink/60">
            {isDe
              ? 'Energieeffizienz, CO₂-Kostenaufteilung, Kaufnebenkosten & 3-Szenarien DCF-Underwriting'
              : isKa
                ? 'ენერგოეფექტურობა, CO₂ გადასახადის გადანაწილება, ხარჯები და 3 სცენარი'
                : 'Energy efficiency, statutory CO₂ cost sharing, closing costs & 3-scenario DCF underwriting'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <div className="flex items-center gap-1.5 rounded-lg border border-sv-ink/[0.08] bg-sv-ink/[0.03] px-3 py-1.5">
            <span className="text-[11px] font-bold text-sv-ink/60">SPI Score:</span>
            <span className="text-[14px] font-black text-sv-blue">{report.spiScore}</span>
            <span className="text-[11px] font-semibold text-sv-ink/40">/100</span>
          </div>

          <div
            className={`inline-flex items-center rounded-lg border px-3 py-1.5 text-[11px] font-black uppercase tracking-wider gap-1 ${verdictBadge.color}`}
          >
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
            <span>{verdictBadge.label}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-4 flex rounded-control bg-sv-ink/[0.04] p-1 gap-1" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'energy'}
          onClick={() => setTab('energy')}
          className={`flex-1 rounded-lg py-2 text-xs font-black transition flex items-center justify-center gap-1.5 ${
            tab === 'energy'
              ? 'bg-sv-surface text-sv-ink shadow-sm'
              : 'text-sv-ink/60 hover:text-sv-ink'
          }`}
        >
          <Zap className="h-3.5 w-3.5 text-sv-orange" aria-hidden />
          <span>{isDe ? 'Energie & GEG' : isKa ? 'ენერგია და GEG' : 'Energy & GEG'}</span>
        </button>

        {isSale && (
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'acquisition'}
            onClick={() => setTab('acquisition')}
            className={`flex-1 rounded-lg py-2 text-xs font-black transition flex items-center justify-center gap-1.5 ${
              tab === 'acquisition'
                ? 'bg-sv-surface text-sv-ink shadow-sm'
                : 'text-sv-ink/60 hover:text-sv-ink'
            }`}
          >
            <FileCheck2 className="h-3.5 w-3.5 text-sv-blue" aria-hidden />
            <span>{isDe ? 'Kaufnebenkosten' : isKa ? 'ხარჯები და გადასახადი' : 'Closing Costs'}</span>
          </button>
        )}

        {isSale && (
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'scenarios'}
            onClick={() => setTab('scenarios')}
            className={`flex-1 rounded-lg py-2 text-xs font-black transition flex items-center justify-center gap-1.5 ${
              tab === 'scenarios'
                ? 'bg-sv-surface text-sv-ink shadow-sm'
                : 'text-sv-ink/60 hover:text-sv-ink'
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5 text-emerald-500" aria-hidden />
            <span>{isDe ? '3-Szenarien Rendite' : isKa ? '3 სცენარი / IRR' : '3 Scenarios & Yield'}</span>
          </button>
        )}
      </div>

      {/* Tab 1: Energy & GEG 2026 */}
      {tab === 'energy' && (
        <div className="mt-5 space-y-5">
          {/* Visual Energy Class Strip (A+ to H) */}
          <div className="rounded-tile border border-sv-ink/[0.06] bg-sv-cloud/50 p-4">
            <div className="flex items-center justify-between text-xs font-bold text-sv-ink/70">
              <span>{isDe ? 'Energieeffizienzklasse nach Anlage 10 GEG' : 'Energy Rating (GEG Anlage 10)'}</span>
              <span className="font-black text-sv-ink">
                {report.energy.kwhPerSqmYear} kWh/(m²·a)
              </span>
            </div>

            {/* Gradient scale with pin */}
            <div className="mt-3 relative">
              <div className="grid grid-cols-9 gap-1 h-6 rounded-md overflow-hidden p-0.5 bg-sv-ink/[0.04]">
                {ALL_CLASSES.map((cls) => {
                  const isCurrent = cls === report.energy.energyClass
                  return (
                    <div
                      key={cls}
                      className={`relative flex items-center justify-center text-[10px] font-black text-white rounded transition-transform ${
                        ENERGY_COLORS[cls].bg
                      } ${isCurrent ? 'ring-2 ring-sv-ink shadow-md scale-105 z-10' : 'opacity-80'}`}
                    >
                      {cls}
                    </div>
                  )
                })}
              </div>
            </div>

            {gegDisclosure && (
              <p className="mt-3 text-[11px] font-medium text-sv-ink/60 leading-relaxed">
                <strong className="text-sv-ink/80">{isDe ? 'Pflichtangabe:' : 'Mandatory disclosure:'} </strong>
                {gegDisclosure}
              </p>
            )}
          </div>

          {/* 3 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 1. CO2KostAufG Stufenmodell */}
            <div className="rounded-tile border border-sv-ink/[0.06] bg-sv-surface p-4 shadow-card">
              <div className="flex items-center gap-1.5 text-xs font-bold text-sv-ink/60">
                <Leaf className="h-4 w-4 text-emerald-500" aria-hidden />
                <span>{isDe ? 'CO₂-Kostenaufteilung' : 'CO₂ Carbon Tax Share'}</span>
              </div>
              <div className="mt-2 text-[20px] font-black text-sv-ink">
                {report.energy.co2LandlordSharePct}%
                <span className="text-xs font-bold text-sv-ink/50 ml-1">
                  {isDe ? 'Vermieter' : 'Landlord'}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-sv-ink/60">
                {isDe
                  ? `Mieter trägt ${100 - report.energy.co2LandlordSharePct} % (CO2KostAufG Stufenmodell)`
                  : `Tenant absorbs ${100 - report.energy.co2LandlordSharePct}% per statutory 10-tier scale`}
              </p>
            </div>

            {/* 2. KfW 261 / BEG 458 Förderzuschuss */}
            <div className="rounded-tile border border-sv-ink/[0.06] bg-sv-surface p-4 shadow-card">
              <div className="flex items-center gap-1.5 text-xs font-bold text-sv-ink/60">
                <Zap className="h-4 w-4 text-amber-500" aria-hidden />
                <span>{isDe ? 'KfW / BEG Förderung' : 'KfW Subsidy Potential'}</span>
              </div>
              <div className="mt-2 text-[20px] font-black text-sv-blue">
                +{report.energy.kfwSubsidyEligibleEur.toLocaleString('de-DE')} €
              </div>
              <p className="mt-1 text-[11px] text-sv-ink/60">
                {isDe
                  ? 'Bis zu 55 % staatlicher Zuschuss bei Heizungstausch & Sanierung'
                  : 'Up to 55% state grant for energy renovation (BEG 458)'}
              </p>
            </div>

            {/* 3. Sanierungs-Capex & Amortisation */}
            <div className="rounded-tile border border-sv-ink/[0.06] bg-sv-surface p-4 shadow-card">
              <div className="flex items-center gap-1.5 text-xs font-bold text-sv-ink/60">
                <Flame className="h-4 w-4 text-sv-orange" aria-hidden />
                <span>{isDe ? 'Netto-Sanierung' : 'Net Capex & Payback'}</span>
              </div>
              <div className="mt-2 text-[20px] font-black text-sv-ink">
                {report.energy.netRenovationCapexEur.toLocaleString('de-DE')} €
              </div>
              <p className="mt-1 text-[11px] text-sv-ink/60">
                {report.energy.energyUpgradePaybackYears > 0
                  ? isDe
                    ? `Amortisation in ca. ${report.energy.energyUpgradePaybackYears} Jahren`
                    : `Payback in ~${report.energy.energyUpgradePaybackYears} years`
                  : isDe
                    ? 'Kein unmittelbarer Sanierungsbedarf'
                    : 'No immediate renovation needed'}
              </p>
            </div>
          </div>

          {/* GEG 2026 Compliance Status Banner */}
          <div className="rounded-tile border border-sv-ink/[0.06] bg-sv-cloud/40 p-4 flex items-start gap-3">
            <Info className="h-5 w-5 text-sv-blue shrink-0 mt-0.5" aria-hidden />
            <div className="text-xs text-sv-ink/70 leading-relaxed">
              <span className="font-bold text-sv-ink">
                {isDe ? 'GEG 2026 Status: ' : 'GEG 2026 Status: '}
              </span>
              {isDe ? report.energy.gegSummaryDe : report.energy.gegSummaryEn}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Acquisition Costs (Kaufnebenkosten) */}
      {tab === 'acquisition' && isSale && (
        <div className="mt-5 space-y-4">
          <div className="rounded-tile border border-sv-ink/[0.06] overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-sv-cloud/60 text-sv-ink/60 font-bold border-b border-sv-ink/[0.06]">
                  <th className="py-2.5 px-4">{isDe ? 'Kostenposition' : 'Closing Item'}</th>
                  <th className="py-2.5 px-3 text-right">{isDe ? 'Satz' : 'Rate'}</th>
                  <th className="py-2.5 px-4 text-right">{isDe ? 'Betrag' : 'Amount'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sv-ink/[0.06] font-semibold text-sv-ink/80">
                <tr>
                  <td className="py-2.5 px-4">
                    {isDe
                      ? `Grunderwerbsteuer (${report.acquisition.state})`
                      : `Transfer Tax (${report.acquisition.state})`}
                  </td>
                  <td className="py-2.5 px-3 text-right">{report.acquisition.transferTaxPct}%</td>
                  <td className="py-2.5 px-4 text-right font-bold text-sv-ink">
                    {report.acquisition.transferTaxEur.toLocaleString('de-DE')} €
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4">
                    {isDe ? 'Notarkosten (GNotKG)' : 'Notary Fees (GNotKG)'}
                  </td>
                  <td className="py-2.5 px-3 text-right">{report.acquisition.notaryPct}%</td>
                  <td className="py-2.5 px-4 text-right font-bold text-sv-ink">
                    {report.acquisition.notaryEur.toLocaleString('de-DE')} €
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4">
                    {isDe ? 'Grundbucheintragung' : 'Land Registry (Grundbuch)'}
                  </td>
                  <td className="py-2.5 px-3 text-right">{report.acquisition.registerPct}%</td>
                  <td className="py-2.5 px-4 text-right font-bold text-sv-ink">
                    {report.acquisition.registerEur.toLocaleString('de-DE')} €
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4">
                    {isDe ? 'Maklerprovision (§ 656c BGB)' : 'Broker Fee (§ 656c BGB)'}
                  </td>
                  <td className="py-2.5 px-3 text-right">{report.acquisition.maklerPct}%</td>
                  <td className="py-2.5 px-4 text-right font-bold text-sv-ink">
                    {report.acquisition.maklerEur.toLocaleString('de-DE')} €
                  </td>
                </tr>
                <tr className="bg-sv-blue/[0.04] font-black text-sv-ink">
                  <td className="py-3 px-4 text-sv-blue">
                    {isDe ? 'Gesamte Kaufnebenkosten' : 'Total Closing Costs'}
                  </td>
                  <td className="py-3 px-3 text-right text-sv-blue">
                    +{report.acquisition.totalClosingCostsPct}%
                  </td>
                  <td className="py-3 px-4 text-right text-[14px] text-sv-blue">
                    +{report.acquisition.totalClosingCostsEur.toLocaleString('de-DE')} €
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="rounded-tile border border-sv-ink/[0.06] bg-sv-surface p-4 shadow-card">
              <div className="text-xs font-bold text-sv-ink/60">
                {isDe ? 'Gesamtkapitalbedarf (inkl. Nebenkosten)' : 'Total Capital Required'}
              </div>
              <div className="mt-1 text-[22px] font-black text-sv-ink">
                {report.acquisition.totalCapitalRequiredEur.toLocaleString('de-DE')} €
              </div>
            </div>

            <div className="rounded-tile border border-sv-ink/[0.06] bg-sv-surface p-4 shadow-card">
              <div className="text-xs font-bold text-sv-ink/60">
                {isDe ? 'Steuerliche AfA (§ 7 EStG)' : 'Annual Tax Depreciation (AfA)'}
              </div>
              <div className="mt-1 text-[22px] font-black text-emerald-500">
                {report.annualAfAEur.toLocaleString('de-DE')} € / {isDe ? 'Jahr' : 'yr'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: 3-Scenario DCF Underwriting */}
      {tab === 'scenarios' && isSale && (
        <div className="mt-5 space-y-4">
          {/* Scenario Selector */}
          <div className="flex items-center gap-2 rounded-control bg-sv-ink/[0.03] p-1 border border-sv-ink/[0.04]">
            {(['BEAR', 'BASE', 'BULL'] as const).map((s) => {
              const active = scenarioKey === s
              const label =
                s === 'BEAR'
                  ? isDe
                    ? 'Konservativ (Bär)'
                    : 'Bear Scenario'
                  : s === 'BASE'
                    ? isDe
                      ? 'Basis (Erwartet)'
                      : 'Base Scenario'
                    : isDe
                      ? 'Optimistisch (Bulle)'
                      : 'Bull Scenario'
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setScenarioKey(s)}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition ${
                    active ? 'bg-sv-surface text-sv-ink shadow-sm' : 'text-sv-ink/60 hover:text-sv-ink'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-tile border border-sv-ink/[0.06] bg-sv-surface p-3.5 shadow-card">
              <div className="text-[11px] font-bold text-sv-ink/60">
                {isDe ? 'Bruttomietrendite' : 'Gross Yield'}
              </div>
              <div className="mt-1 text-[18px] font-black text-sv-ink">
                {report.grossYieldPct}%
              </div>
            </div>

            <div className="rounded-tile border border-sv-ink/[0.06] bg-sv-surface p-3.5 shadow-card">
              <div className="text-[11px] font-bold text-sv-ink/60">
                {isDe ? 'Nettomietrendite' : 'Net Yield'}
              </div>
              <div className="mt-1 text-[18px] font-black text-sv-ink">
                {report.netYieldPct}%
              </div>
            </div>

            <div className="rounded-tile border border-sv-ink/[0.06] bg-sv-surface p-3.5 shadow-card">
              <div className="text-[11px] font-bold text-sv-ink/60">
                {isDe ? '10-Jahres IRR' : '10-Year IRR'}
              </div>
              <div className="mt-1 text-[18px] font-black text-emerald-500">
                {scenario.year10IrrPct}%
              </div>
            </div>

            <div className="rounded-tile border border-sv-ink/[0.06] bg-sv-surface p-3.5 shadow-card">
              <div className="text-[11px] font-bold text-sv-ink/60">
                {isDe ? 'DSCR Deckung' : 'DSCR Buffer'}
              </div>
              <div className="mt-1 text-[18px] font-black text-sv-blue">
                {report.dscr}x
              </div>
            </div>
          </div>

          {/* Deal Drivers & Risks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="rounded-tile border border-emerald-500/15 bg-emerald-500/[0.03] p-4">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                <ShieldCheck className="h-4 w-4" aria-hidden />
                <span>{isDe ? 'Stärken & Deal-Treiber' : 'Deal Drivers & Strengths'}</span>
              </div>
              <ul className="mt-2 space-y-1.5 text-xs font-medium text-sv-ink/80 list-disc list-inside">
                {(isDe ? report.whyThisDealDe : report.whyThisDealEn).map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-tile border border-rose-500/15 bg-rose-500/[0.03] p-4">
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600">
                <AlertTriangle className="h-4 w-4" aria-hidden />
                <span>{isDe ? 'Risikofaktoren' : 'Risk Vectors & Failure Modes'}</span>
              </div>
              <ul className="mt-2 space-y-1.5 text-xs font-medium text-sv-ink/80 list-disc list-inside">
                {(isDe ? report.whatCouldMakeItFailDe : report.whatCouldMakeItFailEn).map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
