'use client'

import { motion } from 'framer-motion'
import LocalizedLink from '@/components/LocalizedLink'
import Image from 'next/image'
import { MapPin, ArrowRight, BadgeCheck, Building2, CalendarCheck, Star } from 'lucide-react'
import { Reveal } from '@/components/Reveal'
import HScroll from '@/components/HScroll'
import { useI18n } from '@/lib/i18n/context'
import { getDeveloper, type Project } from '@/data/professionals'

export default function Projects({
  items,
  total,
}: {
  items: Project[]
  total: number
}) {
  const { b } = useI18n()
  if (items.length === 0) return null

  return (
    <section id="projects" className="relative overflow-hidden bg-sv-cloud py-20 md:py-28">
      <div className="mx-auto max-w-[1440px] px-5 md:px-10">
        <Reveal className="mb-10 flex flex-wrap items-end justify-between gap-5">
          <div>
            <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-sv-blue/10 px-4 py-1.5 text-[12px] font-black uppercase tracking-wider text-sv-blue">
              <Building2 className="h-3.5 w-3.5" /> {b('home.projects.kicker')}
            </span>
            <h2 className="text-balance text-[30px] font-black tracking-[-0.02em] text-sv-ink md:text-[40px]">
              {b('home.projects.title')}
            </h2>
            <p className="mt-2 text-[15px] font-semibold text-sv-ink/65 md:text-[16px]">
              {b('home.projects.sub')}
            </p>
          </div>
          <LocalizedLink
            href="/projects"
            className="group flex items-center gap-2 text-[15px] font-extrabold text-sv-blue transition-colors duration-200 hover:text-sv-blue-deep"
          >
            {/* SEO: keyword hub /projects — count stays projects (catalog unit). */}
            {total} პროექტის ნახვა
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </LocalizedLink>
        </Reveal>
      </div>

      <HScroll
        aria-label="მშენებარე ბინები"
        step={560}
        className="gap-6 px-5 pb-2 pt-2 md:px-10 lg:px-[max(2.5rem,calc((100vw-1440px)/2+2.5rem))]"
      >
        {items.map((p, i) => {
          const dev = getDeveloper(p.developerSlug)
          const devName = dev?.name.ka ?? p.developerSlug
          return (
            <LocalizedLink
              key={p.slug}
              href={`/projects/${p.slug}`}
              className="group block w-[min(85vw,520px)] shrink-0"
            >
              <article className="flex h-full cursor-pointer flex-col overflow-hidden rounded-card border border-sv-ink/[0.06] bg-sv-surface shadow-card transition-all duration-500 hover:-translate-y-2 hover:shadow-card-hover">
                <div className="relative aspect-[16/9] overflow-hidden">
                  <Image
                    src={p.img}
                    alt={`${p.name} — მშენებარე ბინები`}
                    fill
                    sizes="(max-width:768px) 85vw, 520px"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                    priority={i < 2}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-sv-navy/75 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-[20px] font-black text-white [text-shadow:0_2px_10px_rgba(5,11,38,0.55)] md:text-[22px]">
                        {p.name}
                      </h3>
                      <p className="flex items-center gap-1.5 text-[13px] font-bold text-white/80">
                        <BadgeCheck className="h-4 w-4 shrink-0 text-sv-success" /> {devName}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1 rounded-control bg-white/95 px-3 py-1.5 text-[14px] font-black text-sv-navy">
                      <Star className="h-3.5 w-3.5 fill-sv-orange text-sv-orange" /> {p.rating}
                    </div>
                  </div>
                  <div className="absolute left-5 top-4 rounded-full bg-sv-navy/55 px-3.5 py-1.5 text-[12px] font-extrabold text-white backdrop-blur">
                    აშენებულია {p.done}%
                  </div>
                </div>
                <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-2 p-5">
                  <span className="flex max-w-full items-center gap-1.5 truncate text-[13px] font-bold text-sv-ink/55">
                    <MapPin className="h-4 w-4 shrink-0 text-sv-ink/35" /> {p.location}
                  </span>
                  <span className="flex items-center gap-1.5 text-[13px] font-bold text-sv-ink/55">
                    <CalendarCheck className="h-4 w-4 text-sv-ink/35" /> ჩაბარება {p.finish}
                  </span>
                  <span className="flex items-center gap-1.5 text-[13px] font-bold text-sv-ink/55">
                    <Building2 className="h-4 w-4 text-sv-ink/35" /> {p.flats} ბინა
                  </span>
                  <span className="ml-auto text-[16px] font-black text-sv-blue">
                    {p.priceFromM2}
                    <span className="text-[12px] font-bold text-sv-ink/60"> /მ²-დან</span>
                  </span>
                </div>
                <div className="mx-5 mb-5 h-1.5 overflow-hidden rounded-full bg-sv-ink/[0.07]">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${p.done}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, ease: [0.21, 0.65, 0.2, 1] }}
                    className="h-full rounded-full bg-gradient-to-r from-sv-blue to-sv-violet"
                  />
                </div>
              </article>
            </LocalizedLink>
          )
        })}
      </HScroll>
    </section>
  )
}
