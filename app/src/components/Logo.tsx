import LocalizedLink from '@/components/LocalizedLink'

/* Board 1:1 rasters (logo/board1x1 → public/logo). Wordmark font is baked in — not Manrope outlines. */
const LOCK_W = 729
const LOCK_H = 246
const MARK_W = 221
const MARK_H = 246

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
  href = '/',
}: {
  light?: boolean
  compact?: boolean
  href?: string
}) {
  const mark = 36
  const lockW = Math.round((mark * LOCK_W) / LOCK_H)
  return (
    <LocalizedLink
      href={href}
      className="group flex items-center overflow-visible"
      aria-label="სივრცე — მთავარი"
    >
      {compact ? (
        <LogoMark size={mark} />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- ponytail: raw PNG stays crisp; Next Image avif/q75 softens board font
        <img
          src={light ? '/logo/lockup-white.png' : '/logo/lockup-ink.png'}
          alt=""
          width={lockW}
          height={mark}
          className="shrink-0 object-contain transition-transform duration-300 group-hover:scale-[1.02] group-active:scale-95"
          decoding="async"
          fetchPriority="high"
        />
      )}
    </LocalizedLink>
  )
}
