'use client'

import { useMemo, useState } from 'react'
import { monthlyPayment, dtiPct } from '@/lib/finance'
import { NBG_MAX_LTV, nbgPtiCap } from '@/data/mortgage-ge'
import { useLiveRate } from '@/lib/currency'
import { formatUSD } from '@/lib/listing-format'
import type { DirLoc } from '@/lib/directory-seo'

const L: Record<DirLoc | 'de', {
  price: string; down: (pct: number) => string; rate: string; years: string
  yearsN: (n: number) => string; monthly: string; principal: string
  interest: string; total: string; disclaimer: string
  income: string; debts: string; burden: string
  verdictOk: string; verdictMid: string; verdictNo: string
  downWarn: string; gelHint: (cap: number) => string
}> = {
  ka: {
    price: 'ბინის ფასი', down: (pct) => `პირველი შენატანი (${pct}%)`, rate: 'წლიური პროცენტი',
    years: 'ვადა', yearsN: (n) => `${n} წელი`, monthly: 'ყოველთვიური გადახდა',
    principal: 'სესხის თანხა', interest: 'პროცენტის ჯამი', total: 'სულ გადასახდელი',
    disclaimer:
      'მაჩვენებელი გამოთვლილია სტანდარტული ანუიტეტის ფორმულით და არ წარმოადგენს საბანკო შემოთავაზებას.',
    income: 'თვიური შემოსავალი', debts: 'სხვა თვიური ვალდებულებები', burden: 'დატვირთვა',
    verdictOk: 'ეროვნული ბანკის ლიმიტის ფარგლებში', verdictMid: 'ლიმიტთან ახლოს — ბანკი გადაწყვეტს', verdictNo: 'ეროვნული ბანკის ლიმიტს აჭარბებს — ბანკი ვერ გასცემს',
    downWarn: 'ეროვნული ბანკის ლიმიტი: დოლარში/ევროში სესხზე მინ. 30% შენატანი (ლარში — 10%)',
    gelHint: (cap) => `ლარის სესხზე ლიმიტი ${cap}%-ია — ასე ჯდება`,
  },
  en: {
    price: 'Apartment price', down: (pct) => `Down payment (${pct}%)`, rate: 'Annual interest',
    years: 'Term', yearsN: (n) => `${n} years`, monthly: 'Monthly payment',
    principal: 'Loan amount', interest: 'Total interest', total: 'Total repaid',
    disclaimer:
      'Indicative figure calculated with the standard annuity formula — not a bank offer.',
    income: 'Monthly income', debts: 'Other monthly debt', burden: 'Debt burden',
    verdictOk: 'Within the NBG limit', verdictMid: 'Near the NBG limit — bank decides', verdictNo: 'Above the NBG limit — banks can’t lend',
    downWarn: 'NBG rule: USD/EUR mortgages need at least 30% down (10% if the loan is in lari)',
    gelHint: (cap) => `A lari loan has a ${cap}% limit — it fits that way`,
  },
  ru: {
    price: 'Стоимость квартиры', down: (pct) => `Первый взнос (${pct}%)`, rate: 'Годовая ставка',
    years: 'Срок', yearsN: (n) => `${n} лет`, monthly: 'Ежемесячный платёж',
    principal: 'Сумма кредита', interest: 'Сумма процентов', total: 'Всего к выплате',
    disclaimer:
      'Расчёт по стандартной аннуитетной формуле — не является банковским предложением.',
    income: 'Доход в месяц', debts: 'Другие платежи в месяц', burden: 'Долговая нагрузка',
    verdictOk: 'В пределах лимита НБГ', verdictMid: 'Близко к лимиту НБГ — решит банк', verdictNo: 'Выше лимита НБГ — банк не может выдать',
    downWarn: 'Правило НБГ: для кредита в USD/EUR — минимум 30% взноса (в лари — 10%)',
    gelHint: (cap) => `Для кредита в лари лимит ${cap}% — так проходит`,
  },
  de: {
    price: 'Wohnungspreis', down: (pct) => `Anzahlung (${pct}%)`, rate: 'Jahreszins',
    years: 'Laufzeit', yearsN: (n) => `${n} Jahre`, monthly: 'Monatsrate',
    principal: 'Kreditbetrag', interest: 'Gesamtzinsen', total: 'Gesamtrückzahlung',
    disclaimer:
      'Richtwert, berechnet mit der Standard-Annuitätenformel — kein Bankangebot.',
    income: 'Monatseinkommen', debts: 'Sonstige monatliche Schulden', burden: 'Schuldenlast',
    verdictOk: 'Innerhalb der NBG-Grenze', verdictMid: 'Nahe der NBG-Grenze — Bank entscheidet', verdictNo: 'Über der NBG-Grenze — Banken dürfen nicht leihen',
    downWarn: 'NBG-Regel: Kredite in USD/EUR erfordern mind. 30 % Anzahlung (in Lari 10 %)',
    gelHint: (cap) => `Ein Lari-Kredit hat ${cap} % Grenze — so passt es`,
  },
}

const PRESETS = [
  { label: '$80,000', price: 80_000 },
  { label: '$120,000', price: 120_000 },
  { label: '$180,000', price: 180_000 },
  { label: '$250,000', price: 250_000 },
]

/** Verdict = PTI vs the NBG legal cap (nbgPtiCap); "near" = within 5 points of it.
 *  Down floor = NBG max LTV for FX loans (70%; lari loans 90%) — this calc is in USD.
 */
const PTI_NEAR = 5
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
  // Income + debts are entered in this currency; the loan itself is USD.
  const [incomeCur, setIncomeCur] = useState<'GEL' | 'USD'>(loc === 'ka' ? 'GEL' : 'USD')
  const usdGel = useLiveRate()

  const { monthly, principal, totalInterest, totalPaid } = useMemo(() => {
    const principal = Math.max(0, price * (1 - downPct / 100))
    const monthly = monthlyPayment(principal, rate, years)
    const totalPaid = monthly * years * 12
    const totalInterest = totalPaid - principal
    return { monthly, principal, totalInterest, totalPaid }
  }, [price, downPct, rate, years])

  // Eligibility pre-check: hidden until the user enters an income — a verdict
  // without income would be noise. downPct < 5 reads as "just exploring".
  const lari = incomeCur === 'GEL'
  const toUSD = (v: number) => (lari ? v / usdGel : v)
  const dti = dtiPct(monthly, toUSD(debts), toUSD(income))
  // USD loan on lari income = unhedged FX → the stricter NBG grid applies.
  const cap = nbgPtiCap(lari ? income : income * usdGel, lari)
  const verdict = dti === null ? null : dti <= cap - PTI_NEAR ? 'ok' : dti <= cap ? 'mid' : 'no'
  const gelCap = nbgPtiCap(lari ? income : income * usdGel, false)
  const sym = lari ? '₾' : '$'

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
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="mc-income" className="text-[13px] font-black uppercase tracking-wide text-sv-ink/70">
                  {t.income}
                </label>
                <div role="group" aria-label={t.income} className="flex rounded-full border border-sv-ink/[0.12] p-0.5 text-[15px] font-extrabold">
                  {(['GEL', 'USD'] as const).map((c) => (
                    <button
                      key={c}
                      type="button"
                      aria-pressed={incomeCur === c}
                      aria-label={c}
                      onClick={() => setIncomeCur(c)}
                      className={`grid h-8 min-w-9 place-items-center rounded-full px-1 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue ${
                        incomeCur === c ? 'bg-sv-navy text-white' : 'text-sv-ink/60 hover:text-sv-ink'
                      }`}
                    >
                      {c === 'GEL' ? '₾' : '$'}
                    </button>
                  ))}
                </div>
              </div>
              <input
                id="mc-income"
                type="number" min={0} max={1_000_000} step={100} placeholder={`${sym}0`}
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
                type="number" min={0} max={1_000_000} step={50} placeholder={`${sym}0`}
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
                <span className="tabular-nums text-white/70">{Math.round(dti)}% / {cap}%</span>
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
              {verdict === 'no' && lari && dti <= gelCap && (
                <p className="mt-2 text-[12px] font-bold text-sv-blue-light">{t.gelHint(gelCap)}</p>
              )}
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
