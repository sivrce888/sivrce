/**
 * Tbilisi district $/m² choropleth for the /market page. Pure server-rendered
 * SVG — zero client JS: native <title> tooltips, quantile-shaded sv-blue fills,
 * labels only for raions big enough to carry one. Raion polygons are committed
 * OSM-derived geometry (tbilisi-raions.json); medians are asking prices of
 * active new-development projects (getProjectRaionMedians, cached daily).
 */
import raions from '@/data/tbilisi-raions.json'
import { DISTRICTS } from '@/lib/directory-seo-lite'
import { toLatin } from '@/lib/ka-latin'
import type { RaionMedian } from '@/lib/market-stats'

type Loc = 'ka' | 'en' | 'ru' | 'de'

const L: Record<Loc, { title: string; note: string; less: string; more: string; sample: (n: number) => string }> = {
  ka: {
    title: 'თბილისი — ახალი პროექტების ფასი მ²-ზე',
    note: 'აქტიური ახალი პროექტების მედიანური მოთხოვნა',
    less: 'ნაკლები', more: 'მეტი', sample: (n) => `${n} პროექტი`,
  },
  en: {
    title: 'Tbilisi — new-development price per m²',
    note: 'Median asking price across active projects',
    less: 'less', more: 'more', sample: (n) => `${n} projects`,
  },
  ru: {
    title: 'Тбилиси — цена за м² в новостройках',
    note: 'Медианная цена предложения активных проектов',
    less: 'меньше', more: 'больше', sample: (n) => `${n} проектов`,
  },
  de: {
    title: 'Tiflis — Neubaupreis pro m²',
    note: 'Median der Angebotspreise aktiver Projekte',
    less: 'weniger', more: 'mehr', sample: (n) => `${n} Projekte`,
  },
}

/** Raions too small for an in-map label — the board below carries their numbers. */
const MIN_LABEL_SHARE = 0.03
/** Fewer than this many raions with a median shades nothing honestly. */
const MIN_RAIONS = 3
const BUCKETS = 5
const W = 720

// Geometry is static — project all rings once at module load.
const K = Math.cos((41.72 * Math.PI) / 180)
const rings = raions.features.flatMap((f) =>
  f.geometry.type === 'Polygon'
    ? [{ f: f.properties, outer: f.geometry.coordinates[0] as [number, number][] }]
    : [],
)
const allPts = rings.flatMap((r) => r.outer)
const minLon = Math.min(...allPts.map((p) => p[0]))
const maxLon = Math.max(...allPts.map((p) => p[0]))
const minLat = Math.min(...allPts.map((p) => p[1]))
const maxLat = Math.max(...allPts.map((p) => p[1]))
const spanX = Math.max((maxLon - minLon) * K, 1e-6)
const spanY = Math.max(maxLat - minLat, 1e-6)
const H = Math.round((W * spanY) / spanX)
const px = (lon: number) => ((lon - minLon) * K / spanX) * W
const py = (lat: number) => ((maxLat - lat) / spanY) * H

const pathOf = (pts: [number, number][]) =>
  pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${px(p[0]).toFixed(1)},${py(p[1]).toFixed(1)}`).join('') + 'Z'

const shoelace = (pts: [number, number][]) =>
  Math.abs(pts.reduce((s, p, i) => {
    const q = pts[(i + 1) % pts.length]
    return s + (p[0] * q[1] - q[0] * p[1])
  }, 0)) / 2

export default function TbilisiPriceMap({ rows, loc }: { rows: RaionMedian[]; loc: Loc }) {
  const t = L[loc]
  const byName = new Map(rows.map((r) => [r.district, r]))
  if (rows.length < MIN_RAIONS) return null // honest zero: too thin a sample shades nothing

  const sorted = [...rows].sort((a, b) => a.median - b.median)
  const q = (p: number) => sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))].median
  const breaks = Array.from({ length: BUCKETS - 1 }, (_, i) => q((i + 1) / BUCKETS))
  const bucketOf = (v: number) => breaks.filter((b) => v > b).length
  const fmt = (v: number) => `$${Math.round(v).toLocaleString('en-US')}`
  const totalArea = rings.reduce((s, r) => s + shoelace(r.outer), 0)
  /** Non-ka readers get the catalog name, else the national romanization. */
  const locName = (ka: string) => {
    const d = DISTRICTS.find((x) => x.ka === ka)
    return d ? (loc === 'ru' ? d.ru : d.en) : toLatin(ka)
  }

  return (
    <div className="rounded-card border border-sv-ink/[0.06] bg-sv-surface p-5 shadow-card sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-[17px] font-black tracking-[-0.01em] text-sv-ink">{t.title}</h2>
        <span className="text-[11px] font-bold uppercase tracking-wide text-sv-ink/50">{t.note}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-4 w-full" role="img" aria-label={t.title}>
        {rings.map((r) => {
          const row = byName.get(r.f.name)
          const bucket = row ? bucketOf(row.median) : null
          return (
            <path
              key={r.f.slug}
              d={pathOf(r.outer)}
              fill="var(--sv-blue)"
              fillOpacity={bucket === null ? 0.05 : 0.14 + bucket * 0.17}
              stroke="white"
              strokeWidth={1.2}
            >
              <title>{`${loc === 'ka' ? r.f.name : locName(r.f.name)}${row ? ` — ${fmt(row.median)}/m² · ${t.sample(row.n)}` : ''}`}</title>
            </path>
          )
        })}
        {rows.map((row) => {
          const r = rings.find((x) => x.f.name === row.district)
          if (!r || shoelace(r.outer) / totalArea < MIN_LABEL_SHARE) return null
          const cx = r.outer.reduce((s, p) => s + px(p[0]), 0) / r.outer.length
          const cy = r.outer.reduce((s, p) => s + py(p[1]), 0) / r.outer.length
          return (
            <text key={`l-${r.f.slug}`} x={cx} y={cy} textAnchor="middle" fontSize={12} fontWeight={800} className="fill-white [paint-order:stroke] [stroke:var(--sv-navy)] [stroke-width:2.5px]">
              {fmt(row.median)}
            </text>
          )
        })}
      </svg>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-bold text-sv-ink/60">
        <span>{t.less}</span>
        {Array.from({ length: BUCKETS }, (_, b) => (
          <span key={b} className="h-3.5 w-7 rounded-sm" style={{ background: 'var(--sv-blue)', opacity: 0.14 + b * 0.17 }} aria-hidden />
        ))}
        <span>{t.more}</span>
      </div>
    </div>
  )
}
