'use client'

/**
 * Official Berlin geo feature panel — calm progressive disclosure, provenance first.
 * Tile props only — no invented government facts.
 */

import { X, Building2, MapPinned, BadgeCheck, LandPlot, Landmark, ExternalLink } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
import { officialBplanPdf } from '@/lib/map/berlin-pdf'
import type { BerlinPick } from '@/lib/map/berlin-tiles'

const SOURCE_LABEL = {
  alkis: 'ALKIS Berlin · dl-de-zero-2.0',
  step: 'StEP Wohnen 2040 · dl-de-zero-2.0',
  bplan: 'Bebauungsplan Berlin · dl-de-zero-2.0',
} as const

function titleOf(f: NonNullable<BerlinPick>, de: boolean): string {
  if (f.name) return f.name
  if (f.kind === 'alkis_parcel') return de ? 'Flurstück' : 'Parcel'
  if (f.kind.startsWith('alkis')) return de ? 'Gebäude' : 'Building'
  if (f.kind.startsWith('bplan')) return 'Bebauungsplan'
  return 'StEP Wohnen 2040'
}

function kindLabel(kind: string, de: boolean): string {
  if (kind === 'alkis_parcel') return de ? 'Flurstück' : 'Parcel'
  if (kind === 'alkis_building') return de ? 'Gebäude' : 'Building'
  if (kind === 'bplan_festgesetzt') return de ? 'B-Plan · festgesetzt' : 'B-Plan · adopted'
  if (kind === 'bplan_verfahren') return de ? 'B-Plan · im Verfahren' : 'B-Plan · in procedure'
  if (kind === 'step_konzept') return 'Innenentwicklungskonzept'
  if (kind === 'step_quartier') return 'Neue Stadtquartiere'
  if (kind === 'step_priority') return de ? 'Vorranggebiet' : 'Priority area'
  if (kind === 'step_potential') return de ? 'Wohnbaupotenzial' : 'Housing potential'
  if (kind === 'step_gemeinwohl') return 'Gemeinwohlwohnen'
  if (kind.startsWith('step')) return 'StEP Wohnen 2040'
  return kind.replace(/_/g, ' ')
}

function dateUtc(iso: string, de: boolean): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  if (!m) return iso
  return de ? `${m[3]}.${m[2]}.${m[1]}` : `${m[3]}/${m[2]}/${m[1]}`
}

function heightNote(src: string | null, de: boolean): string | null {
  if (src === 'hoh') return de ? 'amtliche ALKIS-Höhe' : 'official ALKIS height'
  if (src === 'aog_x3') return de ? 'aus amtlichen Geschossen × 3 m' : 'from official storeys × 3 m'
  return null
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="shrink-0 text-sv-ink/50">{label}</dt>
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
  const { lang } = useI18n()
  const de = lang === 'de'
  const title = titleOf(feature, de)
  const isParcel = feature.kind === 'alkis_parcel'
  const isPlan = feature.source === 'bplan'
  const Icon = isPlan ? Landmark : isParcel ? LandPlot : feature.source === 'alkis' ? Building2 : MapPinned
  const hNote = heightNote(feature.heightSource, de)
  const pdf = officialBplanPdf(feature.doc)

  return (
    <aside
      className="flex h-full w-full flex-col border-l border-sv-ink/8 bg-sv-surface shadow-panel-dark md:w-[380px]"
      role="dialog"
      aria-modal="true"
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
            <p className="mt-0.5 text-sm text-sv-ink/55">{kindLabel(feature.kind, de)}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-control text-sv-ink/50 transition hover:bg-sv-ink/5 hover:text-sv-ink"
          aria-label={de ? 'Schließen' : 'Close'}
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      <div className="flex-1 space-y-5 overflow-y-auto overscroll-contain p-5">
        <div className="flex items-center gap-2 rounded-module bg-sv-cloud px-3 py-2.5 text-sm text-sv-ink">
          <BadgeCheck className="h-4 w-4 shrink-0 text-sv-blue" aria-hidden />
          <span className="font-semibold">
            {de ? 'Amtliche Geometrie · Regierungsquelle' : 'Official geometry · government source'}
          </span>
        </div>

        <dl className="space-y-3 text-sm">
          {feature.status ? <Row label="Status" value={feature.status} /> : null}
          {feature.planart ? <Row label={de ? 'Planart' : 'Plan type'} value={feature.planart} /> : null}
          {feature.bezirk ? <Row label="Bezirk" value={feature.bezirk} /> : null}
          {feature.inhalt ? <Row label={de ? 'Festsetzungen' : 'Zoning'} value={feature.inhalt} /> : null}
          {feature.festsgAm ? (
            <Row label={de ? 'Festsetzung' : 'Adopted'} value={dateUtc(feature.festsgAm, de)} />
          ) : null}
          {feature.weKat ? <Row label={de ? 'Wohneinheiten' : 'Units (WE)'} value={feature.weKat} /> : null}
          {feature.funktion ? <Row label={de ? 'Nutzung' : 'Use'} value={feature.funktion} /> : null}
          {feature.floors != null ? <Row label={de ? 'Geschosse' : 'Storeys'} value={String(feature.floors)} /> : null}
          {feature.height != null && hNote ? (
            <div className="flex justify-between gap-4">
              <dt className="text-sv-ink/50">{de ? 'Höhe' : 'Height'}</dt>
              <dd className="text-right font-medium text-sv-ink tabular-nums">
                {Math.round(feature.height)} m
                <span className="mt-0.5 block text-xs font-normal text-sv-ink/45">{hNote}</span>
              </dd>
            </div>
          ) : null}
          {feature.areaM2 != null ? (
            <Row
              label={de ? 'Fläche' : 'Area'}
              value={`${Math.round(feature.areaM2).toLocaleString(de ? 'de-DE' : 'en-GB')} m²`}
            />
          ) : null}
          <div className="flex justify-between gap-4">
            <dt className="text-sv-ink/50">{de ? 'Quellen-ID' : 'Source id'}</dt>
            <dd className="max-w-[60%] truncate text-right font-mono text-xs text-sv-ink/80" title={feature.id}>
              {feature.id}
            </dd>
          </div>
        </dl>

        {pdf ? (
          <a
            href={pdf}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-semibold text-sv-blue hover:text-sv-blue-deep"
          >
            <ExternalLink className="h-4 w-4" aria-hidden />
            {de ? 'Amtlicher Plan (PDF)' : 'Official plan (PDF)'}
          </a>
        ) : null}

        <section className="rounded-module border border-sv-ink/8 p-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-sv-ink/45">
            {de ? 'Herkunft' : 'Provenance'}
          </h3>
          <p className="mt-1.5 text-sm text-sv-ink">{SOURCE_LABEL[feature.source]}</p>
          <p className="mt-1 text-xs leading-relaxed text-sv-ink/50">
            {de
              ? 'Geometrie aus dem GDI-Berlin-WFS. KI erfindet keine Grundrisse, Flurstücke oder Pläne.'
              : 'Geometry from live GDI Berlin WFS. AI never invents footprints, lots, or plans.'}
          </p>
        </section>
      </div>
    </aside>
  )
}
