import type { Metadata } from 'next'
import LocalizedLink from '@/components/LocalizedLink'
import { ChevronRight, TrendingUp, Scale } from 'lucide-react'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import { PageHero } from '@/components/PageHero'
import { isValidLang } from '@/lib/i18n/core'
import RentBuyCalcClient from '@/components/rent-buy/RentBuyCalcClient'
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
    ...pageMeta('/rent-vs-buy', lang, {
      ka: {
        title: 'ქირა თუ ყიდვა — კალკულატორი საქართველოში (2026)',
        description:
          'გამოთვალეთ, რა უფრო მომგებიანია თქვენს შემთხვევაში — ბინის ქირავნობა თუ ყიდვა იპოთეკით. სიმდიდრის შედარება ნებისმიერი ვადით: იპოთეკის პროცენტი, ფასების ზრდა, დანაზოგის შემოსავალი და ქირის ინფლაცია ერთ მოდელში.',
      },
      en: {
        title: 'Rent vs Buy Calculator Georgia (2026)',
        description:
          'Work out whether renting or buying wins in your case. Compare wealth after any horizon: mortgage rate, price growth, returns on savings and rent inflation in one deterministic model.',
      },
      ru: {
        title: 'Арендовать или купить — калькулятор для Грузии (2026)',
        description:
          'Рассчитайте, что выгоднее в вашем случае — аренда или покупка в ипотеку. Сравнение капитала на любом горизонте: ставка, рост цен, доходность сбережений и рост аренды в одной модели.',
      },
    }),
    openGraph: {
      title: 'ქირა თუ ყიდვა — კალკულატორი',
      description: 'შეადარეთ ქირავნობა და იპოთეკა რიცხვებით — 2026 წლის ბაზრის პირობებით.',
      url: 'https://sivrce.ge/rent-vs-buy',
      siteName: 'sivrce',
      locale: 'ka_GE',
      type: 'website',
    },
  }
}

const COPY: Record<DirLoc, {
  kicker: string; title: string; subtitle: string
  assumptionsNote: string
  guideTitle: string; guide: string[]
  faqTitle: string; faqs: { q: string; a: string }[]
  ctaTitle: string; ctaSub: string; ctaBuy: string; ctaRent: string
  crumbHome: string; crumbCalc: string; sibling: string; lang: string
}> = {
  ka: {
    kicker: 'გადაწყვეტილება რიცხვებით',
    title: 'ქირა თუ ყიდვა? კალკულატორი საქართველოში',
    subtitle: 'შეადარეთ ქირავნობა და იპოთეკა თქვენს სიტუაციაში — რამდენი სიმდიდრე გექნებოდათ რამდენიმე წლის შემდეგ, თუ იმავე თანხას ბინაში ან დანაზოგში ათავსებდით. მოდელი გამჭვირვალეა: ყველა დაშვებას თვითონ ცვლით.',
    assumptionsNote:
      'მოდელის ფიქსირებული დაშვებები: ქირის ზრდა 5% წელიწადში · ყიდვის ერთჯერადი ხარჯები 2.5% (გადასახადი, ნოტარიუსი, აგენტი) · გაყიდვის ხარჯები 2% · მომსახურება და გადასახადები 0.8% წელიწადში ფასის ოდენობით.',
    guideTitle: 'როგორ მუშაობს შედარება',
    guide: [
      'ორივე გზაზე თქვენი ფული მუშაობს: ყიდვისას — ბინის კაპიტალში (ფასი მინუს დარჩენილი სესხი), ქირისას — იმ თანხაში, რომელიც პირველ შენატანსა და ყიდვის ხარჯებს არ მიჰყვება და დეპოზიტზე ორგროსივდება. ვინც თვეში ნაკლებს ხდის, სხვაობასაც ზრდის — ასე შედარებულია ერთი და იმავე ბიუჯეტის ორი ბედი.',
      'საქართველოს სპეციფიკა: ფიზიკური პირებისთვის იპოთეკის პროცენტი გამოქვითვადი არ არის, ამიტომ მოდელი მას არ ხვდება. ლარის დეპოზიტები ისტორიულად 6-9%-ს იძლევა — ეს მნიშვნელოვანი კონკურენტია უძრავი ქონებისთვის: როცა ფასები ნელა იზრდება, დანაზოგი ბინას ასწრება.',
      'ზოგადად: რაც უფრო დიდხანს რჩებით, მით მეტი უპირატესობა აქვს ყიდვას — ერთჯერადი ხარჯები (გადასახადი, ნოტარიუსი, აგენტი) პირველ წლებში ქირას ასწრება ყიდვას. მოკლე ვადაზე (1-3 წელი) ქირა ხშირად იცხვრება, გრძელ ვადაზე (10+ წელი) ყიდვა ჩვეულებრივ იწინასწარმეტყველებს — მაგრამ შედეგი ყოველთვის თქვენს მიერ შეყვანილ რიცხვებზეა დამოკიდებული.',
    ],
    faqTitle: 'ხშირად დასმული კითხვები',
    faqs: [
      { q: 'რას ადარებს ეს კალკულატორი ზუსტად?', a: 'სიმდიდრეს ერთსა და იმავე მომენტში ორი გზის ბოლოს: ყიდვისას — ბინის მიმდინარე ღირებულება მინუს დარჩენილი სესხი და გაყიდვის ხარჯები, ქირისას — დანაზოგი, რომელიც პირველი შენატანის ეკვივალენტს და ყოველთვიურ სხვაობას დეპოზიტზე გროვდება. საცხოვრებელი ხარჯი ორივე შემთხვევაში გათვალისწინებულია.' },
      { q: 'როდის იმარჯვებს ქირა საქართველოში?', a: 'როცა ჰორიზონტი მოკლეა (1-3 წელი), ფასები ნელა იზრდება ან უმოძრაოა, დეპოზიტის პროცენტი მაღალია, ხოლო ქირა შედარებით იაფია იმავე ბინის ყოველთვიურ ხარჯთან. ასეთ პერიოდებში ერთჯერადი საყიდლო ხარჯები ვერ ამოირჩენს.' },
      { q: 'როდის იმარჯვებს ყიდვა?', a: 'როცა დიდხანს რჩებით ერთ ადგილას, ფასები სტაბილურად იზრდება და იპოთეკის პროცენტი გონივრულია. ყოველთვიური გადახდის ნაწილი კაპიტალიზაციას განიცდის (სესხის დაფარვა), ხოლო ინფლაცია ქირას ყოველწლიურად ზრდის — ეს ორი ეფექტი დროის ცვლაში ყიდვის სასარგებლოდ მუშაობს.' },
      { q: 'არის თუ არა ეს ფინანსური რჩევა?', a: 'არა. კალკულატორი დეტერმინირებულ მოდელს იყენებს თქვენ მიერ შეყვანილი დაშვებებით და მომავალს არ პროგნოზირებს. რეალური გადაწყვეტილებისთვის გაითვალისწინეთ შემოსავლის სტაბილურობა, ვალუტური რისკი (ლარის სესხის შემთხვევაში) და საბანკო პირობები.' },
    ],
    ctaTitle: 'გადაწყვიტეთ რიცხვებით',
    ctaSub: 'ვერიფიცირებული განცხადებები AI ფასის შეფასებით — შეადარეთ რეალური ბინები ქირასა და გასაყიდად.',
    ctaBuy: 'გასაყიდი ბინები', ctaRent: 'ქირავდება',
    crumbHome: 'მთავარი', crumbCalc: 'ქირა თუ ყიდვა',
    sibling: 'იპოთეკის კალკულატორი — ყოველთვიური გადახდა და ბანკების პირობები →', lang: 'ka',
  },
  en: {
    kicker: 'Decide with numbers',
    title: 'Rent vs Buy Calculator Georgia',
    subtitle: 'Compare renting and buying in your situation — how much wealth you would have after a given number of years if the same money went into an apartment or into savings. The model is transparent: you change every assumption.',
    assumptionsNote:
      'Fixed model assumptions: rent growth 5%/yr · one-off purchase costs 2.5% (transfer tax, notary, agent) · selling costs 2% · upkeep and taxes 0.8%/yr of price.',
    guideTitle: 'How the comparison works',
    guide: [
      'Your money works on both paths: when buying, it sits in home equity (value minus remaining loan); when renting, the down payment and purchase costs stay invested at deposit rates. Whoever pays less per month invests the difference — so the same budget is compared on two fate paths.',
      'Georgian specifics: individuals get no mortgage-interest deduction, so the model applies none. GEL deposits historically yield 6–9% — a real competitor to property: when prices rise slowly, savings outrun the apartment.',
      'In general: the longer you stay, the more buying gains — one-off purchase costs take years to recoup. On short horizons (1–3 years) renting is usually cheaper; on long horizons (10+ years) buying usually pulls ahead. But the outcome always follows the numbers you enter.',
    ],
    faqTitle: 'Frequently asked questions',
    faqs: [
      { q: 'What exactly does this calculator compare?', a: 'Wealth at the same future moment on two paths: buying — current home value minus remaining loan and selling costs; renting — savings where the down-payment equivalent and the monthly difference accumulate at deposit rates. Housing costs are counted on both sides.' },
      { q: 'When does renting win in Georgia?', a: 'When the horizon is short (1–3 years), prices rise slowly or stagnate, deposit rates are high and rent is cheap relative to the monthly cost of owning. In such periods the one-off purchase costs never get recouped.' },
      { q: 'When does buying win?', a: 'When you stay put for years, prices grow steadily and the mortgage rate is reasonable. Part of every monthly payment builds equity, while inflation keeps raising rent — two effects that work in buying\u2019s favor as time passes.' },
      { q: 'Is this financial advice?', a: 'No. The calculator runs a deterministic model on the assumptions you enter and forecasts nothing. For a real decision also weigh income stability, currency risk (on GEL loans) and specific bank terms.' },
    ],
    ctaTitle: 'Decide with numbers',
    ctaSub: 'Verified listings with AI price estimates — compare real homes for sale and for rent.',
    ctaBuy: 'Homes for sale', ctaRent: 'For rent',
    crumbHome: 'Home', crumbCalc: 'Rent vs buy',
    sibling: 'Mortgage calculator — monthly payment and bank terms →', lang: 'en',
  },
  ru: {
    kicker: 'Решайте по цифрам',
    title: 'Арендовать или купить? Калькулятор для Грузии',
    subtitle: 'Сравните аренду и ипотеку в вашей ситуации — сколько капитала будет через несколько лет, если те же деньги вложить в квартиру или в сбережения. Модель прозрачна: каждое допущение меняете вы.',
    assumptionsNote:
      'Фиксированные допущения модели: рост аренды 5% в год · разовые расходы покупки 2.5% (налог, нотариус, агент) · расходы продажи 2% · содержание и налоги 0.8% в год от цены.',
    guideTitle: 'Как работает сравнение',
    guide: [
      'Ваши деньги работают на обоих путях: при покупке — в капитале квартиры (цена минус остаток кредита), при аренде — сбережениями: первый взнос и расходы покупки остаются на депозите. Кто платит в месяц меньше, тот инвестирует разницу — так один и тот же бюджет сравнивается на двух траекториях.',
      'Специфика Грузии: физлица не получают вычета по ипотечным процентам, поэтому модель его не учитывает. Депозиты в лари исторически дают 6–9% — реальный конкурент недвижимости: когда цены растут медленно, сбережения обгоняют квартиру.',
      'В целом: чем дольше вы остаётесь, тем сильнее позиция покупки — разовые расходы (налог, нотариус, агент) окупаются годами. На коротком горизонте (1–3 года) аренда обычно дешевле, на длинном (10+ лет) покупка обычно выходит вперёд. Но результат всегда следует введённым вами числам.',
    ],
    faqTitle: 'Частые вопросы',
    faqs: [
      { q: 'Что именно сравнивает этот калькулятор?', a: 'Капитал в один и тот же будущий момент на двух путях: покупка — текущая стоимость квартиры минус остаток кредита и расходы продажи; аренда — сбережения, где накапливаются эквивалент первого взноса и ежемесячная разница под депозитный процент. Жилищные расходы учтены с обеих сторон.' },
      { q: 'Когда аренда выигрывает в Грузии?', a: 'Когда горизонт короткий (1–3 года), цены растут медленно или стоят, депозитные ставки высоки, а аренда дешева относительно ежемесячной стоимости владения. В такие периоды разовые расходы покупки не успевают окупиться.' },
      { q: 'Когда выигрывает покупка?', a: 'Когда вы годами живёте на одном месте, цены растут стабильно, а ставка по ипотеке разумная. Часть каждого платежа превращается в капитал, а инфляция постоянно повышает аренду — со временем оба эффекта работают на покупку.' },
      { q: 'Это финансовая консультация?', a: 'Нет. Калькулятор использует детерминированную модель с вашими допущениями и ничего не прогнозирует. Для реального решения учитывайте также стабильность дохода, валютный риск (по кредитам в лари) и условия конкретного банка.' },
    ],
    ctaTitle: 'Решайте по цифрам',
    ctaSub: 'Верифицированные объявления с ИИ-оценкой цены — сравните реальные квартиры на продажу и в аренду.',
    ctaBuy: 'Квартиры на продажу', ctaRent: 'В аренду',
    crumbHome: 'Главная', crumbCalc: 'Аренда или покупка',
    sibling: 'Ипотечный калькулятор — платёж и условия банков →', lang: 'ru',
  },
}

function hubLdFor(loc: DirLoc) {
  const c = COPY[loc]
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        name: c.title,
        applicationCategory: 'FinanceApplication',
        operatingSystem: 'All',
        browserRequirements: 'Requires JavaScript. Requires HTML5.',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
        description: c.subtitle,
        url: 'https://sivrce.ge/rent-vs-buy',
      },
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
          { '@type': 'ListItem', position: 2, name: c.crumbCalc, item: 'https://sivrce.ge/rent-vs-buy' },
        ],
      },
    ],
  }
}

export default async function RentVsBuyPage({
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
        <div className="mx-auto max-w-[1100px] px-5 pb-20 md:px-10">

        <RentBuyCalcClient loc={loc} />
        <p className="mt-3 text-[12px] font-semibold text-sv-ink/60">
          {c.assumptionsNote}
        </p>

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
          <div className="mt-5 flex flex-wrap items-center justify-center gap-4">
            <LocalizedLink
              href="/sale/apartments"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-sv-orange px-7 text-[15px] font-extrabold text-sv-ink shadow-glow-orange transition-transform hover:-translate-y-0.5"
            >
              {c.ctaBuy}
            </LocalizedLink>
            <LocalizedLink href="/lease/apartments" className="text-[14px] font-bold text-white/70 underline-offset-4 hover:text-white hover:underline">
              {c.ctaRent}
            </LocalizedLink>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-[14px] font-bold text-sv-ink/60">
          <Scale className="h-4 w-4 text-sv-blue" aria-hidden />
          <LocalizedLink href="/mortgage-calculator" className="underline-offset-4 hover:text-sv-blue hover:underline">
            {c.sibling}
          </LocalizedLink>
        </div>
        </div>
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(hubLdFor(loc)) }} />
    </div>
  )
}
