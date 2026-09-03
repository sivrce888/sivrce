import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { ArrowDownRight, ArrowUpRight } from "lucide-react"

const TONES = {
  blue: "text-sv-blue",
  orange: "text-sv-orange",
  ink: "text-sv-ink",
  success: "text-emerald-600",
  danger: "text-rose-600",
} as const

/** Period-over-period % change; flat values collapse to a neutral dot. */
function Delta({ pct, title }: { pct: number; title?: string }) {
  const flat = Math.abs(pct) < 0.05
  const Icon = flat ? null : pct > 0 ? ArrowUpRight : ArrowDownRight
  return (
    <span
      title={title}
      className={`inline-flex shrink-0 items-center gap-0.5 text-[12px] font-bold tabular-nums ${
        flat ? "text-sv-ink/40" : pct > 0 ? "text-emerald-600" : "text-rose-600"
      }`}
    >
      {Icon ? <Icon className="h-3.5 w-3.5" /> : "·"}
      {flat ? "0%" : `${Math.abs(Math.round(pct * 10) / 10)}%`}
    </span>
  )
}

/** Tiny inline trend — pure SVG, answers "is this flowing up or down?". */
function Sparkline({ points }: { points: number[] }) {
  const w = 84
  const h = 30
  const max = Math.max(...points, 1)
  const step = points.length > 1 ? w / (points.length - 1) : w
  const y = (p: number) => h - 3 - (p / max) * (h - 6)
  const coords = points.map((p, i) => `${(i * step).toFixed(1)},${y(p).toFixed(1)}`)
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width={w}
      height={h}
      aria-hidden="true"
      className="shrink-0"
    >
      <polygon
        points={`0,${h} ${coords.join(" ")} ${w},${h}`}
        fill="currentColor"
        opacity="0.08"
      />
      <polyline
        points={coords.join(" ")}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.6"
      />
    </svg>
  )
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "ink",
  delta,
  deltaTitle,
  spark,
  href,
}: {
  label: string
  value: string
  hint?: string
  icon?: LucideIcon
  tone?: keyof typeof TONES
  /** % change shown as a chip (e.g. +12.5%); omit when no honest baseline exists. */
  delta?: number | null
  deltaTitle?: string
  /** Recent series behind the card, drawn as a mini trend. */
  spark?: number[]
  /** Drill-down target — spec: no KPI is a dead-end widget. */
  href?: string
}) {
  const inner = (
    <>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[12px] font-bold tracking-[0.08em] text-sv-ink/45 uppercase">
          {label}
        </p>
        {Icon ? <Icon className={`h-4.5 w-4.5 ${TONES[tone]}`} /> : null}
      </div>
      <div className="mt-2 flex items-end justify-between gap-2">
        <p className={`text-[28px] leading-none font-extrabold tracking-tight ${TONES[tone]}`}>
          {value}
        </p>
        {spark && spark.length > 1 ? (
          <span className={TONES[tone]}>
            <Sparkline points={spark} />
          </span>
        ) : null}
      </div>
      {hint || typeof delta === "number" ? (
        <div className="mt-2 flex items-center justify-between gap-2">
          {hint ? <p className="truncate text-[12.5px] text-sv-ink/50">{hint}</p> : <span />}
          {typeof delta === "number" ? <Delta pct={delta} title={deltaTitle} /> : null}
        </div>
      ) : null}
    </>
  )

  const classes =
    "block rounded-[var(--radius-tile)] border border-sv-ink/6 bg-white p-5 shadow-[var(--shadow-card)] transition-colors"

  if (href) {
    return (
      <Link
        href={href}
        className={`${classes} hover:border-sv-blue/40 focus-visible:ring-2 focus-visible:ring-sv-blue/40 focus-visible:outline-none`}
      >
        {inner}
      </Link>
    )
  }
  return <div className={classes}>{inner}</div>
}
