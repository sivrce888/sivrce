'use client'

import { useState, useMemo } from 'react'
import {
  ShieldCheck,
  Zap,
  TrendingUp,
  AlertTriangle,
  Sliders,
  CheckCircle2,
  Scale,
  MapPin,
  FileCheck,
} from 'lucide-react'
import { Reveal } from '@/components/Reveal'
import {
  underwriteDeProperty,
  type DeEnergyClass,
  type DeHeatingType,
} from '@/lib/countries/de-proptech-os'
import { DE_CITIES, deCityBySlug } from '@/lib/countries/de'
import { DE_ENERGY_CLASSES } from '@/lib/countries/de-expose'
import { getBorisLandValue, calculateLandBuildingSplit, estimateGrundsteuerB } from '@/lib/countries/de-boris'
import { STATUTORY_NOTARY_CHECKLIST, verifyCommissionParity, generateBankUnderwritingSummary } from '@/lib/countries/de-transaction-os'

interface DePropTechOSProps {
  citySlug?: string
  de?: boolean
}

const TABS = [
  { id: 'underwriting', labelDe: '1. Investment & Cashflow', labelEn: '1. Investment & Cash Flow', icon: TrendingUp },
  { id: 'boris', labelDe: '2. BORIS Bodenwert & Grundsteuer', labelEn: '2. BORIS Land & Taxes', icon: MapPin },
  { id: 'energy', labelDe: '3. GEG 2026 & Sanierung', labelEn: '3. GEG 2026 & Energy', icon: Zap },
  { id: 'transaction', labelDe: '4. Notar & Transaktion OS', labelEn: '4. Notary & Closing OS', icon: FileCheck },
  { id: 'scenarios', labelDe: '5. 10-J. Szenarien (IRR)', labelEn: '5. 10-Yr Scenarios', icon: Scale },
  { id: 'provenance', labelDe: '6. EU AI Act & OpenImmo', labelEn: '6. EU AI Act & Syndication', icon: ShieldCheck },
] as const

type TabId = (typeof TABS)[number]['id']

export default function DePropTechOS({ citySlug = 'berlin', de = true }: DePropTechOSProps) {
  // State for interactive underwriting
  const city = deCityBySlug(citySlug) ?? DE_CITIES[0]
  const [selectedCity, setSelectedCity] = useState(city.slug)
  const [priceEur, setPriceEur] = useState(450_000)
  const [areaSqm, setAreaSqm] = useState(70)
  const [coldRentEur, setColdRentEur] = useState(1_350)
  const [downPaymentPct, setDownPaymentPct] = useState(20)
  const [interestPct, setInterestPct] = useState(4.1)
  const [repaymentPct, setRepaymentPct] = useState(2.0)
  const [energyClass, setEnergyClass] = useState<DeEnergyClass>('C')
  const [heatingType, setHeatingType] = useState<DeHeatingType>('gaszentral')
  const [provisionsfrei, setProvisionsfrei] = useState(false)
  const [activeTab, setActiveTab] = useState<TabId>('underwriting')

  const report = useMemo(() => {
    return underwriteDeProperty({
      purchasePriceEur: priceEur,
      citySlug: selectedCity,
      areaSqm,
      monthlyColdRentEur: coldRentEur,
      downPaymentPct,
      mortgageInterestPct: interestPct,
      mortgageRepaymentPct: repaymentPct,
      energyClass,
      heatingType,
      provisionsfrei,
      marginalTaxRatePct: 42,
    })
  }, [priceEur, selectedCity, areaSqm, coldRentEur, downPaymentPct, interestPct, repaymentPct, energyClass, heatingType, provisionsfrei])

  const borisData = useMemo(() => {
    const b = getBorisLandValue(selectedCity)
    const split = calculateLandBuildingSplit(priceEur, 25, areaSqm, b.standardBodenrichtwertEurSqm)
    const gst = estimateGrundsteuerB(selectedCity, areaSqm)
    return { b, split, gst }
  }, [selectedCity, priceEur, areaSqm])

  const bankSummary = useMemo(() => {
    return generateBankUnderwritingSummary({
      propertyAddress: `${selectedCity.toUpperCase()} · Verified Asset`,
      purchasePriceEur: priceEur,
      closingCostsEur: report.acquisition.totalClosingCostsEur,
      equityEur: report.equityRequiredEur,
      loanPrincipalEur: report.loanPrincipalEur,
      monthlyColdRentEur: coldRentEur,
      annualNoiEur: report.annualNetOperatingIncomeEur,
      dscr: report.dscr,
      energyClass,
    })
  }, [selectedCity, priceEur, report, coldRentEur, energyClass])

  const commissionCheck = useMemo(() => {
    return verifyCommissionParity(provisionsfrei ? 0 : 3.57, 3.57)
  }, [provisionsfrei])

  const fmtEur = (n: number) => {
    return de ? `${Math.round(n).toLocaleString('de-DE')} €` : `€${Math.round(n).toLocaleString('en-US')}`
  }

  const verdictBadge = {
    EXCELLENT_BUY: {
      labelDe: 'Hervorragende Kapitalanlage',
      labelEn: 'Prime Investment',
      bg: 'bg-sv-blue/10 text-sv-blue-deep dark:text-sv-blue-light border-sv-blue/20',
    },
    FAIR_VALUE: {
      labelDe: 'Fairer Marktwert',
      labelEn: 'Fair Market Value',
      bg: 'bg-sv-cloud text-sv-ink border-sv-ink/[0.08]',
    },
    HOLD_ANALYZE: {
      labelDe: 'Prüfbedarf / Halten',
      labelEn: 'Further Due Diligence',
      bg: 'bg-sv-orange/10 text-sv-orange border-sv-orange/20',
    },
    HIGH_RISK_OVERPRICED: {
      labelDe: 'Erhöhtes Risiko / Überteuert',
      labelEn: 'Elevated Risk / Overpriced',
      bg: 'bg-sv-orange-deep/10 text-sv-orange-deep border-sv-orange-deep/20',
    },
  }[report.dealVerdict]

  return (
    <section id="proptech-os" className="relative overflow-hidden bg-sv-cloud py-16 md:py-24">
      <div className="mx-auto max-w-[1440px] px-5 md:px-10">
        {/* Header */}
        <Reveal className="mb-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="mb-2 inline-flex items-center gap-2 rounded-full bg-sv-blue/10 px-3.5 py-1 text-[11px] font-black uppercase tracking-wider text-sv-blue-deep dark:text-sv-blue-light">
                <Sliders className="h-3.5 w-3.5" />
                {/* ponytail: no self-awarded score in the badge — the scorecard
                    derives the number from evidence (germany-competitive.ts).
                    Upgrade path: render sivrceGermanyStanding().total here. */}
                {de ? 'SIVRCE PropTech OS · Deutschland' : 'SIVRCE PropTech OS · Germany'}
              </span>
              <h2 className="text-[28px] font-black tracking-tight text-sv-ink md:text-[36px]">
                {de ? 'Institutionelle Immobilien-Intelligenz & Investment OS' : 'Institutional Property Intelligence & Investment OS'}
              </h2>
              <p className="mt-2 max-w-3xl text-[15px] font-semibold text-sv-ink/65">
                {de
                  ? 'Echtzeit-Underwriting, BORIS-Bodenrichtwerte, GEG 2026 Sanierungsrechner, KfW-Förderung, Notar-Transaktions-Checkliste und EU AI Act Governance.'
                  : 'Real-time underwriting, BORIS land values, GEG 2026 energy renovation modeling, KfW subsidies, Notary closing OS, and EU AI Act compliance.'}
              </p>
            </div>

            {/* SPI Score Live Badge */}
            <div className="flex items-center gap-4 rounded-card border border-sv-ink/[0.08] bg-sv-surface p-4 shadow-card">
              <div className="text-right">
                <div className="text-[11px] font-black uppercase tracking-wider text-sv-ink/50">
                  {de ? 'Sivrce Intelligence Score' : 'Sivrce Intelligence Score'}
                </div>
                <div className="text-[26px] font-black tracking-tight text-sv-ink">
                  {report.spiScore}
                  <span className="text-[16px] font-bold text-sv-ink/40">/100</span>
                </div>
              </div>
              <div
                className={`flex h-12 items-center justify-center rounded-control border px-3.5 text-[12px] font-black uppercase tracking-wide ${verdictBadge.bg}`}
              >
                {de ? verdictBadge.labelDe : verdictBadge.labelEn}
              </div>
            </div>
          </div>
        </Reveal>

        {/* Tab Navigation */}
        <div className="mb-8 flex flex-wrap gap-2 border-b border-sv-ink/[0.08] pb-4" role="tablist" aria-label={de ? 'PropTech Module' : 'PropTech modules'}>
          {TABS.map((tab) => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`de-os-tab-${tab.id}`}
                aria-selected={active}
                aria-controls={`de-os-panel-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 rounded-control px-4 py-2.5 text-[13px] font-black transition-all ${
                  active
                    ? 'bg-sv-navy text-white shadow-glow-navy'
                    : 'bg-sv-surface text-sv-ink/70 hover:bg-sv-cloud hover:text-sv-ink border border-sv-ink/[0.06]'
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden />
                {de ? tab.labelDe : tab.labelEn}
              </button>
            )
          })}
        </div>

        {/* Grid Container */}
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Controls Panel (Left 4 cols) */}
          <div className="lg:col-span-4">
            <div className="rounded-card border border-sv-ink/[0.08] bg-sv-surface p-6 shadow-card">
              <h3 className="flex items-center gap-2 text-[16px] font-black tracking-tight text-sv-ink">
                <Sliders className="h-4 w-4 text-sv-blue" />
                {de ? 'Objekt- & Finanzierungsparameter' : 'Property & Financing Inputs'}
              </h3>

              <div className="mt-5 space-y-4 text-[13px] font-bold">
                {/* City */}
                <div>
                  <label htmlFor="de-os-city" className="text-sv-ink/70">{de ? 'Standort / Stadt' : 'Location / City'}</label>
                  <select
                    id="de-os-city"
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="mt-1 w-full rounded-control border border-sv-ink/[0.12] bg-sv-surface px-3 py-2 text-[13px] font-bold text-sv-ink"
                  >
                    {DE_CITIES.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.de} ({c.state} · {c.transferTaxPct}% GrESt)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Purchase Price */}
                <div>
                  <div className="flex justify-between">
                    <label className="text-sv-ink/70">{de ? 'Kaufpreis' : 'Purchase Price'}</label>
                    <span className="text-sv-ink">{fmtEur(priceEur)}</span>
                  </div>
                  <input
                    type="range"
                    min={100_000}
                    max={2_000_000}
                    step={10_000}
                    value={priceEur}
                    onChange={(e) => setPriceEur(Number(e.target.value))}
                    className="mt-1.5 w-full accent-sv-blue"
                  />
                </div>

                {/* Area */}
                <div>
                  <div className="flex justify-between">
                    <label className="text-sv-ink/70">{de ? 'Wohnfläche' : 'Living Area'}</label>
                    <span className="text-sv-ink">{areaSqm} m² ({Math.round(priceEur / areaSqm)} €/m²)</span>
                  </div>
                  <input
                    type="range"
                    min={25}
                    max={250}
                    step={5}
                    value={areaSqm}
                    onChange={(e) => setAreaSqm(Number(e.target.value))}
                    className="mt-1.5 w-full accent-sv-blue"
                  />
                </div>

                {/* Monthly Cold Rent */}
                <div>
                  <div className="flex justify-between">
                    <label className="text-sv-ink/70">{de ? 'Monatliche Kaltmiete' : 'Monthly Cold Rent'}</label>
                    <span className="text-sv-ink">{fmtEur(coldRentEur)} ({(coldRentEur / areaSqm).toFixed(1)} €/m²)</span>
                  </div>
                  <input
                    type="range"
                    min={300}
                    max={6_000}
                    step={50}
                    value={coldRentEur}
                    onChange={(e) => setColdRentEur(Number(e.target.value))}
                    className="mt-1.5 w-full accent-sv-blue"
                  />
                </div>

                {/* Equity Down Payment */}
                <div>
                  <div className="flex justify-between">
                    <label className="text-sv-ink/70">{de ? 'Eigenkapitalanteil' : 'Equity Down Payment'}</label>
                    <span className="text-sv-ink">{downPaymentPct}% ({fmtEur((priceEur * downPaymentPct) / 100)})</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={downPaymentPct}
                    onChange={(e) => setDownPaymentPct(Number(e.target.value))}
                    className="mt-1.5 w-full accent-sv-blue"
                  />
                </div>

                {/* Interest & Tilgung */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sv-ink/70">{de ? 'Sollzins %' : 'Interest %'}</label>
                    <input
                      type="number"
                      step={0.1}
                      min={1}
                      max={10}
                      value={interestPct}
                      onChange={(e) => setInterestPct(Number(e.target.value))}
                      className="mt-1 w-full rounded-control border border-sv-ink/[0.12] bg-sv-surface px-3 py-1.5 text-[13px] font-bold text-sv-ink"
                    />
                  </div>
                  <div>
                    <label className="text-sv-ink/70">{de ? 'Tilgung %' : 'Repayment %'}</label>
                    <input
                      type="number"
                      step={0.5}
                      min={1}
                      max={10}
                      value={repaymentPct}
                      onChange={(e) => setRepaymentPct(Number(e.target.value))}
                      className="mt-1 w-full rounded-control border border-sv-ink/[0.12] bg-sv-surface px-3 py-1.5 text-[13px] font-bold text-sv-ink"
                    />
                  </div>
                </div>

                {/* Energy Class */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sv-ink/70">{de ? 'Energieklasse' : 'Energy Rating'}</label>
                    <select
                      value={energyClass}
                      onChange={(e) => setEnergyClass(e.target.value as DeEnergyClass)}
                      className="mt-1 w-full rounded-control border border-sv-ink/[0.12] bg-sv-surface px-3 py-1.5 text-[13px] font-bold text-sv-ink"
                    >
                      {DE_ENERGY_CLASSES.map((c) => (
                        <option key={c} value={c}>
                          Klasse {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sv-ink/70">{de ? 'Heizsystem' : 'Heating Type'}</label>
                    <select
                      value={heatingType}
                      onChange={(e) => setHeatingType(e.target.value as DeHeatingType)}
                      className="mt-1 w-full rounded-control border border-sv-ink/[0.12] bg-sv-surface px-3 py-1.5 text-[13px] font-bold text-sv-ink"
                    >
                      <option value="waermepumpe">Wärmepumpe</option>
                      <option value="fernwaerme">Fernwärme</option>
                      <option value="gaszentral">Gaszentralheizung</option>
                      <option value="oelzentral">Ölzentralheizung</option>
                      <option value="pellets">Pelletheizung</option>
                      <option value="etagenheizung">Gasetagenheizung</option>
                    </select>
                  </div>
                </div>

                {/* Provisionsfrei toggle */}
                <label className="flex cursor-pointer items-center gap-2 pt-2 text-[13px] font-bold text-sv-ink">
                  <input
                    type="checkbox"
                    checked={provisionsfrei}
                    onChange={(e) => setProvisionsfrei(e.target.checked)}
                    className="rounded text-sv-blue"
                  />
                  <span>{de ? 'Provisionsfrei (0 % Makler)' : 'Commission-free (0% Makler)'}</span>
                </label>
              </div>
            </div>
          </div>

          {/* Results Display (Right 8 cols) */}
          <div className="lg:col-span-8" role="tabpanel" id={`de-os-panel-${activeTab}`} aria-labelledby={`de-os-tab-${activeTab}`}>
            {activeTab === 'underwriting' && (
              <div className="space-y-6">
                {/* Core KPIs Banner */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="rounded-card border border-sv-ink/[0.08] bg-sv-surface p-4 shadow-card">
                    <div className="text-[11px] font-black uppercase tracking-wider text-sv-ink/50">
                      {de ? 'Bruttomietrendite' : 'Gross Yield'}
                    </div>
                    <div className="mt-1 text-[24px] font-black text-sv-blue">
                      {report.grossYieldPct}%
                    </div>
                    <div className="text-[11px] font-semibold text-sv-ink/60">
                      {fmtEur(report.annualGrossColdRentEur)} / {de ? 'Jahr' : 'yr'}
                    </div>
                  </div>

                  <div className="rounded-card border border-sv-ink/[0.08] bg-sv-surface p-4 shadow-card">
                    <div className="text-[11px] font-black uppercase tracking-wider text-sv-ink/50">
                      {de ? 'Nettomietrendite' : 'Net Yield'}
                    </div>
                    <div className="mt-1 text-[24px] font-black text-sv-ink">
                      {report.netYieldPct}%
                    </div>
                    <div className="text-[11px] font-semibold text-sv-ink/60">
                      {de ? 'Nach Bewirtschaftung' : 'After OPEX'}
                    </div>
                  </div>

                  <div className="rounded-card border border-sv-ink/[0.08] bg-sv-surface p-4 shadow-card">
                    <div className="text-[11px] font-black uppercase tracking-wider text-sv-ink/50">
                      {de ? 'Eigenkapitalrendite' : 'Cash-on-Cash'}
                    </div>
                    <div className={`mt-1 text-[24px] font-black ${report.cashOnCashReturnPct >= 0 ? 'text-sv-blue dark:text-sv-success' : 'text-sv-orange-deep'}`}>
                      {report.cashOnCashReturnPct}%
                    </div>
                    <div className="text-[11px] font-semibold text-sv-ink/60">
                      {de ? 'Auf eingesetztes EK' : 'On invested equity'}
                    </div>
                  </div>

                  <div className="rounded-card border border-sv-ink/[0.08] bg-sv-surface p-4 shadow-card">
                    <div className="text-[11px] font-black uppercase tracking-wider text-sv-ink/50">
                      {de ? 'Schuldendienst (DSCR)' : 'DSCR Buffer'}
                    </div>
                    <div className={`mt-1 text-[24px] font-black ${report.dscr >= 1.15 ? 'text-sv-blue dark:text-sv-success' : 'text-sv-orange'}`}>
                      {report.dscr}x
                    </div>
                    <div className="text-[11px] font-semibold text-sv-ink/60">
                      {report.dscr >= 1.15 ? (de ? 'Solider Puffer' : 'Solid coverage') : (de ? 'Knappe Deckung' : 'Tight coverage')}
                    </div>
                  </div>
                </div>

                {/* Cashflow & Financial Waterfall */}
                <div className="rounded-card border border-sv-ink/[0.08] bg-sv-surface p-6 shadow-card">
                  <h4 className="text-[16px] font-black text-sv-ink">
                    {de ? 'Finanzierungs- & Cashflow-Wasserfall (Monat & Jahr)' : 'Financing & Cash Flow Waterfall'}
                  </h4>

                  <div className="mt-4 grid gap-6 md:grid-cols-2">
                    <dl className="space-y-2 text-[13px] font-bold">
                      <div className="flex justify-between text-sv-ink/70">
                        <dt>{de ? 'Kaufpreis' : 'Purchase Price'}</dt>
                        <dd>{fmtEur(report.acquisition.purchasePriceEur)}</dd>
                      </div>
                      <div className="flex justify-between text-sv-ink/70">
                        <dt>{de ? `Kaufnebenkosten (${report.acquisition.state})` : `Closing Costs (${report.acquisition.state})`}</dt>
                        <dd>+{fmtEur(report.acquisition.totalClosingCostsEur)} ({report.acquisition.totalClosingCostsPct}%)</dd>
                      </div>
                      <div className="flex justify-between border-t border-sv-ink/[0.08] pt-2 text-sv-ink">
                        <dt>{de ? 'Gesamtkapitalbedarf' : 'Total Capital Required'}</dt>
                        <dd>{fmtEur(report.acquisition.totalCapitalRequiredEur)}</dd>
                      </div>
                      <div className="flex justify-between text-sv-ink/70">
                        <dt>{de ? 'Eigenkapitaleinsatz (inkl. Nebenkosten)' : 'Required Equity (incl. fees)'}</dt>
                        <dd>{fmtEur(report.equityRequiredEur)}</dd>
                      </div>
                      <div className="flex justify-between text-sv-ink/70">
                        <dt>{de ? 'Bankdarlehen' : 'Bank Mortgage'}</dt>
                        <dd>{fmtEur(report.loanPrincipalEur)}</dd>
                      </div>
                    </dl>

                    <dl className="space-y-2 text-[13px] font-bold">
                      <div className="flex justify-between text-sv-ink/70">
                        <dt>{de ? 'Kaltmiete (Monat)' : 'Monthly Cold Rent'}</dt>
                        <dd className="text-sv-blue dark:text-sv-success">+{fmtEur(coldRentEur)}/Mt.</dd>
                      </div>
                      <div className="flex justify-between text-sv-ink/70">
                        <dt>{de ? 'Bankrate (Zins + Tilgung)' : 'Mortgage Payment (Annuity)'}</dt>
                        <dd className="text-sv-orange-deep">-{fmtEur(report.monthlyMortgageRateEur)}/Mt.</dd>
                      </div>
                      <div className="flex justify-between text-sv-ink/70">
                        <dt>{de ? 'Nicht umlegbare Kosten + Rücklage' : 'Non-recoverable OPEX + Reserve'}</dt>
                        <dd className="text-sv-orange-deep">-{fmtEur((report.annualGrossColdRentEur - report.annualNetOperatingIncomeEur) / 12)}/Mt.</dd>
                      </div>
                      <div className="flex justify-between border-t border-sv-ink/[0.08] pt-2 text-sv-ink">
                        <dt>{de ? 'Cashflow vor Steuern' : 'Cash Flow Pre-Tax'}</dt>
                        <dd className={report.year1CashFlowPreTaxEur >= 0 ? 'text-sv-blue dark:text-sv-success' : 'text-sv-orange-deep'}>
                          {fmtEur(report.year1CashFlowPreTaxEur / 12)}/Mt. ({fmtEur(report.year1CashFlowPreTaxEur)}/J.)
                        </dd>
                      </div>
                      <div className="flex justify-between text-sv-ink/70">
                        <dt>{de ? 'Steuereffekt (AfA §7 EStG Abzug)' : 'Tax Effect (AfA Depreciation)'}</dt>
                        <dd className="text-sv-blue">
                          {report.annualTaxEffectEur >= 0 ? `+${fmtEur(report.annualTaxEffectEur / 12)}/Mt. Ersparnis` : `-${fmtEur(Math.abs(report.annualTaxEffectEur) / 12)}/Mt. Steuer`}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>

                {/* Honest Deal Drivers vs Failure Modes */}
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="rounded-card border border-sv-blue/20 bg-sv-blue/[0.03] p-5 shadow-card">
                    <h5 className="flex items-center gap-2 text-[14px] font-black text-sv-blue-deep dark:text-sv-blue-light">
                      <CheckCircle2 className="h-4 w-4" />
                      {de ? 'Warum dieser Deal? (Vorteile)' : 'Why this deal? (Upsides)'}
                    </h5>
                    <ul className="mt-3 space-y-2 text-[12px] font-bold text-sv-ink/80">
                      {(de ? report.whyThisDealDe : report.whyThisDealEn).map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-sv-blue">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-card border border-sv-orange-deep/20 bg-sv-orange-deep/[0.03] p-5 shadow-card">
                    <h5 className="flex items-center gap-2 text-[14px] font-black text-sv-orange-deep">
                      <AlertTriangle className="h-4 w-4" />
                      {de ? 'Woran dieser Deal scheitern könnte (Risiken)' : 'What could make this deal fail? (Risks)'}
                    </h5>
                    <ul className="mt-3 space-y-2 text-[12px] font-bold text-sv-ink/80">
                      {(de ? report.whatCouldMakeItFailDe : report.whatCouldMakeItFailEn).map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-sv-orange-deep">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'boris' && (
              <div className="space-y-6">
                <div className="rounded-card border border-sv-ink/[0.08] bg-sv-surface p-6 shadow-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="inline-block rounded-full bg-sv-blue/10 px-3 py-1 text-[11px] font-black text-sv-blue">
                        {de ? 'BORIS Bodenrichtwert-Informationssystem' : 'BORIS Land Value Benchmark'}
                      </span>
                      <h4 className="mt-2 text-[18px] font-black text-sv-ink">
                        {de ? `Amtlicher Bodenwert: ${fmtEur(borisData.b.standardBodenrichtwertEurSqm)}/m² Grund` : `Official Land Value: ${fmtEur(borisData.b.standardBodenrichtwertEurSqm)}/m² plot`}
                      </h4>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] font-bold text-sv-ink/50">{de ? 'GFZ-Dichte' : 'FAR Density'}</div>
                      <div className="text-[16px] font-black text-sv-ink">{borisData.b.typicalFloorAreaRatio}</div>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-module border border-sv-ink/[0.07] bg-sv-cloud p-4">
                      <div className="text-[12px] font-black uppercase text-sv-ink/70">
                        {de ? 'Kaufpreisaufteilung (§7 EStG AfA-Basis)' : 'Purchase Price Allocation (AfA Base)'}
                      </div>
                      <dl className="mt-3 space-y-2 text-[13px] font-bold">
                        <div className="flex justify-between text-sv-ink/70">
                          <dt>{de ? 'Bodenwertanteil (nicht absetzbar)' : 'Land Share (non-depreciable)'}</dt>
                          <dd>{fmtEur(borisData.split.landShareEur)} ({borisData.split.landSharePct}%)</dd>
                        </div>
                        <div className="flex justify-between border-t border-sv-ink/[0.08] pt-2 text-sv-ink">
                          <dt>{de ? 'Gebäudewertanteil (AfA-abschreibbar)' : 'Building Share (Depreciable AfA)'}</dt>
                          <dd className="text-sv-blue">{fmtEur(borisData.split.buildingShareEur)} ({borisData.split.buildingSharePct}%)</dd>
                        </div>
                      </dl>
                    </div>

                    <div className="rounded-module border border-sv-ink/[0.07] bg-sv-cloud p-4">
                      <div className="text-[12px] font-black uppercase text-sv-ink/70">
                        {de ? 'Grundsteuer B Reform 2025/2026' : 'Grundsteuer B Reform (2025/2026)'}
                      </div>
                      <dl className="mt-3 space-y-2 text-[13px] font-bold">
                        <div className="flex justify-between text-sv-ink/70">
                          <dt>{de ? 'Gemeinde-Hebesatz' : 'Municipal Hebesatz'}</dt>
                          <dd>{borisData.gst.hebesatzPct}%</dd>
                        </div>
                        <div className="flex justify-between text-sv-ink/70">
                          <dt>{de ? 'Landesmodell' : 'State Tax Model'}</dt>
                          <dd>{borisData.gst.model}</dd>
                        </div>
                        <div className="flex justify-between border-t border-sv-ink/[0.08] pt-2 text-sv-ink">
                          <dt>{de ? 'Geschätzte Grundsteuer B' : 'Estimated Annual Property Tax'}</dt>
                          <dd className="text-sv-ink">~{fmtEur(borisData.gst.estimatedAnnualTaxEur)} / {de ? 'Jahr' : 'yr'}</dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'energy' && (
              <div className="space-y-6">
                <div className="rounded-card border border-sv-ink/[0.08] bg-sv-surface p-6 shadow-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="inline-block rounded-full bg-sv-blue/10 px-3 py-1 text-[11px] font-black text-sv-blue">
                        {de ? 'GEG 2026 Novelle & Sanierungsfahrplan' : 'GEG 2026 Building Energy Act'}
                      </span>
                      <h4 className="mt-2 text-[18px] font-black text-sv-ink">
                        {de ? `Energieklasse ${report.energy.energyClass} · ${report.energy.kwhPerSqmYear} kWh/(m²·a)` : `Energy Class ${report.energy.energyClass} · ${report.energy.kwhPerSqmYear} kWh/(m²·a)`}
                      </h4>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] font-bold text-sv-ink/50">{de ? 'CO2-Kostenaufteilung' : 'CO2 Cost Splitting'}</div>
                      <div className="text-[16px] font-black text-sv-orange-deep">{report.energy.co2LandlordSharePct}% {de ? 'Vermieteranteil' : 'Landlord Share'}</div>
                    </div>
                  </div>

                  <p className="mt-3 rounded-control bg-sv-cloud p-3 text-[13px] font-semibold text-sv-ink/80">
                    {de ? report.energy.gegSummaryDe : report.energy.gegSummaryEn}
                  </p>

                  <div className="mt-6 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-module border border-sv-ink/[0.07] bg-sv-surface p-4">
                      <div className="text-[11px] font-bold text-sv-ink/50">{de ? 'Geschätzte Sanierungskosten' : 'Estimated Gross CAPEX'}</div>
                      <div className="mt-1 text-[20px] font-black text-sv-ink">{fmtEur(report.energy.estimatedRenovationCapexEur)}</div>
                      <div className="text-[11px] font-semibold text-sv-ink/60">{de ? 'Heizungstausch & Dämmung' : 'Heating & insulation'}</div>
                    </div>

                    <div className="rounded-module border border-sv-blue/20 bg-sv-blue/[0.03] p-4">
                      <div className="text-[11px] font-bold text-sv-blue-deep dark:text-sv-blue-light">{de ? 'KfW 261 / BEG 458 Förderung' : 'KfW / BEG Subsidy'}</div>
                      <div className="mt-1 text-[20px] font-black text-sv-blue dark:text-sv-success">-{fmtEur(report.energy.kfwSubsidyEligibleEur)}</div>
                      <div className="text-[11px] font-semibold text-sv-ink/55">{de ? 'Bis zu 55 % Zuschuss' : 'Up to 55% grant'}</div>
                    </div>

                    <div className="rounded-module border border-sv-ink/[0.07] bg-sv-surface p-4">
                      <div className="text-[11px] font-bold text-sv-ink/50">{de ? 'Netto-Eigenanteil Sanierung' : 'Net Owner CAPEX'}</div>
                      <div className="mt-1 text-[20px] font-black text-sv-blue">{fmtEur(report.energy.netRenovationCapexEur)}</div>
                      <div className="text-[11px] font-semibold text-sv-ink/60">
                        {de ? `Amortisation in ~${report.energy.energyUpgradePaybackYears} J.` : `Payback in ~${report.energy.energyUpgradePaybackYears} yrs`}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'transaction' && (
              <div className="space-y-6">
                <div className="rounded-card border border-sv-ink/[0.08] bg-sv-surface p-6 shadow-card">
                  <div className="flex items-center justify-between">
                    <h4 className="flex items-center gap-2 text-[16px] font-black text-sv-ink">
                      <FileCheck className="h-5 w-5 text-sv-blue" />
                      {de ? 'Notarielle Ankaufsprüfung & §656c BGB Status' : 'Notary Due Diligence & Statutory Parity'}
                    </h4>
                    <span className="rounded bg-sv-blue/10 px-2.5 py-1 text-[11px] font-black text-sv-blue dark:text-sv-success">
                      {commissionCheck.compliant ? (de ? '§656c BGB Konform' : 'Statutory Parity OK') : 'Non-compliant'}
                    </span>
                  </div>

                  <p className="mt-2 text-[13px] font-semibold text-sv-ink/70">
                    {de ? commissionCheck.reasonDe : commissionCheck.reasonEn}
                  </p>

                  <div className="mt-5 rounded-module border border-sv-ink/[0.07] bg-sv-cloud p-4">
                    <div className="text-[12px] font-black uppercase text-sv-ink/70">
                      {de ? bankSummary.headerDe : bankSummary.headerEn}
                    </div>
                    <p className="mt-2 text-[13px] font-medium leading-relaxed text-sv-ink">
                      {de ? bankSummary.summaryTextDe : bankSummary.summaryTextEn}
                    </p>
                  </div>

                  <div className="mt-5">
                    <div className="text-[12px] font-black uppercase text-sv-ink/70">
                      {de ? 'Gesetzliche Notar-Prüfliste (Statutory Checklist)' : 'Statutory Notary Checklist'}
                    </div>
                    <ul className="mt-3 space-y-2.5">
                      {STATUTORY_NOTARY_CHECKLIST.map((item) => (
                        <li key={item.id} className="flex items-start gap-2.5 rounded-control border border-sv-ink/[0.06] bg-sv-surface p-3 text-[12px]">
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-sv-blue dark:text-sv-success" />
                          <div>
                            <div className="font-extrabold text-sv-ink">{de ? item.titleDe : item.titleEn}</div>
                            <div className="text-sv-ink/60">{de ? item.descriptionDe : item.descriptionEn}</div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'scenarios' && (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  {(['bear', 'base', 'bull'] as const).map((scKey) => {
                    const sc = report.scenarios[scKey]
                    const title = {
                      bear: { de: 'Bären-Szenario (Stagnation)', en: 'Bear Scenario' },
                      base: { de: 'Basis-Szenario (Konsens)', en: 'Base Scenario' },
                      bull: { de: 'Bullen-Szenario (Wachstum)', en: 'Bull Scenario' },
                    }[scKey]
                    const cardCls = scKey === 'base' ? 'border-sv-blue/40 bg-sv-surface shadow-glow-navy' : 'border-sv-ink/[0.07] bg-sv-surface'

                    return (
                      <div key={scKey} className={`rounded-card border p-5 shadow-card ${cardCls}`}>
                        <div className="flex items-center justify-between">
                          <span className="text-[13px] font-black uppercase text-sv-ink">{de ? title.de : title.en}</span>
                          <span className="rounded bg-sv-ink/10 px-2 py-0.5 text-[11px] font-black text-sv-ink">
                            IRR {sc.year10IrrPct}%
                          </span>
                        </div>

                        <dl className="mt-4 space-y-2 text-[12px] font-bold">
                          <div className="flex justify-between text-sv-ink/70">
                            <dt>{de ? 'Mietwachstum p.a.' : 'Rent Growth p.a.'}</dt>
                            <dd>+{sc.annualRentGrowthPct}%</dd>
                          </div>
                          <div className="flex justify-between text-sv-ink/70">
                            <dt>{de ? 'Wertsteigerung p.a.' : 'Appreciation p.a.'}</dt>
                            <dd>+{sc.annualAppreciationPct}%</dd>
                          </div>
                          <div className="flex justify-between text-sv-ink/70">
                            <dt>{de ? 'Leerstand (pro Dekade)' : 'Vacancy / 10 yrs'}</dt>
                            <dd>{sc.vacancyMonthsPerDecade} {de ? 'Monate' : 'mo'}</dd>
                          </div>
                          <div className="flex justify-between border-t border-sv-ink/[0.08] pt-2 text-sv-ink">
                            <dt>{de ? 'Immobilienwert nach 10 J.' : 'Property Value (Yr 10)'}</dt>
                            <dd>{fmtEur(sc.year10PropertyValueEur)}</dd>
                          </div>
                          <div className="flex justify-between text-sv-ink">
                            <dt>{de ? 'Kumulierter Cashflow' : 'Cumulative Cash Flow'}</dt>
                            <dd className={sc.year10CumulativeCashFlowEur >= 0 ? 'text-sv-blue dark:text-sv-success' : 'text-sv-orange-deep'}>
                              {fmtEur(sc.year10CumulativeCashFlowEur)}
                            </dd>
                          </div>
                        </dl>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {activeTab === 'provenance' && (
              <div className="space-y-6">
                <div className="rounded-card border border-sv-ink/[0.08] bg-sv-surface p-6 shadow-card">
                  <h4 className="flex items-center gap-2 text-[16px] font-black text-sv-ink">
                    <ShieldCheck className="h-5 w-5 text-sv-blue" />
                    {de ? 'EU AI Act Governance (2026) & OpenImmo CRM-Feeds' : 'EU AI Act Governance (2026) & OpenImmo Syndication'}
                  </h4>

                  <p className="mt-2 text-[13px] font-medium leading-relaxed text-sv-ink/70">
                    {de
                      ? 'Gemäß den Vorgaben des EU AI Act (in Kraft seit 2. August 2026) und der DSGVO werden alle Bewertungs- und Underwriting-Algorithmen deterministisch offengelegt. OpenImmo-1.2.7-Ingest für onOffice-, Propstack- und FlowFact-Feeds (Anbindung auf Anfrage).'
                      : 'Compliant with the EU AI Act (effective August 2, 2026) and GDPR. All valuation, tax, and subsidy calculations are fully auditable, deterministic, and ingest OpenImmo 1.2.7 feeds from onOffice, Propstack, and FlowFact (connection on request).'}
                  </p>

                  <div className="mt-5 space-y-3 text-[12px] font-bold">
                    <div className="flex items-center justify-between rounded-control border border-sv-ink/[0.06] bg-sv-cloud p-3">
                      <span className="text-sv-ink/60">{de ? 'Kaufnebenkosten & Notargebühren' : 'Acquisition Taxes & Notary'}</span>
                      <span className="font-mono text-sv-ink">{report.acquisition.provenance.source}</span>
                    </div>

                    <div className="flex items-center justify-between rounded-control border border-sv-ink/[0.06] bg-sv-cloud p-3">
                      <span className="text-sv-ink/60">{de ? 'Energie & GEG 2026 Förderrichtlinien' : 'Energy & GEG 2026 Guidelines'}</span>
                      <span className="font-mono text-sv-ink">{report.energy.provenance.source}</span>
                    </div>

                    <div className="flex items-center justify-between rounded-control border border-sv-ink/[0.06] bg-sv-cloud p-3">
                      <span className="text-sv-ink/60">{de ? 'CRM-Feeds (OpenImmo 1.2.7)' : 'CRM Feeds (OpenImmo 1.2.7)'}</span>
                      <span className="inline-flex items-center gap-1.5 text-sv-blue">
                        <CheckCircle2 className="h-3.5 w-3.5" /> onOffice · Propstack · FlowFact · Kommunal
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-control border border-sv-ink/[0.06] bg-sv-cloud p-3">
                      <span className="text-sv-ink/60">{de ? 'EU AI Act Risikoeinstufung' : 'EU AI Act Risk Classification'}</span>
                      <span className="inline-flex items-center gap-1.5 text-sv-blue dark:text-sv-success">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {report.provenance.euAiActGovernance.riskTier} · Vollständig auditierbar
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
