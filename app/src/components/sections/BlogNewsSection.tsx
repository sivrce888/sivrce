'use client'

import LocalizedLink from '@/components/LocalizedLink'
import { BookOpen, ArrowRight, Calendar, Clock } from 'lucide-react'
import { Reveal } from '@/components/Reveal'
import { BLOG_POSTS } from '@/data/blog'

const KA_MONTHS = [
  'იან', 'თებ', 'მარ', 'აპრ', 'მაი', 'ივნ',
  'ივლ', 'აგვ', 'სექ', 'ოქტ', 'ნოე', 'დეკ',
] as const

/** Deterministic ka date — avoids Node/Chrome toLocaleDateString drift. */
function formatKaDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return `${d.getUTCDate()} ${KA_MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

const ARTICLES = [...BLOG_POSTS]
  .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
  .slice(0, 4)

export default function BlogNewsSection() {
  return (
    <section className="relative overflow-hidden bg-sv-surface py-16 md:py-24 border-t border-sv-ink/[0.06]">
      <div className="mx-auto max-w-[1440px] px-5 md:px-10">
        <Reveal className="mb-10 flex flex-wrap items-end justify-between gap-5">
          <div>
            <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-sv-blue/10 px-4 py-1.5 text-[12px] font-black uppercase tracking-wider text-sv-blue-deep">
              <BookOpen className="h-3.5 w-3.5" /> ბლოგი & სიახლეები
            </span>
            <h2 className="text-balance text-[28px] font-black tracking-[-0.02em] text-sv-ink md:text-[36px]">
              უძრავი ქონების სიახლეები & რჩევები
            </h2>
            <p className="mt-2 text-[14px] font-semibold text-sv-ink/65 md:text-[15px]">
              უახლესი სტატიები, ბაზრის ანალიზი და ექსპერტების რეკომენდაციები
            </p>
          </div>
          <LocalizedLink
            href="/blog"
            className="group flex items-center gap-2 text-[15px] font-extrabold text-sv-blue-deep transition-colors hover:text-sv-blue-deep"
          >
            ყველას ნახვა
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </LocalizedLink>
        </Reveal>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {ARTICLES.map((art, i) => (
            <Reveal key={art.slug} delay={i * 0.08} className="h-full">
              <LocalizedLink href={`/blog/${art.slug}`} className="block h-full">
                <article className="group flex h-full flex-col overflow-hidden rounded-card border border-sv-ink/[0.08] bg-gradient-to-b from-sv-cloud to-sv-surface p-4 transition-all duration-300 hover:-translate-y-1.5 hover:border-sv-blue/30 hover:shadow-card-hover">
                  <div className="relative h-44 w-full overflow-hidden rounded-module bg-sv-surface">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={art.cover}
                      alt={art.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute left-3 top-3">
                      <span className="rounded-full bg-sv-blue px-3 py-1 text-[11px] font-black text-white">
                        {art.tags[0]}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-1 flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-[12px] font-bold text-sv-ink/60">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-sv-ink/40" />
                          {/* ponytail: fixed ka months — Node ICU ≠ Chrome locale → React #418 */}
                          {formatKaDate(art.publishedAt)}
                        </span>
                        <span className="flex items-center gap-1 text-sv-ink/45">
                          <Clock className="h-3 w-3" />
                          {art.readingMinutes} წთ
                        </span>
                      </div>
                      <h3 className="mt-2 text-[15px] font-extrabold leading-snug text-sv-ink transition-colors line-clamp-2 group-hover:text-sv-blue">
                        {art.title}
                      </h3>
                      <p className="mt-2 text-[13px] font-medium leading-relaxed text-sv-ink/60 line-clamp-3">
                        {art.excerpt}
                      </p>
                    </div>

                    <div className="mt-4 border-t border-sv-ink/[0.06] pt-3 text-[13px] font-extrabold text-sv-blue-deep group-hover:underline">
                      სრულად კითხვა →
                    </div>
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
