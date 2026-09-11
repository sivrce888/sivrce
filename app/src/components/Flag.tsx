/**
 * SIVRCE — country flags for the language switcher.
 * Pure inline SVG, circular crop, hairline ring for definition on any
 * surface. No emoji (BRAND.md: vector-only UI), no network requests.
 */

import type { ReactNode } from 'react'

export type FlagCode = 'ge' | 'gb' | 'ru' | 'ua' | 'am' | 'az' | 'il' | 'sa' | 'tr' | 'de' | 'ae' | 'fr' | 'es' | 'it' | 'us' | 'ca' | 'gr' | 'cy' | 'nl' | 'pt' | 'ch'

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
  /* Germany — black / red / gold tricolor */
  de: (
    <>
      <rect x="0" y="3" width="24" height="6" fill="#151515" />
      <rect x="0" y="9" width="24" height="6" fill="#dd0000" />
      <rect x="0" y="15" width="24" height="6" fill="#ffce00" />
    </>
  ),
  /* UAE — red hoist, green / white / black bands */
  ae: (
    <>
      <rect x="0" y="3" width="24" height="6" fill="#00732f" />
      <rect x="0" y="9" width="24" height="6" fill="#ffffff" />
      <rect x="0" y="15" width="24" height="6" fill="#000000" />
      <rect x="0" y="3" width="7" height="18" fill="#ff0000" />
    </>
  ),
  /* France — blue / white / red */
  fr: (
    <>
      <rect x="0" y="3" width="8" height="18" fill="#002395" />
      <rect x="8" y="3" width="8" height="18" fill="#ffffff" />
      <rect x="16" y="3" width="8" height="18" fill="#ed2939" />
    </>
  ),
  /* Spain — red / yellow / red */
  es: (
    <>
      <rect x="0" y="3" width="24" height="4.5" fill="#aa151b" />
      <rect x="0" y="7.5" width="24" height="9" fill="#f1bf00" />
      <rect x="0" y="16.5" width="24" height="4.5" fill="#aa151b" />
    </>
  ),
  /* Italy — green / white / red */
  it: (
    <>
      <rect x="0" y="3" width="8" height="18" fill="#009246" />
      <rect x="8" y="3" width="8" height="18" fill="#ffffff" />
      <rect x="16" y="3" width="8" height="18" fill="#ce2b37" />
    </>
  ),
  /* United States — simplified canton + stripes */
  us: (
    <>
      <rect x="0" y="3" width="24" height="18" fill="#bf0a30" />
      <rect x="0" y="5.25" width="24" height="2.25" fill="#ffffff" />
      <rect x="0" y="9.75" width="24" height="2.25" fill="#ffffff" />
      <rect x="0" y="14.25" width="24" height="2.25" fill="#ffffff" />
      <rect x="0" y="3" width="11" height="10.5" fill="#002868" />
    </>
  ),
  /* Canada — red / white / red */
  ca: (
    <>
      <rect x="0" y="3" width="6" height="18" fill="#ff0000" />
      <rect x="6" y="3" width="12" height="18" fill="#ffffff" />
      <rect x="18" y="3" width="6" height="18" fill="#ff0000" />
      <path d="M12 7.2 L13.1 10.2 L16.4 10.2 L13.7 12.1 L14.8 15.1 L12 13.2 L9.2 15.1 L10.3 12.1 L7.6 10.2 L10.9 10.2 Z" fill="#ff0000" />
    </>
  ),
  /* Greece — blue / white stripes, canton cross */
  gr: (
    <>
      <rect x="0" y="3" width="24" height="18" fill="#ffffff" />
      <rect x="0" y="4.8" width="24" height="2" fill="#0d5eaf" />
      <rect x="0" y="8.8" width="24" height="2" fill="#0d5eaf" />
      <rect x="0" y="12.8" width="24" height="2" fill="#0d5eaf" />
      <rect x="0" y="16.8" width="24" height="2" fill="#0d5eaf" />
      <rect x="0" y="3" width="9" height="10" fill="#0d5eaf" />
      <rect x="3.5" y="3" width="2" height="10" fill="#ffffff" />
      <rect x="0" y="6.5" width="9" height="2" fill="#ffffff" />
    </>
  ),
  /* Cyprus — white field, copper silhouette */
  cy: (
    <>
      <rect x="0" y="3" width="24" height="18" fill="#ffffff" />
      <path d="M9 9.5 L13 8.5 L15.5 11 L14 14.5 L10.5 15.5 L8 13 Z" fill="#c87e2f" />
    </>
  ),
  /* Netherlands — red / white / blue */
  nl: (
    <>
      <rect x="0" y="3" width="24" height="6" fill="#ae1c28" />
      <rect x="0" y="9" width="24" height="6" fill="#ffffff" />
      <rect x="0" y="15" width="24" height="6" fill="#21468b" />
    </>
  ),
  /* Portugal — green / red with shield dot */
  pt: (
    <>
      <rect x="0" y="3" width="9.6" height="18" fill="#046a38" />
      <rect x="9.6" y="3" width="14.4" height="18" fill="#da291c" />
      <circle cx="9.6" cy="12" r="2.6" fill="#ffe900" />
      <circle cx="9.6" cy="12" r="1.2" fill="#da291c" />
    </>
  ),
  /* Switzerland — white cross on red */
  ch: (
    <>
      <rect x="0" y="3" width="24" height="18" fill="#da291c" />
      <rect x="10.6" y="7" width="2.8" height="10" fill="#ffffff" />
      <rect x="7" y="10.6" width="10" height="2.8" fill="#ffffff" />
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
