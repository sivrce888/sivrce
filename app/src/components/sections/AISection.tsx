'use client'

import Link from 'next/link'
import { Sparkles, TrendingDown, TrendingUp, Minus, ArrowRight, BrainCircuit } from 'lucide-react'
import { motion } from 'framer-motion'
import { Reveal } from '@/components/Reveal'

const BARS = [42, 58, 50, 66, 61, 78, 72, 88, 81, 95, 90, 100]

export default function AISection() {
  return (
    <section className="relative overflow-hidden bg-sv-surface py-20 md:py-28">
      <div className="mx-auto max-w-[1440px] px-5 md:px-10">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          {/* Visual card */}
          <Reveal className="order-2 lg:order-1">
            <div className="relative mx-auto max-w-[560px]">
              <div className="absolute -inset-6 rounded-card bg-gradient-to-br from-sv-blue/12 via-transparent to-sv-violet/10 blur-2xl" />
              <motion.div
                whileHover={{ y: -6 }}
                transition={{ type: 'spring', stiffness: 220, damping: 22 }}
                className="relative overflow-hidden rounded-card border border-sv-ink/[0.07] bg-sv-surface shadow-card-hover"
              >
                {/* header */}
                <div className="flex items-center justify-between border-b border-sv-ink/[0.06] bg-gradient-to-r from-sv-navy to-sv-navy-soft px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-control bg-white/10 text-sv-blue-light">
                      <BrainCircuit className="h-5 w-5" />
                    </span>
                    <div>
                      <div className="text-[14px] font-extrabold text-white">Sivrce AI Valuation</div>
                      <div className="text-[11px] font-bold text-white/50">48 პარამეტრის ანალიზი</div>
                    </div>
                  </div>
                  <span className="flex items-center gap-1.5 rounded-full bg-sv-success/15 px-3 py-1 text-[11px] font-black text-sv-success">
                    <span className="h-1.5 w-1.5 rounded-full bg-sv-success" /> LIVE
                  </span>
                </div>

                <div className="p-6">
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-[12px] font-bold uppercase tracking-wider text-sv-ink/60">
                        საბაზარო ღირებულება
                      </div>
                      <div className="mt-1 text-[34px] font-black tracking-tight text-sv-ink">$128,400</div>
                      <div className="text-[13px] font-bold text-sv-ink/65">$1,980/მ² • ვაკე, თბილისი</div>
                    </div>
                    <div className="rounded-module bg-sv-blue/10 px-4 py-2.5 text-right">
                      <div className="flex items-center gap-1 text-[15px] font-black text-sv-blue">
                        <TrendingUp className="h-4 w-4" /> +8.4%
                      </div>
                      <div className="text-[11px] font-bold text-sv-ink/60">ბოლო 12 თვეში</div>
                    </div>
                  </div>

                  {/* chart */}
                  <div className="mt-6 flex h-[110px] items-end gap-2">
                    {BARS.map((h, i) => (
                      <motion.div
                        key={i}
                        initial={{ height: 0 }}
                        whileInView={{ height: `${h}%` }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 + i * 0.05, duration: 0.6, ease: [0.21, 0.65, 0.2, 1] }}
                        className={`flex-1 rounded-t-control ${
                          i === BARS.length - 1
                            ? 'bg-gradient-to-t from-sv-orange to-sv-orange-light'
                            : 'bg-gradient-to-t from-sv-blue/25 to-sv-blue/60'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="mt-2 flex justify-between text-[11px] font-bold text-sv-ink/35">
                    <span>2025 ივლ</span>
                    <span>2026 ივლ</span>
                  </div>

                  {/* verdict */}
                  <div className="mt-6 grid grid-cols-3 gap-3">
                    {[
                      { icon: TrendingDown, label: 'ბაზარზე დაბალი', val: '12%', good: true },
                      { icon: Minus, label: 'უბნის საშუალო', val: '$2,210', good: null },
                      { icon: TrendingUp, label: 'ზრდის პროგნოზი', val: '+6.1%', good: true },
                    ].map((s) => (
                      <div key={s.label} className="rounded-module bg-sv-cloud p-3.5 text-center">
                        <s.icon className={`mx-auto h-4 w-4 ${s.good ? 'text-sv-blue' : 'text-sv-ink/40'}`} />
                        <div className="mt-1.5 text-[16px] font-black text-sv-ink">{s.val}</div>
                        <div className="mt-0.5 text-[10.5px] font-bold leading-tight text-sv-ink/60">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </Reveal>

          {/* Copy */}
          <div className="order-1 lg:order-2">
            <Reveal>
              <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-sv-blue/10 px-4 py-1.5 text-[12px] font-black uppercase tracking-wider text-sv-blue">
                <Sparkles className="h-3.5 w-3.5" /> AI ტექნოლოგია
              </span>
              <h2 className="text-balance text-[32px] font-black leading-[1.12] tracking-[-0.02em] text-sv-ink md:text-[46px]">
                იცოდე ნამდვილი ფასი — <span className="text-gradient-blue">ყიდვამდე</span>
              </h2>
              <p className="mt-5 max-w-[520px] text-[15px] font-medium leading-relaxed text-sv-ink/55 md:text-[17px]">
                ჩვენი AI 48 პარამეტრს ანალიზებს — მდებარეობა, იატაკი, ხედი, რემონტი,
                ბაზრის დინამიკა — და გეუბნება, რამდენად კარგი გარიგებაა კონკრეტული ქონება.
              </p>
            </Reveal>

            <div className="mt-8 space-y-4">
              {[
                'ყოველი განცხადება იღებს AI ქულას 0-დან 100-მდე',
                'ფასების ისტორია და პროგნოზი უბნების მიხედვით',
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
              <Link
                href="/search"
                className="group mt-9 inline-flex items-center gap-2.5 rounded-full bg-sv-navy px-7 py-4 text-[15px] font-extrabold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-sv-navy-soft hover:shadow-glow-navy"
              >
                შეაფასე შენი ქონება
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}
