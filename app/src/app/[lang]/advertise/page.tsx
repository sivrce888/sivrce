import type { Metadata } from 'next'
import { Eye, TrendingUp, Star, Plus, Building2, BadgeCheck, ArrowRight, KeyRound, CalendarClock, Briefcase, Home, Megaphone, Zap, CircleDot, Palette, RefreshCw, Wrench } from 'lucide-react'
import LocalizedLink from '@/components/LocalizedLink'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import { PageHero } from '@/components/PageHero'
import { AdSlot } from '@/components/ads/AdSlot'
import { Reveal } from '@/components/Reveal'
import PromoPricingGrid from '@/components/payments/PromoPricingGrid'
import { langAlternates } from '@/lib/i18n/server'
import { isValidLang } from '@/lib/i18n/core'
import { roleSignupHref } from '@/lib/auth-roles'
import { formatGel, MONTHLY_RE_TETRI, ADDON_TETRI } from '@/lib/promo-pricing'
import { jsonLd } from '@/lib/utils'

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'განათავსე განცხადება — sivrce',
  description: `უფასო განთავსება მესაკუთრეებისთვის, სააგენტოებისა და დეველოპერებისთვის. VIP დღეში ${formatGel(100)}-დან.`,
  alternates: { canonical: '/advertise', languages: langAlternates('/advertise') },
}

const AUDIENCES = [
  { icon: Home, title: 'გამყიდველი', text: 'უფასო განთავსება · 3 წუთი · ლიდები დაფაზე', href: '/add-listing' },
  { icon: KeyRound, title: 'გამქირავებელი', text: 'ყოველთვიური ქირა — იგივე ანგარიში, იგივე VIP', href: '/add-listing' },
  { icon: CalendarClock, title: 'დღიური მასპინძელი', text: 'კოლექციები, თარიღები, უკონტაქტო ჩექინი', href: '/add-listing' },
  { icon: BadgeCheck, title: 'აგენტი', text: 'პროფილი /agents-ზე · ლიდები · ხელმისაწვდომი VIP', href: roleSignupHref('agent') },
  { icon: Building2, title: 'სააგენტო', text: 'გუნდი, ანალიტიკა, განცხადებები ერთ დაფაზე', href: roleSignupHref('agency') },
  { icon: Briefcase, title: 'დეველოპერი', text: 'პროექტები, ინვენტარი, 3D რუკა კორპუსზე', href: roleSignupHref('developer') },
  { icon: Wrench, title: 'სერვისის კომპანია', text: 'რემონტი, იურიდიული, ფოტო — სერვისი და განცხადება ერთ ანგარიშზე', href: '/add-service' },
] as const

const PRO_STEPS = [
  { n: '1', t: 'დარეგისტრირდი', d: 'ტელეფონი ან Google — 30 წამი' },
  { n: '2', t: 'აირჩიე როლი', d: 'აგენტი / სააგენტო / დეველოპერი — ერთი ეკრანი' },
  { n: '3', t: 'გამოაქვეყნე', d: 'უფასო ან VIP+ · ლიდები შენს დაფაზე' },
]

const ADDONS = [
  { icon: Zap, title: 'Turbo', text: 'SUPER VIP + ფერი + სასწრაფოდ', price: formatGel(ADDON_TETRI.turbo_7) + ' / 7დ' },
  { icon: CircleDot, title: 'სთორი', text: 'მთავარი გვერდის სთორი · 24სთ', price: formatGel(ADDON_TETRI.story) },
  { icon: Zap, title: 'სასწრაფოდ', text: 'ნარინჯისფერი ნიშანი · 24სთ', price: formatGel(ADDON_TETRI.sticker_urgent) },
  { icon: TrendingUp, title: 'ფასი დაწეულია', text: 'სიგნალი მყიდველისთვის · 7დ', price: formatGel(ADDON_TETRI.sticker_price_drop) },
  { icon: Palette, title: 'ფერი', text: 'ლურჯი ჩარჩო ძიებაში · 7დ', price: formatGel(ADDON_TETRI.color) },
  { icon: RefreshCw, title: 'განახლება', text: 'სიის თავში აყვანა', price: formatGel(ADDON_TETRI.refresh_once) },
] as const

const BRAND_PACKS = [
  { title: 'მთავარი გვერდი', text: 'Billboard ჰეროს ქვემოთ — დეველოპერი, ბანკი, ბრენდი' },
  { title: 'ძიება', text: 'Native ბარათი შედეგებში + ზედა ზოლი' },
  { title: 'განცხადება', text: 'Sidebar ქვემოთ აგენტის ბარათისა' },
  { title: 'დირექტორიები', text: 'აგენტები, დეველოპერები, პროექტები, უბნები' },
  { title: 'იპოთეკა', text: 'კალკულატორზე — ბანკის პროდუქტი' },
  { title: 'ბლოგი', text: 'სარედაქციო აუდიტორია, მაღალი intent' },
] as const

const STATS = [
  { icon: Eye, value: 'VIP+', label: 'კარუსელი + პრიორიტეტი სიაში VIP-ზე წინ' },
  { icon: TrendingUp, value: '2.50₾', label: 'VIP+ დღეში · უძრავი ქონება' },
  { icon: Star, value: formatGel(MONTHLY_RE_TETRI.vip), label: 'VIP 30 დღე · უძრავი ქონება' },
]

const FAQ = [
  {
    q: 'რატომ არის sivrce ხელმისაწვდომი?',
    a: 'VIP+ დღეში 2.50₾-დან, VIP უძრავზე 1₾/დღე, SUPER VIP — ტოპ პოზიცია. უფასო განთავსება ყველასთვის.',
  },
  {
    q: 'რომელი პაკეტი ავირჩიო?',
    a: 'უმეტესობისთვის VIP+ საკმარისია: კარუსელი + სიაში VIP-ზე წინ. SUPER VIP — როცა გინდა ტოპი ყველას თავზე და მთავარი სლაიდერი.',
  },
  {
    q: 'როგორ ხდება გადახდა?',
    a: 'ონლაინ ბარათით ან ბალანსიდან. სტატუსი აქტიურდება გადახდისთანავე არჩეული დღეების განმავლობაში.',
  },
  {
    q: 'რა მოხდება ვადის გასვლის შემდეგ?',
    a: 'განცხადება არ იშლება — ბრუნდება უფასო რეჟიმში და რჩება ხილვადი ვადის ამოწურვამდე.',
  },
  {
    q: 'სააგენტო ან დეველოპერი ვარ — სად დავიწყო?',
    a: 'დარეგისტრირდი → აირჩიე როლი → შეავსე პროფილი. გამოჩნდები /agents ან /developers დირექტორიაში.',
  },
  {
    q: 'სერვისის კომპანია ვარ — რემონტი, იურიდიული, ფოტო. სად დავდო?',
    a: 'დაამატე კომპანია /add-service-ზე. ქონების განცხადება იმავე ანგარიშით /add-listing-ზე — ორივე გამოჩნდება შენს პროფილზე.',
  },
]

export default async function AdvertisePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params
  const lang = isValidLang(raw) ? raw : 'ka'
  return (
    <div className="min-h-screen bg-sv-cloud">
      <Navbar />
      <main id="main">
        <PageHero
          kicker="განთავსება"
          title="განათავსე განცხადება"
          subtitle="უფასოდ დაიწყე — ან გააძლიერე VIP-ით. მესაკუთრე, გამქირავებელი, აგენტი, სააგენტო, დეველოპერი თუ სერვისის კომპანია — ერთი ანგარიში."
        />

        <section className="mx-auto max-w-6xl px-6 pb-6 pt-10">
          <Reveal>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {AUDIENCES.map((a) => (
                <LocalizedLink
                  key={a.title}
                  href={a.href}
                  className="group flex gap-4 rounded-card border border-sv-ink/[0.06] bg-sv-surface p-5 shadow-card transition-all duration-500 hover:-translate-y-1 hover:border-transparent hover:shadow-card-hover"
                >
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-module bg-sv-blue/10 text-sv-blue">
                    <a.icon className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-[16px] font-extrabold tracking-[-0.02em] text-sv-ink">
                      {a.title}
                    </span>
                    <span className="mt-1 block text-[13px] font-medium leading-relaxed text-sv-ink/60">
                      {a.text}
                    </span>
                  </span>
                </LocalizedLink>
              ))}
            </div>
          </Reveal>
        </section>

        {/* ponytail: BD funnel for agencies — footer already points here; page was VIP-only. */}
        <section className="mx-auto max-w-5xl px-6 pb-14 pt-10">
          <Reveal>
            <div className="overflow-hidden rounded-card border border-sv-ink/[0.06] bg-sv-navy p-6 text-white shadow-card md:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-xl">
                  <p className="inline-flex items-center gap-2 text-[12px] font-black uppercase tracking-wider text-sv-blue-light">
                    <Building2 className="h-3.5 w-3.5" /> სააგენტო · აგენტი · დეველოპერი
                  </p>
                  <h2 className="mt-2 text-[22px] font-black tracking-[-0.02em] md:text-[28px]">
                    პროფესიონალური ანგარიში — 3 ნაბიჯი
                  </h2>
                  <p className="mt-2 text-[14px] font-medium text-white/65">
                    Footer-ის „აგენტები / დეველოპერები“ აქ მოდის. როლი რეგისტრაციის
                    შემდეგ ირჩევა — ცალკე განაცხადი არ გჭირდება.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <LocalizedLink
                    href={roleSignupHref()}
                    className="inline-flex items-center gap-2 rounded-full bg-sv-orange px-5 py-3 text-[14px] font-extrabold text-white shadow-glow-orange transition hover:-translate-y-0.5"
                  >
                    რეგისტრაცია <ArrowRight className="h-4 w-4" />
                  </LocalizedLink>
                  <LocalizedLink
                    href="/add-listing"
                    className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-3 text-[14px] font-extrabold text-white transition hover:bg-white/15"
                  >
                    განცხადების დამატება
                  </LocalizedLink>
                </div>
              </div>
              <ol className="mt-6 grid gap-3 sm:grid-cols-3">
                {PRO_STEPS.map((s) => (
                  <li
                    key={s.n}
                    className="rounded-module border border-white/10 bg-white/[0.04] p-4"
                  >
                    <span className="inline-flex items-center gap-2 text-[13px] font-black text-sv-blue-light">
                      <BadgeCheck className="h-4 w-4" /> {s.n}. {s.t}
                    </span>
                    <p className="mt-1.5 text-[13px] font-medium text-white/55">{s.d}</p>
                  </li>
                ))}
              </ol>
            </div>
          </Reveal>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-16">
          <PromoPricingGrid />
        </section>

        <AdSlot slot="advertise" lang={lang} />

        <section className="mx-auto max-w-6xl px-6 pb-16">
          <Reveal>
            <p className="inline-flex items-center gap-2 text-[12px] font-black uppercase tracking-wider text-sv-blue">
              <Zap className="h-3.5 w-3.5" /> დანამატები
            </p>
            <h2 className="mt-2 text-[22px] font-black tracking-[-0.02em] text-sv-ink md:text-[28px]">
              ბუსტები გამოქვეყნების შემდეგ
            </h2>
            <p className="mt-2 max-w-xl text-[14px] font-medium text-sv-ink/55">
              VIP-ის გარდა — სთორი, სასწრაფოდ, ფერი, Turbo. ყიდულობ შენი განცხადებიდან.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {ADDONS.map((a) => (
                <div
                  key={a.title}
                  className="flex gap-3 rounded-card border border-sv-ink/[0.06] bg-sv-surface p-4 shadow-card"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-module bg-sv-blue/10 text-sv-blue">
                    <a.icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="text-[15px] font-extrabold text-sv-ink">{a.title}</span>
                      <span className="shrink-0 text-[13px] font-black text-sv-blue">{a.price}</span>
                    </span>
                    <span className="mt-0.5 block text-[13px] font-medium text-sv-ink/55">{a.text}</span>
                  </span>
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-16">
          <Reveal>
            <div className="overflow-hidden rounded-card bg-sv-navy p-6 text-white shadow-card md:p-10">
              <p className="inline-flex items-center gap-2 text-[12px] font-black uppercase tracking-wider text-sv-blue-light">
                <Megaphone className="h-3.5 w-3.5" /> ბრენდის განთავსება
              </p>
              <h2 className="mt-2 max-w-xl text-[22px] font-black tracking-[-0.02em] md:text-[28px]">
                ბანერები მთელ სივრცეზე
              </h2>
              <p className="mt-2 max-w-xl text-[14px] font-medium text-white/65">
                დეველოპერი, ბანკი, დაზღვევა, სააგენტო — ერთი კამპანია, აუდიტორიით (მყიდველი / გამყიდველი / აგენტი) და ენით.
                ადმინი აკონტროლებს ყოველ სლოტს.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {BRAND_PACKS.map((p) => (
                  <div key={p.title} className="rounded-module border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-[14px] font-black">{p.title}</p>
                    <p className="mt-1 text-[13px] font-medium text-white/55">{p.text}</p>
                  </div>
                ))}
              </div>
              <LocalizedLink
                href="/contact"
                className="mt-7 inline-flex items-center gap-2 rounded-full bg-sv-orange px-5 py-3 text-[14px] font-extrabold text-white shadow-glow-orange transition hover:-translate-y-0.5"
              >
                დაგვიკავშირდი ბანერისთვის <ArrowRight className="h-4 w-4" />
              </LocalizedLink>
            </div>
          </Reveal>
        </section>

        <section className="bg-sv-surface">
          <div className="mx-auto grid max-w-6xl gap-8 px-6 py-14 md:grid-cols-3">
            {STATS.map((s, i) => (
              <Reveal key={s.label} delay={i * 0.07}>
                <div className="flex items-center gap-4">
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-module bg-sv-cloud shadow-card">
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
                className="group rounded-card bg-sv-surface shadow-card ring-1 ring-sv-ink/5 transition open:shadow-card-hover"
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: FAQ.map((item) => ({
              '@type': 'Question',
              name: item.q,
              acceptedAnswer: {
                '@type': 'Answer',
                text: item.a,
              },
            })),
          }),
        }}
      />
      <Footer />
    </div>
  )
}
