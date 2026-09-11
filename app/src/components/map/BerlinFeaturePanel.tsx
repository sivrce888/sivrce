'use client'

/**
 * Official Berlin geo feature panel — calm progressive disclosure, provenance first.
 * Tile props only — no invented government facts.
 */

import { X, Building2, MapPinned, BadgeCheck, LandPlot } from 'lucide-react'
import type { BerlinPick } from '@/lib/map/berlin-tiles'

const SOURCE_LABEL = {
  alkis: 'ALKIS Berlin · dl-de-zero-2.0',
  step: 'StEP Wohnen 2040 · dl-de-zero-2.0',
} as const

function titleOf(f: NonNullable<BerlinPick>): string {
  if (f.name) return f.name
  if (f.kind === 'alkis_parcel') return 'Flurstück'
  if (f.kind.startsWith('alkis')) return 'Gebäude'
  return 'StEP Wohnen 2040'
}

function heightNote(src: string | null): string | null {
  if (src === 'hoh') return 'official ALKIS Höhe'
  if (src === 'aog_x3') return 'from official Geschosse × 3 m'
  if (src === 'default_12') return 'default until Geschosse/Höhe present'
  return null
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-sv-ink/50">{label}</dt>
      <dd className="text-right font-medium text-sv-ink">{value}</dd>
    </div>
  )
}

export default function BerlinFeaturePanel({
  feature,
  onClose,
}: {
  feature: NonNullable<BerlinPick>
  onClose: () => void
}) {
  const title = titleOf(feature)
  const isParcel = feature.kind === 'alkis_parcel'
  const Icon = isParcel ? LandPlot : feature.source === 'alkis' ? Building2 : MapPinned
  const hNote = heightNote(feature.heightSource)

  return (
    <aside
      className="flex h-full w-full flex-col border-l border-sv-ink/8 bg-sv-surface shadow-panel-dark md:w-[380px]"
      role="dialog"
      aria-label={title}
    >
      <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-sv-ink/15 md:hidden" aria-hidden />
      <header className="flex items-start justify-between gap-3 border-b border-sv-ink/6 p-5">
        <div className="flex min-w-0 gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-module bg-sv-blue/10 text-sv-blue">
            <Icon className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="truncate font-display text-lg font-black tracking-tight text-sv-ink">{title}</h2>
            <p className="mt-0.5 text-sm text-sv-ink/55">{feature.kind.replace(/_/g, ' ')}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-control text-sv-ink/50 transition hover:bg-sv-ink/5 hover:text-sv-ink"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      <div className="flex-1 space-y-5 overflow-y-auto overscroll-contain p-5">
        <div className="flex items-center gap-2 rounded-module bg-sv-cloud px-3 py-2.5 text-sm text-sv-ink">
          <BadgeCheck className="h-4 w-4 shrink-0 text-sv-blue" aria-hidden />
          <span>
            <span className="font-semibold tabular-nums">100%</span>
            <span className="text-sv-ink/55"> geometry · official government source</span>
          </span>
        </div>

        <dl className="space-y-3 text-sm">
          {feature.status ? <Row label="Status" value={feature.status} /> : null}
          {feature.weKat ? <Row label="Units (WE)" value={feature.weKat} /> : null}
          {feature.floors != null ? <Row label="Floors" value={String(feature.floors)} /> : null}
          {feature.height != null ? (
            <div className="flex justify-between gap-4">
              <dt className="text-sv-ink/50">Height</dt>
              <dd className="text-right font-medium text-sv-ink tabular-nums">
                ~{Math.round(feature.height)} m
                {hNote ? <span className="mt-0.5 block text-xs font-normal text-sv-ink/45">{hNote}</span> : null}
              </dd>
            </div>
          ) : null}
          {feature.areaM2 != null ? (
            <Row label="Area" value={`${Math.round(feature.areaM2).toLocaleString('de-DE')} m²`} />
          ) : null}
          <div className="flex justify-between gap-4">
            <dt className="text-sv-ink/50">Source id</dt>
            <dd className="max-w-[60%] truncate text-right font-mono text-xs text-sv-ink/80" title={feature.id}>
              {feature.id}
            </dd>
          </div>
        </dl>

        <section className="rounded-module border border-sv-ink/8 p-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-sv-ink/45">Provenance</h3>
          <p className="mt-1.5 text-sm text-sv-ink">{SOURCE_LABEL[feature.source]}</p>
          <p className="mt-1 text-xs leading-relaxed text-sv-ink/50">
            Geometry from live GDI Berlin WFS. AI never invents footprints, lots, or potentials.
          </p>
        </section>
      </div>
    </aside>
  )
}
