'use client'

import { useEffect, useRef, useState } from 'react'
import { useInView } from 'framer-motion'
import { Building2, Users, Award, Clock, TrendingUp, Headset } from 'lucide-react'
import { Reveal } from '@/components/Reveal'

function CountUp({ target, suffix = '' }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const [val, setVal] = useState(0)

  useEffect(() => {
    if (!inView) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const raf = requestAnimationFrame(() => setVal(target))
      return () => cancelAnimationFrame(raf)
    }
    const start = performance.now()
    const dur = 1600
    let raf: number
    const tick = (now: number) => {
      const p = Math.min((now - start) / dur, 1)
      const eased = 1 - Math.pow(1 - p, 4)
      setVal(Math.round(target * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, target])

  return (
    <span ref={ref}>
      {val.toLocaleString('en-US')}
      {suffix}
    </span>
  )
}

import { useI18n } from '@/lib/i18n/context'
import type { CmsBlockKey } from '@/lib/cms-blocks'

const STATS = [
  { icon: Building2, n: 1 },
  { icon: Users, n: 2 },
  { icon: TrendingUp, n: 3 },
  { icon: Award, n: 4 },
  { icon: Headset, n: 5 },
  { icon: Clock, n: 6 },
] as const

export default function Stats() {
  const { b } = useI18n()
  return (
    <section className="relative bg-sv-surface py-20 md:py-28">
      <div className="mx-auto max-w-[1440px] px-5 md:px-10">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          {STATS.map((s, i) => {
            const label = b(`home.stats.${s.n}.label` as CmsBlockKey)
            return (
              <Reveal key={s.n} delay={i * 0.02} className="h-full">
                <div
                  className="group relative h-full overflow-hidden rounded-card border border-sv-ink/[0.06] bg-gradient-to-b from-sv-cloud to-sv-surface p-6 transition-all duration-500 hover:-translate-y-1.5 hover:border-sv-blue/25 hover:shadow-card-hover"
                >
                  <div className="mb-5 grid h-11 w-11 place-items-center rounded-module bg-sv-blue/10 text-sv-blue transition-all duration-500 group-hover:scale-110 group-hover:bg-sv-blue group-hover:text-white">
                    <s.icon className="h-5 w-5" />
                  </div>
                  <div className="text-[34px] font-black tracking-tight text-sv-ink md:text-[38px]">
                    <CountUp
                      target={Number(b(`home.stats.${s.n}.value` as CmsBlockKey)) || 0}
                      suffix={b(`home.stats.${s.n}.suffix` as CmsBlockKey)}
                    />
                  </div>
                  <div className="mt-1 text-[14px] font-extrabold text-sv-ink/85">{label}</div>
                  <div className="mt-0.5 text-[12px] font-semibold text-sv-ink/65">
                    {b(`home.stats.${s.n}.sub` as CmsBlockKey)}
                  </div>
                </div>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
