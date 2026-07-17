import type { Metadata } from 'next'
import Link from 'next/link'
import { ShieldCheck, Sparkles, Map as MapIcon, MessageCircle, ArrowRight } from 'lucide-react'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import { Reveal } from '@/components/Reveal'

export const metadata: Metadata = {
  title: 'ჩვენ შესახებ — sivrce',
  description: 'sivrce — საქართველოს თანამედროვე უძრავი ქონების პლატფორმა. ვერიფიკაცია, AI ფასის შეფასება და 3D რუკა ერთ სივრცეში.',
  alternates: { canonical: '/about' },
}

const VALUES = [
  {
    icon: ShieldCheck,
    title: 'ვერიფიკაცია',
    text: 'ყოველი აგენტი და განცხადება გადის შემოწმებას — ხედავ მხოლოდ რეალურ ობიექტებს, რეალური ფასებით.',
  },
  {
    icon: Sparkles,
    title: 'AI ფასის შეფასება',
    text: 'ხელოვნური ინტელექტი ადარებს ფასს ბაზრის ათასობით მაჩვენებელს და გაჩვენებს, რამდენად სამართლიანია ის.',
  },
  {
    icon: MapIcon,
    title: '3D რუკა',
    text: 'დაათვალიერე უბნები, ინფრასტრუქტურა და მზის მუხლი ინტერაქტიულ სამგანზომილებიან რუკაზე.',
  },
  {
    icon: MessageCircle,
    title: 'პირდაპირი კონტაქტი',
    text: 'საუბარი პირდაპირ მფლობელთან ან ვერიფიცირებულ აგენტთან — უამრავი შუამავლის გარეშე.',
  },
]

const STATS = [
  { value: '56,000+', label: 'განცხადება' },
  { value: '1,800+', label: 'ვერიფიცირებული აგენტი' },
  { value: '12', label: 'ქალაქი' },
  { value: '400,000+', label: 'მომხმარებელი თვეში' },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main id="main" className="pt-24 md:pt-28">
        {/* Hero */}
        <section className="relative overflow-hidden bg-sv-navy">
          <div className="absolute inset-0 bg-grid-dark" aria-hidden />
          <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-sv-blue/10 blur-[160px]" aria-hidden />
          <div className="absolute -bottom-24 right-1/5 h-80 w-80 rounded-full bg-sv-blue-light/10 blur-[160px]" aria-hidden />
          <div className="relative mx-auto max-w-5xl px-6 py-20 text-center md:py-28">
            <Reveal>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-sv-blue-light">მისია</p>
              <h1 className="mt-4 text-4xl font-black tracking-[-0.02em] text-white text-balance md:text-6xl">
                უძრავი ქონება <span className="text-sv-orange">ერთ სივრცეში</span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-[16px] font-medium leading-relaxed text-white/65">
                sivrce ბადებს ხიდს მყიდველსა და გამყიდველს შორის — გამჭვირვალე ფასებით,
                ვერიფიცირებული განცხადებებით და ტექნოლოგიით, რომელიც სახლის ძიებას
                მარტივ და სასიამოვნო გამოცდილებად აქცევს. ჩვენი მიზანია საქართველოში
                ყოველი უძრავი ქონების გარიგება იყოს სწრაფი, უსაფრთხო და სამართლიანი.
              </p>
            </Reveal>
          </div>
        </section>

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
                <div className="h-full rounded-card bg-white p-7 shadow-card ring-1 ring-sv-ink/5 transition hover:-translate-y-1.5 hover:shadow-card-hover">
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
                  ვეძებთ ადამიანებს, რომლებსაც სჯერათ, რომ საქართველოს იმსახურებს
                  მსოფლიო დონის უძრავი ქონების პლატფორმას.
                </p>
                <a
                  href="mailto:info@sivrce.ge"
                  className="mt-8 inline-flex items-center gap-2 rounded-full bg-sv-orange px-7 py-3.5 text-sm font-bold text-white shadow-glow-orange transition hover:-translate-y-0.5 hover:shadow-glow-orange-lg"
                >
                  info@sivrce.ge
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          </Reveal>
          <p className="mt-8 text-center text-sm font-medium text-sv-ink/50">
            გაქვს კითხვები? <Link href="/contact" className="font-bold text-sv-blue hover:text-sv-blue-deep">დაგვიკავშირდი</Link>
          </p>
        </section>
      </main>
      <Footer />
    </div>
  )
}
