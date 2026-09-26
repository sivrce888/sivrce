'use client'

import { useMemo, useState } from 'react'
import { monthlyPayment, dtiPct } from '@/lib/finance'
import { NBG_MAX_LTV } from '@/data/mortgage-ge'
import { formatUSD } from '@/lib/listing-format'
import type { DirLoc } from '@/lib/directory-seo'

const L: Record<DirLoc | 'de', {
  price: string; down: (pct: number) => string; rate: string; years: string
  yearsN: (n: number) => string; monthly: string; principal: string
  interest: string; total: string; disclaimer: string
  income: string; debts: string; burden: string
  verdictOk: string; verdictMid: string; verdictNo: string
  downWarn: string
}> = {
  ka: {
    price: 'ბინის ფასი', down: (pct) => `პირველი შენატანი (${pct}%)`, rate: 'წლიური პროცენტი',
    years: 'ვადა', yearsN: (n) => `${n} წელი`, monthly: 'ყოველთვიური გადახდა',
    principal: 'სესხის თანხა', interest: 'პროცენტის ჯამი', total: 'სულ გადასახდელი',
    disclaimer:
      'მაჩვენებელი გამოთვლილია სტანდარტული ანუიტეტის ფორმულით და არ წარმოადგენს საბანკო შემოთავაზებას.',
    income: 'თვიური შემოსავალი', debts: 'სხვა თვიური ვალდებულებები', burden: 'დატვირთვა',
    verdictOk: 'დამტკიცება სავარაუდოა', verdictMid: 'სასაზღვრო — ბანკი განიხილავს', verdictNo: 'ნაკლებად სავარაუდო — მაღალი დატვირთვა',
    downWarn: 'ეროვნული ბანკის ლიმიტი: დოლარში/ევროში სესხზე მინ. 30% შენატანი (ლარში — 10%)',
  },
  en: {
    price: 'Apartment price', down: (pct) => `Down payment (${pct}%)`, rate: 'Annual interest',
    years: 'Term', yearsN: (n) => `${n} years`, monthly: 'Monthly payment',
    principal: 'Loan amount', interest: 'Total interest', total: 'Total repaid',
    disclaimer:
      'Indicative figure calculated with the standard annuity formula — not a bank offer.',
    income: 'Monthly income', debts: 'Other monthly debt', burden: 'Debt burden',
    verdictOk: 'Likely approvable', verdictMid: 'Borderline — bank review', verdictNo: 'Unlikely — burden too high',
    downWarn: 'NBG rule: USD/EUR mortgages need at least 30% down (10% if the loan is in lari)',
  },
  ru: {
    price: 'Стоимость квартиры', down: (pct) => `Первый взнос (${pct}%)`, rate: 'Годовая ставка',
    years: 'Срок', yearsN: (n) => `${n} лет`, monthly: 'Ежемесячный платёж',
    principal: 'Сумма кредита', interest: 'Сумма процентов', total: 'Всего к выплате',
    disclaimer:
      'Расчёт по стандартной аннуитетной формуле — не является банковским предложением.',
    income: 'Доход в месяц', debts: 'Другие платежи в месяц', burden: 'Долговая нагрузка',
    verdictOk: 'Одобрение вероятно', verdictMid: 'На грани — банк решит', verdictNo: 'Маловероятно — нагрузка высока',
    downWarn: 'Правило НБГ: для кредита в USD/EUR — минимум 30% взноса (в лари — 10%)',
  },
  de: {
    price: 'Wohnungspreis', down: (pct) => `Anzahlung (${pct}%)`, rate: 'Jahreszins',
    years: 'Laufzeit', yearsN: (n) => `${n} Jahre`, monthly: 'Monatsrate',
    principal: 'Kreditbetrag', interest: 'Gesamtzinsen', total: 'Gesamtrückzahlung',
    disclaimer:
      'Richtwert, berechnet mit der Standard-Annuitätenformel — kein Bankangebot.',
    income: 'Monatseinkommen', debts: 'Sonstige monatliche Schulden', burden: 'Schuldenlast',
    verdictOk: 'Bewilligung wahrscheinlich', verdictMid: 'Grenzwertig — Bank prüft', verdictNo: 'Unwahrscheinlich — Last zu hoch',
    downWarn: 'NBG-Regel: Kredite in USD/EUR erfordern mind. 30 % Anzahlung (in Lari 10 %)',
  },
}

const PRESETS = [
  { label: '$80,000', price: 80_000 },
  { label: '$120,000', price: 120_000 },
  { label: '$180,000', price: 180_000 },
  { label: '$250,000', price: 250_000 },
]

/** Payment-to-income verdict bands (Georgian banks commonly decline >~45% DTI).
 *  Down floor = NBG max LTV for FX loans (70%; lari loans 90%) — this calc is in USD.
 */
const DTI_OK = 35
const DTI_MID = 45
const DOWN_FLOOR = 100 - NBG_MAX_LTV.fx

export default function MortgageCalcClient({
  loc,
  initial,
}: {
  loc: DirLoc | 'de'
  /** Prefill from the listing-detail calculator deep link (?price&down&rate&years). */
  initial?: { price?: number; down?: number; rate?: number; years?: number }
}) {
  const t = L[loc]
  const [price, setPrice] = useState(initial?.price ?? 120_000)
  const [downPct, setDownPct] = useState(initial?.down ?? DOWN_FLOOR)
  const [rate, setRate] = useState(initial?.rate ?? 10)
  const [years, setYears] = useState(initial?.years ?? 20)
  const [income, setIncome] = useState(0)
  const [debts, setDebts] = useState(0)

  const { monthly, principal, totalInterest, totalPaid } = useMemo(() => {
    const principal = Math.max(0, price * (1 - downPct / 100))
    const monthly = monthlyPayment(principal, rate, years)
    const totalPaid = monthly * years * 12
    const totalInterest = totalPaid - principal
    return { monthly, principal, totalInterest, totalPaid }
  }, [price, downPct, rate, years])

  // Eligibility pre-check: hidden until the user enters an income — a verdict
  // without income would be noise. downPct < 5 reads as "just exploring".
  const dti = dtiPct(monthly, debts, income)
  const verdict = dti === null ? null : dti <= DTI_OK ? 'ok' : dti <= DTI_MID ? 'mid' : 'no'

  return (
    <div className="rounded-tile border border-sv-ink/[0.06] bg-sv-surface p-6 shadow-card md:p-10">
      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        {/* Inputs */}
        <div className="space-y-6">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="mc-price" className="text-[13px] font-black uppercase tracking-wide text-sv-ink/70">
                {t.price}
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
              <label htmlFor="mc-down" className="text-[13px] font-black uppercase tracking-wide text-sv-ink/70">
                {t.down(downPct)}
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
              <label htmlFor="mc-rate" className="text-[13px] font-black uppercase tracking-wide text-sv-ink/70">
                {t.rate}
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
              <label htmlFor="mc-years" className="text-[13px] font-black uppercase tracking-wide text-sv-ink/70">
                {t.years}
              </label>
              <span className="text-[14px] font-black text-sv-ink">{t.yearsN(years)}</span>
            </div>
            <input
              id="mc-years"
              type="range" min={5} max={25} step={1}
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
              className="w-full accent-sv-blue"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="mc-income" className="mb-2 block text-[13px] font-black uppercase tracking-wide text-sv-ink/70">
                {t.income}
              </label>
              <input
                id="mc-income"
                type="number" min={0} max={100_000} step={100} placeholder="$0"
                value={income || ''}
                onChange={(e) => setIncome(Math.max(0, Number(e.target.value) || 0))}
                className="w-full rounded-control border border-sv-ink/[0.12] bg-white px-3 py-2.5 text-[14px] font-bold text-sv-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue"
              />
            </div>
            <div>
              <label htmlFor="mc-debts" className="mb-2 block text-[13px] font-black uppercase tracking-wide text-sv-ink/70">
                {t.debts}
              </label>
              <input
                id="mc-debts"
                type="number" min={0} max={100_000} step={50} placeholder="$0"
                value={debts || ''}
                onChange={(e) => setDebts(Math.max(0, Number(e.target.value) || 0))}
                className="w-full rounded-control border border-sv-ink/[0.12] bg-white px-3 py-2.5 text-[14px] font-bold text-sv-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue"
              />
            </div>
          </div>
        </div>

        {/* Result */}
        <div className="flex flex-col justify-center rounded-module bg-sv-navy p-6 text-white md:p-8">
          <div className="text-[12px] font-black uppercase tracking-wider text-sv-blue-light">
            {t.monthly}
          </div>
          <div className="mt-2 text-[36px] font-black leading-none tracking-[-0.02em] md:text-[44px]">
            {formatUSD(monthly)}
          </div>
          <div className="mt-6 space-y-3 border-t border-white/10 pt-4 text-[13px]">
            <div className="flex justify-between">
              <span className="text-white/55">{t.principal}</span>
              <span className="font-bold">{formatUSD(principal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/55">{t.interest}</span>
              <span className="font-bold text-sv-orange">{formatUSD(totalInterest)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/55">{t.total}</span>
              <span className="font-bold">{formatUSD(totalPaid)}</span>
            </div>
          </div>
          {verdict !== null && dti !== null && (
            <div className="mt-6 border-t border-white/10 pt-4">
              <div className="flex items-center justify-between text-[12px]">
                <span className="font-black uppercase tracking-wider text-white/55">{t.burden}</span>
                <span className="tabular-nums text-white/70">{Math.round(dti)}%</span>
              </div>
              <p
                role="status"
                className={`mt-2 rounded-control px-3 py-2 text-[13px] font-black ${
                  verdict === 'ok'
                    ? 'bg-sv-success/15 text-sv-blue-light'
                    : verdict === 'mid'
                      ? 'bg-sv-orange/15 text-sv-orange'
                      : 'bg-white/10 text-white/80'
                }`}
              >
                {verdict === 'ok' ? t.verdictOk : verdict === 'mid' ? t.verdictMid : t.verdictNo}
              </p>
              {downPct > 0 && downPct < DOWN_FLOOR && (
                <p className="mt-2 text-[12px] font-bold text-sv-orange">{t.downWarn}</p>
              )}
            </div>
          )}
        </div>
      </div>
      <p className="mt-4 text-[12px] font-semibold text-sv-ink/60">
        {t.disclaimer}
      </p>
    </div>
  )
}
