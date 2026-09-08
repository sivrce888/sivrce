import { BadgeCheck, ShieldCheck, Zap } from 'lucide-react'
import HeroBackground from './HeroBackground'
import HeroSearchDeferred from './HeroSearchDeferred'
import { getBlocksForLang } from '@/lib/cms'
import { parseSeoSlug } from '@/lib/seo-pages'
import { QUICK, type HeroQuickChip } from '@/lib/hero-quick'
import type { Lang } from '@/lib/i18n/core'

/* Static hero shell — server component. LCP text (h1/subtitle) paints from the
   RSC payload. HeroSearch mounts deferred (idle/first interaction) so its
   framer-motion chunk stays off the load critical path. */

const TRUST = [
  { icon: BadgeCheck, key: 'home.hero.trust1' },
  { icon: ShieldCheck, key: 'home.hero.trust2' },
  { icon: Zap, key: 'home.hero.trust3' },
] as const

/** A seo landing lives only while inventory does — demote dead district chips to city level. */
function aliveQuickChips(): HeroQuickChip[] {
  const resolves = (p: string) => !!parseSeoSlug(p.split('/').filter(Boolean))
  return QUICK.map((chip) => {
    const out = { ...chip }
    for (const k of ['sale', 'rent', 'daily'] as const) {
      if (!resolves(out[k])) {
        const up = '/' + out[k].split('/').filter(Boolean).slice(0, -1).join('/')
        if (resolves(up)) out[k] = up
      }
    }
    return out
  })
}

export default async function Hero({ lang = 'ka' }: { lang?: Lang }) {
  const b = await getBlocksForLang(lang)
  const badge = b['home.hero.badge']
  const titleA = b['home.hero.titleA']
  const titleAccent = b['home.hero.titleAccent']
  const subtitle = b['home.hero.subtitle']
  const trust = [b['home.hero.trust1'], b['home.hero.trust2'], b['home.hero.trust3']]
  return (
    <section data-cms-section="hero" className="relative min-h-[calc(100svh-var(--sv-dock))] overflow-x-clip bg-sv-cloud dark:bg-sv-navy">
      <HeroBackground />

      <div className="relative z-10 mx-auto flex min-h-[calc(100svh-var(--sv-dock))] max-w-[1440px] flex-col items-center justify-center px-5 pb-24 pt-[calc(9rem+env(safe-area-inset-top,0px))] md:px-10">
        {/* LCP: badge/h1/subtitle paint instantly — motion only on trust + scroll hint */}
        <div className="flex flex-col items-center">
          <div className="mb-5 flex items-center gap-2.5 rounded-full glass-hero px-5 py-2 shadow-card">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sv-blue opacity-60 dark:bg-sv-success" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-sv-blue dark:bg-sv-success" />
            </span>
            <span data-cms-key="block.home.hero.badge" className="text-[13px] font-bold leading-snug tracking-wide text-sv-ink/80 dark:text-white/90 md:text-[14px]">
              {badge}
            </span>
          </div>

          <h1 className="w-full max-w-full text-balance text-center text-[length:var(--sv-type-display)] font-black tracking-[-0.035em] text-sv-ink dark:text-white">
            <span data-cms-key="block.home.hero.titleA" className="block">{titleA}</span>
            <span data-cms-key="block.home.hero.titleAccent" className="text-gradient-blue text-gradient-shimmer">{titleAccent}</span>
          </h1>

          <p data-cms-key="block.home.hero.subtitle" className="speakable-lead mt-4 w-full max-w-[min(56rem,100%)] text-pretty text-center text-[length:var(--sv-type-lead)] font-medium leading-[1.4] tracking-[-0.012em] text-sv-ink/60 dark:text-white/75 sm:mt-5">
            {subtitle}
          </p>
        </div>

        <HeroSearchDeferred quick={aliveQuickChips()} />

        <div
          className="sv-hero-in mt-12 flex flex-wrap items-center justify-center gap-x-10 gap-y-4"
          style={{ animationDelay: '0.3s' }}
        >
          {TRUST.map((t, i) => (
            <div key={t.key} className="flex items-center gap-2.5 text-sv-ink/60 dark:text-white/75">
              <t.icon className="h-[18px] w-[18px] text-sv-blue dark:text-sv-success" />
              <span data-cms-key={`block.${t.key}`} className="text-[13px] font-bold leading-snug md:text-[14px]">{trust[i]}</span>
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
