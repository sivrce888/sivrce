import type { TrendPoint } from "@/lib/admin/metrics"

const W = 600
const H = 180
const PAD_X = 10
const PAD_TOP = 18
const PAD_BOTTOM = 30
const BASE_Y = H - PAD_BOTTOM

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
]

function shortDay(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`)
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`
}

function buildGeometry(points: TrendPoint[], max: number) {
  const innerW = W - PAD_X * 2
  const innerH = BASE_Y - PAD_TOP
  const step = points.length > 1 ? innerW / (points.length - 1) : 0
  const coords = points.map((p, i) => {
    const x = PAD_X + i * step
    const y = max === 0 ? BASE_Y : BASE_Y - (p.count / max) * innerH
    return [x, y] as const
  })
  const line = coords
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ")
  const lastX = coords[coords.length - 1]?.[0] ?? PAD_X
  const area = `${line} L${lastX.toFixed(1)},${BASE_Y} L${PAD_X},${BASE_Y} Z`
  return { line, area, last: coords[coords.length - 1] }
}

/**
 * Hand-rolled accessible SVG trend chart (server component, no chart lib).
 * Renders a graceful placeholder when the whole series is zero.
 */
export function TrendChart({
  points,
  label,
}: {
  points: TrendPoint[]
  label: string
}) {
  if (points.length === 0) return null

  const total = points.reduce((s, p) => s + p.count, 0)
  const max = Math.max(0, ...points.map((p) => p.count))
  const { line, area, last } = buildGeometry(points, max)
  const firstDate = points[0]?.date ?? ""
  const lastDate = points[points.length - 1]?.date ?? ""

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`${label}: ${total} total over the last ${points.length} days, peak ${max} on the busiest day`}
        className="block h-auto w-full text-sv-blue"
      >
        <title>{label}</title>
        {/* gridlines */}
        {[0.5, 1].map((f) => (
          <line
            key={f}
            x1={PAD_X}
            x2={W - PAD_X}
            y1={BASE_Y - f * (BASE_Y - PAD_TOP)}
            y2={BASE_Y - f * (BASE_Y - PAD_TOP)}
            className="stroke-sv-ink/8"
            strokeWidth="1"
            strokeDasharray="3 5"
          />
        ))}
        <line
          x1={PAD_X}
          x2={W - PAD_X}
          y1={BASE_Y}
          y2={BASE_Y}
          className="stroke-sv-ink/15"
          strokeWidth="1"
        />
        {max === 0 ? (
          <text
            x={W / 2}
            y={H / 2 - 6}
            textAnchor="middle"
            className="fill-sv-ink/35 text-[13px] font-semibold"
          >
            No activity in the last {points.length} days
          </text>
        ) : (
          <>
            <path d={area} fill="currentColor" opacity="0.08" />
            <path
              d={line}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {last ? (
              <circle
                cx={last[0]}
                cy={last[1]}
                r="3.5"
                fill="currentColor"
                className="stroke-white"
                strokeWidth="1.5"
              />
            ) : null}
          </>
        )}
        {/* axis labels */}
        <text
          x={PAD_X}
          y={H - 10}
          className="fill-sv-ink/40 text-[11px] font-medium"
        >
          {shortDay(firstDate)}
        </text>
        <text
          x={W - PAD_X}
          y={H - 10}
          textAnchor="end"
          className="fill-sv-ink/40 text-[11px] font-medium"
        >
          {shortDay(lastDate)}
        </text>
        {max > 0 ? (
          <text
            x={W - PAD_X}
            y={PAD_TOP - 5}
            textAnchor="end"
            className="fill-sv-ink/40 text-[11px] font-semibold tabular-nums"
          >
            peak {max}/day
          </text>
        ) : null}
      </svg>
    </div>
  )
}
