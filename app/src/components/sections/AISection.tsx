'use client'

import LocalizedLink from '@/components/LocalizedLink'
import { ArrowRight, BrainCircuit } from 'lucide-react'
import { motion } from 'framer-motion'
import { Reveal } from '@/components/Reveal'
import { SparkMark } from '@/components/SparkMark'
import { useI18n } from '@/lib/i18n/context'
import { listingPath } from '@/lib/listing-slug'
import type { Listing } from '@/data/listings'
import { formatUSD } from '@/data/listings'

export default function AISection({ sample = null }: { sample?: Listing | null }) {
  const { b } = useI18n()
  const score = sample?.ai.score ?? 0
  const href = sample ? listingPath(sample) : '/search?sort=ai'

  return (
    <section className="relative overflow-hidden bg-sv-surface py-20 md:py-28">
      <div className="mx-auto max-w-[1440px] px-5 md:px-10">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <Reveal className="order-2 lg:order-1">
            <div className="relative mx-auto max-w-[560px]">
              <div className="absolute -inset-6 rounded-card bg-gradient-to-br from-sv-blue/12 via-transparent to-sv-violet/10 blur-2xl" />
              <motion.div
                whileHover={{ y: -6 }}
                transition={{ type: 'spring', stiffness: 220, damping: 22 }}
                className="relative overflow-hidden rounded-card border border-sv-ink/[0.07] bg-sv-surface shadow-card-hover"
              >
                <div className="flex items-center justify-between border-b border-sv-ink/[0.06] bg-gradient-to-r from-sv-navy to-sv-navy-soft px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-control bg-white/10 text-sv-blue-light">
                      <BrainCircuit className="h-5 w-5" />
                    </span>
                    <div>
                      <div className="text-[14px] font-extrabold text-white">Sivrce AI</div>
                      <div className="text-[11px] font-bold text-white/50">ფასის სანდოობის ქულა</div>
                    </div>
                  </div>
                  {sample ? (
                    <span className="rounded-full bg-sv-blue/20 px-3 py-1 text-[11px] font-black text-sv-blue-light">
                      ცოცხალი განცხადება
                    </span>
                  ) : null}
                </div>

                <div className="p-6">
                  {sample ? (
                    <>
                      <div className="flex items-end justify-between gap-4">
                        <div>
                          <div className="text-[12px] font-bold uppercase tracking-wider text-sv-ink/60">
                            {sample.district}, {sample.city}
                          </div>
                          <div className="mt-1 text-[34px] font-black tracking-tight text-sv-ink">
                            {formatUSD(sample.priceUSD)}
                          </div>
                          <div className="text-[13px] font-bold text-sv-ink/65">
                            {sample.perM2USD > 0 ? `$${sample.perM2USD.toLocaleString('en-US')}/მ² · ` : ''}
                            {sample.ai.label}
                          </div>
                        </div>
                        <div className="rounded-module bg-sv-blue/10 px-4 py-2.5 text-center">
                          <div className="text-[28px] font-black tabular-nums text-sv-blue">{score}</div>
                          <div className="text-[11px] font-bold text-sv-ink/60">AI ქულა</div>
                        </div>
                      </div>

                      <div className="mt-6 h-2 overflow-hidden rounded-full bg-sv-ink/[0.07]">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${score}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.8, ease: [0.21, 0.65, 0.2, 1] }}
                          className="h-full rounded-full bg-gradient-to-r from-sv-blue to-sv-violet"
                        />
                      </div>
                      <p className="mt-4 line-clamp-2 text-[13px] font-semibold text-sv-ink/55">
                        {sample.title}
                      </p>
                    </>
                  ) : (
                    <p className="text-[15px] font-semibold text-sv-ink/60">
                      ყოველი განცხადება იღებს AI ქულას — გახსენი ძიება და დაალაგე ქულით.
                    </p>
                  )}
                </div>
              </motion.div>
            </div>
          </Reveal>

          <div className="order-1 lg:order-2">
            <Reveal>
              <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-sv-blue/10 px-4 py-1.5 text-[12px] font-black uppercase tracking-wider text-sv-blue">
                <SparkMark className="h-3.5 w-3.5" /> {b('home.ai.kicker')}
              </span>
              <h2 className="text-balance text-[32px] font-black leading-[1.12] tracking-[-0.02em] text-sv-ink md:text-[46px]">
                {b('home.ai.titleA')} <span className="text-gradient-blue">{b('home.ai.titleAccent')}</span>
              </h2>
              <p className="mt-5 max-w-[520px] text-[15px] font-medium leading-relaxed text-sv-ink/55 md:text-[17px]">
                {b('home.ai.sub')}
              </p>
            </Reveal>

            <div className="mt-8 space-y-4">
              {[
                'ყოველი განცხადება იღებს AI ქულას 0-დან 100-მდე',
                'ფასის სანდოობა უბნისა და ტიპის მიხედვით',
                'შეადარე მსგავსი ქონებები ერთი შეხებით',
              ].map((t, i) => (
                <Reveal key={t} delay={0.1 + i * 0.08}>
                  <div className="flex items-center gap-3.5">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-sv-blue text-[13px] font-black text-white">
                      {i + 1}
                    </span>
                    <p className="text-[15px] font-bold text-sv-ink/75">{t}</p>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal delay={0.4}>
              <LocalizedLink
                href={href}
                className="group mt-9 inline-flex items-center gap-2.5 rounded-full bg-sv-navy px-7 py-4 text-[15px] font-extrabold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-sv-navy-soft hover:shadow-glow-navy"
              >
                {sample ? 'განცხადების ნახვა' : 'ძიება AI ქულით'}
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </LocalizedLink>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}
