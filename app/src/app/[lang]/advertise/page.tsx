import type { Metadata } from 'next'
import { Eye, TrendingUp, Star, Plus } from 'lucide-react'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import { Reveal } from '@/components/Reveal'
import PromoPricingGrid from '@/components/payments/PromoPricingGrid'
import { langAlternates } from '@/lib/i18n/server'
import { formatGel, MONTHLY_RE_TETRI } from '@/lib/promo-pricing'

export const metadata: Metadata = {
  title: 'განათავსე განცხადება — sivrce',
  description: `განათავსე უფასოდ ან აირჩიე VIP — დღეში ${formatGel(100)}-დან. VIP+ და SUPER VIP უფრო იაფია, ვიდრე SS და MyHome.`,
  alternates: { canonical: '/advertise', languages: langAlternates('/advertise') },
}

const STATS = [
  { icon: Eye, value: '5×', label: 'მეტ ნახვას იღებს SUPER VIP საშუალოდ' },
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
