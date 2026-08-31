import dynamic from 'next/dynamic'
import { BadgeCheck, ShieldCheck, Zap } from 'lucide-react'
import HeroBackground from './HeroBackground'
import { getBlocksForLang } from '@/lib/cms'
import type { Lang } from '@/lib/i18n/core'

/* Static hero shell — server component. LCP text (h1/subtitle) paints from the
   RSC payload. HeroSearch is a dynamic island so framer-motion stays off the
   FCP critical path. Visual atmosphere + entrances restored for brand presence. */

const HeroSearch = dynamic(() => import('./HeroSearch'), {
  // ponytail: glass shell matching the island — chips reserved so hydrate doesn't CLS
  loading: () => (
    <div className="mx-auto mt-11 w-full max-w-[760px]" aria-hidden>
      <div className="mx-auto h-12 w-[min(100%,420px)] rounded-full glass-hero" />
      <div className="mt-2.5 h-14 w-full rounded-full glass-hero" />
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <span className="h-9 w-16 rounded-full glass-hero" />
        <span className="h-9 w-[72px] rounded-full glass-hero" />
        <span className="h-9 w-24 rounded-full glass-hero" />
        <span className="h-9 w-20 rounded-full glass-hero" />
        <span className="h-9 w-28 rounded-full glass-hero" />
        <span className="h-9 w-[76px] rounded-full glass-hero" />
      </div>
    </div>
  ),
})

const TRUST = [
  { icon: BadgeCheck, key: 'home.hero.trust1' },
  { icon: ShieldCheck, key: 'home.hero.trust2' },
  { icon: Zap, key: 'home.hero.trust3' },
] as const

export default async function Hero({ lang = 'ka' }: { lang?: Lang }) {
  const b = await getBlocksForLang(lang)
  const badge = b['home.hero.badge']
  const titleA = b['home.hero.titleA']
  const titleAccent = b['home.hero.titleAccent']
  const subtitle = b['home.hero.subtitle']
  const trust = [b['home.hero.trust1'], b['home.hero.trust2'], b['home.hero.trust3']]
  return (
    <section className="relative min-h-[calc(100svh-var(--sv-dock))] overflow-x-hidden bg-sv-cloud dark:bg-sv-navy">
      <HeroBackground />

      <div className="relative z-10 mx-auto flex min-h-[calc(100svh-var(--sv-dock))] max-w-[1440px] flex-col items-center justify-center px-5 pb-24 pt-[calc(9rem+env(safe-area-inset-top,0px))] md:px-10">
        {/* LCP: badge/h1/subtitle paint instantly — motion only on trust + scroll hint */}
        <div className="mb-7 flex items-center gap-2.5 rounded-full glass-hero px-5 py-2 shadow-card">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sv-blue opacity-60 dark:bg-sv-success" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-sv-blue dark:bg-sv-success" />
          </span>
          <span className="text-[13px] font-bold tracking-wide text-sv-ink/80 dark:text-white/90 md:text-[14px]">
            {badge}
          </span>
        </div>

        <h1 className="w-full max-w-full text-balance text-center text-[clamp(2.25rem,7vw,5.25rem)] font-black leading-[1.06] tracking-[-0.038em] text-sv-ink dark:text-white">
          {titleA}{' '}
          <span className="text-gradient-blue text-gradient-shimmer">{titleAccent}</span>
        </h1>

        <p className="speakable-lead mt-6 w-full max-w-[640px] text-balance text-center text-[15px] font-medium leading-relaxed text-sv-ink/55 dark:text-white/70 sm:text-[16px] md:text-[19px]">
          {subtitle}
        </p>

        <HeroSearch />

        <div
          className="sv-hero-in mt-14 flex flex-wrap items-center justify-center gap-x-10 gap-y-4"
          style={{ animationDelay: '0.3s' }}
        >
          {TRUST.map((t, i) => (
            <div key={t.key} className="flex items-center gap-2.5 text-sv-ink/55 dark:text-white/70">
              <t.icon className="h-[18px] w-[18px] text-sv-blue dark:text-sv-success" />
              <span className="text-[13px] font-bold md:text-[14px]">{trust[i]}</span>
            </div>
          ))}
        </div>
      </div>

      <div
        className="sv-hero-in absolute bottom-[calc(1.5rem+var(--sv-dock))] left-1/2 z-10 -translate-x-1/2"
        style={{ animationDelay: '0.5s' }}
      >
        <div className="flex h-12 w-7 items-start justify-center rounded-full border-2 border-sv-ink/20 p-1.5 dark:border-white/25">
          <span className="animate-scroll-hint h-2 w-2 rounded-full bg-sv-ink/50 dark:bg-white/70" />
        </div>
      </div>
    </section>
  )
}
