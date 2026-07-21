import dynamic from 'next/dynamic'
import { BadgeCheck, ShieldCheck, Zap } from 'lucide-react'
import HeroBackground from './HeroBackground'
import { getCmsBlock } from '@/lib/cms'
import type { Lang } from '@/lib/i18n/core'

/* Static hero shell — server component. LCP text (h1/subtitle) paints from the
   RSC payload. HeroSearch is a dynamic island so framer-motion stays off the
   FCP critical path. */

const HeroSearch = dynamic(() => import('./HeroSearch'), {
  // ponytail: fixed-height shell — no CLS when the island hydrates
  loading: () => (
    <div
      className="mx-auto mt-11 h-[132px] w-full max-w-[1080px] rounded-[26px] bg-white/[0.08]"
      aria-hidden
    />
  ),
})

const TRUST = [
  { icon: BadgeCheck, key: 'home.hero.trust1' },
  { icon: ShieldCheck, key: 'home.hero.trust2' },
  { icon: Zap, key: 'home.hero.trust3' },
] as const

export default async function Hero({ lang = 'ka' }: { lang?: Lang }) {
  const [badge, titleA, titleAccent, subtitle, ...trust] = await Promise.all([
    getCmsBlock('home.hero.badge', lang),
    getCmsBlock('home.hero.titleA', lang),
    getCmsBlock('home.hero.titleAccent', lang),
    getCmsBlock('home.hero.subtitle', lang),
    getCmsBlock('home.hero.trust1', lang),
    getCmsBlock('home.hero.trust2', lang),
    getCmsBlock('home.hero.trust3', lang),
  ])
  // ponytail: fixed svh box — content/font reflow must not grow section (CLS)
  return (
    <section className="relative h-[100svh] max-h-[100svh] overflow-hidden bg-sv-navy">
      <HeroBackground />

      <div className="relative z-10 mx-auto flex h-full max-w-[1440px] flex-col items-center justify-center px-5 pb-24 pt-36 md:px-10">
        <div className="mb-7 flex items-center gap-2.5 rounded-full glass px-5 py-2.5">
          {/* ponytail: static dot — animate-ping competed with FCP on mobile LH */}
          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-sv-success" />
          <span className="text-[13px] font-bold tracking-wide text-white/90 md:text-[14px]">
            {badge}
          </span>
        </div>

        <h1 className="w-full max-w-full text-balance text-center text-[clamp(2.25rem,7vw,5.25rem)] font-black leading-[1.06] tracking-[-0.03em] text-white">
          {titleA} <span className="text-gradient-blue">{titleAccent}</span>
        </h1>

        <p className="mt-6 w-full max-w-[640px] text-balance text-center text-[15px] font-medium leading-relaxed text-white/70 sm:text-[16px] md:text-[19px]">
          {subtitle}
        </p>

        <HeroSearch />

        <div
          className="sv-hero-in mt-14 flex flex-wrap items-center justify-center gap-x-10 gap-y-4"
          style={{ animationDelay: '0.3s' }}
        >
          {TRUST.map((t, i) => (
            <div key={t.key} className="flex items-center gap-2.5 text-white/70">
              <t.icon className="h-[18px] w-[18px] text-sv-success" />
              <span className="text-[13px] font-bold md:text-[14px]">{trust[i]}</span>
            </div>
          ))}
        </div>
      </div>

      <div
        className="sv-hero-in absolute bottom-6 left-1/2 z-10 -translate-x-1/2"
        style={{ animationDelay: '0.5s' }}
      >
        <div className="flex h-12 w-7 items-start justify-center rounded-full border-2 border-white/25 p-1.5">
          <span className="animate-scroll-hint h-2 w-2 rounded-full bg-white/70" />
        </div>
      </div>
    </section>
  )
}
