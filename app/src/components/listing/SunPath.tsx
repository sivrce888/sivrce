'use client'

import { useId, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Sun } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
import { dayLengthMinutes, formatSunTime, sunPosition, sunTimes, type SunDay } from '@/lib/sun'

const ease = [0.21, 0.65, 0.2, 1] as const

// Arc geometry (viewBox units) — fixed box keeps season toggling shift-free.
const W = 320
const H = 120
const HORIZON = 98
const TOP = 16
const SAMPLES = 64

type Season = 'winter' | 'today' | 'summer'
const SEASONS: readonly Season[] = ['winter', 'today', 'summer']

type PositionedDay = SunDay & { lat: number; lng: number }

/** Polyline of the sun between sunrise and sunset, y scaled to that day's max altitude. */
// ponytail: 64 straight segments read as a smooth arc at card size; a B-spline
// would only bloat the bundle. Upgrade path: catmull-rom if the box ever grows.
function arcPaths(day: PositionedDay): { line: string; fill: string; apexY: number } | null {
  if (!day.sunrise || !day.sunset) return null
  const span = day.sunset.getTime() - day.sunrise.getTime()
  const scale = (HORIZON - TOP) / Math.max(day.noonAltitude, 1)
  const y = (alt: number) => HORIZON - Math.max(alt, 0) * scale
  const pts: string[] = []
  for (let i = 0; i <= SAMPLES; i++) {
    const t = i / SAMPLES
    const { altitude } = sunPosition(day.lat, day.lng, new Date(day.sunrise.getTime() + span * t))
    pts.push(`${i === 0 ? 'M' : 'L'}${(t * W).toFixed(1)} ${y(altitude).toFixed(1)}`)
  }
  const line = pts.join(' ')
  return { line, fill: `${line} L${W} ${HORIZON} L0 ${HORIZON} Z`, apexY: y(day.noonAltitude) }
}

/** Sun marker for the live day — null before sunrise / after sunset. */
function nowMarker(day: PositionedDay, now: Date): { x: number; y: number } | null {
  if (!day.sunrise || !day.sunset || now < day.sunrise || now > day.sunset) return null
  const t = (now.getTime() - day.sunrise.getTime()) / (day.sunset.getTime() - day.sunrise.getTime())
  const { altitude } = sunPosition(day.lat, day.lng, now)
  return {
    x: t * W,
    y: HORIZON - Math.max(altitude, 0) * ((HORIZON - TOP) / Math.max(day.noonAltitude, 1)),
  }
}

export default function SunPath({ lat, lng }: { lat: number; lng: number }) {
  const { t } = useI18n()
  const [season, setSeason] = useState<Season>('today')
  const gradId = useId()
  // ponytail: "today"/"now" frozen at mount — a listing view outlives midnight
  // only in edge cases; recompute per navigation is enough (no timer needed).
  const [now] = useState(() => new Date())

  const days = useMemo<Record<Season, PositionedDay>>(() => {
    const year = now.getFullYear()
    return {
      today: { ...sunTimes(lat, lng, now), lat, lng },
      summer: { ...sunTimes(lat, lng, new Date(year, 5, 21)), lat, lng },
      winter: { ...sunTimes(lat, lng, new Date(year, 11, 21)), lat, lng },
    }
  }, [lat, lng, now])

  const day = days[season]
  const paths = useMemo(() => arcPaths(day), [day])
  const marker = season === 'today' ? nowMarker(day, now) : null
  const len = dayLengthMinutes(day)

  const stats: [string, string][] = [
    [t('detail.sunRise'), day.sunrise ? formatSunTime(day.sunrise, 'ka') : '—'],
    [t('detail.sunNoon'), formatSunTime(day.noon, 'ka')],
    [t('detail.sunSet'), day.sunset ? formatSunTime(day.sunset, 'ka') : '—'],
    [t('detail.sunDayLen'), len > 0 ? t('detail.sunLenVal', { h: Math.floor(len / 60), m: len % 60 }) : '—'],
  ]

  return (
    <div className="mt-8 rounded-card border border-sv-ink/[0.06] bg-sv-surface p-6 shadow-card md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-control bg-sv-orange/10">
            <Sun className="h-5 w-5 text-sv-orange" aria-hidden />
          </span>
          <div>
            <h2 className="text-[20px] font-black tracking-[-0.02em] text-sv-ink">{t('detail.sunTitle')}</h2>
            <p className="text-[12px] font-bold text-sv-ink/60">{t('detail.sunNote')}</p>
          </div>
        </div>
        <div className="flex rounded-control bg-sv-ink/[0.05] p-1" role="tablist" aria-label={t('detail.sunTitle')}>
          {SEASONS.map((s) => (
            <button
              key={s}
              role="tab"
              aria-selected={season === s}
              onClick={() => setSeason(s)}
              className={`relative rounded-lg px-3.5 py-1.5 text-[12px] font-extrabold transition-colors ${
                season === s ? 'text-white' : 'text-sv-ink/60 hover:text-sv-ink'
              }`}
            >
              {season === s && (
                <motion.span
                  layoutId="sun-seg"
                  className="absolute inset-0 rounded-lg bg-sv-blue"
                  transition={{ type: 'spring', bounce: 0.18, duration: 0.5 }}
                />
              )}
              <span className="relative z-10">
                {t(s === 'winter' ? 'detail.sunWinter' : s === 'summer' ? 'detail.sunSummer' : 'detail.sunToday')}
              </span>
            </button>
          ))}
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="mt-5 h-auto w-full" aria-hidden="true">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--sv-orange-light)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--sv-orange-light)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* ground */}
        <rect x="0" y={HORIZON} width={W} height={H - HORIZON} className="fill-sv-ink/[0.04]" />
        <line x1="0" y1={HORIZON} x2={W} y2={HORIZON} className="stroke-sv-ink/15" strokeWidth="1" />
        {paths && (
          <>
            <motion.path
              initial={false}
              animate={{ d: paths.fill }}
              transition={{ duration: 0.6, ease }}
              fill={`url(#${gradId})`}
            />
            <motion.path
              initial={false}
              animate={{ d: paths.line }}
              transition={{ duration: 0.6, ease }}
              fill="none"
              className="stroke-sv-orange"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* horizon dots: sunrise · noon · sunset */}
            <circle cx="0" cy={HORIZON} r="2.5" className="fill-sv-orange/50" />
            <circle cx={W} cy={HORIZON} r="2.5" className="fill-sv-orange/50" />
            <motion.circle
              initial={false}
              animate={{ cy: paths.apexY }}
              transition={{ duration: 0.6, ease }}
              cx={W / 2}
              r="2.5"
              className="fill-sv-orange/50"
            />
          </>
        )}
        {marker && (
          <>
            <motion.circle
              animate={{ cx: marker.x, cy: marker.y }}
              transition={{ duration: 0.6, ease }}
              r="11"
              className="fill-sv-orange/25"
            />
            <motion.circle
              animate={{ cx: marker.x, cy: marker.y }}
              transition={{ duration: 0.6, ease }}
              r="4.5"
              className="fill-sv-orange"
            />
          </>
        )}
      </svg>

      <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
        {stats.map(([label, value]) => (
          <div key={label}>
            <div className="text-[11px] font-black uppercase tracking-wider text-sv-ink/60">{label}</div>
            <div className="mt-0.5 text-[16px] font-black tabular-nums tracking-tight text-sv-ink">{value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
