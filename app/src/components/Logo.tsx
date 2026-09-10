import LocalizedLink from '@/components/LocalizedLink'
import { useI18n } from '@/lib/i18n/context'

/* Board 1:1 rasters (logo/board1x1 → public/logo). Wordmark font is baked in — not Manrope outlines. */
const LOCK_W = 1279
const LOCK_H = 415
const MARK_W = 388
const MARK_H = 415
// ponytail: bust year-long immutable CDN cache of the 117KB predecessor
const LOGO_V = 'v14k'

export function LogoMark({ size = 36 }: { size?: number }) {
  const w = Math.round((size * MARK_W) / MARK_H)
  return (
    // eslint-disable-next-line @next/next/no-img-element -- ponytail: raw PNG stays crisp; Next Image avif/q75 softens board font
    <img
      src={`/logo/mark-144.png?${LOGO_V}`}
      srcSet={`/logo/mark-144.png?${LOGO_V} 144w, /logo/mark.png?${LOGO_V} ${MARK_W}w`}
      sizes={`${w}px`}
      alt=""
      width={w}
      height={size}
      className="block shrink-0 object-contain transition-transform duration-300 group-hover:scale-[1.06] group-active:scale-95"
      decoding="async"
      fetchPriority="low"
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
  const { t } = useI18n()
  const mark = size
  const lockW = Math.round((mark * LOCK_W) / LOCK_H)
  const imgClass =
    'shrink-0 object-contain transition-transform duration-300 group-hover:scale-[1.02] group-active:scale-95'
  return (
    <LocalizedLink
      href={href}
      className="group flex items-center overflow-visible"
      aria-label={t('nav.logo')}
    >
      {compact ? (
        <LogoMark size={mark} />
      ) : adaptive ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- ponytail: raw PNG stays crisp; Next Image avif/q75 softens board font */}
          <img
            src={`/logo/lockup-ink-144.png?${LOGO_V}`}
            srcSet={`/logo/lockup-ink-144.png?${LOGO_V} 144w, /logo/lockup-ink.png?${LOGO_V} ${LOCK_W}w`}
            sizes={`${lockW}px`}
            alt=""
            width={lockW}
            height={mark}
            className={`${imgClass} dark:hidden`}
            decoding="async"
            fetchPriority="high"
          />
          {/* eslint-disable-next-line @next/next/no-img-element -- ponytail: raw PNG stays crisp; Next Image avif/q75 softens board font */}
          <img
            src={`/logo/lockup-white-144.png?${LOGO_V}`}
            srcSet={`/logo/lockup-white-144.png?${LOGO_V} 144w, /logo/lockup-white.png?${LOGO_V} ${LOCK_W}w`}
            sizes={`${lockW}px`}
            alt=""
            width={lockW}
            height={mark}
            className={`${imgClass} hidden dark:block`}
            decoding="async"
            fetchPriority="low"
          />
        </>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- ponytail: raw PNG stays crisp; Next Image avif/q75 softens board font
        <img
          src={`${light ? '/logo/lockup-white-144.png' : '/logo/lockup-ink-144.png'}?${LOGO_V}`}
          srcSet={`${light ? '/logo/lockup-white-144.png' : '/logo/lockup-ink-144.png'}?${LOGO_V} 144w, ${light ? '/logo/lockup-white.png' : '/logo/lockup-ink.png'}?${LOGO_V} ${LOCK_W}w`}
          sizes={`${lockW}px`}
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
