'use client'

import LocalizedLink from '@/components/LocalizedLink'
import { MessageSquare, ArrowRight, Eye, Sparkles } from 'lucide-react'
import { Reveal } from '@/components/Reveal'
import { FORUM_THREADS } from '@/data/forum'
import { useI18n } from '@/lib/i18n/context'

const TOPICS = [...FORUM_THREADS]
  .sort((a, b) => b.lastActivityAt.localeCompare(a.lastActivityAt))
  .slice(0, 3)

export default function ForumTeaser() {
  const { b } = useI18n()
  return (
    <section className="relative overflow-hidden bg-sv-surface py-16 md:py-24">
      <div className="mx-auto max-w-[1440px] px-5 md:px-10">
        <Reveal className="mb-10 flex flex-wrap items-end justify-between gap-5">
          <div>
            <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-sv-blue/10 px-4 py-1.5 text-[12px] font-black uppercase tracking-wider text-sv-blue-deep">
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
            className="group flex items-center gap-2 text-[15px] font-extrabold text-sv-blue-deep transition-colors hover:text-sv-blue-deep"
          >
            {b('home.forum.viewAll')}
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </LocalizedLink>
        </Reveal>

        <div className="grid gap-5 md:grid-cols-3">
          {TOPICS.map((t, i) => (
            <Reveal key={t.slug} delay={i * 0.1} className="h-full">
              <LocalizedLink href={`/forum/${t.slug}`} className="block h-full">
                <article className="group flex h-full flex-col justify-between rounded-card border border-sv-ink/[0.07] bg-gradient-to-b from-sv-cloud to-sv-surface p-6 transition-all duration-300 hover:-translate-y-1.5 hover:border-sv-blue/30 hover:shadow-card-hover">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-sv-blue/10 px-3 py-1 text-[11px] font-black text-sv-blue-deep">
                        {t.category}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sv-ink">
                        <Sparkles className="h-3 w-3" /> {t.badge}
                      </span>
                    </div>
                    <h3 className="mt-4 text-[16px] font-extrabold leading-snug text-sv-ink transition-colors group-hover:text-sv-blue">
                      {t.title}
                    </h3>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-sv-ink/[0.06] pt-4 text-[12px] font-bold text-sv-ink/60">
                    <span className="flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5 text-sv-ink/40" />
                      {b('home.forum.replies', { n: t.replies.length })}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Eye className="h-3.5 w-3.5 text-sv-ink/40" />
                      {b('home.forum.views', { n: t.viewsLabel })}
                    </span>
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
