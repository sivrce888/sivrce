import { forwardRef } from 'react'
import type { LucideProps } from 'lucide-react'

/**
 * Houses-for-parties mark. Lucide Home geometry + 3-ray burst
 * (venue, not PartyPopper). Same stroke as the rest of the catalog.
 */
export const PartyHouseIcon = forwardRef<SVGSVGElement, LucideProps>(
  function PartyHouseIcon(
    { color = 'currentColor', size = 24, strokeWidth = 2, absoluteStrokeWidth, className, ...props },
    ref,
  ) {
    const sw =
      absoluteStrokeWidth && typeof strokeWidth === 'number' && typeof size === 'number'
        ? (strokeWidth * 24) / size
        : strokeWidth
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden
        {...props}
      >
        <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
        <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <path d="m18.7 4.3 1.6-1.6" />
        <path d="M20.1 5.3h1.7" />
        <path d="M19.2 2.7 19.7 1.3" />
      </svg>
    )
  },
)
