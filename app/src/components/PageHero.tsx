import type { ReactNode } from 'react'
import { Reveal } from '@/components/Reveal'

/** Shared inner-page header — navy cinematic or light editorial. Brand motion via Reveal. */
export function PageHero({
  kicker,
  title,
  subtitle,
  children,
  tone = 'navy',
}: {
  kicker?: string
  title: ReactNode
  subtitle?: ReactNode
  children?: ReactNode
  tone?: 'navy' | 'light'
}) {
  if (tone === 'light') {
    return (
      <header className="mx-auto max-w-[1440px] px-5 pb-2 pt-[calc(7rem+env(safe-area-inset-top,0px))] md:px-10 md:pt-[calc(8rem+env(safe-area-inset-top,0px))]">
        <Reveal>
          {kicker ? (
            <p className="sv-kicker mb-3 text-sv-blue">
              {kicker}
            </p>
          ) : null}
          <h1 className="sv-h1 max-w-4xl text-sv-ink">
            {title}
          </h1>
          {subtitle ? (
            <p className="sv-lead mt-4 max-w-2xl text-sv-ink/60">
              {subtitle}
            </p>
          ) : null}
          {children}
        </Reveal>
      </header>
    )
  }

  return (
    <section className="relative overflow-hidden bg-sv-navy">
      <div className="absolute inset-0 bg-grid-dark" aria-hidden />
      <div
        aria-hidden
        className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-sv-blue/18 blur-[160px]"
      />
      <div
        aria-hidden
        className="absolute -bottom-24 right-1/5 h-80 w-80 rounded-full bg-sv-violet/14 blur-[160px]"
      />
      <div className="relative mx-auto max-w-5xl px-6 pb-16 pt-[calc(8rem+env(safe-area-inset-top,0px))] text-center md:pb-24 md:pt-40">
        <Reveal>
          {kicker ? (
            <p className="sv-kicker text-sv-blue-light">
              {kicker}
            </p>
          ) : null}
          <h1 className="mt-4 max-w-full text-balance text-[clamp(2rem,1.1rem+3.6vw,3.75rem)] font-black tracking-[-0.03em] text-white">
            {title}
          </h1>
          {subtitle ? (
            <p className="sv-lead mx-auto mt-6 max-w-2xl text-white/65">
              {subtitle}
            </p>
          ) : null}
          {children}
        </Reveal>
      </div>
    </section>
  )
}
