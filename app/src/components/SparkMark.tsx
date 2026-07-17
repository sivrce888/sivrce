'use client'

import { useId } from 'react'

/* Sivrce Spark — AI sub-brand mark (BRAND.md §2.1 · logo/README.md).
   Two crescent blades, exact 180° symmetry about (24,24), locked brand
   gradients. AI features only — never replaces the Space Point master logo.
   Lucide-compatible sizing: <SparkMark className="h-4 w-4" /> */
export function SparkMark({ className = 'h-4 w-4' }: { className?: string }) {
  const id = useId().replace(/:/g, '')
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <defs>
        <linearGradient id={`${id}a`} x1="24" y1="3.2" x2="3.2" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="var(--sv-blue-light)" />
          <stop offset="0.55" stopColor="var(--sv-blue)" />
          <stop offset="1" stopColor="var(--sv-violet)" />
        </linearGradient>
        <linearGradient id={`${id}b`} x1="24" y1="44.8" x2="44.8" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="var(--sv-violet)" />
          <stop offset="0.62" stopColor="var(--sv-orange-deep)" />
          <stop offset="1" stopColor="var(--sv-orange)" />
        </linearGradient>
      </defs>
      <path d="M24 3.2 Q21.4 21.4 3.2 24 Q25.2 25.2 24 3.2 Z" fill={`url(#${id}a)`} />
      <path d="M24 44.8 Q26.6 26.6 44.8 24 Q22.8 22.8 24 44.8 Z" fill={`url(#${id}b)`} />
    </svg>
  )
}
