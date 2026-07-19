import LocalizedLink from '@/components/LocalizedLink'

/* ponytail: pure SVG + LocalizedLink only — no framer-motion, so Footer/Navbar
   don't pull the whole animation lib just for the logo. */

/* Aurora Spark (BRAND.md §2 · logo/v4 · board-faithful).
   4-point star + star void, evenodd; brand flow gradient → orange tip.
   Optical small master ≤32px. Static gradient id — server-safe. */
const MARK =
  'M24 3.2C24 18.87 29.13 24 44.8 24C29.13 24 24 29.13 24 44.8C24 29.13 18.87 24 3.2 24C18.87 24 24 18.87 24 3.2ZM24 19.4C24 21.95 26.05 24 28.6 24C26.05 24 24 26.05 24 28.6C24 26.05 21.95 24 19.4 24C21.95 24 24 21.95 24 19.4Z'
const MARK_SMALL =
  'M24 2.6C24 16.05 31.95 24 45.4 24C31.95 24 24 31.95 24 45.4C24 31.95 16.05 24 2.6 24C16.05 24 24 16.05 24 2.6ZM24 20.4C24 22.37 25.63 24 27.6 24C25.63 24 24 25.63 24 27.6C24 25.63 22.37 24 20.4 24C22.37 24 24 22.37 24 20.4Z'

export function LogoMark({ size = 36 }: { size?: number }) {
  const d = size <= 32 ? MARK_SMALL : MARK
  const glossy = size > 32
  return (
    <span
      className="relative block shrink-0 transition-transform duration-300 group-hover:scale-[1.06] group-active:scale-95"
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden>
        <defs>
          <linearGradient id="sv4g" x1="24" y1="3.2" x2="24" y2="44.8" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="var(--sv-blue-light)" />
            <stop offset="0.34" stopColor="var(--sv-blue)" />
            <stop offset="0.58" stopColor="var(--sv-violet)" />
            <stop offset="0.8" stopColor="var(--sv-orange-deep)" />
            <stop offset="1" stopColor="var(--sv-orange)" />
          </linearGradient>
          {glossy && (
            <>
              <clipPath id="sv4clip">
                <path d={d} fillRule="evenodd" />
              </clipPath>
              <linearGradient id="sv4sheen" x1="14" y1="4" x2="34" y2="40" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#fff" stopOpacity=".45" />
                <stop offset=".38" stopColor="#fff" stopOpacity=".14" />
                <stop offset=".58" stopColor="#fff" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="sv4shade" x1="36" y1="40" x2="20" y2="14" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="var(--sv-navy)" stopOpacity=".28" />
                <stop offset=".5" stopColor="var(--sv-navy)" stopOpacity="0" />
              </linearGradient>
            </>
          )}
        </defs>
        <path d={d} fill="url(#sv4g)" fillRule="evenodd" />
        {glossy && (
          <g clipPath="url(#sv4clip)">
            <rect width="48" height="48" fill="url(#sv4sheen)" />
            <rect width="48" height="48" fill="url(#sv4shade)" />
          </g>
        )}
      </svg>
    </span>
  )
}

/* Master lockup wordmark — outlined Manrope 800 paths from
   logo/assets/sivrce-wordmark.svg. Font units → grid: XH=25 / UPMXH=1080.
   Ink box includes i-dot (−1470) + round overshoot (+30), not bare x-height —
   old `0 0 W 25` viewBox clipped tops/bottoms. */
const WM_S = 25 / 1080
const WM_W = 6038 * WM_S // 139.7685…
const WM_BASE = 25
const WM_TOP = -1470 * WM_S + WM_BASE // i-dot
const WM_BOT = 30 * WM_S + WM_BASE // s/c/e overshoot
/* Pad so viewBox mid = x-height mid (12.5) → flex items-center matches lockup. */
const WM_PAD = Math.max(WM_BASE / 2 - WM_TOP, WM_BOT - WM_BASE / 2)
const WM_VB_Y = WM_BASE / 2 - WM_PAD
const WM_H = WM_PAD * 2

function LogoWordmark({ light }: { light: boolean }) {
  // Lockup: 1 grid unit = mark/48 px → x-height stays 25/48 of mark.
  const mark = 36
  const h = (mark * WM_H) / 48
  const w = (mark * WM_W) / 48
  return (
    <svg
      viewBox={`0 ${WM_VB_Y} ${WM_W} ${WM_H}`}
      height={h}
      width={w}
      overflow="visible"
      aria-hidden
      className={`shrink-0 overflow-visible ${light ? 'text-white' : 'text-sv-ink'}`}
    >
      <g transform={`translate(0 ${WM_BASE}) scale(${WM_S})`}>
        <path d="M562.0 30Q358.0 30 232.5 -62.5Q107.0 -155 80.0 -324L358.0 -366Q375.0 -290 433.5 -247.0Q492.0 -204 582.0 -204Q656.0 -204 696.0 -232.5Q736.0 -261 736.0 -312Q736.0 -344 720.0 -363.5Q704.0 -383 648.5 -402.0Q593.0 -421 476.0 -452Q344.0 -486 265.0 -528.0Q186.0 -570 151.0 -628.5Q116.0 -687 116.0 -770Q116.0 -874 169.0 -950.5Q222.0 -1027 318.5 -1068.5Q415.0 -1110 546.0 -1110Q673.0 -1110 771.0 -1071.0Q869.0 -1032 929.5 -960.0Q990.0 -888 1004.0 -790L726.0 -740Q719.0 -800 674.0 -835.0Q629.0 -870 552.0 -876Q477.0 -881 431.5 -856.0Q386.0 -831 386.0 -784Q386.0 -756 405.5 -737.0Q425.0 -718 486.5 -698.0Q548.0 -678 674.0 -646Q797.0 -614 871.5 -571.5Q946.0 -529 980.0 -469.5Q1014.0 -410 1014.0 -326Q1014.0 -160 894.0 -65.0Q774.0 30 562.0 30Z" fill="currentColor" />
        <path d="M1164.0 -1230V-1470H1436.0V-1230ZM1164.0 0V-1080H1436.0V0Z" fill="currentColor" />
        <path d="M1938.0 0 1546.0 -1080H1818.0L2074.0 -332L2330.0 -1080H2602.0L2210.0 0Z" fill="currentColor" />
        <path d="M2692.0 0V-1080H2932.0V-816L2906.0 -850Q2927.0 -906 2962.0 -952.0Q2997.0 -998 3048.0 -1028Q3087.0 -1052 3133.0 -1065.5Q3179.0 -1079 3228.0 -1082.5Q3277.0 -1086 3326.0 -1080V-826Q3281.0 -840 3221.5 -835.5Q3162.0 -831 3114.0 -808Q3066.0 -786 3033.0 -749.5Q3000.0 -713 2983.0 -663.5Q2966.0 -614 2966.0 -552V0Z" fill="currentColor" />
        <path d="M3882.0 30Q3714.0 30 3594.0 -45.0Q3474.0 -120 3410.0 -249.0Q3346.0 -378 3346.0 -540Q3346.0 -704 3412.5 -833.0Q3479.0 -962 3600.0 -1036.0Q3721.0 -1110 3886.0 -1110Q4077.0 -1110 4206.5 -1013.5Q4336.0 -917 4372.0 -750L4100.0 -678Q4076.0 -762 4016.5 -809.0Q3957.0 -856 3882.0 -856Q3796.0 -856 3741.0 -814.5Q3686.0 -773 3660.0 -701.5Q3634.0 -630 3634.0 -540Q3634.0 -399 3696.5 -311.5Q3759.0 -224 3882.0 -224Q3974.0 -224 4022.0 -266.0Q4070.0 -308 4094.0 -386L4372.0 -328Q4326.0 -156 4198.0 -63.0Q4070.0 30 3882.0 30Z" fill="currentColor" />
        <path d="M4954.0 30Q4788.0 30 4661.5 -41.5Q4535.0 -113 4463.5 -238.5Q4392.0 -364 4392.0 -526Q4392.0 -703 4462.0 -834.0Q4532.0 -965 4655.0 -1037.5Q4778.0 -1110 4938.0 -1110Q5108.0 -1110 5227.0 -1030.0Q5346.0 -950 5403.0 -805.0Q5460.0 -660 5443.0 -464H5174.0V-564Q5174.0 -729 5121.5 -801.5Q5069.0 -874 4950.0 -874Q4811.0 -874 4745.5 -789.5Q4680.0 -705 4680.0 -540Q4680.0 -389 4745.5 -306.5Q4811.0 -224 4938.0 -224Q5018.0 -224 5075.0 -259.0Q5132.0 -294 5162.0 -360L5434.0 -282Q5373.0 -134 5241.5 -52.0Q5110.0 30 4954.0 30ZM4596.0 -464V-666H5312.0V-464Z" fill="currentColor" />
        <path d="M5582.0 0V-272H5854.0V0Z" fill="var(--sv-orange)" />
      </g>
    </svg>
  )
}

export function Logo({ light = false, compact = false, href = "/" }: { light?: boolean; compact?: boolean; href?: string }) {
  // Lockup contract (logo/README.md): gap 15/48 of mark · x-height 25/48 of
  // mark · wordmark optically centered on the 48-unit grid.
  const mark = 36
  return (
    <LocalizedLink
      href={href}
      className="group flex items-center overflow-visible"
      style={{ gap: (mark * 15) / 48 }}
      aria-label="სივრცე — მთავარი"
    >
      <LogoMark size={mark} />
      {!compact && <LogoWordmark light={light} />}
    </LocalizedLink>
  )
}
