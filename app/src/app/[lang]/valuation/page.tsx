import type { Metadata } from 'next'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import { PageHero } from '@/components/PageHero'
import LocalizedLink from '@/components/LocalizedLink'
import { getMarketOverview } from '@/lib/market-stats'
import { USD_GEL } from '@/lib/listings-db'
import { grossYieldPct } from '@/lib/finance'
import { estimateRent } from '@/lib/rent-anchor'
import { calculateValuation10x } from '@/lib/valuation-10x'
import { MIN_SAMPLE } from '@/lib/market-stats-core'
import { DISTRICTS } from '@/lib/directory-seo-lite'
import { toLatin } from '@/lib/ka-latin'
import { isValidLang, type Lang } from '@/lib/i18n/core'
import { pageMeta } from '@/lib/i18n/server'
import { jsonLd } from '@/lib/utils'
import type { DirLoc } from '@/lib/directory-seo'
import { ArrowUpRight, Calculator, Search, TrendingUp } from 'lucide-react'

/**
 * SIVRCE AVM — free "what's my home worth" funnel (Zillow/Idealista parity,
 * first public one in Georgia). Pure RSC: native GET form, zero client JS,
 * zero fabricated numbers — an estimate renders only when the district board
 * has ≥ MIN_SAMPLE active listings, and the range widens as the sample thins.
 */

const usd = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`
const gel = (n: number) => `${Math.round(n * USD_GEL).toLocaleString('en-US')} ₾`

/* Condition adjustment on the district's all-condition $/m² average. Indicative
   by design (a renovation-need discount is real but varies); stated in the copy. */
const CONDITION_FACTOR = { any: 1, new: 1.06, renovated: 1, needs_renovation: 0.85 } as const
type Condition = keyof typeof CONDITION_FACTOR

type Copy = {
  kicker: string; title: string; subtitle: string
  districtPh: string; area: string; areaPh: string; condition: string
  condAny: string; condNew: string; condRenov: string; condWorn: string; submit: string
  estimate: string; approx: string; range: string; perM2: string; basis: string
  rent: string; yieldL: string; cap: string; y5: string; closing: string
  searchCta: string; sellCta: string; marketCta: string
  empty: string; disclaimer: string
  faq: { q: string; a: string }[]
}

const COPY: Record<DirLoc | 'de', Copy> = {
  ka: {
    kicker: 'უფასო შეფასება',
    title: 'რამდენად ღირს შენი ბინა?',
    subtitle: 'მიუთითე უბანი და ფართი — მიიღე მყისიერი შეფასება აქტიური განცხადებების ცოცხალი ფასებიდან. უფასოდ, რეგისტრაციის გარეშე.',
    districtPh: 'აირჩიე უბანი',
    area: 'ფართი, მ²',
    areaPh: 'მაგ. 65',
    condition: 'მდგომარეობა',
    condAny: 'არაა მნიშვნელოვანი',
    condNew: 'ახალი აშენებული',
    condRenov: 'გარემონტებული',
    condWorn: 'სარემონტო',
    submit: 'შეაფასე',
    estimate: 'სავარაუდო ღირებულება',
    approx: 'დაახლოებით',
    range: 'დიაპაზონი',
    perM2: 'ფასი მ²-ზე',
    basis: '{n} აქტიური განცხადების საფუძველზე',
    rent: 'სავარაუდო ქირა / თვე',
    yieldL: 'ბრუტო შემოსავლიანობა',
    cap: 'NOI კაპიტალიზაცია — ბაზური სცენარი',
    y5: 'ბინის პროგნოზი 5 წელში — ბაზური',
    closing: 'გარიგების ხარჯები (~3%)',
    searchCta: 'განცხადებები ამ უბანში',
    sellCta: 'განათავსე განცხადება',
    marketCta: 'ბაზრის სრული ანალიტიკა',
    empty: 'ამ უბანში ახლა ცოტა აქტიური განცხადებაა — ზუსტი შეფასების ნაცვლად ნახე ბაზრის ანალიტიკა. ცრუ ციფრს არ დაწერთ.',
    disclaimer: 'შეფასება სავარაუდოა: აქტიური განცხადებების საშუალო ფასი მ²-ზე × ფართი, მდგომარეობის კორექციით. ქირისა და შემოსავლიანობის შეფასება ეყრდნობა Galt & Taggart-ის მონაცემებს (2026-05). არ წარმოადგენს შეფასების აქტს და არ არის ბანკის შემოთავაზება.',
    faq: [
      { q: 'როგორ ხდება შეფასება?', a: 'უბანში აქტიური განცხადებების საშუალო ფასი მ²-ზე მრავლდება შენი ბინის ფართზე და ხდება მდგომარეობის კორექცია (სარემონტო იაფია, ახალი აშენებული — უფრო ძვირი). დიაპაზონი იმის მიხედვით ფართოვდება, რამდენი აქტიური განცხადებაა უბანში.' },
      { q: 'რამდენად ზუსტია ციფრი?', a: 'ეს საცოდავი მაჩვენებელია მოთხოვნის ფასებზე — არა რეგისტრირებული გარიგებების. სანდოობა იზრდება ნიმუშთან ერთად; როცა ნიმუში საკმარისი არ არის, ჩვენ ვაჩვენებთ ცარიელ შედეგს და არა მოგონილ რიცხვს.' },
      { q: 'უფასოა?', a: 'დიახ — შეუზღუდავი შეფასება რეგისტრაციის და გადახდის გარეშე, ყველა უბანზე.' },
      { q: 'როგორ ხშირად განახლდება?', a: 'ყოველდღიურად, პირდაპირ აქტიური განცხადებებიდან; უბნის დაფა ქეშდება საათობრივად.' },
    ],
  },
  en: {
    kicker: 'Free estimate',
    title: 'What is your home worth?',
    subtitle: 'Pick a district and enter your area — get an instant estimate from live asking prices on active listings. Free, no sign-up.',
    districtPh: 'Choose a district',
    area: 'Area, m²',
    areaPh: 'e.g. 65',
    condition: 'Condition',
    condAny: 'Any',
    condNew: 'New build',
    condRenov: 'Renovated',
    condWorn: 'Needs renovation',
    submit: 'Estimate',
    estimate: 'Estimated value',
    approx: '≈',
    range: 'Range',
    perM2: 'Price per m²',
    basis: 'based on {n} active listings',
    rent: 'Est. rent / month',
    yieldL: 'Gross yield',
    cap: 'NOI cap rate — base case',
    y5: 'Value in 5 years — base case',
    closing: 'Closing costs (~3%)',
    searchCta: 'Listings in this district',
    sellCta: 'Post your listing',
    marketCta: 'Full market analytics',
    empty: 'Too few active listings in this district for an honest estimate — see the market analytics instead. We do not invent numbers.',
    disclaimer: 'Indicative only: average active-listing $/m² in the district × your area, adjusted for condition. Rent and yield estimates draw on Galt & Taggart data (2026-05). Not an appraisal report or a bank offer.',
    faq: [
      { q: 'How is the estimate calculated?', a: 'The average active-listing price per m² in the district is multiplied by your area, with a condition adjustment (needs-renovation discounts, new-build premiums). The range widens when the district has fewer active listings.' },
      { q: 'How accurate is the number?', a: 'It reflects asking prices of live listings, not registered transactions. Confidence grows with the sample; when the sample is too small we show no estimate rather than a made-up figure.' },
      { q: 'Is it free?', a: 'Yes — unlimited estimates, no registration, no payment, every district.' },
      { q: 'How often is the data updated?', a: 'Daily, straight from active listings; the district board is cached hourly.' },
    ],
  },
  ru: {
    kicker: 'Бесплатная оценка',
    title: 'Сколько стоит ваша квартира?',
    subtitle: 'Выберите район и укажите площадь — мгновенная оценка по живым ценам активных объявлений. Бесплатно, без регистрации.',
    districtPh: 'Выберите район',
    area: 'Площадь, м²',
    areaPh: 'напр. 65',
    condition: 'Состояние',
    condAny: 'Не важно',
    condNew: 'Новостройка',
    condRenov: 'С ремонтом',
    condWorn: 'Требует ремонта',
    submit: 'Оценить',
    estimate: 'Оценочная стоимость',
    approx: '≈',
    range: 'Диапазон',
    perM2: 'Цена за м²',
    basis: 'на основе {n} активных объявлений',
    rent: 'Оценка аренды / мес',
    yieldL: 'Валовая доходность',
    cap: 'Ставка капитализации NOI — базовый сценарий',
    y5: 'Прогноз на 5 лет — базовый',
    closing: 'Расходы сделки (~3%)',
    searchCta: 'Объявления в районе',
    sellCta: 'Разместить объявление',
    marketCta: 'Вся аналитика рынка',
    empty: 'В этом районе слишком мало активных объявлений для честной оценки — смотрите аналитику рынка. Цифры мы не выдумываем.',
    disclaimer: 'Оценка ориентировочная: средняя цена м² активных объявлений района × площадь, с поправкой на состояние. Оценка аренды и доходности опирается на данные Galt & Taggart (05.2026). Не является отчётом об оценке или банковским предложением.',
    faq: [
      { q: 'Как считается оценка?', a: 'Средняя цена за м² по активным объявлениям района умножается на вашу площадь с поправкой на состояние (требующее ремонта — дешевле, новостройка — дороже). Диапазон шире, если в районе мало активных объявлений.' },
      { q: 'Насколько точна цифра?', a: 'Она отражает цены спроса живых объявлений, а не зарегистрированные сделки. Точность растёт с объёмом выборки; при слишком малой выборке мы не показываем оценку вообще.' },
      { q: 'Это бесплатно?', a: 'Да — неограниченные оценки, без регистрации и оплаты, по всем районам.' },
      { q: 'Как часто обновляются данные?', a: 'Ежедневно, напрямую из активных объявлений; доска районов кэшируется ежечасно.' },
    ],
  },
  de: {
    kicker: 'Kostenlose Schätzung',
    title: 'Was ist Ihre Wohnung wert?',
    subtitle: 'Bezirk wählen, Fläche eingeben — sofortige Schätzung aus den Live-Preisen aktiver Inserate. Kostenlos, ohne Registrierung.',
    districtPh: 'Bezirk wählen',
    area: 'Fläche, m²',
    areaPh: 'z. B. 65',
    condition: 'Zustand',
    condAny: 'Egal',
    condNew: 'Neubau',
    condRenov: 'Saniert',
    condWorn: 'Renovierungsbedürftig',
    submit: 'Schätzen',
    estimate: 'Geschätzter Wert',
    approx: '≈',
    range: 'Spanne',
    perM2: 'Preis pro m²',
    basis: 'basierend auf {n} aktiven Inseraten',
    rent: 'Geschätzte Miete / Monat',
    yieldL: 'Bruttorendite',
    cap: 'NOI-Cap-Rate — Basisszenario',
    y5: 'Wert in 5 Jahren — Basis',
    closing: 'Nebenkosten (~3 %)',
    searchCta: 'Inserate in diesem Bezirk',
    sellCta: 'Inserat aufgeben',
    marketCta: 'Vollständige Marktanalyse',
    empty: 'Zu wenige aktive Inserate in diesem Bezirk für eine ehrliche Schätzung — sehen Sie sich die Marktanalyse an. Wir erfinden keine Zahlen.',
    disclaimer: 'Nur Richtwert: durchschnittlicher Inseratspreis pro m² im Bezirk × Ihre Fläche, korrigiert nach Zustand. Miet- und Renditeschätzung basiert auf Daten von Galt & Taggart (05/2026). Kein Gutachten und kein Bankangebot.',
    faq: [
      { q: 'Wie wird die Schätzung berechnet?', a: 'Der durchschnittliche Inseratspreis pro m² im Bezirk wird mit Ihrer Fläche multipliziert und nach Zustand korrigiert (renovierungsbedürftig günstiger, Neubau teurer). Die Spanne weitet sich, wenn der Bezirk weniger aktive Inserate hat.' },
      { q: 'Wie genau ist die Zahl?', a: 'Sie spiegelt Angebotspreise laufender Inserate, nicht registrierte Transaktionen. Die Genauigkeit wächst mit der Stichprobe; ist diese zu klein, zeigen wir bewusst keine Schätzung.' },
      { q: 'Ist sie kostenlos?', a: 'Ja — unbegrenzte Schätzungen, ohne Registrierung und Gebühr, für jeden Bezirk.' },
      { q: 'Wie oft werden die Daten aktualisiert?', a: 'Täglich, direkt aus den aktiven Inseraten; die Bezirkstafel wird stündlich zwischengespeichert.' },
    ],
  },
}

const FIELD_CLASS =
  'w-full rounded-control border border-sv-ink/[0.12] bg-sv-surface px-3.5 py-2.5 text-[14px] font-semibold text-sv-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue'

function districtName(ka: string, lang: Lang): string {
  if (lang === 'ka') return ka
  const d = DISTRICTS.find((x) => x.ka === ka)
  if (d) return lang === 'ru' ? d.ru : d.en
  return toLatin(ka)
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang: raw } = await params
  const lang = isValidLang(raw) ? raw : 'ka'
  return pageMeta('/valuation', lang, {
    ka: {
      title: 'ბინის უფასო შეფასება — რამდენ ღირს შენი ქონება? | sivrce',
      description: 'მიიღე მყისიერი, უფასო შეფასება ბინის ღირებულების შესახებ უბნის აქტიური განცხადებების ცოცხალი ფასებიდან — დიაპაზონი, ქირა, შემოსავლიანობა, 5-წლიანი პროგნოზი.',
    },
    en: {
      title: 'Free Home Value Estimate — What Is My Home Worth? | sivrce',
      description: 'Instant, free home value estimate from live asking prices in your district — range, rent potential, yield and a 5-year base projection. No sign-up.',
    },
    ru: {
      title: 'Бесплатная оценка квартиры — сколько стоит жильё? | sivrce',
      description: 'Мгновенная бесплатная оценка квартиры по живым ценам активных объявлений района — диапазон, аренда, доходность, прогноз на 5 лет. Без регистрации.',
    },
    de: {
      title: 'Kostenlose Immobilientaxation — Was ist meine Wohnung wert? | sivrce',
      description: 'Sofortige, kostenlose Wertermittlung aus den Live-Preisen aktiver Inserate Ihres Bezirks — Spanne, Miete, Rendite, 5-Jahres-Prognose. Ohne Registrierung.',
    },
  })
}

export default async function ValuationPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { lang: raw } = await params
  const lang = isValidLang(raw) ? raw : 'ka'
  const loc: DirLoc | 'de' = lang === 'ka' || lang === 'ru' || lang === 'de' ? lang : 'en'
  const c = COPY[loc]

  const [data, sp] = await Promise.all([getMarketOverview(USD_GEL), searchParams])

  // Trust boundary — nothing from the query string is trusted as-is.
  const districtKa = typeof sp.district === 'string' ? sp.district.slice(0, 120) : ''
  const areaRaw = Number(sp.area)
  const area = Number.isFinite(areaRaw) && areaRaw >= 10 && areaRaw <= 1000 ? Math.round(areaRaw) : null
  const cond: Condition =
    typeof sp.condition === 'string' && sp.condition in CONDITION_FACTOR
      ? (sp.condition as Condition)
      : 'any'

  const row = districtKa ? data.districts.find((d) => d.district === districtKa) : undefined

  let result: null | {
    valueUSD: number; loUSD: number; hiUSD: number; hwPct: number
    ppsm: number; rent: number | null; yieldPct: number; capPct: number
    y5USD: number; closingUSD: number; sample: number
  } = null
  if (row && area) {
    if (row.stats.sample >= MIN_SAMPLE) {
      const ppsm = row.stats.avgPerM2USD
      const valueUSD = Math.round((area * ppsm * CONDITION_FACTOR[cond]) / 100) * 100
      // ±6% at a 40-listing sample, widening to ±16% as the sample thins.
      const hwPct = 6 + Math.max(0, 10 - Math.min(row.stats.sample, 40) / 4)
      // Anchor needs the district's city; unknown district → no rent/yield rows.
      const city = DISTRICTS.find((d) => d.ka === districtKa)?.citySlug
      const rent = estimateRent(area, 'GE', city, districtKa)
      const report = calculateValuation10x({
        priceUSD: valueUSD, areaSqm: area, monthlyRentUSD: rent ?? 0, countryCode: 'GE',
      })
      result = {
        valueUSD,
        loUSD: Math.round((valueUSD * (1 - hwPct / 100)) / 100) * 100,
        hiUSD: Math.round((valueUSD * (1 + hwPct / 100)) / 100) * 100,
        hwPct,
        ppsm,
        rent,
        yieldPct: rent ? grossYieldPct(valueUSD, rent) : 0,
        capPct: report.scenarios.base.year1CapRatePct,
        y5USD: report.scenarios.base.year5PropertyValueUSD,
        closingUSD: report.estimatedClosingCostsUSD,
        sample: row.stats.sample,
      }
    }
  }

  const searchHref = `/search?district=${encodeURIComponent(districtKa)}`
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: c.faq.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }
  const crumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'sivrce', item: 'https://sivrce.ge' },
      { '@type': 'ListItem', position: 2, name: c.title, item: 'https://sivrce.ge/valuation' },
    ],
  }

  return (
    <div className="min-h-screen bg-sv-cloud">
      <Navbar />
      <main id="main">
        <PageHero tone="light" kicker={c.kicker} title={c.title} subtitle={c.subtitle} />

        <div className="mx-auto max-w-[820px] px-5 pb-20 md:px-10">
          {/* GET form — cacheable, shareable, zero client JS */}
          <form
            method="get"
            className="grid gap-4 rounded-card border border-sv-ink/[0.06] bg-sv-surface p-6 shadow-card md:grid-cols-[1.4fr_0.8fr_1fr_auto] md:items-end md:p-8"
          >
            <label className="block text-[13px] font-bold text-sv-ink/70">
              {c.districtPh}
              <select name="district" required defaultValue={districtKa} className={`${FIELD_CLASS} mt-1`}>
                <option value="" disabled>
                  {c.districtPh}
                </option>
                {data.districts
                  .filter((d) => d.stats.sample >= MIN_SAMPLE)
                  .map((d) => (
                    <option key={d.district} value={d.district}>
                      {districtName(d.district, lang)} · {d.stats.sample}
                    </option>
                  ))}
              </select>
            </label>
            <label className="block text-[13px] font-bold text-sv-ink/70">
              {c.area}
              <input
                name="area"
                type="number"
                min={10}
                max={1000}
                step={1}
                required
                inputMode="numeric"
                defaultValue={area ?? ''}
                placeholder={c.areaPh}
                className={`${FIELD_CLASS} mt-1`}
              />
            </label>
            <label className="block text-[13px] font-bold text-sv-ink/70">
              {c.condition}
              <select name="condition" defaultValue={cond} className={`${FIELD_CLASS} mt-1`}>
                <option value="any">{c.condAny}</option>
                <option value="new">{c.condNew}</option>
                <option value="renovated">{c.condRenov}</option>
                <option value="needs_renovation">{c.condWorn}</option>
              </select>
            </label>
            <button
              type="submit"
              className="inline-flex h-[42px] items-center justify-center gap-2 rounded-control bg-sv-ink px-5 text-[14px] font-extrabold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2"
            >
              <Calculator className="h-4 w-4" aria-hidden />
              {c.submit}
            </button>
          </form>

          {result ? (
            <section className="mt-6 rounded-card border border-sv-ink/[0.06] bg-sv-surface p-6 shadow-card md:p-8" aria-live="polite">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <div className="text-[11px] font-black uppercase tracking-wider text-sv-blue">{c.estimate}</div>
                  <div className="mt-1 text-[38px] font-black leading-none tracking-[-0.02em] text-sv-ink md:text-[44px]">
                    {usd(result.valueUSD)}
                  </div>
                  <div className="mt-1 text-[13px] font-bold text-sv-ink/60">
                    {c.approx} {gel(result.valueUSD)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] font-black uppercase tracking-wider text-sv-ink/50">{c.range}</div>
                  <div className="mt-1 text-[16px] font-black text-sv-ink">
                    {usd(result.loUSD)} – {usd(result.hiUSD)}
                  </div>
                  <div className="text-[12px] font-bold text-sv-ink/50">±{Math.round(result.hwPct)}%</div>
                </div>
              </div>

              <dl className="mt-6 grid gap-3 border-t border-sv-ink/[0.06] pt-5 text-[13px] font-bold sm:grid-cols-2">
                <div className="flex justify-between gap-3 sm:block">
                  <dt className="text-sv-ink/55">{c.perM2}</dt>
                  <dd className="text-sv-ink">{usd(result.ppsm)}/m²</dd>
                </div>
                {result.rent !== null && (
                  <>
                    <div className="flex justify-between gap-3 sm:block">
                      <dt className="text-sv-ink/55">{c.rent}</dt>
                      <dd className="text-sv-ink">{usd(result.rent)}</dd>
                    </div>
                    <div className="flex justify-between gap-3 sm:block">
                      <dt className="text-sv-ink/55">{c.yieldL}</dt>
                      <dd className="text-sv-ink">{result.yieldPct.toFixed(1)}%</dd>
                    </div>
                    <div className="flex justify-between gap-3 sm:block">
                      <dt className="text-sv-ink/55">{c.cap}</dt>
                      <dd className="text-sv-ink">{result.capPct.toFixed(1)}%</dd>
                    </div>
                  </>
                )}
                <div className="flex justify-between gap-3 sm:block">
                  <dt className="text-sv-ink/55">{c.y5}</dt>
                  <dd className="text-sv-ink">{usd(result.y5USD)}</dd>
                </div>
                <div className="flex justify-between gap-3 sm:block">
                  <dt className="text-sv-ink/55">{c.closing}</dt>
                  <dd className="text-sv-ink">{usd(result.closingUSD)}</dd>
                </div>
              </dl>

              <p className="mt-5 flex items-center gap-1.5 text-[12px] font-bold text-sv-ink/50">
                <TrendingUp className="h-3.5 w-3.5" aria-hidden />
                {c.basis.replace('{n}', String(result.sample))}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <LocalizedLink
                  href={searchHref}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-control bg-sv-blue px-5 text-[14px] font-extrabold text-white transition-opacity hover:opacity-90"
                >
                  <Search className="h-4 w-4" aria-hidden />
                  {c.searchCta}
                </LocalizedLink>
                <LocalizedLink
                  href="/add-listing"
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-control bg-sv-orange px-5 text-[14px] font-extrabold text-sv-ink shadow-glow-orange transition-opacity hover:opacity-95"
                >
                  {c.sellCta}
                  <ArrowUpRight className="h-4 w-4" aria-hidden />
                </LocalizedLink>
              </div>
            </section>
          ) : districtKa && area ? (
            <section className="mt-6 rounded-card border border-sv-orange/25 bg-cat-houses-chip p-6 md:p-8" aria-live="polite">
              <p className="text-[14px] font-bold text-sv-ink">{c.empty}</p>
              <LocalizedLink
                href="/market"
                className="mt-4 inline-flex min-h-11 items-center gap-1.5 text-[14px] font-extrabold text-sv-blue hover:text-sv-blue-deep"
              >
                {c.marketCta}
                <ArrowUpRight className="h-4 w-4" aria-hidden />
              </LocalizedLink>
            </section>
          ) : null}

          <p className="mt-4 text-[12px] font-semibold leading-relaxed text-sv-ink/50">{c.disclaimer}</p>

          {/* AEO surface — same Q&A as the FAQPage JSON-LD */}
          <section className="mt-10">
            <h2 className="text-[16px] font-black tracking-[-0.02em] text-sv-ink">FAQ</h2>
            <div className="mt-3 divide-y divide-sv-ink/[0.06]">
              {c.faq.map((f) => (
                <details key={f.q} className="group py-3">
                  <summary className="cursor-pointer list-none text-[14px] font-extrabold text-sv-ink marker:hidden [&::-webkit-details-marker]:hidden">
                    {f.q}
                  </summary>
                  <p className="mt-2 text-[13px] font-semibold leading-relaxed text-sv-ink/65">{f.a}</p>
                </details>
              ))}
            </div>
            <LocalizedLink
              href="/market"
              className="mt-6 inline-flex min-h-11 items-center gap-1.5 text-[14px] font-extrabold text-sv-blue hover:text-sv-blue-deep"
            >
              {c.marketCta}
              <ArrowUpRight className="h-4 w-4" aria-hidden />
            </LocalizedLink>
          </section>
        </div>
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(crumbLd) }} />
    </div>
  )
}
