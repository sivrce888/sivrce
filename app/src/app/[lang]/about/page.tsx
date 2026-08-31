import type { Metadata } from 'next'
import LocalizedLink from '@/components/LocalizedLink'
import { ShieldCheck, Map as MapIcon, MessageCircle, ArrowRight } from 'lucide-react'
import { SparkMark } from '@/components/SparkMark'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import { PageHero } from '@/components/PageHero'
import { Reveal } from '@/components/Reveal'
import { langAlternates } from '@/lib/i18n/server'

export const metadata: Metadata = {
  title: 'უძრავი ქონება საქართველოში — ჩვენ შესახებ | sivrce',
  description: 'სივრცე — უძრავი ქონება საქართველოში. ბინები დღიურად თბილისში, იყიდება და ქირავდება. მარტივი, სწრაფი, დაცული ძიება, 3D რუკა და AI ფასი.',
  alternates: { canonical: '/about', languages: langAlternates('/about') },
}

const VALUES = [
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
]

// ponytail: prior values (56,000+ listings / 1,800+ agents / 400k MAU) were
// unverifiable against the live catalog and carry YMYL manual-action risk in
// the real-estate vertical. These substitutes are defensible against the
// actual data: NEIGHBORHOODS, STREETS, BLOG_POSTS, CITIES registry.
const STATS = [
  { value: '17', label: 'უბნის გზამკვლევი' },
  { value: '3,900+', label: 'თბილისის ქუჩა კატალოგში' },
  { value: '3', label: 'ქალაქი სრული დაფარვით' },
  { value: '6', label: 'ქალაქი მზარდი ბაზით' },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-sv-cloud">
      <Navbar />
      <main id="main">
        <PageHero
          kicker="მისია"
          title={
            <>
              უძრავი ქონება <span className="text-gradient-blue">ერთ სივრცეში</span>
            </>
          }
          subtitle="ყველაზე მარტივი, სწრაფი, დაცული და თანამედროვე პლატფორმა საქართველოში — sivrce აკავშირებს მყიდველს, დამქირავებელს, გამყიდველს, გამქირავებელს, აგენტსა და დეველოპერს გამჭვირვალე ფასებით, ვერიფიცირებული განცხადებებით და 3D რუკით."
        />

        {/* Values */}
        <section className="mx-auto max-w-6xl px-6 py-16 md:py-24">
          <Reveal>
            <h2 className="text-center text-3xl font-black tracking-[-0.02em] text-sv-ink text-balance md:text-4xl">
              რატომ sivrce
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((v, i) => (
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
            {STATS.map((s, i) => (
              <Reveal key={s.label} delay={i * 0.06}>
                <div className="text-center">
                  <div className="text-3xl font-black tracking-[-0.02em] text-sv-blue md:text-4xl">{s.value}</div>
                  <div className="mt-1 text-sm font-semibold text-sv-ink/60">{s.label}</div>
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
                  გვინდა ჩვენთან მუშაობა?
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-[15px] font-medium text-white/65">
                  გვჭირდება გაყიდვების მენეჯერები თბილისსა და ბათუმში.
                </p>
                <LocalizedLink
                  href="/careers"
                  className="mt-8 inline-flex items-center gap-2 rounded-full bg-sv-orange px-7 py-3.5 text-sm font-black text-white shadow-glow-orange transition hover:-translate-y-0.5 hover:shadow-glow-orange-lg"
                >
                  ვაკანსიები
                  <ArrowRight className="h-4 w-4" />
                </LocalizedLink>
              </div>
            </div>
          </Reveal>
          <p className="mt-8 text-center text-sm font-medium text-sv-ink/65">
            გაქვს კითხვები? <LocalizedLink href="/contact" className="font-bold text-sv-blue hover:text-sv-blue-deep">დაგვიკავშირდი</LocalizedLink>
          </p>
        </section>
      </main>
      <Footer />
    </div>
  )
}
