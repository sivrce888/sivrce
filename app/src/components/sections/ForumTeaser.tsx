'use client'

import LocalizedLink from '@/components/LocalizedLink'
import { MessageSquare, ArrowRight } from 'lucide-react'
import { Reveal } from '@/components/Reveal'
import { useI18n } from '@/lib/i18n/context'

/** Card payload picked server-side (HomeMain) — the 19 KB thread corpus stays off the client. */
export type ForumTopic = { slug: string; title: string; category: string; replies: number }

export default function ForumTeaser({ topics }: { topics: ForumTopic[] }) {
  const { b } = useI18n()
  if (topics.length === 0) return null
  return (
    <section className="relative overflow-hidden bg-sv-surface py-16 md:py-24">
      <div className="mx-auto max-w-[1440px] px-5 md:px-10">
        <Reveal className="mb-10 flex flex-wrap items-end justify-between gap-5">
          <div>
            <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-sv-blue/10 px-4 py-1.5 text-[12px] font-black uppercase tracking-wider text-sv-blue-deep dark:text-sv-blue-light">
              <MessageSquare className="h-3.5 w-3.5" /> {b('home.forum.kicker')}
            </span>
            <h2 className="sv-h2 text-sv-ink">
              {b('home.forum.title')}
            </h2>
            <p className="mt-2 text-[14px] font-semibold text-sv-ink/65 md:text-[15px]">
              {b('home.forum.sub')}
            </p>
          </div>
          <LocalizedLink
            href="/forum"
            className="group flex items-center gap-2 text-[15px] font-extrabold text-sv-blue-deep dark:text-sv-blue-light transition-colors hover:text-sv-blue-deep dark:hover:text-sv-blue-light"
          >
            {b('home.forum.viewAll')}
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </LocalizedLink>
        </Reveal>

        <div className="grid gap-5 md:grid-cols-3">
          {topics.map((t, i) => (
            <Reveal key={t.slug} delay={i * 0.1} className="h-full">
              <LocalizedLink href={`/forum/${t.slug}`} className="block h-full">
                <article className="group flex h-full flex-col justify-between rounded-card border border-sv-ink/[0.07] bg-gradient-to-b from-sv-cloud to-sv-surface p-6 transition-all duration-300 hover:-translate-y-1.5 hover:border-sv-blue/30 hover:shadow-card-hover">
                  {/* Threads are Georgian community posts — lang="ka" so screen readers switch voice (WCAG 3.1.2). */}
                  <div lang="ka">
                    <span className="inline-block rounded-full bg-sv-blue/10 px-3 py-1 text-[11px] font-black text-sv-blue-deep dark:text-sv-blue-light">
                      {t.category}
                    </span>
                    <h3 className="mt-4 text-[16px] font-extrabold leading-snug text-sv-ink transition-colors group-hover:text-sv-blue">
                      {t.title}
                    </h3>
                  </div>

                  <div className="mt-6 flex items-center gap-1.5 border-t border-sv-ink/[0.06] pt-4 text-[12px] font-bold text-sv-ink/60">
                    <MessageSquare className="h-3.5 w-3.5" aria-hidden />
                    {b('home.forum.replies', { n: t.replies })}
                  </div>
                </article>
              </LocalizedLink>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
