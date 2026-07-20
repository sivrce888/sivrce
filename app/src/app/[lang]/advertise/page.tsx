import type { Metadata } from 'next'
import { Eye, TrendingUp, Star, Plus, Building2, BadgeCheck, ArrowRight } from 'lucide-react'
import LocalizedLink from '@/components/LocalizedLink'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import { Reveal } from '@/components/Reveal'
import PromoPricingGrid from '@/components/payments/PromoPricingGrid'
import { langAlternates } from '@/lib/i18n/server'
import { formatGel, MONTHLY_RE_TETRI } from '@/lib/promo-pricing'

export const metadata: Metadata = {
  title: 'განათავსე განცხადება — sivrce',
  description: `უფასო განთავსება მესაკუთრეებისთვის, სააგენტოებისა და დეველოპერებისთვის. VIP დღეში ${formatGel(100)}-დან — იაფი ვიდრე SS და MyHome.`,
  alternates: { canonical: '/advertise', languages: langAlternates('/advertise') },
}

const PRO_STEPS = [
  { n: '1', t: 'დარეგისტრირდი', d: 'ტელეფონი ან Google — 30 წამი' },
  { n: '2', t: 'აირჩიე როლი', d: 'სააგენტო / აგენტი / დეველოპერი — Settings-ში' },
  { n: '3', t: 'გამოაქვეყნე', d: 'უფასო ან VIP+ · ლიდები შენს დაფაზე' },
]

const STATS = [
  { icon: Eye, value: 'VIP+', label: 'კარუსელი + პრიორიტეტი სიაში VIP-ზე წინ' },
  { icon: TrendingUp, value: '2.50₾', label: 'VIP+ დღეში · SS 3₾ / MyHome 4₾' },
  { icon: Star, value: formatGel(MONTHLY_RE_TETRI.vip), label: 'VIP 30 დღე · უძრავი ქონება' },
]

const FAQ = [
  {
    q: 'რატომ არის sivrce უფრო იაფი?',
    a: 'VIP+ და SUPER VIP დღიური ტარიფები SS.ge და MyHome-ზე დაბალია. VIP უძრავზე = SS (1₾/დღე), MyHome-ზე კი 2.50₾-ია. Livo და Korter საჯარო დღიურ ტარიფს არ აქვეყნებენ.',
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
    a: 'დარეგისტრირდი → Settings-ში აირჩიე როლი (სააგენტო / აგენტი / დეველოპერი) → დაამატე განცხადება. პროფილი გამოჩნდება /agents ან /developers დირექტორიაში.',
  },
]

export default function AdvertisePage() {
  return (
    <div className="min-h-screen bg-sv-cloud">
      <Navbar />
      <main id="main" className="pt-24 md:pt-28">
        <section className="mx-auto max-w-5xl px-6 py-14 text-center md:py-20">
          <Reveal>
            <h1 className="text-4xl font-black tracking-[-0.02em] text-sv-ink text-balance md:text-6xl">
              განათავსე განცხადება
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-[16px] font-medium text-sv-ink/60">
              უფასოდ დაიწყე — ან გააძლიერე VIP-ით. იგივე პრომო ლოგიკა, რაც ბაზარზეა,
              უფრო კარგ ფასად.
            </p>
          </Reveal>
        </section>

        {/* ponytail: BD funnel for agencies — footer already points here; page was VIP-only. */}
        <section className="mx-auto max-w-5xl px-6 pb-14">
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
                    Footer-ის „აგენტები / დეველოპერები“ აქ მოდის. როლი Settings-ში ირჩევა —
                    ცალკე განაცხადი არ გჭირდება.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <LocalizedLink
                    href="/auth/signup?callbackUrl=/settings"
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
      <Footer />
    </div>
  )
}
