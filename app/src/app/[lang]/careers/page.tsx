import type { Metadata } from 'next'
import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Inbox,
  MapPin,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import { PageHero } from '@/components/PageHero'
import { Reveal } from '@/components/Reveal'
import CareersApplyForm from '@/components/careers/CareersApplyForm'
import { jsonLd } from '@/lib/utils'
import { pageMeta } from '@/lib/i18n/server'
import { isValidLang } from '@/lib/i18n/core'

export const revalidate = 86400

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang: raw } = await params
  const lang = isValidLang(raw) ? raw : 'ka'
  return {
    ...pageMeta('/careers', lang, {
      ka: {
        title: 'კარიერა — გაყიდვების მენეჯერი',
        description:
          'გვჭირდება გაყიდვების მენეჯერები თბილისსა და ბათუმში. მოთხოვნები ვებგვერდიდან, თავისუფალი გრაფიკი.',
      },
      en: {
        title: 'Careers — Sales Manager',
        description:
          'We are hiring sales managers in Tbilisi and Batumi. Leads from the site, flexible schedule.',
      },
      ru: {
        title: 'Карьера — менеджер по продажам',
        description:
          'Ищем менеджеров по продажам в Тбилиси и Батуми. Лиды с сайта, свободный график.',
      },
    }),
    openGraph: {
      title: lang === 'en' ? 'Careers — Sales Manager' : lang === 'ru' ? 'Карьера — менеджер по продажам' : 'კარიერა — გაყიდვების მენეჯერი',
      description: lang === 'en' ? 'Sales managers in Tbilisi and Batumi.' : lang === 'ru' ? 'Менеджеры по продажам в Тбилиси и Батуми.' : 'გაყიდვების მენეჯერები თბილისსა და ბათუმში.',
      type: 'website',
    },
  }
}

type Copy = {
  hero: { kicker: string; titleA: string; titleB: string; titleC: string; subtitle: string; cta: string }
  cities: { city: string; note: string }[]
  whyTitle: string
  whySub: string
  benefits: { icon: LucideIcon; title: string; text: string }[]
  howTitle: string
  steps: { n: string; title: string; text: string }[]
  traitsTitle: string
  traits: string[]
  applyTitle: string
  applySub: string
  jobTitle: string
  jobDescription: string
}

const COPY: Record<string, Copy> = {
  ka: {
    hero: { kicker: 'კარიერა', titleA: 'მოდი ', titleB: 'გაყიდვების', titleC: ' გუნდში', subtitle: 'გვჭირდება კარგი გამყიდველები თბილისსა და ბათუმში.', cta: 'განაცხადი' },
    cities: [
      { city: 'თბილისი', note: 'ახალი და მეორადი ბინები' },
      { city: 'ბათუმი', note: 'ზღვა და ინვესტიცია' },
    ],
    whyTitle: 'რატომ აქ',
    whySub: 'უძრავი ქონება ერთ სივრცეში. შენი საქმეა კლიენტის დახმარება და გარიგების დახურვა.',
    benefits: [
      { icon: Inbox, title: 'კლიენტი მოდის შენთან', text: 'მოთხოვნები ვებგვერდიდან და აპიდან მოდის. ქუჩაში მყიდველს აღარ ეძებ.' },
      { icon: Wallet, title: 'შემოსავალი გაყიდვებიდან', text: 'კომისია დახურულ გარიგებაზე. რაც მეტს ყიდი, მით მეტს იღებ. პირობები ინტერვიუზე გეტყვიან.' },
      { icon: Clock3, title: 'შენი გრაფიკი', text: 'დროს თავად მართავ. მთავარია შედეგი.' },
      { icon: GraduationCap, title: 'დაგეხმარებით დასაწყისში', text: 'გაგაცნობთ პროდუქტს, სისტემას და როგორ ვმუშაობთ.' },
    ],
    howTitle: 'როგორ მუშაობს',
    steps: [
      { n: '1', title: 'მოთხოვნა მოდის', text: 'კლიენტი წერს ვებგვერდზე ან აპში — შენ იღებ.' },
      { n: '2', title: 'ესაუბრები', text: 'იგებ, რა აინტერესებს და რა ბიუჯეტი აქვს.' },
      { n: '3', title: 'ირჩევ ბინას', text: 'აჩვენებ შესაფერის ვარიანტებს sivrce-ზე.' },
      { n: '4', title: 'მიჰყავხარ ბოლომდე', text: 'ნახვიდან ხელშეკრულებამდე გვერდით ხარ.' },
      { n: '5', title: 'იღებ კომისიას', text: 'გარიგება დაიხურა — შენი წილი შენია.' },
    ],
    traitsTitle: 'რა გჭირდება',
    traits: [
      'კარგად ყიდი',
      'უმკლავდები წინააღმდეგობებს',
      'მიზანს აღწევ',
      'კლიენტს კარგად ეპყრობი',
      'ორგანიზებული და პასუხისმგებელი ხარ',
      'სწავლობ და იზრდები',
    ],
    applyTitle: 'მოგვწერე',
    applySub: 'შეავსე ფორმა და ატვირთე CV (PDF, DOC ან DOCX).',
    jobTitle: 'გაყიდვების მენეჯერი — უძრავი ქონება',
    jobDescription: 'გვჭირდება გაყიდვების მენეჯერები თბილისსა და ბათუმში.',
  },
  en: {
    hero: { kicker: 'Careers', titleA: 'Join our ', titleB: 'sales', titleC: ' team', subtitle: 'We’re hiring good salespeople in Tbilisi and Batumi.', cta: 'Apply' },
    cities: [
      { city: 'Tbilisi', note: 'New and resale apartments' },
      { city: 'Batumi', note: 'Sea and investment' },
    ],
    whyTitle: 'Why here',
    whySub: 'Real estate in one place. Your job is helping clients and closing deals.',
    benefits: [
      { icon: Inbox, title: 'Clients come to you', text: 'Requests arrive from the website and app. No more hunting for buyers on the street.' },
      { icon: Wallet, title: 'Income from sales', text: 'Commission on every closed deal. The more you sell, the more you earn. Terms shared at the interview.' },
      { icon: Clock3, title: 'Your schedule', text: 'You manage your own time. Results are what matter.' },
      { icon: GraduationCap, title: 'We help you start', text: 'We’ll walk you through the product, the system and how we work.' },
    ],
    howTitle: 'How it works',
    steps: [
      { n: '1', title: 'A request comes in', text: 'A client writes on the website or app — you pick it up.' },
      { n: '2', title: 'You talk', text: 'You learn what they care about and what their budget is.' },
      { n: '3', title: 'You pick the apartment', text: 'You show suitable options on sivrce.' },
      { n: '4', title: 'You see it through', text: 'From the first viewing to the contract, you’re by their side.' },
      { n: '5', title: 'You earn commission', text: 'Deal closed — your share is yours.' },
    ],
    traitsTitle: 'What you need',
    traits: [
      'You sell well',
      'You handle objections',
      'You reach your goals',
      'You treat clients well',
      'You’re organized and reliable',
      'You learn and grow',
    ],
    applyTitle: 'Write to us',
    applySub: 'Fill in the form and upload your CV (PDF, DOC or DOCX).',
    jobTitle: 'Sales Manager — Real Estate',
    jobDescription: 'We are hiring sales managers in Tbilisi and Batumi.',
  },
  ru: {
    hero: { kicker: 'Карьера', titleA: 'Вступай в ', titleB: 'команду продаж', titleC: '', subtitle: 'Ищем хороших продажников в Тбилиси и Батуми.', cta: 'Откликнуться' },
    cities: [
      { city: 'Тбилиси', note: 'Новостройки и вторичка' },
      { city: 'Батуми', note: 'Море и инвестиции' },
    ],
    whyTitle: 'Почему у нас',
    whySub: 'Недвижимость в одном месте. Твоя задача — помогать клиентам и закрывать сделки.',
    benefits: [
      { icon: Inbox, title: 'Клиенты приходят к тебе', text: 'Заявки приходят с сайта и из приложения. Больше не нужно искать покупателей на улице.' },
      { icon: Wallet, title: 'Доход с продаж', text: 'Комиссия с каждой закрытой сделки. Чем больше продаёшь, тем больше получаешь. Условия расскажем на интервью.' },
      { icon: Clock3, title: 'Свой график', text: 'Временем управляешь сам. Главное — результат.' },
      { icon: GraduationCap, title: 'Поможем на старте', text: 'Познакомим с продуктом, системой и тем, как мы работаем.' },
    ],
    howTitle: 'Как это работает',
    steps: [
      { n: '1', title: 'Приходит заявка', text: 'Клиент пишет на сайте или в приложении — ты её берёшь.' },
      { n: '2', title: 'Разговариваешь', text: 'Узнаёшь, что интересно и какой бюджет.' },
      { n: '3', title: 'Подбираешь квартиру', text: 'Показываешь подходящие варианты на sivrce.' },
      { n: '4', title: 'Ведёшь до конца', text: 'От просмотра до договора ты рядом.' },
      { n: '5', title: 'Получаешь комиссию', text: 'Сделка закрыта — твоя доля твоя.' },
    ],
    traitsTitle: 'Что нужно',
    traits: [
      'Ты хорошо продаёшь',
      'Работаешь с возражениями',
      'Достигаешь целей',
      'Хорошо обращаешься с клиентами',
      'Организован и ответственен',
      'Учишься и растёшь',
    ],
    applyTitle: 'Напиши нам',
    applySub: 'Заполни форму и загрузи CV (PDF, DOC или DOCX).',
    jobTitle: 'Менеджер по продажам — недвижимость',
    jobDescription: 'Ищем менеджеров по продажам в Тбилиси и Батуми.',
  },
}

export default async function CareersPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params
  const lang = isValidLang(raw) ? raw : 'ka'
  const c = COPY[lang] ?? COPY.ka
  const jobLd = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: c.jobTitle,
    description: c.jobDescription,
    datePosted: '2026-07-20',
    hiringOrganization: {
      '@type': 'Organization',
      name: 'sivrce',
      sameAs: 'https://sivrce.ge',
      logo: 'https://sivrce.ge/logo/lockup-ink.png',
      email: 'hi@sivrce.ge',
    },
    jobLocation: c.cities.map((city) => ({
      '@type': 'Place',
      address: { '@type': 'PostalAddress', addressLocality: city.city, addressCountry: 'GE' },
    })),
    employmentType: 'CONTRACTOR',
    directApply: true,
    url: 'https://sivrce.ge/careers',
  }
  return (
    <div className="min-h-screen bg-sv-cloud">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(jobLd) }} />
      <Navbar />
      <main id="main">
        <PageHero
          kicker={c.hero.kicker}
          title={
            <>
              {c.hero.titleA}
              <span className="text-gradient-blue">{c.hero.titleB}</span>
              {c.hero.titleC}
            </>
          }
          subtitle={c.hero.subtitle}
        >
          <a
            href="#apply"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-sv-orange px-7 py-3.5 text-sm font-black text-sv-ink shadow-glow-orange transition hover:-translate-y-0.5 hover:shadow-glow-orange-lg"
          >
            {c.hero.cta}
            <ArrowRight className="h-4 w-4" />
          </a>
        </PageHero>

        <section className="mx-auto max-w-4xl px-6 py-14 md:py-16">
          <div className="grid gap-4 sm:grid-cols-2">
            {c.cities.map((ci, i) => (
              <Reveal key={ci.city} delay={i * 0.06}>
                <div className="flex items-start gap-4 rounded-card bg-sv-surface p-6 shadow-card ring-1 ring-sv-ink/5">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-module bg-sv-blue/10">
                    <MapPin className="h-5 w-5 text-sv-blue" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black tracking-[-0.02em] text-sv-ink">{ci.city}</h2>
                    <p className="mt-1 text-[15px] font-medium text-sv-ink/60">{ci.note}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="bg-sv-surface">
          <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
            <Reveal>
              <h2 className="text-center text-3xl font-black tracking-[-0.02em] text-sv-ink text-balance md:text-4xl">
                {c.whyTitle}
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-center text-[15px] font-medium text-sv-ink/60">
                {c.whySub}
              </p>
            </Reveal>
            <div className="mt-12 grid gap-6 sm:grid-cols-2">
              {c.benefits.map((b, i) => (
                <Reveal key={b.title} delay={i * 0.07}>
                  <div className="h-full rounded-card bg-sv-cloud p-7 ring-1 ring-sv-ink/5 transition hover:-translate-y-1 hover:shadow-card">
                    <div className="grid h-12 w-12 place-items-center rounded-module bg-sv-surface shadow-card">
                      <b.icon className="h-6 w-6 text-sv-blue" />
                    </div>
                    <h3 className="mt-5 text-lg font-black tracking-[-0.02em] text-sv-ink">{b.title}</h3>
                    <p className="mt-2 text-[15px] font-medium leading-relaxed text-sv-ink/60">{b.text}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-6 py-16 md:py-20">
          <Reveal>
            <div className="flex items-center justify-center gap-3">
              <Briefcase className="h-6 w-6 text-sv-blue" />
              <h2 className="text-center text-3xl font-black tracking-[-0.02em] text-sv-ink text-balance">
                {c.howTitle}
              </h2>
            </div>
          </Reveal>
          <ol className="mt-12 space-y-4">
            {c.steps.map((s, i) => (
              <Reveal key={s.n} delay={i * 0.05}>
                <li className="flex gap-4 rounded-card bg-sv-surface p-5 shadow-card ring-1 ring-sv-ink/5 md:p-6">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-control bg-sv-navy text-sm font-black text-white">
                    {s.n}
                  </span>
                  <div>
                    <h3 className="text-[16px] font-black tracking-[-0.02em] text-sv-ink">{s.title}</h3>
                    <p className="mt-1 text-[15px] font-medium text-sv-ink/60">{s.text}</p>
                  </div>
                </li>
              </Reveal>
            ))}
          </ol>
        </section>

        <section className="bg-sv-navy">
          <div className="mx-auto max-w-4xl px-6 py-16 md:py-20">
            <Reveal>
              <h2 className="text-center text-3xl font-black tracking-[-0.02em] text-white text-balance">
                {c.traitsTitle}
              </h2>
            </Reveal>
            <ul className="mt-10 grid gap-3 sm:grid-cols-2">
              {c.traits.map((t, i) => (
                <Reveal key={t} delay={i * 0.04}>
                  <li className="flex items-start gap-3 rounded-module bg-white/[0.06] px-4 py-3.5 ring-1 ring-white/10">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-sv-success" />
                    <span className="text-[15px] font-semibold text-white/85">{t}</span>
                  </li>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>

        <section id="apply" className="mx-auto max-w-xl px-6 py-16 md:py-24">
          <Reveal>
            <h2 className="text-center text-3xl font-black tracking-[-0.02em] text-sv-ink text-balance">
              {c.applyTitle}
            </h2>
            <p className="mx-auto mt-3 max-w-md text-center text-[15px] font-medium text-sv-ink/60">
              {c.applySub}
            </p>
          </Reveal>
          <div className="mt-10">
            <Reveal delay={0.08}>
              <CareersApplyForm />
            </Reveal>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
