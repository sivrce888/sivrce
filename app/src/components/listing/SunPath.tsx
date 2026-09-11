'use client'

import { useId, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Sun } from 'lucide-react'
import { useI18n, type DictKey } from '@/lib/i18n/context'
import {
  compass8, dayLengthMinutes, formatSunTime, sunPosition, sunTimes,
  timeZoneFor, wallInstant, wallMinutesOfDay, type SunDay,
} from '@/lib/sun'

const ease = [0.21, 0.65, 0.2, 1] as const

// Arc geometry (viewBox units) — fixed box keeps season toggling shift-free.
const W = 320
const H = 178
const HORIZON = 98
const TOP = 16
const SAMPLES = 64

// Compass band under the arc: azimuth ruler E→S→W. Fixed 40–320° scale keeps
// the winter (narrow) and summer (wide) tracks visually comparable.
// ponytail: covers Georgia + most temperate latitudes; garbage coords render
// no paths at all, so no clamping story is needed beyond azX itself.
const BY = 148 // ruler line y
const AZ_MIN = 40
const AZ_MAX = 320
const azX = (az: number) =>
  10 + ((Math.min(AZ_MAX, Math.max(AZ_MIN, az)) - AZ_MIN) / (AZ_MAX - AZ_MIN)) * (W - 20)

type Season = 'winter' | 'today' | 'summer'
const SEASONS: readonly Season[] = ['winter', 'today', 'summer']

const DIR_KEYS = [
  'detail.sunDirN', 'detail.sunDirNE', 'detail.sunDirE', 'detail.sunDirSE',
  'detail.sunDirS', 'detail.sunDirSW', 'detail.sunDirW', 'detail.sunDirNW',
] as const satisfies readonly DictKey[]

type PositionedDay = SunDay & { lat: number; lng: number }

/** Polyline of the sun between sunrise and sunset, y scaled to that day's max altitude. */
// ponytail: 64 straight segments read as a smooth arc at card size; a B-spline
// would only bloat the bundle. Upgrade path: catmull-rom if the box ever grows.
function arcPaths(day: PositionedDay): {
  line: string
  fill: string
  apexY: number
  /** compass-band track endpoints (x of sunrise/sunset azimuth) */
  bandX1: number
  bandX2: number
} | null {
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
  return {
    line,
    fill: `${line} L${W} ${HORIZON} L0 ${HORIZON} Z`,
    apexY: y(day.noonAltitude),
    bandX1: azX(sunPosition(day.lat, day.lng, day.sunrise).azimuth),
    bandX2: azX(sunPosition(day.lat, day.lng, day.sunset).azimuth),
  }
}

/** Sun marker at an instant — null before sunrise / after sunset. */
function markerAt(day: PositionedDay, when: Date): { x: number; y: number } | null {
  if (!day.sunrise || !day.sunset || when < day.sunrise || when > day.sunset) return null
  const t = (when.getTime() - day.sunrise.getTime()) / (day.sunset.getTime() - day.sunrise.getTime())
  const { altitude } = sunPosition(day.lat, day.lng, when)
  return {
    x: t * W,
    y: HORIZON - Math.max(altitude, 0) * ((HORIZON - TOP) / Math.max(day.noonAltitude, 1)),
  }
}

export default function SunPath({ lat, lng }: { lat: number; lng: number }) {
  const { t, lang } = useI18n()
  const [season, setSeason] = useState<Season>('today')
  const gradId = useId()
  // ponytail: "today"/"now" frozen at mount — a listing view outlives midnight
  // only in edge cases; recompute per navigation is enough (no timer needed).
  const [now] = useState(() => new Date())
  const tz = timeZoneFor(lat, lng)

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
  const len = dayLengthMinutes(day)

  // Scrubber — listing-local wall-clock minutes (same as the map shadow scrubber).
  const riseMin = day.sunrise ? wallMinutesOfDay(day.sunrise, tz) : 0
  const setMin = day.sunset ? wallMinutesOfDay(day.sunset, tz) : 0
  const [scrubMin, setScrubMin] = useState(() =>
    Math.min(setMin, Math.max(riseMin, wallMinutesOfDay(now, tz))),
  )
  const pickSeason = (s: Season) => {
    setSeason(s)
    const d = days[s]
    const r = d.sunrise ? wallMinutesOfDay(d.sunrise, tz) : 0
    const e = d.sunset ? wallMinutesOfDay(d.sunset, tz) : 0
    setScrubMin(s === 'today'
      ? Math.min(e, Math.max(r, wallMinutesOfDay(now, tz)))
      : wallMinutesOfDay(d.noon, tz))
  }

  // Anchor to the selected day (solstice noon), not `now` — the scrub instant
  // must ride the same calendar date the arc was computed for.
  const when = useMemo(() => wallInstant(scrubMin, day.noon, tz), [scrubMin, day.noon, tz])
  const pos = useMemo(() => sunPosition(lat, lng, when), [lat, lng, when])
  const marker = paths ? markerAt(day, when) : null
  const timeTxt = formatSunTime(when, lang, tz)
  const dirTxt = t(DIR_KEYS[compass8(pos.azimuth)])
  const altDeg = Math.max(0, Math.round(pos.altitude))
  const up = pos.altitude > 0

  const stats: [string, string][] = [
    [t('detail.sunRise'), day.sunrise ? formatSunTime(day.sunrise, lang, tz) : '—'],
    [t('detail.sunNoon'), `${formatSunTime(day.noon, lang, tz)} · ${Math.round(day.noonAltitude)}°`],
    [t('detail.sunSet'), day.sunset ? formatSunTime(day.sunset, lang, tz) : '—'],
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
        {/* season toggle — group + pressed (no tabpanel exists, so tablist/tab misleads AT) */}
        <div className="flex rounded-control bg-sv-ink/[0.05] p-1" role="group" aria-label={t('detail.sunTitle')}>
          {SEASONS.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={season === s}
              onClick={() => pickSeason(s)}
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
        <rect x="0" y={HORIZON} width={W} height={14} className="fill-sv-ink/[0.04]" />
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
            {/* horizon dots: sunrise · noon · sunset — explicit initial: motion's
                first client render otherwise writes cx/cy="undefined" */}
            <circle cx={0} cy={HORIZON} r="2.5" className="fill-sv-orange/50" />
            <circle cx={W} cy={HORIZON} r="2.5" className="fill-sv-orange/50" />
            <motion.circle
              initial={{ cy: paths.apexY }}
              animate={{ cy: paths.apexY }}
              transition={{ duration: 0.6, ease }}
              cx={W / 2}
              cy={paths.apexY}
              r="2.5"
              className="fill-sv-orange/50"
            />

            {/* compass band — where the sun sits in the E→S→W plane */}
            <line x1={8} y1={BY} x2={W - 8} y2={BY} className="stroke-sv-ink/10" strokeWidth="1" />
            {([90, 180, 270] as const).map((az) => (
              <g key={az}>
                <line x1={azX(az)} y1={BY - 4} x2={azX(az)} y2={BY + 4} className="stroke-sv-ink/20" strokeWidth="1" />
                <text x={azX(az)} y={BY + 17} textAnchor="middle" className="fill-sv-ink/50 text-[10px] font-black">
                  {t(az === 90 ? 'detail.sunBE' : az === 180 ? 'detail.sunBS' : 'detail.sunBW')}
                </text>
              </g>
            ))}
            <motion.line
              initial={{ x1: paths.bandX1, x2: paths.bandX2 }}
              animate={{ x1: paths.bandX1, x2: paths.bandX2 }}
              transition={{ duration: 0.6, ease }}
              y1={BY}
              y2={BY}
              className="stroke-sv-orange"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <motion.circle
              initial={{ cx: paths.bandX1 }}
              animate={{ cx: paths.bandX1 }}
              transition={{ duration: 0.6, ease }}
              cy={BY}
              r="2.5"
              className="fill-sv-orange/50"
            />
            <motion.circle
              initial={{ cx: paths.bandX2 }}
              animate={{ cx: paths.bandX2 }}
              transition={{ duration: 0.6, ease }}
              cy={BY}
              r="2.5"
              className="fill-sv-orange/50"
            />
          </>
        )}
        {/* scrub markers — plain attributes: the range input drives these, no spring lag */}
        {marker && (
          <>
            <circle cx={marker.x} cy={marker.y} r="11" className="fill-sv-orange/25" />
            <circle cx={marker.x} cy={marker.y} r="4.5" className="fill-sv-orange" />
            <circle cx={azX(pos.azimuth)} cy={BY} r="11" className="fill-sv-orange/25" />
            <circle cx={azX(pos.azimuth)} cy={BY} r="4.5" className="fill-sv-orange" />
          </>
        )}
      </svg>

      {/* native range = free touch, keyboard and AT semantics for the scrubber */}
      {paths && riseMin < setMin && (
        <>
          <input
            type="range"
            min={riseMin}
            max={setMin}
            step={5}
            value={scrubMin}
            onChange={(e) => setScrubMin(Number(e.target.value))}
            aria-label={t('detail.sunScrubAria')}
            aria-valuetext={`${timeTxt} · ${altDeg}° · ${dirTxt}`}
            className="sv-range mt-4 w-full"
          />
          {up ? (
            <div className="mt-4 grid grid-cols-3 gap-x-4">
              <div>
                <div className="text-[11px] font-black uppercase tracking-wider text-sv-ink/60">{t('detail.sunTime')}</div>
                <div className="mt-0.5 text-[16px] font-black tabular-nums tracking-tight text-sv-ink">{timeTxt}</div>
              </div>
              <div>
                <div className="text-[11px] font-black uppercase tracking-wider text-sv-ink/60">{t('detail.sunElev')}</div>
                <div className="mt-0.5 text-[16px] font-black tabular-nums tracking-tight text-sv-ink">{altDeg}°</div>
              </div>
              <div>
                <div className="text-[11px] font-black uppercase tracking-wider text-sv-ink/60">{t('detail.sunDirL')}</div>
                <div className="mt-0.5 break-words text-[15px] font-black leading-snug tracking-tight text-sv-ink">{dirTxt}</div>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-center text-[14px] font-extrabold text-sv-ink/60">{t('detail.sunNight')}</p>
          )}
        </>
      )}

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
