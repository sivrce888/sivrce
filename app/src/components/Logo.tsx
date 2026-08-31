import LocalizedLink from '@/components/LocalizedLink'

/* Board 1:1 rasters (logo/board1x1 → public/logo). Wordmark font is baked in — not Manrope outlines. */
const LOCK_W = 1279
const LOCK_H = 415
const MARK_W = 388
const MARK_H = 415

export function LogoMark({ size = 36 }: { size?: number }) {
  const w = Math.round((size * MARK_W) / MARK_H)
  return (
    // eslint-disable-next-line @next/next/no-img-element -- ponytail: raw PNG stays crisp; Next Image avif/q75 softens board font
    <img
      src="/logo/mark.png"
      alt=""
      width={w}
      height={size}
      className="block shrink-0 object-contain transition-transform duration-300 group-hover:scale-[1.06] group-active:scale-95"
      decoding="async"
      fetchPriority="high"
    />
  )
}

export function Logo({
  light = false,
  compact = false,
  adaptive = false,
  href = '/',
  size = 36,
}: {
  light?: boolean
  compact?: boolean
  /** Ink in light theme, white in dark — homepage hero over day/night sky */
  adaptive?: boolean
  href?: string
  size?: number
}) {
  const mark = size
  const lockW = Math.round((mark * LOCK_W) / LOCK_H)
  const imgClass =
    'shrink-0 object-contain transition-transform duration-300 group-hover:scale-[1.02] group-active:scale-95'
  return (
    <LocalizedLink
      href={href}
      className="group flex items-center overflow-visible"
      aria-label="სივრცე — მთავარი"
    >
      {compact ? (
        <LogoMark size={mark} />
      ) : adaptive ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- ponytail: raw PNG stays crisp; Next Image avif/q75 softens board font */}
          <img
            src="/logo/lockup-ink.png"
            alt=""
            width={lockW}
            height={mark}
            className={`${imgClass} dark:hidden`}
            decoding="async"
            fetchPriority="high"
          />
          {/* eslint-disable-next-line @next/next/no-img-element -- ponytail: raw PNG stays crisp; Next Image avif/q75 softens board font */}
          <img
            src="/logo/lockup-white.png"
            alt=""
            width={lockW}
            height={mark}
            className={`${imgClass} hidden dark:block`}
            decoding="async"
            fetchPriority="high"
          />
        </>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- ponytail: raw PNG stays crisp; Next Image avif/q75 softens board font
        <img
          src={light ? '/logo/lockup-white.png' : '/logo/lockup-ink.png'}
          alt=""
          width={lockW}
          height={mark}
          className={imgClass}
          decoding="async"
          fetchPriority="high"
        />
      )}
    </LocalizedLink>
  )
}
