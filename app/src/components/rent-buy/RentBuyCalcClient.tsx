'use client'

import { useMemo, useState } from 'react'
import { rentVsBuy, FIXED_ASSUMPTIONS } from '@/lib/rent-buy'
import { formatUSD } from '@/lib/listing-format'
import type { DirLoc } from '@/lib/directory-seo'

const L: Record<DirLoc, {
  price: string; rent: string; horizon: string; yearsN: (n: number) => string
  down: (pct: number) => string; rate: string; appreciation: string; altReturn: string
  buyWins: (n: string) => string; rentWins: (n: string) => string
  buyWorth: string; rentWorth: string; breakEven: (n: number) => string
  breakEvenNone: string; monthlyOwn: string; monthlyRent: string; disclaimer: string
}> = {
  ka: {
    price: 'ბინის ფასი', rent: 'ქირა თვეში (მსგავსი ბინა)', horizon: 'რამდენ ხანს დარჩებით',
    yearsN: (n) => `${n} წელი`, down: (pct) => `პირველი შენატანი (${pct}%)`, rate: 'იპოთეკის პროცენტი',
    appreciation: 'ფასების წლიური ზრდა', altReturn: 'დანაზოგის ალტერნატიული შემოსავალი',
    buyWins: (n) => `ყიდვა გამარჯვებულია — ბოლოს მდიდარი ხართ ${n}-ით`,
    rentWins: (n) => `ქირა გამარჯვებულია — მდიდარი ${n}-ით`,
    buyWorth: 'თქვენი სიმდიდრე ყიდვის შემთხვევაში', rentWorth: 'თქვენი სიმდიდრე ქირის შემთხვევაში',
    breakEven: (n) => `ყიდვა ${n}. წლიდან იწყებს წინსვლას`, breakEvenNone: 'ამ ვადაში ყიდვა ვერ გასწრებია',
    monthlyOwn: 'ყოველთვიური ხარჯი ყიდვისას', monthlyRent: 'ყოველთვიური ხარჯი ქირისას',
    disclaimer:
      'მოდელი არ არის პროგნოზი — შედეგი დამოკიდებულია თქვენს მიერ შეყვანილ დაშვებებზე (ქირის ზრდა 5%, ყიდვის ხარჯები 2.5%, გაყიდვის 2%, მომსახურება 0.8% წლიურად). ეს არ არის ფინანსური რჩევა.',
  },
  en: {
    price: 'Apartment price', rent: 'Rent per month (equivalent home)', horizon: 'How long you stay',
    yearsN: (n) => `${n} years`, down: (pct) => `Down payment (${pct}%)`, rate: 'Mortgage rate',
    appreciation: 'Annual price growth', altReturn: 'Return on invested savings',
    buyWins: (n) => `Buying wins — you end up ${n} richer`,
    rentWins: (n) => `Renting wins — you end up ${n} richer`,
    buyWorth: 'Your wealth if you buy', rentWorth: 'Your wealth if you rent',
    breakEven: (n) => `Buying pulls ahead from year ${n}`, breakEvenNone: 'Buying never catches up within this horizon',
    monthlyOwn: 'Monthly cost of owning', monthlyRent: 'Monthly cost of renting',
    disclaimer:
      'This model is not a forecast — the result depends on the assumptions you enter (rent growth 5%, purchase costs 2.5%, selling costs 2%, upkeep 0.8%/yr). Not financial advice.',
  },
  ru: {
    price: 'Стоимость квартиры', rent: 'Аренда в месяц (аналогичная квартира)', horizon: 'Сколько лет остаётесь',
    yearsN: (n) => `${n} лет`, down: (pct) => `Первый взнос (${pct}%)`, rate: 'Ставка по ипотеке',
    appreciation: 'Рост цен в год', altReturn: 'Доходность вложенных сбережений',
    buyWins: (n) => `Покупка выгоднее — вы богаче на ${n}`,
    rentWins: (n) => `Аренда выгоднее — вы богаче на ${n}`,
    buyWorth: 'Ваш капитал при покупке', rentWorth: 'Ваш капитал при аренде',
    breakEven: (n) => `Покупка выходит вперёд с ${n}-го года`, breakEvenNone: 'За этот срок покупка не догоняет аренду',
    monthlyOwn: 'Ежемесячные расходы при покупке', monthlyRent: 'Ежемесячные расходы при аренде',
    disclaimer:
      'Это не прогноз — результат зависит от введённых допущений (рост аренды 5%, расходы покупки 2.5%, продажи 2%, содержание 0.8% в год). Не является финансовой консультацией.',
  },
}

const PRESETS = [
  { label: '$80,000', price: 80_000 },
  { label: '$120,000', price: 120_000 },
  { label: '$180,000', price: 180_000 },
]

export default function RentBuyCalcClient({ loc }: { loc: DirLoc }) {
  const t = L[loc]
  const [price, setPrice] = useState(120_000)
  const [rentMonthly, setRentMonthly] = useState(850)
  const [horizonYears, setHorizonYears] = useState(10)
  const [downPct, setDownPct] = useState(25)
  const [ratePct, setRatePct] = useState(10)
  const [appreciationPct, setAppreciationPct] = useState(4)
  const [altReturnPct, setAltReturnPct] = useState(7)

  const out = useMemo(
    () =>
      rentVsBuy({
        price, rentMonthly, horizonYears, downPct, ratePct, appreciationPct, altReturnPct,
        mortgageYears: 20, ...FIXED_ASSUMPTIONS,
      }),
    [price, rentMonthly, horizonYears, downPct, ratePct, appreciationPct, altReturnPct],
  )

  const maxWorth = Math.max(out.buyNetWorth, out.rentNetWorth, 1)

  return (
    <div className="rounded-tile border border-sv-ink/[0.06] bg-sv-surface p-6 shadow-card md:p-10">
      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        {/* Inputs */}
        <div className="space-y-6">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="rb-price" className="text-[13px] font-black uppercase tracking-wide text-sv-ink/70">
                {t.price}
              </label>
              <span className="text-[14px] font-black text-sv-ink">{formatUSD(price)}</span>
            </div>
            <input
              id="rb-price"
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
              <label htmlFor="rb-rent" className="text-[13px] font-black uppercase tracking-wide text-sv-ink/70">
                {t.rent}
              </label>
              <span className="text-[14px] font-black text-sv-ink">{formatUSD(rentMonthly)}</span>
            </div>
            <input
              id="rb-rent"
              type="range" min={300} max={3_000} step={25}
              value={rentMonthly}
              onChange={(e) => setRentMonthly(Number(e.target.value))}
              className="w-full accent-sv-blue"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="rb-horizon" className="text-[13px] font-black uppercase tracking-wide text-sv-ink/70">
                {t.horizon}
              </label>
              <span className="text-[14px] font-black text-sv-ink">{t.yearsN(horizonYears)}</span>
            </div>
            <input
              id="rb-horizon"
              type="range" min={1} max={30} step={1}
              value={horizonYears}
              onChange={(e) => setHorizonYears(Number(e.target.value))}
              className="w-full accent-sv-blue"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="rb-down" className="text-[13px] font-black uppercase tracking-wide text-sv-ink/70">
                {t.down(downPct)}
              </label>
              <span className="text-[14px] font-black text-sv-ink">{formatUSD((price * downPct) / 100)}</span>
            </div>
            <input
              id="rb-down"
              type="range" min={0} max={70} step={5}
              value={downPct}
              onChange={(e) => setDownPct(Number(e.target.value))}
              className="w-full accent-sv-blue"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="rb-rate" className="text-[13px] font-black uppercase tracking-wide text-sv-ink/70">
                {t.rate}
              </label>
              <span className="text-[14px] font-black text-sv-ink">{ratePct.toFixed(1)}%</span>
            </div>
            <input
              id="rb-rate"
              type="range" min={4} max={18} step={0.1}
              value={ratePct}
              onChange={(e) => setRatePct(Number(e.target.value))}
              className="w-full accent-sv-blue"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="rb-app" className="text-[13px] font-black uppercase tracking-wide text-sv-ink/70">
                {t.appreciation}
              </label>
              <span className="text-[14px] font-black text-sv-ink">{appreciationPct.toFixed(1)}%</span>
            </div>
            <input
              id="rb-app"
              type="range" min={-2} max={12} step={0.5}
              value={appreciationPct}
              onChange={(e) => setAppreciationPct(Number(e.target.value))}
              className="w-full accent-sv-blue"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="rb-alt" className="text-[13px] font-black uppercase tracking-wide text-sv-ink/70">
                {t.altReturn}
              </label>
              <span className="text-[14px] font-black text-sv-ink">{altReturnPct.toFixed(1)}%</span>
            </div>
            <input
              id="rb-alt"
              type="range" min={0} max={15} step={0.5}
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
            {out.buyWins ? t.buyWins(formatUSD(Math.max(0, out.delta))) : t.rentWins(formatUSD(Math.max(0, -out.delta)))}
          </div>
          <div className="mt-6 space-y-3 border-t border-white/10 pt-4 text-[13px]">
            <div className="flex justify-between">
              <span className="text-white/55">{t.monthlyOwn}</span>
              <span className="font-bold">{formatUSD(out.ownFirstMonth)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/55">{t.monthlyRent}</span>
              <span className="font-bold">{formatUSD(out.rentFirstMonth)}</span>
            </div>
          </div>

          <div className="mt-6 space-y-3 border-t border-white/10 pt-4">
            <div>
              <div className="flex justify-between text-[13px]">
                <span className="text-white/55">{t.buyWorth}</span>
                <span className="font-black text-sv-blue-light">{formatUSD(out.buyNetWorth)}</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-sv-blue-light" style={{ width: `${Math.max(2, (out.buyNetWorth / maxWorth) * 100)}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[13px]">
                <span className="text-white/55">{t.rentWorth}</span>
                <span className="font-black text-sv-orange">{formatUSD(out.rentNetWorth)}</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-sv-orange" style={{ width: `${Math.max(2, (out.rentNetWorth / maxWorth) * 100)}%` }} />
              </div>
            </div>
            <div className="pt-1 text-[12px] font-bold text-white/60">
              {out.breakEvenYear !== null ? t.breakEven(out.breakEvenYear) : t.breakEvenNone}
            </div>
          </div>
        </div>
      </div>
      <p className="mt-4 text-[12px] font-semibold text-sv-ink/60">
        {t.disclaimer}
      </p>
    </div>
  )
}
