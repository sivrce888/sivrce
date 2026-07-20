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
} from 'lucide-react'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import { Reveal } from '@/components/Reveal'
import CareersApplyForm from '@/components/careers/CareersApplyForm'
import { jsonLd } from '@/lib/utils'
import { langAlternates } from '@/lib/i18n/server'

export const metadata: Metadata = {
  title: 'კარიერა — გაყიდვების მენეჯერი | sivrce',
  description: 'გვჭირდება გაყიდვების მენეჯერები თბილისსა და ბათუმში. მოთხოვნები საიტიდან, თავისუფალი გრაფიკი.',
  alternates: { canonical: '/careers', languages: langAlternates('/careers') },
  openGraph: {
    title: 'კარიერა — გაყიდვების მენეჯერი | sivrce',
    description: 'გაყიდვების მენეჯერები თბილისსა და ბათუმში.',
    type: 'website',
  },
}

const CITIES = [
  { city: 'თბილისი', note: 'ახალი და მეორადი ბინები' },
  { city: 'ბათუმი', note: 'ზღვა და ინვესტიცია' },
]

const BENEFITS = [
  {
    icon: Inbox,
    title: 'კლიენტი მოდის შენთან',
    text: 'მოთხოვნები საიტიდან და აპიდან მოდის. ქუჩაში მყიდველს აღარ ეძებ.',
  },
  {
    icon: Wallet,
    title: 'ფული გაყიდვაზე',
    text: 'კომისია დახურულ გარიგებაზე. რაც მეტს ყიდი, მით მეტს იღებ. პირობები ინტერვიუზე გეტყვი.',
  },
  {
    icon: Clock3,
    title: 'შენი გრაფიკი',
    text: 'დროს თავად მართავ. მთავარია შედეგი.',
  },
  {
    icon: GraduationCap,
    title: 'დაგეხმარებით დასაწყისში',
    text: 'გაგაცნობთ პროდუქტს, სისტემას და როგორ ვმუშაობთ.',
  },
]

const STEPS = [
  { n: '1', title: 'მოთხოვნა მოდის', text: 'კლიენტი წერს საიტზე ან აპში — შენ იღებ.' },
  { n: '2', title: 'ესაუბრები', text: 'იგებ რა უნდაინტერესებს და რა ბიუჯეტი აქვს.' },
  { n: '3', title: 'ირჩევ ბინას', text: 'აჩვენებ შესაფერის ვარიანტებს sivrce-ზე.' },
  { n: '4', title: 'მიჰყავხარ ბოლომდე', text: 'ნახვიდან ხელშეკრულებამდე გვერდით ხარ.' },
  { n: '5', title: 'იღებ კომისიას', text: 'გარიგება დაიხურა — შენი წილი შენია.' },
]

const TRAITS = [
  'კარგად ყიდი',
  'უმკლავდები წინააღმდეგობებს',
  'მიზანს აღწევ',
  'კლიენტს კარგად ეპყრობი',
  'ორგანიზებული და პასუხისმგებელი ხარ',
  'სწავლობ და იზრდები',
]

const jobLd = {
  '@context': 'https://schema.org',
  '@type': 'JobPosting',
  title: 'გაყიდვების მენეჯერი — უძრავი ქონება',
  description: 'გვჭირდება გაყიდვების მენეჯერები თბილისსა და ბათუმში.',
  datePosted: '2026-07-20',
  hiringOrganization: {
    '@type': 'Organization',
    name: 'sivrce',
    sameAs: 'https://sivrce.ge',
    logo: 'https://sivrce.ge/logo/lockup-ink.png',
    email: 'hi@sivrce.ge',
  },
  jobLocation: [
    {
      '@type': 'Place',
      address: { '@type': 'PostalAddress', addressLocality: 'თბილისი', addressCountry: 'GE' },
    },
    {
      '@type': 'Place',
      address: { '@type': 'PostalAddress', addressLocality: 'ბათუმი', addressCountry: 'GE' },
    },
  ],
  employmentType: 'CONTRACTOR',
  directApply: true,
  url: 'https://sivrce.ge/careers',
}

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-sv-cloud">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(jobLd) }} />
      <Navbar />
      <main id="main" className="pt-24 md:pt-28">
        <section className="relative overflow-hidden bg-sv-navy">
          <div className="absolute inset-0 bg-grid-dark" aria-hidden />
          <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-sv-blue/10 blur-[160px]" aria-hidden />
          <div className="absolute -bottom-24 right-1/5 h-80 w-80 rounded-full bg-sv-orange/10 blur-[160px]" aria-hidden />
          <div className="relative mx-auto max-w-5xl px-6 py-20 text-center md:py-28">
            <Reveal>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-sv-blue-light">კარიერა</p>
              <h1 className="mt-4 text-4xl font-black tracking-[-0.02em] text-white text-balance md:text-6xl">
                მოდი <span className="text-sv-orange">გაყიდვების</span> გუნდში
              </h1>
              <p className="mx-auto mt-6 max-w-xl text-[16px] font-medium leading-relaxed text-white/65">
                გვჭირდება კარგი სეილსები თბილისსა და ბათუმში.
              </p>
            </Reveal>
            <a
              href="#apply"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-sv-orange px-7 py-3.5 text-sm font-bold text-white shadow-glow-orange transition hover:-translate-y-0.5 hover:shadow-glow-orange-lg"
            >
              განაცხადი
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-6 py-14 md:py-16">
          <div className="grid gap-4 sm:grid-cols-2">
            {CITIES.map((c, i) => (
              <Reveal key={c.city} delay={i * 0.06}>
                <div className="flex items-start gap-4 rounded-card bg-sv-surface p-6 shadow-card ring-1 ring-sv-ink/5">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-module bg-sv-blue/10">
                    <MapPin className="h-5 w-5 text-sv-blue" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black tracking-[-0.02em] text-sv-ink">{c.city}</h2>
                    <p className="mt-1 text-[15px] font-medium text-sv-ink/60">{c.note}</p>
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
                რატომ აქ
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-center text-[15px] font-medium text-sv-ink/60">
                უძრავი ქონება ერთ სივრცეში. შენი საქმეა კლიენტის დახმარება და გარიგების დახურვა.
              </p>
            </Reveal>
            <div className="mt-12 grid gap-6 sm:grid-cols-2">
              {BENEFITS.map((b, i) => (
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
                როგორ მუშაობ
              </h2>
            </div>
          </Reveal>
          <ol className="mt-12 space-y-4">
            {STEPS.map((s, i) => (
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
                რა გჭირდება
              </h2>
            </Reveal>
            <ul className="mt-10 grid gap-3 sm:grid-cols-2">
              {TRAITS.map((t, i) => (
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
              მოგვწერე
            </h2>
            <p className="mx-auto mt-3 max-w-md text-center text-[15px] font-medium text-sv-ink/60">
              შეავსე ფორმა და ატვირთე CV (PDF, DOC ან DOCX).
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
