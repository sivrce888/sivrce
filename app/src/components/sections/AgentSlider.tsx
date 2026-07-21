'use client'

import LocalizedLink from '@/components/LocalizedLink'
import { BadgeCheck, ArrowRight, UserRound } from 'lucide-react'
import { Reveal } from '@/components/Reveal'
import HScroll from '@/components/HScroll'
import type { LocalName } from '@/data/professionals'

export type TopAgentCard = {
  slug: string
  name: LocalName
  agency: string
  city: string
  verified: boolean
  listingsCount: number
}

export default function AgentSlider({
  agents,
  total,
}: {
  agents: TopAgentCard[]
  total: number
}) {
  if (agents.length === 0) return null

  return (
    <section className="relative overflow-hidden bg-sv-cloud py-16 md:py-24">
      <div className="mx-auto max-w-[1440px] px-5 md:px-10">
        <Reveal className="mb-10 flex flex-wrap items-end justify-between gap-5">
          <div>
            <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-sv-blue/10 px-4 py-1.5 text-[12px] font-black uppercase tracking-wider text-sv-blue-deep-deep">
              <UserRound className="h-3.5 w-3.5" /> ტოპ აგენტები
            </span>
            <h2 className="text-balance text-[28px] font-black tracking-[-0.02em] text-sv-ink md:text-[36px]">
              ყველაზე მეტი აქტიური განცხადება
            </h2>
            <p className="mt-2 text-[14px] font-semibold text-sv-ink/65 md:text-[15px]">
              რეიტინგი ცოცხალი ინვენტარით — ვინც ახლა ყველაზე მეტ ბაზარზეა
            </p>
          </div>
          <LocalizedLink
            href="/agents"
            className="group flex items-center gap-2 text-[15px] font-extrabold text-sv-blue-deep transition-colors hover:text-sv-blue-deep"
          >
            ყველა აგენტი ({total})
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </LocalizedLink>
        </Reveal>

        <HScroll aria-label="ტოპ აგენტების კარუსელი" step={340} className="gap-5 pb-4">
          {agents.map((a, i) => (
            <LocalizedLink
              key={a.slug}
              href={`/agents/${a.slug}`}
              className="group relative flex w-[280px] shrink-0 flex-col overflow-hidden rounded-card border border-sv-ink/[0.07] bg-sv-surface p-5 transition-all duration-300 hover:-translate-y-1.5 hover:border-sv-blue/30 hover:shadow-card-hover"
            >
              <div className="flex items-center gap-3.5">
                <span
                  aria-hidden
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-module bg-sv-blue/10 text-[14px] font-black text-sv-blue-deep-deep"
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h3 className="truncate text-[16px] font-black text-sv-ink transition-colors group-hover:text-sv-blue">
                      {a.name.ka}
                    </h3>
                    {a.verified && (
                      <BadgeCheck className="h-4 w-4 shrink-0 text-sv-blue" />
                    )}
                  </div>
                  <p className="truncate text-[12px] font-bold text-sv-ink/60">
                    {a.agency} · {a.city}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-sv-ink/[0.06] pt-3 text-[13px] font-extrabold text-sv-ink/75">
                <span className="text-sv-ink/60">
                  {a.listingsCount} აქტიური
                </span>
                <span className="text-sv-blue-deep group-hover:underline">პროფილი →</span>
              </div>
            </LocalizedLink>
          ))}
        </HScroll>
      </div>
    </section>
  )
}
