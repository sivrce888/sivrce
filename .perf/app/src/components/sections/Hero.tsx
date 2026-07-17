import { BadgeCheck, ShieldCheck, Zap } from 'lucide-react'
import HeroBackground from './HeroBackground'
import HeroSearch from './HeroSearch'

/* Static hero shell — server component. LCP text (h1/subtitle) paints from the
   RSC payload, never gated on or re-painted by client hydration. Interactive
   search panel lives in the HeroSearch island (the only framer-motion user). */

const TRUST = [
  { icon: BadgeCheck, label: 'ვერიფიცირებული განცხადებები' },
  { icon: ShieldCheck, label: 'უსაფრთხო გარიგებები' },
  { icon: Zap, label: 'AI ფასის შეფასება' },
]

export default function Hero() {
  return (
    <section className="relative min-h-[100svh] overflow-hidden bg-sv-navy">
      {/* Animated brand background */}
      <HeroBackground />

      {/* Content */}
      <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-[1440px] flex-col items-center justify-center px-5 pb-24 pt-36 md:px-10">
        {/* LCP content paints instantly — no entrance animation on badge/h1/subtitle
            (opacity-0 start cost ~1.2s mobile LCP). Animation kept on trust row only. */}
        <div className="mb-7 flex items-center gap-2.5 rounded-full glass px-5 py-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sv-success opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-sv-success" />
          </span>
          <span className="text-[13px] font-bold tracking-wide text-white/90 md:text-[14px]">
            52,400+ აქტიური განცხადება საქართველოში
          </span>
        </div>

        <h1 className="text-balance text-center text-[44px] font-black leading-[1.06] tracking-[-0.03em] text-white md:text-[72px] lg:text-[84px]">
          იპოვე შენი <span className="text-gradient-blue text-gradient-shimmer">სივრცე</span>
        </h1>

        <p className="mt-6 max-w-[640px] text-balance text-center text-[16px] font-medium leading-relaxed text-white/70 md:text-[19px]">
          ბინები, სახლები, აგარაკები, მიწა და კომერციული ფართები — ყველაფერი ერთ
          პლატფორმაზე, 3D რუკით და AI შეფასებით
        </p>

        <HeroSearch />

        {/* Trust row */}
        <div
          className="sv-hero-in mt-14 flex flex-wrap items-center justify-center gap-x-10 gap-y-4"
          style={{ animationDelay: '0.3s' }}
        >
          {TRUST.map((t) => (
            <div key={t.label} className="flex items-center gap-2.5 text-white/70">
              <t.icon className="h-[18px] w-[18px] text-sv-success" />
              <span className="text-[13px] font-bold md:text-[14px]">{t.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll hint */}
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
