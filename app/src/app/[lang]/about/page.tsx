import type { ComponentType } from 'react'
import type { Metadata } from 'next'
import LocalizedLink from '@/components/LocalizedLink'
import { ShieldCheck, Map as MapIcon, MessageCircle, ArrowRight } from 'lucide-react'
import { SparkMark } from '@/components/SparkMark'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import { PageHero } from '@/components/PageHero'
import { Reveal } from '@/components/Reveal'
import { pageMeta } from '@/lib/i18n/server'
import { isValidLang } from '@/lib/i18n/core'
import { dirLoc, type DirLoc } from '@/lib/directory-seo'

export const revalidate = 86400

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang: raw } = await params
  const lang = isValidLang(raw) ? raw : 'ka'
  return pageMeta('/about', lang, {
    ka: {
      title: 'უძრავი ქონება საქართველოში — ჩვენ შესახებ',
      description:
        'სივრცე — უძრავი ქონება საქართველოში. ბინები დღიურად თბილისში, იყიდება და ქირავდება. მარტივი, სწრაფი, დაცული ძიება, 3D რუკა და AI ფასის შეფასება.',
    },
    en: {
      title: 'About sivrce — Real Estate in One Place',
      description:
        'sivrce — real estate in Georgia in one place. Daily rentals in Tbilisi, for sale and for rent. Simple, fast, safe search, 3D map and AI pricing.',
    },
    ru: {
      title: 'О sivrce — недвижимость в одном пространстве',
      description:
        'sivrce — недвижимость в Грузии в одном пространстве. Посуточно в Тбилиси, продажа и аренда. Простой, быстрый и безопасный поиск, 3D-карта и ИИ-оценка.',
    },
  })
}

const VALUES: Record<DirLoc, { icon: ComponentType<{ className?: string }>; title: string; text: string }[]> = {
  ka: [
    {
      icon: ShieldCheck,
      title: 'ვერიფიკაცია',
      text: 'ყოველი აგენტი და განცხადება გადის შემოწმებას — ხედავ მხოლოდ რეალურ ობიექტებს, რეალური ფასებით.',
    },
    {
      icon: SparkMark,
      title: 'AI ფასის შეფასება',
      text: 'ხელოვნური ინტელექტი ადარებს ფასს ბაზრის ათასობით მაჩვენებელს და გიჩვენებს, რამდენად სამართლიანია ის.',
    },
    {
      icon: MapIcon,
      title: '3D რუკა',
      text: 'დაათვალიერე უბნები, ინფრასტრუქტურა და მზის განათება ინტერაქტიულ სამგანზომილებიან რუკაზე.',
    },
    {
      icon: MessageCircle,
      title: 'პირდაპირი კონტაქტი',
      text: 'საუბარი პირდაპირ მფლობელთან ან ვერიფიცირებულ აგენტთან — შუამავლების გარეშე.',
    },
  ],
  en: [
    {
      icon: ShieldCheck,
      title: 'Verification',
      text: 'Every agent and listing is checked — you only see real properties at real prices.',
    },
    {
      icon: SparkMark,
      title: 'AI price estimate',
      text: 'Our AI compares each price against thousands of market signals and shows you how fair it is.',
    },
    {
      icon: MapIcon,
      title: '3D map',
      text: 'Explore neighborhoods, infrastructure and sunlight on an interactive 3D map.',
    },
    {
      icon: MessageCircle,
      title: 'Direct contact',
      text: 'Talk directly to the owner or a verified agent — no middlemen.',
    },
  ],
  ru: [
    {
      icon: ShieldCheck,
      title: 'Верификация',
      text: 'Каждый агент и объявление проходит проверку — вы видите только реальные объекты по реальным ценам.',
    },
    {
      icon: SparkMark,
      title: 'ИИ-оценка цены',
      text: 'ИИ сравнивает цену с тысячами рыночных показателей и показывает, насколько она справедлива.',
    },
    {
      icon: MapIcon,
      title: '3D-карта',
      text: 'Смотрите кварталы, инфраструктуру и солнечный свет на интерактивной 3D-карте.',
    },
    {
      icon: MessageCircle,
      title: 'Прямой контакт',
      text: 'Общайтесь напрямую с владельцем или верифицированным агентом — без посредников.',
    },
  ],
}

// ponytail: prior values (56,000+ listings / 1,800+ agents / 400k MAU) were
// unverifiable against the live catalog and carry YMYL manual-action risk in
// the real-estate vertical. These substitutes are defensible against the
// actual data: NEIGHBORHOODS, STREETS, BLOG_POSTS, CITIES registry.
const STATS: Record<DirLoc, { value: string; label: string }[]> = {
  ka: [
    { value: '17', label: 'უბნის გზამკვლევი' },
    { value: '3,900+', label: 'თბილისის ქუჩა კატალოგში' },
    { value: '3', label: 'ქალაქი სრული დაფარვით' },
    { value: '6', label: 'ქალაქი მზარდი ბაზით' },
  ],
  en: [
    { value: '17', label: 'neighborhood guides' },
    { value: '3,900+', label: 'Tbilisi streets in the catalog' },
    { value: '3', label: 'cities fully covered' },
    { value: '6', label: 'cities with a growing base' },
  ],
  ru: [
    { value: '17', label: 'гидов по кварталам' },
    { value: '3,900+', label: 'улиц Тбилиси в каталоге' },
    { value: '3', label: 'города с полным покрытием' },
    { value: '6', label: 'городов с растущей базой' },
  ],
}

const HERO: Record<DirLoc, { kicker: string; titleA: string; titleB: string; subtitle: string }> = {
  ka: {
    kicker: 'მისია',
    titleA: 'უძრავი ქონება', titleB: 'ერთ სივრცეში',
    subtitle: 'ყველაზე მარტივი, სწრაფი, დაცული და თანამედროვე პლატფორმა საქართველოში — sivrce აკავშირებს მყიდველს, დამქირავებელს, გამყიდველს, გამქირავებელს, აგენტსა და დეველოპერს გამჭვირვალე ფასებით, ვერიფიცირებული განცხადებებით და 3D რუკით.',
  },
  en: {
    kicker: 'Our mission',
    titleA: 'Real estate', titleB: 'in one place',
    subtitle: 'The simplest, fastest, safest and most modern platform in Georgia — sivrce connects buyers, renters, sellers, landlords, agents and developers with transparent prices, verified listings and a 3D map.',
  },
  ru: {
    kicker: 'Наша миссия',
    titleA: 'Недвижимость', titleB: 'в одном пространстве',
    subtitle: 'Самая простая, быстрая, безопасная и современная платформа в Грузии — sivrce соединяет покупателей, арендаторов, продавцов, арендодателей, агентов и застройщиков с прозрачными ценами, верифицированными объявлениями и 3D-картой.',
  },
}

const TAIL: Record<DirLoc, { why: string; jobs: string; jobsSub: string; vacancies: string; questions: string; contact: string }> = {
  ka: { why: 'რატომ sivrce', jobs: 'გვინდა ჩვენთან მუშაობა?', jobsSub: 'გვჭირდება გაყიდვების მენეჯერები თბილისსა და ბათუმში.', vacancies: 'ვაკანსიები', questions: 'გაქვს კითხვები?', contact: 'დაგვიკავშირდი' },
  en: { why: 'Why sivrce', jobs: 'Want to work with us?', jobsSub: 'We are hiring sales managers in Tbilisi and Batumi.', vacancies: 'Open positions', questions: 'Have questions?', contact: 'Contact us' },
  ru: { why: 'Почему sivrce', jobs: 'Хотите работать с нами?', jobsSub: 'Ищем менеджеров по продажам в Тбилиси и Батуми.', vacancies: 'Вакансии', questions: 'Есть вопросы?', contact: 'Напишите нам' },
}

export default async function AboutPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params
  const loc = dirLoc(isValidLang(raw) ? raw : 'ka')
  const hero = HERO[loc]
  const tail = TAIL[loc]
  return (
    <div className="min-h-screen bg-sv-cloud">
      <Navbar />
      <main id="main">
        <PageHero
          kicker={hero.kicker}
          title={
            <>
              {hero.titleA} <span className="text-gradient-blue">{hero.titleB}</span>
            </>
          }
          subtitle={hero.subtitle}
        />

        {/* Values */}
        <section className="mx-auto max-w-6xl px-6 py-16 md:py-24">
          <Reveal>
            <h2 className="text-center text-3xl font-black tracking-[-0.02em] text-sv-ink text-balance md:text-4xl">
              {tail.why}
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES[loc].map((v, i) => (
              <Reveal key={v.title} delay={i * 0.08}>
                <div className="h-full rounded-card bg-sv-surface p-7 shadow-card ring-1 ring-sv-ink/5 transition hover:-translate-y-1.5 hover:shadow-card-hover">
                  <div className="grid h-12 w-12 place-items-center rounded-module bg-sv-blue/10">
                    <v.icon className="h-6 w-6 text-sv-blue" />
                  </div>
                  <h3 className="mt-5 text-lg font-black tracking-[-0.02em] text-sv-ink">{v.title}</h3>
                  <p className="mt-2 text-[15px] font-medium leading-relaxed text-sv-ink/60">{v.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Stats strip */}
        <section className="bg-sv-cloud">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-6 py-14 lg:grid-cols-4">
            {STATS[loc].map((stat, i) => (
              <Reveal key={stat.label} delay={i * 0.06}>
                <div className="text-center">
                  <div className="text-3xl font-black tracking-[-0.02em] text-sv-blue md:text-4xl">{stat.value}</div>
                  <div className="mt-1 text-sm font-semibold text-sv-ink/60">{stat.label}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Careers teaser */}
        <section id="careers" className="mx-auto max-w-4xl px-6 py-16 md:py-24">
          <Reveal>
            <div className="rounded-card bg-sv-navy p-10 text-center shadow-soft md:p-14 relative overflow-hidden">
              <div className="absolute inset-0 bg-grid-dark" aria-hidden />
              <div className="relative">
                <h2 className="text-3xl font-black tracking-[-0.02em] text-white text-balance">
                  {tail.jobs}
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-[15px] font-medium text-white/65">
                  {tail.jobsSub}
                </p>
                <LocalizedLink
                  href="/careers"
                  className="mt-8 inline-flex items-center gap-2 rounded-full bg-sv-orange px-7 py-3.5 text-sm font-black text-sv-ink shadow-glow-orange transition hover:-translate-y-0.5 hover:shadow-glow-orange-lg"
                >
                  {tail.vacancies}
                  <ArrowRight className="h-4 w-4" />
                </LocalizedLink>
              </div>
            </div>
          </Reveal>
          <p className="mt-8 text-center text-sm font-medium text-sv-ink/65">
            {tail.questions} <LocalizedLink href="/contact" className="font-bold text-sv-blue hover:text-sv-blue-deep">{tail.contact}</LocalizedLink>
          </p>
        </section>
      </main>
      <Footer />
    </div>
  )
}
