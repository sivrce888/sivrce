import type { Metadata } from 'next'
import LocalizedLink from '@/components/LocalizedLink'
import { ChevronRight, Calculator, TrendingUp, Building2 } from 'lucide-react'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import MortgageCalcClient from '@/components/mortgage/MortgageCalcClient'
import { jsonLd } from '@/lib/utils'
import { langAlternates } from '@/lib/i18n/server'

export const metadata: Metadata = {
  title: 'იპოთეკის კალკულატორი საქართველოში — ყოველთვიური გადასახადი, პირველი შენატრება, პროცენტი',
  description:
    'უფასო იპოთეკის კალკულატორი საქართველოს ბაზრისთვის — გამოთვალეთ ყოველთვიური გადასახადი ნებისმიერი ბინისთვის. 2026 წლის პროცენტები Bank of Georgia, TBC Bank, Credo, BasisBank. ვადა 15-25 წელი, პირველი შენატრება 15-30%.',
  alternates: { canonical: '/mortgage-calculator', languages: langAlternates('/mortgage-calculator') },
  openGraph: {
    title: 'იპოთეკის კალკულატორი საქართველოში',
    description: 'გამოთვალეთ ყოველთვიური გადასახადი და პროცენტი — 2026 წლის ბაზრის პირობებით.',
    url: 'https://sivrce.ge/mortgage-calculator',
    siteName: 'sivrce',
    locale: 'ka_GE',
    type: 'website',
  },
}

const faqs = [
  {
    q: 'რა არის მინიმალური პირველი შენატრება იპოთეკაზე საქართველოში?',
    a: 'რეზიდენტი მოქალაქეებისთვის მინიმალური პირველი შენატრება ჩვეულებრივ 10-20% იყო, თუმცა 2026 წლის ბაზარზე ბანკების უმრავლესობა ითხოვს 20-30%-ს. არა-რეზიდენტებისთვის მოთხოვნა ხშირად 30-50%-მდე იზრდება, რადგან ქართული შემოსავალი არ აქვთ.',
  },
  {
    q: 'რომელი ბანკი იძლევა საუკეთესო იპოთეკურ პირობებს 2026-ში?',
    a: 'ბაზარზე მოქმედი ძირითადი მოთამაშეებია Bank of Georgia, TBC Bank, Credo Bank და BasisBank. პროცენტი მერყეობს 8-13%-ის ფარგლებში ლარში და 6-9%-ის ფარგლებში უცხოურ ვალუტაში (მრავალწლიანი ვადით). კონკრეტული წინადადება დამოკიდებულია შემოსავალზე, კრედიტის ისტორიაზე და ქონების ტიპზე.',
  },
  {
    q: 'შემიძლია მივიღო იპოთეკა უცხოელმა საქართველოში?',
    a: 'დიახ, მაგრამ შეზღუდვებით. ქართული შემოსავლის გარეშე ბანკები ითხოვენ მსხვილ პირველ შენატრებას (30-50%) და მოკლე ვადას (10-15 წელი). ზოგიერთი ბანკი მოითხოვს საქართველოში ადგილობრივ გარანტს ან კომპანიის რეგისტრაციას. სრული ფასის ქეშით გადახდა ყოველთვის შესაძლებელია და ყველაზე გავრცელებული გზაა უცხოელებისთვის.',
  },
  {
    q: 'რა დამატებითი ხარჯები მოსდევს ქონების ყიდვას?',
    a: 'ქონების გადაცემის გადასახადი შეადგენს შეფასებული ღირებულების პირველ 100,000 ლარზე 1%-ს, ზემოთ კი 2%-ს. ნოტარიული და რეესტრის გადასახადი ჩვეულებრივ 150-300 დოლარია. აგენტის საკომისიო მერყეობს 1-3%-ის ფარგლებში (ჩვეულებრივ გამყიდველი იხდის ან იყოფა). საჯარო რეესტრში საკუთრების რეგისტრაცია დასრულდება 1-4 სამუშაო დღეში.',
  },
  {
    q: 'რა ვადით მომგებიანია იპოთეკა?',
    a: 'მოკლე ვადით (10-15 წელი) გადასახადის ჯამი ორჯერ ნაკლებია, მაგრამ ყოველთვიური თანხა მაღალია. გრძელი ვადა (20-25 წელი) ამცირებს ყოველთვიურ დატვირთვას, მაგრამ საბოლოო ღირებულება იზრდება. ოქროს შუალედი ქართული ბინისთვის — 15-20 წელი.',
  },
]

const banks = [
  { name: 'Bank of Georgia', ka: 'საქართველოს ბანკი', rate: '8.9-12.5%', term: '5-25 წელი', note: 'ყველაზე დიდი პორტფელი; რეზიდენტებისთვის სწრაფი განხილვა' },
  { name: 'TBC Bank', ka: 'ტი-ბი-სი ბანკი', rate: '9.2-13%', term: '5-25 წელი', note: 'ციფრული განაცხადი, ონლაინ პრე-აპრუვალი' },
  { name: 'Credo Bank', ka: 'კრედო ბანკი', rate: '10-14%', term: '5-20 წელი', note: 'მიკრო და მცირე იპოთეკის სპეციალისტი' },
  { name: 'BasisBank', ka: 'ბაზისბანკი', rate: '9.5-13%', term: '5-20 წელი', note: 'არა-რეზიდენტებისთვის მოქნილი პირობები' },
]

const hubLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'FAQPage',
      inLanguage: 'ka',
      isPartOf: { '@id': 'https://sivrce.ge/#website' },
      mainEntity: faqs.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'მთავარი', item: 'https://sivrce.ge' },
        { '@type': 'ListItem', position: 2, name: 'იპოთეკის კალკულატორი', item: 'https://sivrce.ge/mortgage-calculator' },
      ],
    },
  ],
}

export default function MortgageCalculatorPage() {
  return (
    <div className="min-h-screen bg-sv-cloud">
      <Navbar />
      <main id="main" className="mx-auto max-w-[1100px] px-5 pb-20 pt-24 md:px-10 md:pt-28">
        <nav aria-label="ბრედკრამბი" className="mb-6">
          <ol className="flex flex-wrap items-center gap-1.5 text-[13px] font-bold text-sv-ink/50">
            <li className="flex items-center gap-1.5">
              <LocalizedLink href="/" className="transition-colors hover:text-sv-blue">მთავარი</LocalizedLink>
              <ChevronRight className="h-3.5 w-3.5 text-sv-ink/30" aria-hidden />
            </li>
            <li aria-current="page" className="text-sv-ink/80">იპოთეკის კალკულატორი</li>
          </ol>
        </nav>

        <header className="mb-10">
          <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-sv-blue/10 px-4 py-1.5 text-[12px] font-black uppercase tracking-wider text-sv-blue">
            <Calculator className="h-3.5 w-3.5" aria-hidden /> 2026 წლის ბაზრის პირობებით
          </span>
          <h1 className="text-balance text-[30px] font-black tracking-[-0.02em] text-sv-ink md:text-[44px]">
            იპოთეკის კალკულატორი საქართველოში
          </h1>
          <p className="mt-3 max-w-[720px] text-[15px] font-semibold text-sv-ink/60 md:text-[16px]">
            გამოთვალეთ ყოველთვიური გადასახადი, პროცენტის ჯამი და პირველი შენატრება ნებისმიერი
            ბინისთვის. კალკულატორი იყენებს სტანდარტულ ანუიტეტის ფორმულას — იგივეს, რასაც Bank of
            Georgia-ც და TBC-ც.
          </p>
        </header>

        <MortgageCalcClient />

        {/* Bank comparison */}
        <section className="mt-14" aria-label="ბანკების შედარება">
          <h2 className="mb-5 flex items-center gap-2 text-[22px] font-black tracking-[-0.02em] text-sv-ink md:text-[26px]">
            <Building2 className="h-5 w-5 text-sv-blue" aria-hidden /> ქართული ბანკების შედარება
          </h2>
          <div className="overflow-hidden rounded-tile border border-sv-ink/[0.06] bg-sv-surface shadow-card">
            <table className="w-full text-left text-[14px]">
              <thead className="bg-sv-ink/[0.02] text-[12px] font-black uppercase tracking-wide text-sv-ink/55">
                <tr>
                  <th className="px-5 py-4">ბანკი</th>
                  <th className="px-5 py-4">წლიური პროცენტი</th>
                  <th className="px-5 py-4">ვადა</th>
                  <th className="hidden px-5 py-4 md:table-cell">შენიშვნა</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sv-ink/[0.05]">
                {banks.map((b) => (
                  <tr key={b.name} className="text-sv-ink/80">
                    <td className="px-5 py-4">
                      <div className="font-black text-sv-ink">{b.name}</div>
                      <div className="text-[12px] font-bold text-sv-ink/45">{b.ka}</div>
                    </td>
                    <td className="px-5 py-4 font-black text-sv-blue">{b.rate}</td>
                    <td className="px-5 py-4 font-bold">{b.term}</td>
                    <td className="hidden px-5 py-4 text-sv-ink/55 md:table-cell">{b.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[12px] font-semibold text-sv-ink/45">
            პროცენტები ამსახურებს 2026 წლის ბაზარს და შეიძლება შეიცვალოს. ზუსტი წინადადებისთვის
            დაუკავშირდით კონკრეტულ ბანკს.
          </p>
        </section>

        {/* Guide */}
        <section className="mt-14 rounded-card border border-sv-ink/[0.06] bg-sv-surface p-6 shadow-card md:p-10">
          <h2 className="flex items-center gap-2 text-[22px] font-black tracking-[-0.02em] text-sv-ink md:text-[26px]">
            <TrendingUp className="h-5 w-5 text-sv-blue" aria-hidden /> როგორ მუშაობს იპოთეკა საქართველოში
          </h2>
          <div className="mt-4 space-y-4 text-[15px] font-medium leading-[1.75] text-sv-ink/70">
            <p>
              იპოთეკა საქართველოში ჩვეულებრივ გაიცემა ლარში (GEL) ან უცხოურ ვალუტაში (USD/EUR).
              ლარის პროცენტი მაღალია (8-13%), მაგრამ არ არის სავალუტო რისკი. უცხოური ვალუტის
              პროცენტი დაბალია (6-9%), მაგრამ გაცვლითი კურსის რყევა შეიძლება გაზარდოს თქვენი
              ყოველთვიური გადასახადი.
            </p>
            <p>
              სტანდარტული მოთხოვნები: 21+ წლის ასაკი, ქართული შემოსავლის დადასტურება (ბოლო 3-6
              თვის ფულადი ნაკადი), საკუთრების დაზღვევა. არა-რეზიდენტებმა შეიძლება მოგცეთ უფრო
              მოკლე ვადა და მსხვილი პირველი შენატრება.
            </p>
            <p>
              განაცხადის განხილვა იკავს 3-10 სამუშაო დღე. პრე-აპრუვალი (წინასწარი თანხმობა)
              TBC-სა და Bank of Georgia-ს ციფრულ აპში ხშირად რამდენიმე საათში გაიცემა.
              საბოლოო ხელშეკრულება იდება ქონების შერჩევის შემდეგ.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="mt-10" aria-label="ხშირად დასმული კითხვები">
          <h2 className="mb-5 text-[22px] font-black tracking-[-0.02em] text-sv-ink md:text-[26px]">
            ხშირად დასმული კითხვები
          </h2>
          <div className="grid gap-3">
            {faqs.map((f) => (
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
          <h2 className="text-[22px] font-black text-white md:text-[26px]">ვეძებთ ბინას?</h2>
          <p className="mx-auto mt-2 max-w-[420px] text-[14px] font-medium text-white/60">
            ვერიფიცირებული განცხადებები AI ფასის შეფასებით — თბილისი, ბათუმი, ქუთაისი.
          </p>
          <LocalizedLink
            href="/sale/apartments"
            className="mt-5 inline-flex h-12 items-center gap-2 rounded-full bg-sv-orange px-7 text-[15px] font-extrabold text-white shadow-glow-orange transition-transform hover:-translate-y-0.5"
          >
            ვერიფიცირებული ბინები
          </LocalizedLink>
        </div>
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(hubLd) }} />
    </div>
  )
}
