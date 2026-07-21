'use client'

import { useState } from 'react'
import Image from 'next/image'
import { SERVICE_BRAND } from '@/lib/category-brand'
import type { LocalName } from '@/data/professionals'

export interface DeveloperLogoProps {
  slug: string
  name: LocalName | string
  logoUrl?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

function initials(enName: string): string {
  return enName
    .split(/\s+/)
    .map((w) => w[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function DeveloperLogo({
  slug,
  name,
  logoUrl,
  size = 'md',
  className = '',
}: DeveloperLogoProps) {
  const [error, setError] = useState(false)
  const brand = SERVICE_BRAND.developers
  const displayName = typeof name === 'string' ? name : name.en || name.ka || slug
  const resolvedLogo = logoUrl || `/images/developers/${slug}.svg`

  const sizeClasses = {
    sm: 'h-10 w-10 text-[14px]',
    md: 'h-14 w-14 text-[18px]',
    lg: 'h-20 w-20 md:h-24 md:w-24 text-[28px]',
  }[size]

  const pxSizes = {
    sm: '40px',
    md: '56px',
    lg: '96px',
  }[size]

  if (error) {
    return (
      <span
        aria-hidden
        className={`grid shrink-0 place-items-center rounded-module font-black shadow-sm ${sizeClasses} ${className}`}
        style={{ color: brand.hue, backgroundColor: brand.chip }}
      >
        {initials(displayName)}
      </span>
    )
  }

  return (
    <span
      aria-hidden
      className={`relative grid shrink-0 place-items-center overflow-hidden rounded-module border border-sv-ink/[0.08] bg-sv-surface shadow-sm ${sizeClasses} ${className}`}
    >
      <Image
        src={resolvedLogo}
        alt={displayName}
        fill
        sizes={pxSizes}
        className="object-contain p-1.5 transition-transform duration-300 group-hover:scale-105"
        onError={() => setError(true)}
      />
    </span>
  )
}
