import type { Metadata } from 'next'
import LocalizedLink from '@/components/LocalizedLink'
import { ChevronRight, TrendingUp, Building2 } from 'lucide-react'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import { PageHero } from '@/components/PageHero'
import { AdSlot } from '@/components/ads/AdSlot'
import { isValidLang } from '@/lib/i18n/core'
import MortgageCalcClient from '@/components/mortgage/MortgageCalcClient'
import { jsonLd } from '@/lib/utils'
import { pageMeta } from '@/lib/i18n/server'
import { dirLoc, type DirLoc } from '@/lib/directory-seo'

export const revalidate = 86400

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang: raw } = await params
  const lang = isValidLang(raw) ? raw : 'ka'
  return {
    ...pageMeta('/mortgage-calculator', lang, {
      ka: {
        title:
          'იპოთეკის კალკულატორი საქართველოში — ყოველთვიური გადახდა, პირველი შენატანი, პროცენტი',
        description:
          'უფასო იპოთეკის კალკულატორი საქართველოს ბაზრისთვის — გამოთვალეთ ყოველთვიური გადახდა ნებისმიერი ბინისთვის. 2026 წლის პროცენტები Bank of Georgia, TBC Bank, Credo, BasisBank. ვადა 15-25 წელი, პირველი შენატანი 15-30%.',
      },
      en: {
        title: 'Mortgage Calculator Georgia — Monthly Payment, Down Payment, Rates',
        description:
          'Free mortgage calculator for the Georgian market — monthly payment for any apartment. 2026 rates at Bank of Georgia, TBC, Credo, BasisBank. 15–25 year terms, 15–30% down.',
      },
      ru: {
        title: 'Ипотечный калькулятор Грузии — платёж, взнос, ставка',
        description:
          'Бесплатный ипотечный калькулятор для рынка Грузии — ежемесячный платёж для любой квартиры. Ставки 2026: Bank of Georgia, TBC, Credo, BasisBank. Срок 15–25 лет, взнос 15–30%.',
      },
    }),
    openGraph: {
      title: 'იპოთეკის კალკულატორი საქართველოში',
      description: 'გამოთვალეთ ყოველთვიური გადახდა და პროცენტი — 2026 წლის ბაზრის პირობებით.',
      url: 'https://sivrce.ge/mortgage-calculator',
      siteName: 'sivrce',
      locale: 'ka_GE',
      type: 'website',
    },
  }
}

type BankRow = { name: string; local: string; rate: string; term: string; note: string }

const COPY: Record<DirLoc, {
  kicker: string; title: string; subtitle: string
  bankSection: string; thBank: string; thRate: string; thTerm: string; thNote: string
  ratesNote: string; guideTitle: string; guide: string[]
  faqTitle: string; faqs: { q: string; a: string }[]
  ctaTitle: string; ctaSub: string; ctaButton: string
  crumbHome: string; crumbCalc: string; lang: string
  banks: BankRow[]
}> = {
  ka: {
    kicker: '2026 წლის ბაზრის პირობებით',
    title: 'იპოთეკის კალკულატორი საქართველოში',
    subtitle: 'გამოთვალეთ ყოველთვიური გადახდა, პროცენტის ჯამი და პირველი შენატანი ნებისმიერი ბინისთვის. კალკულატორი იყენებს სტანდარტულ ანუიტეტის ფორმულას — იგივეს, რასაც Bank of Georgia-ც და TBC-ც.',
    bankSection: 'ქართული ბანკების შედარება', thBank: 'ბანკი', thRate: 'წლიური პროცენტი', thTerm: 'ვადა', thNote: 'შენიშვნა',
    ratesNote: 'პროცენტები ასახავს 2026 წლის ბაზარს და შეიძლება შეიცვალოს. ზუსტი წინადადებისთვის დაუკავშირდით კონკრეტულ ბანკს.',
    guideTitle: 'როგორ მუშაობს იპოთეკა საქართველოში',
    guide: [
      'იპოთეკა საქართველოში ჩვეულებრივ გაიცემა ლარში (GEL) ან უცხოურ ვალუტაში (USD/EUR). ლარის პროცენტი მაღალია (8-13%), მაგრამ არ არის სავალუტო რისკი. უცხოური ვალუტის პროცენტი დაბალია (6-9%), მაგრამ გაცვლითი კურსის რყევა შეიძლება გაზარდოს თქვენი ყოველთვიური გადახდა.',
      'სტანდარტული მოთხოვნები: 21+ წლის ასაკი, ქართული შემოსავლის დადასტურება (ბოლო 3-6 თვის ამონაწერი), საკუთრების დაზღვევა. არარეზიდენტებისთვის ხშირად უფრო მოკლე ვადა და უფრო დიდი პირველი შენატანია.',
      'განაცხადის განხილვას სჭირდება 3-10 სამუშაო დღე. პრე-აპრუვალი (წინასწარი თანხმობა) TBC-სა და Bank of Georgia-ს ციფრულ აპში ხშირად რამდენიმე საათში გაიცემა. საბოლოო ხელშეკრულება იდება ქონების შერჩევის შემდეგ.',
    ],
    faqTitle: 'ხშირად დასმული კითხვები',
    faqs: [
      { q: 'რა არის მინიმალური პირველი შენატანი იპოთეკაზე საქართველოში?', a: 'რეზიდენტი მოქალაქეებისთვის მინიმალური პირველი შენატანი ჩვეულებრივ 10-20% იყო, თუმცა 2026 წლის ბაზარზე ბანკების უმრავლესობა ითხოვს 20-30%-ს. არარეზიდენტებისთვის მოთხოვნა ხშირად 30-50%-მდე იზრდება, რადგან ქართული შემოსავალი არ აქვთ.' },
      { q: 'რომელი ბანკი იძლევა საუკეთესო იპოთეკურ პირობებს 2026-ში?', a: 'ბაზარზე მოქმედი ძირითადი მოთამაშეებია Bank of Georgia, TBC Bank, Credo Bank და BasisBank. პროცენტი მერყეობს 8-13%-ის ფარგლებში ლარში და 6-9%-ის ფარგლებში უცხოურ ვალუტაში (მრავალწლიანი ვადით). კონკრეტული წინადადება დამოკიდებულია შემოსავალზე, კრედიტის ისტორიაზე და ქონების ტიპზე.' },
      { q: 'შემიძლია მივიღო იპოთეკა უცხოელმა საქართველოში?', a: 'დიახ, მაგრამ შეზღუდვებით. ქართული შემოსავლის გარეშე ბანკები ითხოვენ მსხვილ პირველ შენატანს (30-50%) და მოკლე ვადას (10-15 წელი). ზოგიერთი ბანკი მოითხოვს საქართველოში ადგილობრივ გარანტს ან კომპანიის რეგისტრაციას. სრული ფასის ქეშით გადახდა ყოველთვის შესაძლებელია და ყველაზე გავრცელებული გზაა უცხოელებისთვის.' },
      { q: 'რა დამატებითი ხარჯები მოსდევს ქონების ყიდვას?', a: 'ქონების გადაცემის გადასახადი შეადგენს შეფასებული ღირებულების პირველ 100,000 ლარზე 1%-ს, ზემოთ კი 2%-ს. ნოტარიული და რეესტრის გადასახადი ჩვეულებრივ 150-300 დოლარია. აგენტის საკომისიო მერყეობს 1-3%-ის ფარგლებში (ჩვეულებრივ გამყიდველი იხდის ან იყოფა). საჯარო რეესტრში საკუთრების რეგისტრაცია დასრულდება 1-4 სამუშაო დღეში.' },
      { q: 'რა ვადით მომგებიანია იპოთეკა?', a: 'მოკლე ვადით (10-15 წელი) გადასახადის ჯამი ორჯერ ნაკლებია, მაგრამ ყოველთვიური თანხა მაღალია. გრძელი ვადა (20-25 წელი) ამცირებს ყოველთვიურ დატვირთვას, მაგრამ საბოლოო ღირებულება იზრდება. ოქროს შუალედი ქართული ბინისთვის — 15-20 წელი.' },
    ],
    ctaTitle: 'ბინას ეძებთ?',
    ctaSub: 'ვერიფიცირებული განცხადებები AI ფასის შეფასებით — თბილისი, ბათუმი, ქუთაისი.',
    ctaButton: 'ვერიფიცირებული ბინები',
    crumbHome: 'მთავარი', crumbCalc: 'იპოთეკის კალკულატორი', lang: 'ka',
    banks: [
      { name: 'Bank of Georgia', local: 'საქართველოს ბანკი', rate: '8.9-12.5%', term: '5-25 წელი', note: 'ყველაზე დიდი პორტფელი; რეზიდენტებისთვის სწრაფი განხილვა' },
      { name: 'TBC Bank', local: 'ტი-ბი-სი ბანკი', rate: '9.2-13%', term: '5-25 წელი', note: 'ციფრული განაცხადი, ონლაინ პრე-აპრუვალი' },
      { name: 'Credo Bank', local: 'კრედო ბანკი', rate: '10-14%', term: '5-20 წელი', note: 'მიკრო და მცირე იპოთეკის სპეციალისტი' },
      { name: 'BasisBank', local: 'ბაზისბანკი', rate: '9.5-13%', term: '5-20 წელი', note: 'არარეზიდენტებისთვის მოქნილი პირობები' },
    ],
  },
  en: {
    kicker: 'Based on 2026 market conditions',
    title: 'Mortgage Calculator Georgia',
    subtitle: 'Work out the monthly payment, total interest and down payment for any apartment. The calculator uses the standard annuity formula — the same one Bank of Georgia and TBC use.',
    bankSection: 'Georgian banks compared', thBank: 'Bank', thRate: 'Annual rate', thTerm: 'Term', thNote: 'Notes',
    ratesNote: 'Rates reflect the 2026 market and can change. Contact the specific bank for an exact offer.',
    guideTitle: 'How mortgages work in Georgia',
    guide: [
      'Mortgages in Georgia are issued in GEL or a foreign currency (USD/EUR). GEL rates are higher (8–13%) with no currency risk. Foreign-currency rates are lower (6–9%), but exchange-rate swings can raise your monthly payment.',
      'Standard requirements: age 21+, proof of Georgian income (last 3–6 months of statements) and property insurance. Non-residents usually face shorter terms and larger down payments.',
      'Review takes 3–10 business days. Pre-approval in the TBC and Bank of Georgia apps is often issued within hours. The final contract is signed after the property is chosen.',
    ],
    faqTitle: 'Frequently asked questions',
    faqs: [
      { q: 'What is the minimum down payment on a mortgage in Georgia?', a: 'For residents the minimum down payment used to be 10–20%, but in the 2026 market most banks ask for 20–30%. For non-residents the requirement often rises to 30–50% because they have no Georgian income.' },
      { q: 'Which bank offers the best mortgage terms in 2026?', a: 'The main players are Bank of Georgia, TBC Bank, Credo Bank and BasisBank. Rates range from 8–13% in GEL and 6–9% in foreign currency (long terms). The exact offer depends on income, credit history and property type.' },
      { q: 'Can a foreigner get a mortgage in Georgia?', a: 'Yes, with limitations. Without Georgian income banks require a large down payment (30–50%) and a shorter term (10–15 years). Some banks require a local guarantor or a company registered in Georgia. Paying cash for the full price is always possible and is the most common route for foreigners.' },
      { q: 'What extra costs come with buying property?', a: 'The property transfer tax is 1% of the assessed value on the first 100,000 GEL and 2% above that. Notary and registration fees are usually $150–300. Agent commission ranges 1–3% (usually paid by the seller or split). Ownership registration at the Public Registry completes in 1–4 business days.' },
      { q: 'What term is most economical?', a: 'A short term (10–15 years) halves the total interest but raises the monthly payment. A long term (20–25 years) lowers the monthly burden but increases the final cost. The sweet spot for a Georgian apartment is 15–20 years.' },
    ],
    ctaTitle: 'Looking for an apartment?',
    ctaSub: 'Verified listings with AI price estimates — Tbilisi, Batumi, Kutaisi.',
    ctaButton: 'Verified apartments',
    crumbHome: 'Home', crumbCalc: 'Mortgage calculator', lang: 'en',
    banks: [
      { name: 'Bank of Georgia', local: 'Bank of Georgia', rate: '8.9-12.5%', term: '5–25 yrs', note: 'Largest portfolio; fast review for residents' },
      { name: 'TBC Bank', local: 'TBC Bank', rate: '9.2-13%', term: '5–25 yrs', note: 'Digital application, online pre-approval' },
      { name: 'Credo Bank', local: 'Credo Bank', rate: '10-14%', term: '5–20 yrs', note: 'Specialist in micro and small mortgages' },
      { name: 'BasisBank', local: 'BasisBank', rate: '9.5-13%', term: '5–20 yrs', note: 'Flexible terms for non-residents' },
    ],
  },
  ru: {
    kicker: 'По условиям рынка 2026 года',
    title: 'Ипотечный калькулятор Грузии',
    subtitle: 'Рассчитайте ежемесячный платёж, сумму процентов и первый взнос для любой квартиры. Калькулятор использует стандартную аннуитетную формулу — ту же, что и Bank of Georgia и TBC.',
    bankSection: 'Сравнение грузинских банков', thBank: 'Банк', thRate: 'Годовая ставка', thTerm: 'Срок', thNote: 'Примечание',
    ratesNote: 'Ставки отражают рынок 2026 года и могут меняться. Для точного предложения обратитесь в конкретный банк.',
    guideTitle: 'Как работает ипотека в Грузии',
    guide: [
      'Ипотека в Грузии выдаётся в лари (GEL) или в валюте (USD/EUR). Ставка в лари выше (8–13%), но без валютного риска. Валютная ставка ниже (6–9%), однако колебания курса могут увеличить ежемесячный платёж.',
      'Стандартные требования: возраст 21+, подтверждение дохода в Грузии (выписка за последние 3–6 месяцев), страхование собственности. Для нерезидентов часто короче срок и больше первый взнос.',
      'Рассмотрение заявки занимает 3–10 рабочих дней. Пре-аппруваль в приложениях TBC и Bank of Georgia часто приходит за несколько часов. Финальный договор подписывается после выбора недвижимости.',
    ],
    faqTitle: 'Частые вопросы',
    faqs: [
      { q: 'Какой минимальный первый взнос по ипотеке в Грузии?', a: 'Для резидентов минимальный взнос обычно был 10–20%, но на рынке 2026 года большинство банков требует 20–30%. Для нерезидентов требование часто вырастает до 30–50%, так как нет грузинского дохода.' },
      { q: 'Какой банк даёт лучшие ипотечные условия в 2026 году?', a: 'Основные игроки — Bank of Georgia, TBC Bank, Credo Bank и BasisBank. Ставки колеблются от 8–13% в лари и 6–9% в валюте (длинный срок). Конкретное предложение зависит от дохода, кредитной истории и типа недвижимости.' },
      { q: 'Может ли иностранец получить ипотеку в Грузии?', a: 'Да, с ограничениями. Без грузинского дохода банки требуют большой первый взнос (30–50%) и короткий срок (10–15 лет). Некоторые банки требуют местного поручителя или регистрацию компании в Грузии. Оплата полной цены наличными всегда возможна и является самым распространённым путём для иностранцев.' },
      { q: 'Какие дополнительные расходы при покупке недвижимости?', a: 'Налог на передачу собственности — 1% от оценочной стоимости на первые 100 000 лари и 2% свыше. Нотариальные и регистрационные сборы обычно $150–300. Комиссия агента — 1–3% (обычно платит продавец или делится). Регистрация собственности в Публичном реестре занимает 1–4 рабочих дня.' },
      { q: 'На какой срок выгоднее ипотека?', a: 'Короткий срок (10–15 лет) уменьшает сумму процентов вдвое, но платёж выше. Длинный срок (20–25 лет) снижает ежемесячную нагрузку, но увеличивает итоговую стоимость. Золотая середина для грузинской квартиры — 15–20 лет.' },
    ],
    ctaTitle: 'Ищете квартиру?',
    ctaSub: 'Верифицированные объявления с ИИ-оценкой цены — Тбилиси, Батуми, Кутаиси.',
    ctaButton: 'Верифицированные квартиры',
    crumbHome: 'Главная', crumbCalc: 'Ипотечный калькулятор', lang: 'ru',
    banks: [
      { name: 'Bank of Georgia', local: 'Банк Грузии', rate: '8.9-12.5%', term: '5–25 лет', note: 'Крупнейший портфель; быстрое рассмотрение для резидентов' },
      { name: 'TBC Bank', local: 'Ти-Би-Си Банк', rate: '9.2-13%', term: '5–25 лет', note: 'Цифровая заявка, онлайн пре-аппруваль' },
      { name: 'Credo Bank', local: 'Кредо Банк', rate: '10-14%', term: '5–20 лет', note: 'Специалист по микро- и малой ипотеке' },
      { name: 'BasisBank', local: 'БазисБанк', rate: '9.5-13%', term: '5–20 лет', note: 'Гибкие условия для нерезидентов' },
    ],
  },
}

function hubLdFor(loc: DirLoc) {
  const c = COPY[loc]
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'FAQPage',
        inLanguage: c.lang,
        isPartOf: { '@id': 'https://sivrce.ge/#website' },
        mainEntity: c.faqs.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: c.crumbHome, item: 'https://sivrce.ge' },
          { '@type': 'ListItem', position: 2, name: c.crumbCalc, item: 'https://sivrce.ge/mortgage-calculator' },
        ],
      },
    ],
  }
}

export default async function MortgageCalculatorPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang: raw } = await params
  const lang = isValidLang(raw) ? raw : 'ka'
  const loc = dirLoc(lang)
  const c = COPY[loc]
  return (
    <div className="min-h-screen bg-sv-cloud">
      <Navbar />
      <main id="main">
        <PageHero tone="light" kicker={c.kicker} title={c.title} subtitle={c.subtitle} />
        <AdSlot slot="mortgage" lang={lang} />
        <div className="mx-auto max-w-[1100px] px-5 pb-20 md:px-10">

        <MortgageCalcClient loc={loc} />

        {/* Bank comparison */}
        <section className="mt-14" aria-label={c.bankSection}>
          <h2 className="mb-5 flex items-center gap-2 text-[22px] font-black tracking-[-0.02em] text-sv-ink md:text-[26px]">
            <Building2 className="h-5 w-5 text-sv-blue" aria-hidden /> {c.bankSection}
          </h2>
          <div className="overflow-hidden rounded-tile border border-sv-ink/[0.06] bg-sv-surface shadow-card">
            <table className="w-full text-left text-[14px]">
              <thead className="bg-sv-ink/[0.02] text-[12px] font-black uppercase tracking-wide text-sv-ink/70">
                <tr>
                  <th className="px-5 py-4">{c.thBank}</th>
                  <th className="px-5 py-4">{c.thRate}</th>
                  <th className="px-5 py-4">{c.thTerm}</th>
                  <th className="hidden px-5 py-4 md:table-cell">{c.thNote}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sv-ink/[0.05]">
                {c.banks.map((b) => (
                  <tr key={b.name} className="text-sv-ink/80">
                    <td className="px-5 py-4">
                      <div className="font-black text-sv-ink">{b.name}</div>
                      <div className="text-[12px] font-bold text-sv-ink/60">{b.local}</div>
                    </td>
                    <td className="px-5 py-4 font-black text-sv-blue">{b.rate}</td>
                    <td className="px-5 py-4 font-bold">{b.term}</td>
                    <td className="hidden px-5 py-4 text-sv-ink/70 md:table-cell">{b.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[12px] font-semibold text-sv-ink/60">
            {c.ratesNote}
          </p>
        </section>

        {/* Guide */}
        <section className="mt-14 rounded-card border border-sv-ink/[0.06] bg-sv-surface p-6 shadow-card md:p-10">
          <h2 className="flex items-center gap-2 text-[22px] font-black tracking-[-0.02em] text-sv-ink md:text-[26px]">
            <TrendingUp className="h-5 w-5 text-sv-blue" aria-hidden /> {c.guideTitle}
          </h2>
          <div className="mt-4 space-y-4 text-[15px] font-medium leading-[1.75] text-sv-ink/70">
            {c.guide.map((para) => (
              <p key={para.slice(0, 24)}>{para}</p>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mt-10" aria-label={c.faqTitle}>
          <h2 className="mb-5 text-[22px] font-black tracking-[-0.02em] text-sv-ink md:text-[26px]">
            {c.faqTitle}
          </h2>
          <div className="grid gap-3">
            {c.faqs.map((f) => (
              <details
                key={f.q}
                className="group rounded-module border border-sv-ink/[0.06] bg-sv-surface px-5 py-4 shadow-card open:shadow-card-hover"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-extrabold text-sv-ink [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <ChevronRight className="h-4 w-4 shrink-0 text-sv-blue transition-transform duration-300 group-open:rotate-90" aria-hidden />
                </summary>
                <p className="mt-3 text-[14px] font-medium leading-relaxed text-sv-ink/60">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <div className="mt-12 rounded-tile bg-sv-navy p-8 text-center md:p-10">
          <h2 className="text-[22px] font-black text-white md:text-[26px]">{c.ctaTitle}</h2>
          <p className="mx-auto mt-2 max-w-[420px] text-[14px] font-medium text-white/60">
            {c.ctaSub}
          </p>
          <LocalizedLink
            href="/sale/apartments"
            className="mt-5 inline-flex h-12 items-center gap-2 rounded-full bg-sv-orange px-7 text-[15px] font-extrabold text-white shadow-glow-orange transition-transform hover:-translate-y-0.5"
          >
            {c.ctaButton}
          </LocalizedLink>
        </div>
        </div>
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(hubLdFor(loc)) }} />
    </div>
  )
}
