'use client'
import { useEffect, useState, type ReactNode } from 'react'
import type { HeroQuickChip } from '@/lib/hero-quick'

/* ponytail: 189KB island (framer-motion + pickers + nl-search) used to hydrate
   on the load critical path — PSI mobile TBT. Mount on idle or first
   interaction instead; skeleton reserves the space so there is no CLS.
   Upgrade path: split pickers into per-open chunks if the island grows. */

function Skeleton() {
  return (
    <div className="mx-auto mt-7 w-full max-w-[1100px] sm:mt-11" aria-hidden>
      <div className="mx-auto h-12 w-full rounded-full glass-hero sm:w-[min(100%,420px)]" />
      <div className="mt-2.5 h-14 w-full rounded-full glass-hero" />
      <div className="mt-4 flex items-center gap-2 overflow-hidden sm:mt-5 sm:flex-wrap sm:justify-center">
        <span className="h-9 w-16 shrink-0 rounded-full glass-hero" />
        <span className="h-9 w-[72px] shrink-0 rounded-full glass-hero" />
        <span className="h-9 w-24 shrink-0 rounded-full glass-hero" />
        <span className="h-9 w-20 shrink-0 rounded-full glass-hero" />
        <span className="h-9 w-28 shrink-0 rounded-full glass-hero" />
        <span className="h-9 w-[76px] shrink-0 rounded-full glass-hero" />
      </div>
    </div>
  )
}

export default function HeroSearchDeferred({
  quick,
  country,
}: {
  quick: HeroQuickChip[]
  country?: string
}) {
  const [Search, setSearch] = useState<null | ((p: { quick: HeroQuickChip[]; country?: string }) => ReactNode)>(null)
  useEffect(() => {
    let loaded = false
    const go = () => {
      if (loaded) return
      loaded = true
      import('./HeroSearch').then((m) => setSearch(() => m.default))
    }
    const idle =
      'requestIdleCallback' in window
        ? window.requestIdleCallback(go, { timeout: 2000 })
        : setTimeout(go, 1200)
    window.addEventListener('pointerdown', go, { once: true, capture: true })
    window.addEventListener('keydown', go, { once: true, capture: true })
    return () => {
      if ('cancelIdleCallback' in window) cancelIdleCallback(idle as number)
      clearTimeout(idle)
      window.removeEventListener('pointerdown', go, { capture: true })
      window.removeEventListener('keydown', go, { capture: true })
    }
  }, [])
  /* min-h reserves the real island's height per breakpoint (re-measured 320→1440
     on the daily tab, the tallest) so the idle mount can't shift the hero — CLS
     stays 0 while the search island hydrates off the critical path. w-full: the
     wrapper is a shrink-to-fit flex item, so without it the island sizes to
     max-content and overflows the phone viewport. Re-measure if HeroSearch grows. */
  return (
    <div className="w-full min-w-0 min-h-[450px] sm:min-h-[540px] lg:min-h-[275px]">
      {Search ? <Search quick={quick} country={country} /> : <Skeleton />}
    </div>
  )
}
