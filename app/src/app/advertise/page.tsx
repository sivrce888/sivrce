import type { Metadata } from 'next'
import Link from 'next/link'
import { Check, Flame, Crown, Eye, TrendingUp, Star, Plus, type LucideIcon } from 'lucide-react'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import { Reveal } from '@/components/Reveal'
import { BRAND } from '@/lib/brand'

export const metadata: Metadata = {
  title: 'განათავსე განცხადება — sivrce',
  description: 'განათავსე განცხადება sivrce-ზე უფასოდ ან აირჩიე VIP პაკეტი — საშუალოდ 5× მეტი ნახვა, ძიების ტოპი და მთავარი გვერდის კარუსელი.',
  alternates: { canonical: '/advertise' },
}

interface Tier {
  name: string
  price: string
  period: string
  features: string[]
  badge?: { style: string; icon: LucideIcon; label: string }
  highlight?: boolean
}

const TIERS: Tier[] = [
  {
    name: 'უფასო',
    price: '0₾',
    period: '',
    features: [
      'სტანდარტული განთავსება',
      'აქტიურია 30 დღე',
      'ძიების შედეგებში გამოჩენა',
      'პირდაპირი შეტყობინებები მყიდველებთან',
    ],
  },
  {
    name: 'VIP',
    price: '19₾',
    period: '/თვე',
    badge: { style: BRAND.vipTiers.VIP.style, icon: Flame, label: 'VIP' },
    features: [
      'ყველაფერი უფასოდან',
      'VIP ბეიჯი განცხადებაზე',
      '2× მეტი ნახვა',
      'ძიებაში უპირატესი ადგილი',
    ],
  },
  {
    name: 'VIP+',
    price: '39₾',
    period: '/თვე',
    badge: { style: BRAND.vipTiers['VIP+'].style, icon: Flame, label: 'VIP+' },
    features: [
      'ყველაფერი VIP-დან',
      'VIP+ გრადიენტული ბეიჯი',
      '3× მეტი ნახვა',
      'მთავარი გვერდის კარუსელში',
      'კატეგორიის ტოპ განყოფილებაში',
    ],
  },
  {
    name: 'SUPER VIP',
    price: '69₾',
    period: '/თვე',
    badge: { style: BRAND.vipTiers['SUPER VIP'].style, icon: Crown, label: 'SUPER VIP' },
    highlight: true,
    features: [
      'ყველაფერი VIP+-დან',
      'SUPER VIP ბეიჯი გვირგვინით',
      '5× მეტი ნახვა საშუალოდ',
      'ძიების ტოპ პოზიცია',
      'მთავარი გვერდის პრიორიტეტული კარუსელი',
    ],
  },
]

const STATS = [
  { icon: Eye, value: '5×', label: 'მეტ ნახვას იღებს VIP განცხადება საშუალოდ' },
  { icon: TrendingUp, value: '3×', label: 'უფრო სწრაფად იყიდება VIP+ ობიექტი' },
  { icon: Star, value: '56,000+', label: 'აქტიური განცხადება პლატფორმაზე' },
]

const FAQ = [
  {
    q: 'შემიძლია თუ არა პაკეტის შეცვლა?',
    a: 'დიახ, ნებისმიერ დროს შეგიძლია უფასო განცხადება განაახლო VIP სტატუსამდე ან პაკეტი გადაამაღლო — ცვლილება მაშინვე აისახება.',
  },
  {
    q: 'როგორ ხდება გადახდა?',
    a: 'გადახდა ხდება ონლაინ, ნებისმიერი ბანკის ბარათით. პაკეტი აქტიურდება გადახდისთანავე და ძლებს ერთი თვის განმავლობაში.',
  },
  {
    q: 'რა მოხდება პაკეტის ვადის გასვლის შემდეგ?',
    a: 'განცხადება არ იშლება — ის ბრუნდება სტანდარტულ, უფასო რეჟიმში და რჩება ხილვადი ვადის ამოწურვამდე.',
  },
]

export default function AdvertisePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main id="main" className="pt-24 md:pt-28">
        {/* Hero */}
        <section className="mx-auto max-w-5xl px-6 py-14 text-center md:py-20">
          <Reveal>
            <h1 className="text-4xl font-black tracking-[-0.02em] text-sv-ink text-balance md:text-6xl">
              განათავსე განცხადება
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-[16px] font-medium text-sv-ink/60">
              დაიწყე უფასოდ — ან აირჩიე VIP პაკეტი და მიეცი შენს ობიექტს
              მაქსიმალური ხილვადობა საქართველოს ყველაზე სწრაფად მზარდ პლატფორმაზე.
            </p>
          </Reveal>
        </section>

        {/* Pricing */}
        <section className="mx-auto max-w-7xl px-6 pb-16">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {TIERS.map((tier, i) => (
              <Reveal key={tier.name} delay={i * 0.07}>
                <div
                  className={`relative flex h-full flex-col rounded-card p-7 transition hover:-translate-y-1.5 ${
                    tier.highlight
                      ? 'bg-sv-navy shadow-soft ring-1 ring-sv-orange/30'
                      : 'bg-white shadow-card ring-1 ring-sv-ink/5 hover:shadow-card-hover'
                  }`}
                >
                  {tier.highlight && (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-sv-orange px-4 py-1.5 text-xs font-bold text-white shadow-glow-orange">
                      ყველაზე პოპულარული
                    </span>
                  )}
                  {tier.badge && (
                    <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold ${tier.badge.style}`}>
                      <tier.badge.icon className="h-3.5 w-3.5" />
                      {tier.badge.label}
                    </span>
                  )}
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className={`text-4xl font-black tracking-[-0.02em] ${tier.highlight ? 'text-white' : 'text-sv-ink'}`}>
                      {tier.price}
                    </span>
                    {tier.period && (
                      <span className={`text-sm font-semibold ${tier.highlight ? 'text-white/60' : 'text-sv-ink/50'}`}>
                        {tier.period}
                      </span>
                    )}
                  </div>
                  <ul className="mt-6 flex-1 space-y-3">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5">
                        <Check className={`mt-0.5 h-4 w-4 shrink-0 ${tier.highlight ? 'text-sv-success' : 'text-sv-blue'}`} />
                        <span className={`text-[14px] font-medium ${tier.highlight ? 'text-white/75' : 'text-sv-ink/65'}`}>
                          {f}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/add-listing"
                    className={`mt-8 inline-flex items-center justify-center rounded-full px-6 py-3.5 text-sm font-bold transition hover:-translate-y-0.5 ${
                      tier.highlight
                        ? 'bg-sv-orange text-white shadow-glow-orange hover:shadow-glow-orange-lg'
                        : 'bg-sv-ink text-white shadow-glow-navy hover:bg-sv-navy'
                    }`}
                  >
                    განთავსება
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Stats strip */}
        <section className="bg-sv-cloud">
          <div className="mx-auto grid max-w-6xl gap-8 px-6 py-14 md:grid-cols-3">
            {STATS.map((s, i) => (
              <Reveal key={s.label} delay={i * 0.07}>
                <div className="flex items-center gap-4">
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-module bg-white shadow-card">
                    <s.icon className="h-6 w-6 text-sv-blue" />
                  </div>
                  <div>
                    <div className="text-2xl font-black tracking-[-0.02em] text-sv-blue">{s.value}</div>
                    <div className="text-sm font-semibold text-sv-ink/60">{s.label}</div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Mini FAQ */}
        <section className="mx-auto max-w-3xl px-6 py-16 md:py-20">
          <Reveal>
            <h2 className="text-center text-3xl font-black tracking-[-0.02em] text-sv-ink text-balance">
              კითხვები განთავსების შესახებ
            </h2>
          </Reveal>
          <div className="mt-10 space-y-4">
            {FAQ.map((item) => (
              <details
                key={item.q}
                className="group rounded-card bg-white shadow-card ring-1 ring-sv-ink/5 transition open:shadow-card-hover"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-6 text-[16px] font-bold text-sv-ink marker:hidden [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-control bg-sv-cloud text-sv-blue transition group-open:rotate-45">
                    <Plus className="h-4 w-4" aria-hidden />
                  </span>
                </summary>
                <p className="px-6 pb-6 text-[15px] font-medium leading-relaxed text-sv-ink/60">{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
