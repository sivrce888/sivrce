'use client'

import LocalizedLink from '@/components/LocalizedLink'
import { MousePointerClick, Building2, BarChart3, Layers, ArrowRight, MapPin } from 'lucide-react'
import { motion } from 'framer-motion'
import { Reveal } from '@/components/Reveal'
import { STATUS_BRAND } from '@/lib/category-brand'
import { BRAND } from '@/lib/brand'
import { useI18n } from '@/lib/i18n/context'

const FEATURES = [
  {
    icon: MousePointerClick,
    title: 'დააჭირე ნებისმიერ შენობას',
    text: '3D რუკაზე შენობაზე დაჭერით ხედავ ყველა გასაყიდ და გასაქირავებელ ფართს კონკრეტულ კორპუსში.',
  },
  {
    icon: Building2,
    title: 'მშენებარე კორპუსების ვიზუალიზაცია',
    text: 'ჯერ არსასრულ პროექტებსაც კი ვაჩვენებთ 3D-ში — აირჩიე ბინა პირდაპირ სამშენებლო მაკეტიდან.',
  },
  {
    icon: BarChart3,
    title: 'უბნის სრული ანალიტიკა',
    text: 'ფასების დინამიკა, მ²-ის ღირებულება, ინფრასტრუქტურა და ინვესტიციული პოტენციალი ერთ ეკრანზე.',
  },
  {
    icon: Layers,
    title: '2D / 3D რეჟიმები',
    text: 'გადართე კლასიკურ რუკასა და იმერსიულ 3D ხედს შორის ერთი შეხებით — ნებისმიერ მოწყობილობაზე.',
  },
]

/** Zero-JS map preview — LCP: no MapLibre on homepage. Real map lives on /map. */
function MapPreviewCard() {
  return (
    <div className="relative aspect-video overflow-hidden bg-sv-navy-soft">
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(143,180,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(143,180,255,0.12) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      <div
        aria-hidden
        className="absolute -left-16 top-1/4 h-64 w-64 rounded-full bg-sv-blue/25 blur-[80px]"
      />
      <div
        aria-hidden
        className="absolute -right-10 bottom-0 h-56 w-56 rounded-full bg-sv-violet/20 blur-[70px]"
      />
      <div aria-hidden className="absolute inset-0">
        {/* Active listings = brand blue; construction ghosts = STATUS sky (BRAND §3.4). */}
        <span className="absolute left-[18%] top-[42%] h-10 w-7 rounded-sm bg-sv-blue/35 shadow-[0_8px_24px_rgba(5,11,38,0.35)]" />
        <span
          className="absolute left-[28%] top-[36%] h-14 w-8 rounded-sm opacity-90"
          style={{ background: STATUS_BRAND.construction.hue }}
        />
        <span
          className="absolute left-[48%] top-[30%] h-20 w-10 rounded-sm shadow-glow-blue opacity-95"
          style={{
            background: `linear-gradient(to top, ${STATUS_BRAND.construction.hue}, ${BRAND.colors.blueLight})`,
          }}
        />
        <span className="absolute left-[62%] top-[40%] h-12 w-7 rounded-sm bg-sv-blue/40" />
        <span
          className="absolute left-[72%] top-[46%] h-8 w-6 rounded-sm opacity-75"
          style={{ background: STATUS_BRAND.construction.hue }}
        />
      </div>
      <div className="absolute left-1/2 top-[38%] z-[1] -translate-x-1/2 -translate-y-full">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-sv-orange text-white shadow-glow-orange">
          <MapPin className="h-5 w-5" strokeWidth={2.5} />
        </span>
      </div>
      <div className="absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-sv-navy/80 via-sv-navy/20 to-transparent pb-8 pt-16">
        <span className="rounded-full bg-sv-orange px-5 py-2.5 text-[13px] font-extrabold text-white shadow-glow-orange">
          გახსენი ინტერაქტიული 3D რუკა
        </span>
      </div>
    </div>
  )
}

export default function MapSection() {
  const { b } = useI18n()
  return (
    <section className="relative overflow-hidden bg-sv-navy py-20 md:py-28">
      <div className="absolute inset-0 bg-grid-dark" />
      <div className="absolute -left-40 top-1/3 h-[480px] w-[480px] animate-float rounded-full bg-sv-blue/15 blur-[140px]" />
      <div className="absolute -right-40 bottom-0 h-[420px] w-[420px] animate-float rounded-full bg-sv-violet/10 blur-[140px]" style={{ animationDelay: '-4s' }} />

      <div className="relative mx-auto max-w-[1440px] px-5 md:px-10">
        <div className="grid items-center gap-14 lg:grid-cols-[1fr_1.15fr]">
          <div>
            <Reveal>
              <span className="mb-4 inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-[12px] font-black uppercase tracking-wider text-sv-blue-light">
                <Layers className="h-3.5 w-3.5" /> {b('home.map.kicker')}
              </span>
              <h2 className="text-balance text-[32px] font-black leading-[1.12] tracking-[-0.02em] text-white md:text-[46px]">
                {b('home.map.titleA')} <span className="text-gradient-blue">{b('home.map.titleAccent')}</span> {b('home.map.titleB')}
              </h2>
              <p className="mt-5 max-w-[520px] text-[15px] font-medium leading-relaxed text-white/60 md:text-[17px]">
                {b('home.map.sub')}
              </p>
            </Reveal>

            <div className="mt-10 space-y-3">
              {FEATURES.map((f, i) => (
                <Reveal key={f.title} delay={0.1 + i * 0.08}>
                  <div className="group flex gap-5 rounded-module border border-white/[0.07] bg-white/[0.03] p-5 transition-all duration-500 hover:border-sv-blue/40 hover:bg-white/[0.06]">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-module bg-sv-blue/15 text-sv-blue-light transition-all duration-500 group-hover:bg-sv-blue group-hover:text-white">
                      <f.icon className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="text-[16px] font-extrabold text-white">{f.title}</h3>
                      <p className="mt-1 text-[14px] font-medium leading-relaxed text-white/55">{f.text}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal delay={0.45}>
              <LocalizedLink
                href="/map"
                className="group mt-9 inline-flex items-center gap-2.5 rounded-full bg-white px-7 py-4 text-[15px] font-extrabold text-sv-navy transition-all duration-300 hover:-translate-y-0.5 hover:bg-sv-blue-light hover:shadow-glow-blue"
              >
                გახსენი 3D რუკა
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </LocalizedLink>
            </Reveal>
          </div>

          <Reveal delay={0.2} className="relative">
            <motion.div
              whileHover={{ scale: 1.015 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="relative overflow-hidden rounded-card border border-white/10 shadow-showcase-blue"
            >
              <LocalizedLink href="/map" className="block" aria-label="გახსენი 3D რუკა">
                <MapPreviewCard />
              </LocalizedLink>
              <div className="pointer-events-none absolute inset-0 rounded-card ring-1 ring-inset ring-white/10" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6, duration: 0.7, ease: [0.21, 0.65, 0.2, 1] }}
              className="absolute bottom-3 left-3 rounded-tile glass p-4 shadow-soft md:-bottom-6 md:-left-8"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-control bg-sv-blue/20 text-sv-blue-light">
                  <Building2 className="h-5 w-5" />
                </span>
                <div>
                  <div className="text-[13px] font-extrabold text-white">North Avenue Tower</div>
                  <div className="flex items-center text-[12px] font-bold text-white/55">
                    14 ბინა იყიდება
                    <span aria-hidden className="mx-1.5 inline-block h-1 w-1 rounded-full bg-white/30" />
                    $2,400/მ²-დან
                  </div>
                </div>
              </div>
            </motion.div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
