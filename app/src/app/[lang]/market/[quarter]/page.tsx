import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import LocalizedLink from '@/components/LocalizedLink'
import { getQuarterReport } from '@/lib/market-stats'
import { normalizeQuarter, quarterKey } from '@/lib/market-stats-core'
import { jsonLd } from '@/lib/utils'
import { isValidLang, type Lang } from '@/lib/i18n/core'
import { pageAlternates, OG_LOCALE } from '@/lib/i18n/server'

export const revalidate = 3600

// ponytail: prerender the live quarter in ka only — past editions SSR on demand.
export function generateStaticParams() {
  return [{ lang: 'ka', quarter: quarterKey(new Date()).toLowerCase() }]
}

const INTL: Record<Lang, string> = {
  ka: 'ka-GE', en: 'en-US', ru: 'ru-RU', he: 'he-IL', ar: 'ar',
  tr: 'tr-TR', uk: 'uk-UA', hy: 'hy-AM', az: 'az', de: 'de-DE',
}

const COPY = {
  ka: {
    h1: 'თბილისის უძრავი ქონების ბაზარი',
    report: 'კვარტალური ანგარიში',
    lead: (avg: string, qoq: string, active: string) =>
      `თბილისში საცხოვრებელი ფართის საშუალო საკადასტრო ღირებულება ${avg} $/მ²-ია ${qoq} — აქტიური ${active} განცხადებიდან გამოთვლილი. ქვემოთ უბნების დეტალური ცხრილია.`,
    inProgress: 'კვარტალი მიმდინარეა — მონაცემები ივსება ყოველღამიანი აღრიცხვით.',
    avgM2: 'საშ. ფასი / მ²', qoq: 'წინა კვარტალთან', active: 'აქტიური', fresh: 'ახალი', sold: 'გაყიდული',
    district: 'უბანი', median: 'მედიანა', dom: 'სშ. დღე',
    tableTitle: 'უბნების მიხედვით',
    tableSub: 'დალაგებულია აქტიური განცხადებების რაოდენობით — დააჭირე უბანს ლაივ განცხადებებისთვის',
    methodTitle: 'მეთოდოლოგია',
    method: 'მონაცემები მოდის sivrce-ს აქტიური განცხადებების ყოველღამიანი აღრიცხვიდან (MarketSnapshot): ფასები ნორმალიზებულია დოლარში მ²-ზე, ქალაქის ჯამური მაჩვენებელი აქტიური განცხადებებით არის შეწონილი, ხოლო „გაყიდული" რეალურ მფლობელის მიერ დაფიქსირებულ გაყიდვებს ეყრდნობა. უბანი ჩნდება, თუ აღრიცხვა არსებობს; ვალუტის კურსი 2.7 ₾/$.',
    citeTitle: 'ციტირება',
    citeAs: (q: string, url: string) => `Sivrce. „თბილისის უძრავი ქონების ბაზარი, ${q}". ${url}`,
    liveBoard: 'ლაივ ბაზრის დაფა',
    valuation: 'გაიგე შენი ბინის ღირებულება — უფასო შეფასება 30 წამში',
    empty: 'ამ კვარტალის აღრიცხვა ჯერ არ არის საკმარისი. იხილე ლაივ დაფა.',
    updated: 'მონაცემების ბოლო განახლება',
  },
  en: {
    h1: 'Tbilisi property market',
    report: 'quarterly report',
    lead: (avg: string, qoq: string, active: string) =>
      `Tbilisi residential real estate averaged ${avg} $/m² ${qoq}, across ${active} active listings. The district breakdown follows.`,
    inProgress: 'Quarter in progress — figures accumulate from the nightly snapshot run.',
    avgM2: 'Avg. price / m²', qoq: 'vs prev. quarter', active: 'Active', fresh: 'New', sold: 'Sold',
    district: 'District', median: 'Median', dom: 'Avg. days',
    tableTitle: 'By district',
    tableSub: 'Sorted by active listings — tap a district for live inventory',
    methodTitle: 'Methodology',
    method: 'Figures come from sivrce\'s nightly snapshot of active listings (MarketSnapshot): prices are USD-normalized per m², the city total is weighted by active listings, and "Sold" counts owner-confirmed sales. A district appears once a snapshot exists. FX 2.7 ₾/$.',
    citeTitle: 'Cite this report',
    citeAs: (q: string, url: string) => `Sivrce. "Tbilisi property market, ${q}". ${url}`,
    liveBoard: 'live market board',
    valuation: 'What is your home worth? — free instant estimate',
    empty: 'Not enough snapshot coverage for this quarter yet. See the live board.',
    updated: 'Data last updated',
  },
  ru: {
    h1: 'Рынок недвижимости Тбилиси',
    report: 'квартальный отчёт',
    lead: (avg: string, qoq: string, active: string) =>
      `Средняя цена жилья в Тбилиси — ${avg} $/м² ${qoq}, по ${active} активным объявлениям. Ниже — разбивка по районам.`,
    inProgress: 'Квартал продолжается — данные пополняются еженощным снимком.',
    avgM2: 'Ср. цена / м²', qoq: 'к пред. кварталу', active: 'Активных', fresh: 'Новых', sold: 'Продано',
    district: 'Район', median: 'Медиана', dom: 'Ср. дней',
    tableTitle: 'По районам',
    tableSub: 'Отсортировано по числу активных объявлений — нажмите район для живой выдачи',
    methodTitle: 'Методология',
    method: 'Данные — еженощный снимок активных объявлений sivrce (MarketSnapshot): цены нормализованы в $/м², итог по городу взвешен по активным объявлениям, «Продано» — подтверждённые владельцами продажи. Район появляется при наличии снимка. Курс 2.7 ₾/$.',
    citeTitle: 'Цитировать',
    citeAs: (q: string, url: string) => `Sivrce. «Рынок недвижимости Тбилиси, ${q}». ${url}`,
    liveBoard: 'живая панель рынка',
    valuation: 'Узнайте стоимость квартиры — бесплатная оценка за 30 секунд',
    empty: 'Пока недостаточно данных за этот квартал. Смотрите живую панель.',
    updated: 'Данные обновлены',
  },
  de: {
    h1: 'Immobilienmarkt Tiflis',
    report: 'Quartalsbericht',
    lead: (avg: string, qoq: string, active: string) =>
      `Wohnimmobilien in Tiflis erzielten im Schnitt ${avg} $/m² ${qoq}, über ${active} aktive Inserate. Unten die Bezirksaufstellung.`,
    inProgress: 'Quartal läuft — Werte sammeln sich über den nächtlichen Snapshot.',
    avgM2: 'Ø Preis / m²', qoq: 'vs. Vorquartal', active: 'Aktiv', fresh: 'Neu', sold: 'Verkauft',
    district: 'Bezirk', median: 'Median', dom: 'Ø Tage',
    tableTitle: 'Nach Bezirken',
    tableSub: 'Sortiert nach aktiven Inseraten — Bezirk antippen für Live-Bestand',
    methodTitle: 'Methodik',
    method: 'Grundlage ist der nächtliche Snapshot aktiver sivrce-Inserate (MarketSnapshot): Preise USD-normalisiert pro m², Stadtwert nach aktiven Inseraten gewichtet, „Verkauft" zählt besitzerbestätigte Verkäufe. Kurs 2.7 ₾/$.',
    citeTitle: 'Zitieren',
    citeAs: (q: string, url: string) => `Sivrce. „Immobilienmarkt Tiflis, ${q}". ${url}`,
    liveBoard: 'Live-Marktboard',
    valuation: 'Was ist Ihre Wohnung wert? — kostenlose Sofortschätzung',
    empty: 'Noch nicht genug Abdeckung für dieses Quartal. Zum Live-Board.',
    updated: 'Daten aktualisiert',
  },
} as const

const fmtQoq = (qoq: number | null) => {
  if (qoq === null) return null
  return `${qoq > 0 ? '+' : '−'}${Math.abs(qoq)}%`
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; quarter: string }>
}): Promise<Metadata> {
  const { lang: raw, quarter: rawQuarter } = await params
  const lang: Lang = isValidLang(raw) ? raw : 'ka'
  // URL middleware lowercases paths — canonical URL keeps the lowercase form.
  const quarter = normalizeQuarter(rawQuarter)
  if (!quarter) return {}
  const path = `/market/${quarter.toLowerCase()}`
  const report = await getQuarterReport(quarter)
  // Thin-edition guard: a quarter without district snapshots must not build
  // an indexable empty page (anti-doorway).
  const indexable = !!report && report.districts.length >= 2
  const c = COPY[lang as keyof typeof COPY] ?? COPY.en
  const name = ({ ka: 'ბაზრის ანგარიში', en: 'market report', ru: 'отчёт рынка', de: 'Marktbericht' } as Record<string, string>)[lang] ?? 'market report'
  return {
    title: `Tbilisi ${quarter} — ${name} | sivrce`,
    description: c.lead(
      report?.total ? String(report.total.avgPerM2USD) : '—',
      '', report?.total ? String(report.total.activeEnd) : '—',
    ).replace(/\s+/g, ' '),
    alternates: pageAlternates(path, lang),
    ...(indexable ? {} : { robots: { index: false, follow: true } }),
    openGraph: {
      title: `Tbilisi property market — ${quarter}`,
      type: 'website',
      url: `https://sivrce.ge${path}`,
      siteName: 'sivrce',
      locale: OG_LOCALE[lang],
    },
  }
}

export default async function MarketQuarterPage({
  params,
}: {
  params: Promise<{ lang: string; quarter: string }>
}) {
  const { lang: raw, quarter: rawQuarter } = await params
  const lang: Lang = isValidLang(raw) ? raw : 'ka'
  const quarter = normalizeQuarter(rawQuarter)
  if (!quarter || quarter > quarterKey(new Date())) notFound()
  const report = await getQuarterReport(quarter)
  if (!report) notFound()
  const c = COPY[lang as keyof typeof COPY] ?? COPY.en
  const nf = (n: number) => new Intl.NumberFormat(INTL[lang]).format(n)
  const total = report.total

  const datasetLd = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: `sivrce — Tbilisi real estate market, ${quarter}`,
    description: c.method,
    url: `https://sivrce.ge/market/${quarter}`,
    creator: { '@type': 'Organization', name: 'sivrce', url: 'https://sivrce.ge' },
    temporalCoverage: `${report.monthsPresent[0] ?? quarter}/P3M`,
    isAccessibleForFree: true,
    ...(report.dataAsOf ? { dateModified: report.dataAsOf.toISOString() } : {}),
    variableMeasured: ['avg price per m² (USD)', 'median price (USD)', 'active listings', 'new listings', 'sold count', 'days on market'],
  }
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: lang === 'ka' ? 'მთავარი' : lang === 'ru' ? 'Главная' : lang === 'de' ? 'Startseite' : 'Home', item: 'https://sivrce.ge' },
      { '@type': 'ListItem', position: 2, name: lang === 'ka' ? 'ბაზრის ანალიტიკა' : 'Market analytics', item: 'https://sivrce.ge/market' },
      { '@type': 'ListItem', position: 3, name: quarter, item: `https://sivrce.ge/market/${quarter.toLowerCase()}` },
    ],
  }

  const stats: { label: string; value: string; sub?: string }[] = total ? [
    { label: c.avgM2, value: `$${nf(total.avgPerM2USD)}`, sub: fmtQoq(report.totalQoq) ?? undefined },
    { label: c.active, value: nf(total.activeEnd) },
    { label: c.fresh, value: nf(total.newListings) },
    { label: c.sold, value: nf(total.soldCount) },
  ] : []

  return (
    <div className="min-h-screen bg-sv-surface">
      <Navbar />
      <main id="main">
        <article className="mx-auto max-w-[1100px] px-5 pt-10 md:px-10">
          <p className="text-[12px] font-black uppercase tracking-[0.14em] text-sv-blue">
            <LocalizedLink href="/market" className="hover:underline">{c.liveBoard}</LocalizedLink>
            <span className="mx-2 text-sv-ink/30" aria-hidden>·</span>
            {c.report} {quarter}
          </p>
          <h1 className="mt-3 text-[30px] font-black leading-[1.1] tracking-[-0.03em] text-sv-ink md:text-[38px]">
            {c.h1} — {quarter}
          </h1>
          {total ? (
            <>
              {/* Answer-first: the citable sentence, numbers inline. */}
              <p className="mt-4 max-w-[46em] text-[15.5px] font-semibold leading-[1.75] text-sv-ink/70">
                {c.lead(`$${nf(total.avgPerM2USD)}`, fmtQoq(report.totalQoq) ?? '', nf(total.activeEnd))}
              </p>
              <div className="mt-6 grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
                {stats.map((s) => (
                  <div key={s.label} className="rounded-card border border-sv-ink/[0.06] bg-sv-surface p-4 shadow-card">
                    <div className="text-[12px] font-bold text-sv-ink/55">{s.label}</div>
                    <div className="mt-1 text-[22px] font-black tracking-[-0.02em] text-sv-ink">{s.value}</div>
                    {s.sub && <div className={`text-[12.5px] font-extrabold ${s.sub.startsWith('+') ? 'text-sv-blue' : 'text-sv-orange-deep'}`}>{s.sub}</div>}
                  </div>
                ))}
              </div>
              {report.monthsPresent.length < 3 && (
                <p className="mt-3 text-[12.5px] font-semibold text-sv-ink/50">{c.inProgress}</p>
              )}

              <section className="mt-10">
                <h2 className="text-[20px] font-black tracking-[-0.02em] text-sv-ink">{c.tableTitle}</h2>
                <p className="mt-1 text-[13px] font-semibold text-sv-ink/55">{c.tableSub}</p>
                <div className="mt-4 overflow-x-auto rounded-card border border-sv-ink/[0.06] bg-sv-surface shadow-card">
                  <table className="w-full min-w-[560px] text-left text-[13.5px]">
                    <thead>
                      <tr className="border-b border-sv-ink/[0.06] text-[11.5px] font-black uppercase tracking-[0.08em] text-sv-ink/45">
                        <th scope="col" className="px-4 py-3">{c.district}</th>
                        <th scope="col" className="px-4 py-3">{c.avgM2}</th>
                        <th scope="col" className="px-4 py-3">{c.qoq}</th>
                        <th scope="col" className="px-4 py-3">{c.fresh}</th>
                        <th scope="col" className="px-4 py-3">{c.active}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.districts.slice(0, 15).map((d) => {
                        const q = fmtQoq(d.qoq)
                        return (
                          <tr key={d.district} className="border-b border-sv-ink/[0.04] last:border-0">
                            <td className="px-4 py-3 font-extrabold text-sv-ink">
                              <LocalizedLink href={`/search?district=${encodeURIComponent(d.district)}`} className="hover:underline">{d.district}</LocalizedLink>
                            </td>
                            <td className="px-4 py-3 font-bold text-sv-ink">${nf(d.stats.avgPerM2USD)}</td>
                            <td className={`px-4 py-3 font-extrabold ${q ? (q.startsWith('+') ? 'text-sv-blue' : 'text-sv-orange-deep') : 'text-sv-ink/35'}`}>{q ?? '—'}</td>
                            <td className="px-4 py-3 font-semibold text-sv-ink/70">{nf(d.stats.newListings)}</td>
                            <td className="px-4 py-3 font-semibold text-sv-ink/70">{nf(d.stats.activeEnd)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          ) : (
            <p className="mt-6 max-w-[46em] text-[15px] font-semibold leading-[1.75] text-sv-ink/60">{c.empty}</p>
          )}

          <section className="mt-10 max-w-[52em]">
            <h2 className="text-[17px] font-black tracking-[-0.02em] text-sv-ink">{c.methodTitle}</h2>
            <p className="mt-2 text-[13.5px] font-medium leading-[1.8] text-sv-ink/60">{c.method}</p>
            {report.dataAsOf && (
              <p className="mt-2 text-[12.5px] font-semibold text-sv-ink/45">
                {c.updated}: <time dateTime={report.dataAsOf.toISOString()}>{new Intl.DateTimeFormat(INTL[lang], { dateStyle: 'long', timeZone: 'UTC' }).format(report.dataAsOf)}</time>
              </p>
            )}
            <div className="mt-4 rounded-module bg-sv-cloud px-4 py-3 text-[12.5px] font-semibold leading-relaxed text-sv-ink/70">
              <span className="font-black text-sv-ink">{c.citeTitle}:</span>{' '}
              {c.citeAs(quarter, `https://sivrce.ge/market/${quarter}`)}
            </div>
          </section>

          <div className="mb-16 mt-10">
            <LocalizedLink
              href="/valuation"
              className="inline-flex items-center gap-2 rounded-full bg-sv-blue px-6 py-3.5 text-[14px] font-black text-white shadow-glow-blue-sm transition hover:brightness-110"
            >
              {c.valuation}
            </LocalizedLink>
          </div>
        </article>
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(datasetLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbLd) }} />
    </div>
  )
}
