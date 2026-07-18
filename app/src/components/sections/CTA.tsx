import LocalizedLink from '@/components/LocalizedLink'
import { Plus, Search } from 'lucide-react'
import { Reveal } from '@/components/Reveal'
import { getCmsBlock } from '@/lib/cms'
import type { Lang } from '@/lib/i18n/core'

/* Closing CTA — server component; copy is CMS-overridable per language
   (/admin/content/pages → Homepage blocks). */

export default async function CTA({ lang = 'ka' }: { lang?: Lang }) {
  const [title, sub, primary, secondary, proofA, proofB, proofC] = await Promise.all([
    getCmsBlock('home.cta.title', lang),
    getCmsBlock('home.cta.sub', lang),
    getCmsBlock('home.cta.primary', lang),
    getCmsBlock('home.cta.secondary', lang),
    getCmsBlock('home.cta.proofA', lang),
    getCmsBlock('home.cta.proofB', lang),
    getCmsBlock('home.cta.proofC', lang),
  ])
  return (
    <section className="relative overflow-hidden bg-sv-navy py-20 md:py-28">
      <div className="absolute inset-0 bg-grid-dark" />
      <div className="absolute left-1/2 top-0 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-sv-blue/20 blur-[160px]" />
      <div className="absolute bottom-0 left-1/4 h-[280px] w-[380px] rounded-full bg-sv-violet/15 blur-[140px]" />

      <div className="relative mx-auto max-w-[900px] px-5 text-center md:px-10">
        <Reveal>
          <h2 className="text-balance text-[34px] font-black leading-[1.1] tracking-[-0.02em] text-white md:text-[56px]">
            {title}
            <span className="text-sv-orange">.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-[560px] text-balance text-[15px] font-medium leading-relaxed text-white/60 md:text-[18px]">
            {sub}
          </p>
        </Reveal>
        <Reveal delay={0.15}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <LocalizedLink
              href="/add-listing"
              className="group flex items-center gap-2.5 rounded-full bg-sv-orange px-8 py-4 text-[16px] font-extrabold text-white shadow-glow-orange transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow-orange-lg active:scale-[0.98]"
            >
              <Plus className="h-5 w-5 transition-transform duration-300 group-hover:rotate-90" />
              {primary}
            </LocalizedLink>
            <LocalizedLink
              href="/search"
              className="flex items-center gap-2.5 rounded-full glass px-8 py-4 text-[16px] font-extrabold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/15 active:scale-[0.98]"
            >
              <Search className="h-5 w-5" />
              {secondary}
            </LocalizedLink>
          </div>
        </Reveal>
        <Reveal delay={0.3}>
          <p className="mt-8 flex flex-wrap items-center justify-center text-[13px] font-bold text-white/60">
            {proofA}
            <span aria-hidden className="mx-1.5 inline-block h-1 w-1 rounded-full bg-white/30" />
            {proofB}
            <span aria-hidden className="mx-1.5 inline-block h-1 w-1 rounded-full bg-white/30" />
            {proofC}
          </p>
        </Reveal>
      </div>
    </section>
  )
}
