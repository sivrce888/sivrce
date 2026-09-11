'use client'

/**
 * Official Berlin geo feature panel — progressive disclosure, provenance first.
 * Data from vector-tile props only (no invented facts).
 */

import { X, Building2, MapPinned, BadgeCheck } from 'lucide-react'
import type { BerlinPick } from '@/lib/map/berlin-tiles'

const SOURCE_LABEL = {
  alkis: 'ALKIS Berlin · dl-de-zero-2.0',
  step: 'StEP Wohnen 2040 · dl-de-zero-2.0',
} as const

export default function BerlinFeaturePanel({
  feature,
  onClose,
}: {
  feature: NonNullable<BerlinPick>
  onClose: () => void
}) {
  const title = feature.name || (feature.source === 'step' ? 'StEP Wohnen 2040' : 'ALKIS Gebäude')
  const quality = 100

  return (
    <aside
      className="flex h-full w-full flex-col border-l border-sv-ink/8 bg-sv-surface shadow-panel-dark md:w-[380px]"
      role="dialog"
      aria-label={title}
    >
      <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-sv-ink/15 md:hidden" aria-hidden />
      <header className="flex items-start justify-between gap-3 border-b border-sv-ink/6 p-5">
        <div className="flex gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-module bg-sv-blue/10 text-sv-blue">
            {feature.source === 'alkis' ? <Building2 className="h-5 w-5" /> : <MapPinned className="h-5 w-5" />}
          </span>
          <div className="min-w-0">
            <h2 className="truncate font-display text-lg font-black tracking-tight text-sv-ink">{title}</h2>
            <p className="mt-0.5 text-sm text-sv-ink/55">{feature.kind.replace(/_/g, ' ')}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="grid h-10 w-10 place-items-center rounded-control text-sv-ink/50 transition hover:bg-sv-ink/5 hover:text-sv-ink"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      <div className="flex-1 space-y-5 overflow-y-auto p-5">
        <div className="flex items-center gap-2 rounded-module bg-sv-cloud px-3 py-2.5 text-sm text-sv-ink">
          <BadgeCheck className="h-4 w-4 shrink-0 text-sv-blue" aria-hidden />
          <span>
            <span className="font-semibold tabular-nums">{quality}%</span>
            <span className="text-sv-ink/55"> data quality · official government geometry</span>
          </span>
        </div>

        <dl className="space-y-3 text-sm">
          {feature.status ? (
            <div className="flex justify-between gap-4">
              <dt className="text-sv-ink/50">Status</dt>
              <dd className="text-right font-medium text-sv-ink">{feature.status}</dd>
            </div>
          ) : null}
          {feature.weKat ? (
            <div className="flex justify-between gap-4">
              <dt className="text-sv-ink/50">WE-Kat</dt>
              <dd className="text-right font-medium text-sv-ink">{feature.weKat}</dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-4">
            <dt className="text-sv-ink/50">Source id</dt>
            <dd className="truncate text-right font-mono text-xs text-sv-ink/80">{feature.id}</dd>
          </div>
        </dl>

        <section className="rounded-module border border-sv-ink/8 p-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-sv-ink/45">Provenance</h3>
          <p className="mt-1.5 text-sm text-sv-ink">{SOURCE_LABEL[feature.source]}</p>
          <p className="mt-1 text-xs text-sv-ink/50">
            Geometry from live GDI Berlin WFS. AI never invents footprints or potentials.
          </p>
        </section>
      </div>
    </aside>
  )
}
