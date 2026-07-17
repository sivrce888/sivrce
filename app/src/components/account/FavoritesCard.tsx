'use client'

import Link from 'next/link'
import { ArrowRight, Heart } from 'lucide-react'
import { useFavorites } from '@/lib/favorites'
import SectionHeader from './SectionHeader'
import { useAccountStrings } from './i18n'

export default function FavoritesCard() {
  const { count } = useFavorites()
  const tt = useAccountStrings()

  return (
    <section aria-label={tt('favorites')} className="rounded-card border border-sv-ink/[0.06] bg-sv-surface p-6 shadow-card">
      <SectionHeader icon={Heart} title={tt('favorites')} count={count} chipClass="bg-sv-orange/10 text-sv-orange" />
      <p className="text-[32px] font-black tracking-[-0.02em] text-sv-ink">
        {count}
        <span className="ml-2 text-[13px] font-bold text-sv-ink/45">{tt('savedListings')}</span>
      </p>
      <Link
        href="/favorites"
        className="mt-3 inline-flex h-11 items-center gap-1.5 rounded-full px-1 text-[14px] font-extrabold text-sv-blue transition-colors hover:text-sv-blue-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue/30"
      >
        {tt('viewAll')}
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </section>
  )
}
