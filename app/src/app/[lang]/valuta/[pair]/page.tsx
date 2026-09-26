import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ArrowRightLeft, Building2, ChevronRight, RefreshCw } from 'lucide-react'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import LocalizedLink from '@/components/LocalizedLink'
import { PageHero } from '@/components/PageHero'
import { AdSlot } from '@/components/ads/AdSlot'
import { jsonLd } from '@/lib/utils'
import { isValidLang } from '@/lib/i18n/core'
import { pageMeta } from '@/lib/i18n/server'
import {
  FX_PAIRS, fxConvert, fxFormat, fxName, fxRate, fxUpdated, fxWhole, getFx, pairSlug, parsePairSlug,
  type FxCurrency, type FxTable,
} from '@/lib/fx'

export const revalidate = 3600

export function generateStaticParams() {
  return FX_PAIRS.map(([f, t]) => ({ lang: 'ka', pair: pairSlug(f, t) }))
}

type Loc = 'ka' | 'en' | 'ru' | 'de' | 'tr'

/** Exact-match titles for the pairs with real query volume; the tail uses the template. */
const TITLE_KA: Record<string, string> = {
  'usd-gel': 'დოლარის კურსი დღეს — დოლარი ლართან',
  'eur-gel': 'ევროს კურსი დღეს — ევრო ლართან',
  'gbp-gel': 'ფუნტის კურსი ლართან დღეს',
  'try-gel': 'თურქული ლირას კურსი ლართან',
  'rub-gel': 'რუბლის კურსი ლართან დღეს',
  'aed-gel': 'დირჰამის კურსი ლართან',
  'gel-usd': 'ლარი დოლართან — 1 ლარი რამდენი დოლარია',
  'gel-eur': 'ლარი ევროსთან — 1 ლარი რამდენი ევროა',
  'usd-eur': 'დოლარი ევროსთან — კურსი დღეს',
  'eur-usd': 'ევრო დოლართან — კურსი დღეს',
}

const H1_KA: Record<string, string> = {
  'usd-gel': 'დოლარის კურსი დღეს',
  'eur-gel': 'ევროს კურსი დღეს',
}

const TITLE_RU: Record<string, string> = {
  'usd-gel': 'Курс доллара к лари на сегодня',
  'eur-gel': 'Курс евро к лари на сегодня',
}

const COPY: Record<Loc, {
  kicker: string; h1: string; sub: (fx: FxTable, f: FxCurrency, t: FxCurrency) => string
  convTitle: string; amount: string; button: string
  rateWord: string
  guideTitle: string; guide: string[]
  faqTitle: string; faqs: (fx: FxTable, f: FxCurrency, t: FxCurrency) => { q: string; a: string }[]
  faqsNote: string
  ctaTitle: string; ctaSub: string; ctaButton: string
  crumbA: string; crumbB: string; siblingTitle: string
}> = {
  ka: {
    kicker: 'საშუალო ბაზრის კურსი — განახლდება საათში',
    h1: '', // per-pair — H1_KA or names template below
    sub: (fx, f, t) => `1 ${fxName(f, 'ka')} = ${fxRate(fxConvert(1, f, t, fx.rates), 'ka')} ${fxName(t, 'ka')}. გადაიყვანეთ ნებისმიერი თანხა და ნახეთ ცხრილები პოპულარული ოდენობებისთვის.`,
    convTitle: 'გადამყვანი',
    amount: 'თანხა', button: 'გადაყვანა',
    rateWord: 'კურსი',
    guideTitle: 'ამ წყვილის კურსის შესახებ',
    guide: [
      'მოცემულია საშუალო ბაზრის (mid-market) კურსი — გლობალური ბაზრის რეალური შუა მნიშვნელობა, რომელსაც საერთაშორისო ბანკები იყენებენ და რომელზეც Google-ის და NBG-ის გამოქვეყნებული კურსები იმყარებენ. კომერციული ბანკი და გადამცვლელი წერტილი ამ კურსს 0.5–2% მარჟას დაადებს.',
      'უძრავ ქონებაში კურსი გადამწყვეტია: თბილისისა და ბათუმის ბევრი ბინა დოლარში ფასდება, იპოთეკა და სარეგისტრაციო ხარჯები კი ლარში იხდება. sivrce-ზე ყველა განცხადება ორ ვალუტაში ჩანს ერთდროულად — განახლებული კურსით.',
    ],
    faqTitle: 'ხშირად დასმული კითხვები',
    faqs: (fx, f, t) => [
      { q: `რა არის ${fxName(f, 'ka')}-ის კურსი დღეს?`, a: `დღეს 1 ${fxName(f, 'ka')} = ${fxRate(fxConvert(1, f, t, fx.rates), 'ka')} ${fxName(t, 'ka')} (საშუალო ბაზრის კურსი, ${fxUpdated(fx.updatedISO, 'ka')}). ბანკების რეალური ყიდვა/გაყიდვის კურსი ამას მარჟით განსხვავდება.` },
      { q: `რამდენია 100 ${f} ლარში?`, a: `100 ${f} დღეს ${fxFormat(fxConvert(100, f, 'GEL', fx.rates), 'GEL', 'ka')}-ია. სხვა ოდენობებისთვის გამოიყენეთ ზემოთა გადამყვანი — შედეგი მყისიერად გამოითვლება.` },
      { q: 'ეს ოფიციალური კურსია?', a: 'საშუალო ბაზრის კურსია. ოფიციალურ ყოველდღიურ კურსს ეროვნული ბანკი აქვეყნებს nbg.gov.ge-ზე, კომერციული ბანკები კი საკუთარ მარჟას ამატებენ — გარიგებამდე ზუსტი კურსი ბანკთან დააზუსტეთ.' },
      { q: 'როგორ იცვლება ეს კურსი?', a: 'ვალუტის ბაზარი 24/5 მუშაობს. ეს გვერდი საათში ერთხელ განახლდება მსოფლიო ბაზრიდან — ყოველდღიური გამოყენებისთვის საკმარისი სიზუსტეა.' },
    ],
    faqsNote: 'კურსები საინფორმაციოა და არ არის გარიგების ოფერი.',
    ctaTitle: 'ბინას ეძებთ?',
    ctaSub: 'ვერიფიცირებული განცხადებები ორი ვალუტით და AI ფასის შეფასებით — თბილისი, ბათუმი, ქუთაისი.',
    ctaButton: 'ვერიფიცირებული ბინები',
    crumbA: 'ვალუტის კურსი', crumbB: '', siblingTitle: 'სხვა მიმართულებები',
  },
  en: {
    kicker: 'Mid-market rate — refreshed hourly',
    h1: '',
    sub: (fx, f, t) => `1 ${f} = ${fxRate(fxConvert(1, f, t, fx.rates), 'en')} ${t} today. Convert any amount and see ready tables for popular amounts.`,
    convTitle: 'Converter',
    amount: 'Amount', button: 'Convert',
    rateWord: 'Rate',
    guideTitle: 'About this pair',
    guide: [
      'This is the mid-market rate — the real midpoint of the global market that international banks use and that Google\'s and the NBG\'s published rates are built on. Commercial banks and exchange booths add a 0.5–2% margin on top.',
      'In real estate the rate is decisive: many Tbilisi and Batumi listings are priced in dollars while mortgages and registration fees are settled in lari. Every sivrce listing shows both currencies at once, converted at the live rate.',
    ],
    faqTitle: 'Frequently asked questions',
    faqs: (fx, f, t) => [
      { q: `What is the ${f} to ${t} rate today?`, a: `Today 1 ${f} = ${fxRate(fxConvert(1, f, t, fx.rates), 'en')} ${t} (mid-market rate, ${fxUpdated(fx.updatedISO, 'en')}). Actual bank buy/sell rates differ by a 0.5–2% margin.` },
      { q: `How much is 100 ${f} in lari?`, a: `100 ${f} is ${fxFormat(fxConvert(100, f, 'GEL', fx.rates), 'GEL', 'en')} today. Use the converter above for any other amount — the result is computed instantly.` },
      { q: 'Is this the official rate?', a: 'It is the mid-market rate. The National Bank of Georgia publishes the official daily rate at nbg.gov.ge; commercial banks add their own margin — confirm the exact rate with your bank before exchanging.' },
      { q: 'How often does this rate change?', a: 'The currency market trades 24/5. This page refreshes hourly from the global market — more than accurate enough for everyday use.' },
    ],
    faqsNote: 'Rates are informational and not an offer to transact.',
    ctaTitle: 'Looking for an apartment?',
    ctaSub: 'Verified listings in two currencies with AI price estimates — Tbilisi, Batumi, Kutaisi.',
    ctaButton: 'Verified apartments',
    crumbA: 'Exchange rates', crumbB: '', siblingTitle: 'Other pairs',
  },
  ru: {
    kicker: 'Среднерыночный курс — обновляется ежечасно',
    h1: '',
    sub: (fx, f, t) => `1 ${f} = ${fxRate(fxConvert(1, f, t, fx.rates), 'ru')} ${t} сегодня. Переводите любую сумму и пользуйтесь готовыми таблицами популярных сумм.`,
    convTitle: 'Конвертер',
    amount: 'Сумма', button: 'Конвертировать',
    rateWord: 'Курс',
    guideTitle: 'Об этой валютной паре',
    guide: [
      'Это среднерыночный курс (mid-market) — реальная середина глобального рынка, которую используют международные банки и на которой стоят курсы Google и НБГ. Коммерческие банки и обменники добавляют к нему маржу 0,5–2%.',
      'В недвижимости курс решает всё: многие квартиры в Тбилиси и Батуми оцениваются в долларах, а ипотека и регистрационные сборы платятся в лари. Каждое объявление на sivrce показывает обе валюты сразу по живому курсу.',
    ],
    faqTitle: 'Частые вопросы',
    faqs: (fx, f, t) => [
      { q: `Какой курс ${f} к ${t} сегодня?`, a: `Сегодня 1 ${f} = ${fxRate(fxConvert(1, f, t, fx.rates), 'ru')} ${t} (среднерыночный курс, ${fxUpdated(fx.updatedISO, 'ru')}). Реальные курсы банков отличаются на маржу 0,5–2%.` },
      { q: `Сколько будет 100 ${f} в лари?`, a: `100 ${f} сегодня — это ${fxFormat(fxConvert(100, f, 'GEL', fx.rates), 'GEL', 'ru')}. Для других сумм используйте конвертер выше — результат считается мгновенно.` },
      { q: 'Это официальный курс?', a: 'Это среднерыночный курс. Официальный ежедневный курс публикует Нацбанк Грузии на nbg.gov.ge; коммерческие банки добавляют свою маржу — уточните точный курс в банке до операции.' },
      { q: 'Как часто меняется курс?', a: 'Валютный рынок работает 24/5. Эта страница обновляется ежечасно с мирового рынка — для повседневного использования точности достаточно.' },
    ],
    faqsNote: 'Курсы носят информационный характер и не являются офертой.',
    ctaTitle: 'Ищете квартиру?',
    ctaSub: 'Верифицированные объявления в двух валютах с ИИ-оценкой цены — Тбилиси, Батуми, Кутаиси.',
    ctaButton: 'Верифицированные квартиры',
    crumbA: 'Курс валют', crumbB: '', siblingTitle: 'Другие направления',
  },
  de: {
    kicker: 'Mittelkurs — stündlich aktualisiert',
    h1: '',
    sub: (fx, f, t) => `1 ${f} = ${fxRate(fxConvert(1, f, t, fx.rates), 'de')} ${t} heute. Rechnen Sie jeden Betrag um und nutzen Sie die Tabellen für gängige Beträge.`,
    convTitle: 'Rechner',
    amount: 'Betrag', button: 'Umrechnen',
    rateWord: 'Kurs',
    guideTitle: 'Über dieses Währungspaar',
    guide: [
      'Dies ist der Mittelkurs (mid-market) — die echte Mitte des Weltmarkts, auf der auch die Kurse von Google und der NBG beruhen. Kommerzielle Banken und Wechselstuben schlagen 0,5–2 % Marge darauf.',
      'In der Immobilienwelt entscheidet der Kurs: Viele Wohnungen in Tiflis und Batumi werden in Dollar angeboten, während Hypothek und Registrierungsgebühren in Lari zahlen sind. Jedes sivrce-Inserat zeigt beide Währungen zum Live-Kurs.',
    ],
    faqTitle: 'Häufig gestellte Fragen',
    faqs: (fx, f, t) => [
      { q: `Wie ist der ${f}-zu-${t}-Kurs heute?`, a: `Heute kostet 1 ${f} ${fxRate(fxConvert(1, f, t, fx.rates), 'de')} ${t} (Mittelkurs, Stand ${fxUpdated(fx.updatedISO, 'de')}). Die konkreten Bankkurse weichen um 0,5–2 % Marge ab.` },
      { q: `Wie viel sind 100 ${f} in Lari?`, a: `100 ${f} sind heute ${fxFormat(fxConvert(100, f, 'GEL', fx.rates), 'GEL', 'de')}. Für andere Beträge nutzen Sie den Rechner oben.` },
      { q: 'Ist das der offizielle Kurs?', a: 'Es ist der Mittelkurs. Den offiziellen Tageskurs veröffentlicht die Nationalbank auf nbg.gov.ge; Banken schlagen ihre Marge darauf — erfragen Sie den konkreten Kurs bei Ihrer Bank.' },
      { q: 'Wie oft ändert sich der Kurs?', a: 'Der Devisenmarkt handelt 24/5. Diese Seite aktualisiert sich stündlich vom Weltmarkt.' },
    ],
    faqsNote: 'Kurse sind informativ und kein Angebot.',
    ctaTitle: 'Wohnung gesucht?',
    ctaSub: 'Verifizierte Inserate in zwei Währungen mit KI-Preisschätzung — Tiflis, Batumi, Kutaissi.',
    ctaButton: 'Verifizierte Wohnungen',
    crumbA: 'Wechselkurse', crumbB: '', siblingTitle: 'Andere Paare',
  },
  tr: {
    kicker: 'Orta piyasa kuru — saatlik güncellenir',
    h1: '',
    sub: (fx, f, t) => `Bugün 1 ${f} = ${fxRate(fxConvert(1, f, t, fx.rates), 'tr')} ${t}. Her tutarı çevirin, popüler tutarlar için hazır tabloları kullanın.`,
    convTitle: 'Çevirici',
    amount: 'Tutar', button: 'Çevir',
    rateWord: 'Kur',
    guideTitle: 'Bu parite hakkında',
    guide: [
      'Bu orta piyasa (mid-market) kurudur — uluslararası bankaların kullandığı ve Google ile NBG kurlarının dayandığı dünyanın gerçek ortası. Ticari bankalar ve döviz büroları bunun üzerine %0,5–2 marj ekler.',
      'Gayrimenkulde kur belirleyicidir: Tiflis ve Batumi\'deki birçok daire dolarla fiyatlanır; mortgage ve tapu harçları Lari ile ödenir. sivrce\'deki her ilan iki para birimini canlı kurla gösterir.',
    ],
    faqTitle: 'Sık sorulan sorular',
    faqs: (fx, f, t) => [
      { q: `Bugün ${f}/${t} kuru ne kadar?`, a: `Bugün 1 ${f} = ${fxRate(fxConvert(1, f, t, fx.rates), 'tr')} ${t} (orta piyasa kuru, ${fxUpdated(fx.updatedISO, 'tr')}). Bankaların gerçek kurları %0,5–2 marjla farklıdır.` },
      { q: `100 ${f} kaç Lari eder?`, a: `100 ${f} bugün ${fxFormat(fxConvert(100, f, 'GEL', fx.rates), 'GEL', 'tr')} eder. Diğer tutarlar için yukarıdaki çeviriciyi kullanın.` },
      { q: 'Bu resmî kur mu?', a: 'Orta piyasa kurudur. Resmî günlük kurü Gürcistan Merkez Bankası nbg.gov.ge\'de yayımlar; bankalar kendi marjını ekler — işlem öncesi kesin kuru teyit edin.' },
      { q: 'Kur ne sıklıkla değişir?', a: 'Döviz piyasası 24/5 çalışır. Bu sayfa dünya piyasasından saat başı güncellenir.' },
    ],
    faqsNote: 'Kurlar bilgilendirme amaçlıdır ve işlem teklifi değildir.',
    ctaTitle: 'Daire mi arıyorsunuz?',
    ctaSub: 'İki para birimli, AI fiyat tahminli doğrulanmış ilanlar — Tiflis, Batumi, Kutaisi.',
    ctaButton: 'Doğrulanmış daireler',
    crumbA: 'Döviz kurları', crumbB: '', siblingTitle: 'Diğer çiftler',
  },
}

const locOf = (lang: string): Loc => (COPY[lang as Loc] ? (lang as Loc) : 'en')

const LADDER = [1, 5, 10, 50, 100, 500, 1000, 5000, 10000] as const
const LADDER_REV = [1, 10, 100, 1000] as const

interface PageProps {
  params: Promise<{ lang: string; pair: string }>
  searchParams: Promise<Record<string, string | string[]>>
}

export async function generateMetadata({ params }: { params: PageProps['params'] }): Promise<Metadata> {
  const { lang: raw, pair } = await params
  if (!isValidLang(raw)) return {}
  const parsed = parsePairSlug(pair)
  if (!parsed) return {}
  const [f, t] = parsed
  const lang = raw
  const loc = locOf(lang)
  const fx = await getFx()
  const rate = fxRate(fxConvert(1, f, t, fx.rates), lang)
  const title =
    loc === 'ka' ? (TITLE_KA[pairSlug(f, t)] ?? `${f} → ${t} — კურსი დღეს და გადამყვანი`)
    : loc === 'ru' ? (TITLE_RU[pairSlug(f, t)] ?? `${f} → ${t} — курс на сегодня и конвертер`)
    : loc === 'de' ? `${f} in ${t} — Wechselkurs heute & Rechner`
    : loc === 'tr' ? `${f} / ${t} — bugünkü döviz kuru ve çevirici`
    : `${f} to ${t} — Exchange Rate Today & Converter`
  const desc =
    loc === 'ka' ? `1 ${f} = ${rate} ${t} დღეს. ${fxName(f, 'ka')}-ის ლაივ კურსი, გადამყვანი და მზა ცხრილები: 1, 10, 100, 1000 ${f} რამდენ ${t}-ია.`
    : loc === 'ru' ? `1 ${f} = ${rate} ${t} сегодня. Живой курс, конвертер и готовые таблицы: сколько будет 1, 10, 100, 1000 ${f} в ${t}.`
    : loc === 'de' ? `1 ${f} = ${rate} ${t} heute. Live-Kurs, Rechner und fertige Tabellen: 1, 10, 100, 1000 ${f} in ${t}.`
    : loc === 'tr' ? `Bugün 1 ${f} = ${rate} ${t}. Canlı kur, çevirici ve hazır tablolar: 1, 10, 100, 1000 ${f} kaç ${t} eder.`
    : `1 ${f} = ${rate} ${t} today. Live rate, instant converter and ready tables: how much is 1, 10, 100, 1000 ${f} in ${t}.`
  return pageMeta(`/valuta/${pairSlug(f, t)}`, lang, {
    ka: { title, description: desc },
    en: { title, description: desc },
  })
}

export default async function ValutaPairPage({ params, searchParams }: PageProps) {
  const { lang: raw, pair } = await params
  if (!isValidLang(raw)) notFound()
  const parsed = parsePairSlug(pair)
  if (!parsed) notFound()
  const [f, t] = parsed
  const slug = pairSlug(f, t)
  const lang = raw
  const loc = locOf(lang)
  const c = COPY[loc]
  const fx = await getFx()

  const sp = await searchParams
  const rawAmount = Array.isArray(sp.amount) ? sp.amount[0] : sp.amount
  const amountNum = Number(rawAmount)
  const amount = Number.isFinite(amountNum) && amountNum > 0 ? Math.min(amountNum, 1_000_000_000_000) : 100

  const h1 = loc === 'ka'
    ? (H1_KA[slug] ?? `${f} → ${t} კურსი დღეს`)
    : loc === 'en' ? `${f} to ${t} — Rate Today`
    : loc === 'ru' ? `${f} → ${t}: курс сегодня`
    : loc === 'de' ? `${f} in ${t} — Kurs heute`
    : `${f} / ${t} — Bugünkü Kur`

  const rateStr = fxRate(fxConvert(1, f, t, fx.rates), lang)
  const revStr = fxRate(fxConvert(1, t, f, fx.rates), lang)
  const faqs = c.faqs(fx, f, t)
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        name: h1,
        applicationCategory: 'FinanceApplication',
        operatingSystem: 'All',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        description: c.sub(fx, f, t),
        url: `https://sivrce.ge/valuta/${slug}`,
      },
      {
        '@type': 'FAQPage',
        inLanguage: lang,
        isPartOf: { '@id': 'https://sivrce.ge/#website' },
        mainEntity: faqs.map((q) => ({
          '@type': 'Question',
          name: q.q,
          acceptedAnswer: { '@type': 'Answer', text: q.a },
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'sivrce', item: 'https://sivrce.ge' },
          { '@type': 'ListItem', position: 2, name: c.crumbA, item: 'https://sivrce.ge/valuta' },
          { '@type': 'ListItem', position: 3, name: `${f}/${t}`, item: `https://sivrce.ge/valuta/${slug}` },
        ],
      },
    ],
  }

  // Only pairs that actually exist in FX_PAIRS — every chip must resolve to a real page.
  const siblings = FX_PAIRS.filter(([sf, st]) => (sf === f || st === f || sf === t || st === t) && !(sf === f && st === t))

  const inputCls = 'h-12 w-full rounded-module border border-sv-ink/10 bg-sv-surface px-4 text-[15px] font-bold text-sv-ink outline-none focus:border-sv-blue'
  const labelCls = 'mb-1.5 block text-[12px] font-black uppercase tracking-wide text-sv-ink/60'

  return (
    <div className="min-h-screen bg-sv-cloud">
      <Navbar />
      <main id="main">
        <PageHero tone="light" kicker={c.kicker} title={h1} subtitle={c.sub(fx, f, t)} />
        <AdSlot slot="valuta" lang={lang} />
        <div className="mx-auto max-w-[1100px] px-5 pb-20 md:px-10">

          {/* Hero rate + instant flip to the reverse pair */}
          <section className="rounded-card border border-sv-ink/[0.06] bg-sv-surface p-6 shadow-card md:p-10">
            <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
              <div>
                <div className="text-[13px] font-black uppercase tracking-wide text-sv-ink/50">1 {f} → 1 {t}</div>
                <div className="mt-1 text-[38px] font-black leading-none tracking-[-0.03em] text-sv-ink md:text-[52px]">
                  {rateStr} <span className="text-sv-blue">{t}</span>
                </div>
                <div className="mt-2 text-[14px] font-bold text-sv-ink/60">1 {t} = {revStr} {f}</div>
              </div>
              <LocalizedLink
                href={`/valuta/${pairSlug(t, f)}`}
                className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full border border-sv-ink/[0.08] bg-sv-cloud px-5 text-[14px] font-extrabold text-sv-ink transition-transform hover:-translate-y-0.5 hover:border-sv-blue/40 hover:text-sv-blue"
              >
                <ArrowRightLeft className="h-4 w-4 text-sv-blue" aria-hidden /> {t} → {f}
              </LocalizedLink>
            </div>
            <p className="mt-5 flex items-center gap-1.5 text-[12px] font-semibold text-sv-ink/50">
              <RefreshCw className="h-3 w-3" aria-hidden /> {fxUpdated(fx.updatedISO, lang)}
            </p>

            {/* Converter — GET form, works without JS */}
            <form method="GET" className="mt-6 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
              <div>
                <label className={labelCls} htmlFor="fx-amount">{c.amount} ({f} → {t})</label>
                <input id="fx-amount" name="amount" type="number" inputMode="decimal" min="0" max="1000000000000" step="any" defaultValue={amount} className={inputCls} />
              </div>
              <button type="submit" className="h-12 rounded-full bg-sv-blue px-7 text-[15px] font-extrabold text-white transition-transform hover:-translate-y-0.5">
                {c.button}
              </button>
            </form>
            <p className="mt-4 rounded-module bg-sv-cloud px-5 py-4 text-[17px] font-extrabold text-sv-ink md:text-[19px]" role="status">
              {fxWhole(amount, lang)} {f} = <span className="text-sv-blue">{fxFormat(fxConvert(amount, f, t, fx.rates), t, lang)}</span>
            </p>
          </section>

          {/* Ladders */}
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <section aria-label={`${c.rateWord} ${f} → ${t}`}>
              <h2 className="mb-4 text-[18px] font-black tracking-[-0.02em] text-sv-ink">{c.rateWord} {f} → {t}</h2>
              <div className="overflow-hidden rounded-tile border border-sv-ink/[0.06] bg-sv-surface shadow-card">
                <table className="w-full text-left text-[14px]">
                  <tbody className="divide-y divide-sv-ink/[0.05]">
                    {LADDER.map((n) => (
                      <tr key={n} className="text-sv-ink/80">
                        <td className="px-5 py-3 font-black text-sv-ink">{fxWhole(n, lang)} {f}</td>
                        <td className="px-5 py-3 text-right font-bold">{fxFormat(fxConvert(n, f, t, fx.rates), t, lang)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
            <section aria-label={`${c.rateWord} ${t} → ${f}`}>
              <h2 className="mb-4 text-[18px] font-black tracking-[-0.02em] text-sv-ink">{c.rateWord} {t} → {f}</h2>
              <div className="overflow-hidden rounded-tile border border-sv-ink/[0.06] bg-sv-surface shadow-card">
                <table className="w-full text-left text-[14px]">
                  <tbody className="divide-y divide-sv-ink/[0.05]">
                    {LADDER_REV.map((n) => (
                      <tr key={n} className="text-sv-ink/80">
                        <td className="px-5 py-3 font-black text-sv-ink">{fxWhole(n, lang)} {t}</td>
                        <td className="px-5 py-3 text-right font-bold">{fxFormat(fxConvert(n, t, f, fx.rates), f, lang)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* Guide */}
          <section className="mt-14 rounded-card border border-sv-ink/[0.06] bg-sv-surface p-6 shadow-card md:p-10">
            <h2 className="text-[22px] font-black tracking-[-0.02em] text-sv-ink md:text-[26px]">{c.guideTitle}</h2>
            <div className="mt-4 space-y-4 text-[15px] font-medium leading-[1.75] text-sv-ink/70">
              {c.guide.map((para) => (
                <p key={para.slice(0, 24)}>{para}</p>
              ))}
            </div>
          </section>

          {/* FAQ */}
          <section className="mt-10" aria-label={c.faqTitle}>
            <h2 className="mb-5 text-[22px] font-black tracking-[-0.02em] text-sv-ink md:text-[26px]">{c.faqTitle}</h2>
            <div className="grid gap-3">
              {faqs.map((q) => (
                <details key={q.q} className="group rounded-module border border-sv-ink/[0.06] bg-sv-surface px-5 py-4 shadow-card open:shadow-card-hover">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-extrabold text-sv-ink [&::-webkit-details-marker]:hidden">
                    {q.q}
                    <ChevronRight className="h-4 w-4 shrink-0 text-sv-blue transition-transform duration-300 group-open:rotate-90" aria-hidden />
                  </summary>
                  <p className="mt-3 text-[14px] font-medium leading-relaxed text-sv-ink/60">{q.a}</p>
                </details>
              ))}
            </div>
            <p className="mt-4 text-[12px] font-semibold leading-relaxed text-sv-ink/50">{c.faqsNote}</p>
          </section>

          {/* Sibling pairs */}
          {siblings.length > 0 && (
            <section className="mt-10" aria-label={c.siblingTitle}>
              <h2 className="mb-4 text-[18px] font-black tracking-[-0.02em] text-sv-ink">{c.siblingTitle}</h2>
              <div className="flex flex-wrap gap-2.5">
                {siblings.map(([sf, st]) => (
                  <LocalizedLink
                    key={pairSlug(sf, st)}
                    href={`/valuta/${pairSlug(sf, st)}`}
                    className="inline-flex h-11 items-center gap-2 rounded-full border border-sv-ink/[0.08] bg-sv-surface px-5 text-[14px] font-extrabold text-sv-ink shadow-card transition-transform hover:-translate-y-0.5 hover:border-sv-blue/40 hover:text-sv-blue"
                  >
                    {sf}<ArrowRightLeft className="h-3.5 w-3.5 text-sv-ink/30" aria-hidden />{st}
                    <span className="font-bold text-sv-ink/50">{fxRate(fxConvert(1, sf, st, fx.rates), lang)}</span>
                  </LocalizedLink>
                ))}
              </div>
            </section>
          )}

          <div className="mt-12 rounded-tile bg-sv-navy p-8 text-center md:p-10">
            <h2 className="flex items-center justify-center gap-2 text-[22px] font-black text-white md:text-[26px]">
              <Building2 className="h-5 w-5" aria-hidden /> {c.ctaTitle}
            </h2>
            <p className="mx-auto mt-2 max-w-[420px] text-[14px] font-medium text-white/60">{c.ctaSub}</p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <LocalizedLink
                href="/sale/apartments"
                className="inline-flex h-12 items-center rounded-full bg-sv-orange px-7 text-[15px] font-extrabold text-sv-ink shadow-glow-orange transition-transform hover:-translate-y-0.5"
              >
                {c.ctaButton}
              </LocalizedLink>
              <LocalizedLink
                href="/mortgage-calculator"
                className="inline-flex h-12 items-center rounded-full border border-white/20 px-7 text-[15px] font-extrabold text-white transition-transform hover:-translate-y-0.5"
              >
                {loc === 'ka' ? 'იპოთეკის კალკულატორი' : loc === 'ru' ? 'Ипотечный калькулятор' : loc === 'de' ? 'Hypothekenrechner' : loc === 'tr' ? 'Konut kredisi hesaplayıcı' : 'Mortgage calculator'}
              </LocalizedLink>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(ld) }} />
    </div>
  )
}
