/**
 * SIVRCE — country flags for the language switcher.
 * Pure inline SVG, circular crop, hairline ring for definition on any
 * surface. No emoji (BRAND.md: vector-only UI), no network requests.
 */

import type { ReactNode } from 'react'

export type FlagCode = 'ge' | 'gb' | 'ru' | 'ua' | 'am' | 'az' | 'il' | 'sa' | 'tr'

const FLAG_ART: Record<FlagCode, ReactNode> = {
  /* Georgia — white field, large red cross, four small crosses */
  ge: (
    <>
      <rect x="0" y="3" width="24" height="18" fill="#ffffff" />
      <rect x="10" y="3" width="4" height="18" fill="#ff0000" />
      <rect x="0" y="10" width="24" height="4" fill="#ff0000" />
      {[
        [5, 6.5],
        [19, 6.5],
        [5, 16.5],
        [19, 16.5],
      ].map(([cx, cy]) => (
        <g key={`${cx}-${cy}`} fill="#ff0000">
          <rect x={cx - 0.55} y={cy - 1.9} width="1.1" height="3.8" />
          <rect x={cx - 1.9} y={cy - 0.55} width="3.8" height="1.1" />
        </g>
      ))}
    </>
  ),
  /* United Kingdom — Union Jack */
  gb: (
    <>
      <rect x="0" y="3" width="24" height="18" fill="#012169" />
      <path d="M0 3 L24 21 M24 3 L0 21" stroke="#ffffff" strokeWidth="3.4" />
      <path d="M0 3 L24 21 M24 3 L0 21" stroke="#C8102E" strokeWidth="1.15" />
      <rect x="10.1" y="3" width="3.8" height="18" fill="#ffffff" />
      <rect x="0" y="10.1" width="24" height="3.8" fill="#ffffff" />
      <rect x="10.85" y="3" width="2.3" height="18" fill="#C8102E" />
      <rect x="0" y="10.85" width="24" height="2.3" fill="#C8102E" />
    </>
  ),
  /* Russia — white / blue / red tricolor */
  ru: (
    <>
      <rect x="0" y="3" width="24" height="6" fill="#ffffff" />
      <rect x="0" y="9" width="24" height="6" fill="#0039a6" />
      <rect x="0" y="15" width="24" height="6" fill="#d52b1e" />
    </>
  ),
  /* Ukraine — blue over yellow */
  ua: (
    <>
      <rect x="0" y="3" width="24" height="9" fill="#005bbb" />
      <rect x="0" y="12" width="24" height="9" fill="#ffd500" />
    </>
  ),
  /* Armenia — red / blue / orange tricolor */
  am: (
    <>
      <rect x="0" y="3" width="24" height="6" fill="#d90012" />
      <rect x="0" y="9" width="24" height="6" fill="#0033a0" />
      <rect x="0" y="15" width="24" height="6" fill="#f2a800" />
    </>
  ),
  /* Azerbaijan — blue / red / green with white crescent + 8-point star */
  az: (
    <>
      <rect x="0" y="3" width="24" height="6" fill="#00b5e2" />
      <rect x="0" y="9" width="24" height="6" fill="#ef3340" />
      <rect x="0" y="15" width="24" height="6" fill="#509e2f" />
      <circle cx="11" cy="12" r="2.6" fill="#ffffff" />
      <circle cx="11.9" cy="12" r="2.1" fill="#ef3340" />
      <g fill="#ffffff">
        <rect x="14.4" y="10.6" width="2.8" height="2.8" />
        <rect x="14.4" y="10.6" width="2.8" height="2.8" transform="rotate(45 15.8 12)" />
      </g>
    </>
  ),
  /* Israel — white field, blue stripes, Star of David */
  il: (
    <>
      <rect x="0" y="3" width="24" height="18" fill="#ffffff" />
      <rect x="0" y="5" width="24" height="2.6" fill="#0038b8" />
      <rect x="0" y="16.4" width="24" height="2.6" fill="#0038b8" />
      <g fill="none" stroke="#0038b8" strokeWidth="0.9">
        <path d="M12 8.1 L15.3 13.9 L8.7 13.9 Z" />
        <path d="M12 15.9 L8.7 10.1 L15.3 10.1 Z" />
      </g>
    </>
  ),
  /* Saudi Arabia — green field, shahada band + sword */
  sa: (
    <>
      <rect x="0" y="3" width="24" height="18" fill="#006c35" />
      <g stroke="#ffffff" strokeWidth="1" strokeLinecap="round">
        <path d="M6.5 10.2 H17.5" />
        <path d="M8 12 H16" opacity="0.85" />
      </g>
      <path d="M6 15.4 H17" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M17 15.4 L18.6 14.6" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
    </>
  ),
  /* Turkey — red field, white crescent + star */
  tr: (
    <>
      <rect x="0" y="3" width="24" height="18" fill="#e30a17" />
      <circle cx="10.3" cy="12" r="3.1" fill="#ffffff" />
      <circle cx="11.3" cy="12" r="2.5" fill="#e30a17" />
      <path
        d="M16.4 10.3 L16.9 11.8 L18.5 11.85 L17.2 12.85 L17.6 14.4 L16.4 13.5 L15.2 14.4 L15.6 12.85 L14.3 11.85 L15.9 11.8 Z"
        fill="#ffffff"
      />
    </>
  ),
}

export function Flag({ code, size = 16 }: { code: FlagCode; size?: number }) {
  return (
    <span
      aria-hidden
      className="inline-block shrink-0 overflow-hidden rounded-full shadow-[inset_0_0_0_1px_rgba(10,16,48,0.12)]"
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 24 24" width={size} height={size}>
        <defs>
          <clipPath id={`sv-flag-clip-${code}`}>
            <circle cx="12" cy="12" r="12" />
          </clipPath>
        </defs>
        <g clipPath={`url(#sv-flag-clip-${code})`}>{FLAG_ART[code]}</g>
      </svg>
    </span>
  )
}
