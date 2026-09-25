'use client'

/**
 * Official Berlin geo feature panel — calm progressive disclosure, provenance first.
 * Tile props only — no invented government facts.
 */

import { useState } from 'react'
import { X, Building2, MapPinned, BadgeCheck, LandPlot, Landmark, ExternalLink, Copy, Check } from 'lucide-react'
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
    <div className="flex items-center justify-between gap-4 py-0.5">
      <dt className="shrink-0 text-sv-ink/60 text-[13px]">{label}</dt>
      <dd className="text-right font-semibold text-sv-ink text-[13px]">{value}</dd>
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
  const [copied, setCopied] = useState(false)
  const de = lang === 'de'
  const title = titleOf(feature, de)
  const isParcel = feature.kind === 'alkis_parcel'
  const isPlan = feature.source === 'bplan'
  const Icon = isPlan ? Landmark : isParcel ? LandPlot : feature.source === 'alkis' ? Building2 : MapPinned
  const hNote = heightNote(feature.heightSource, de)
  const pdf = officialBplanPdf(feature.doc)

  const handleCopyId = () => {
    if (!feature.id) return
    void navigator.clipboard.writeText(feature.id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <aside
      className="flex h-full w-full flex-col border-t md:border-t-0 md:border-l border-sv-ink/10 bg-sv-surface/98 backdrop-blur-xl shadow-panel-dark md:w-[380px] rounded-t-3xl md:rounded-none transition-transform duration-300"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-sv-ink/20 md:hidden" aria-hidden />
      <header className="flex items-start justify-between gap-3 border-b border-sv-ink/6 p-5">
        <div className="flex min-w-0 gap-3.5">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-module bg-sv-blue/10 text-sv-blue shadow-sm">
            <Icon className="h-6 w-6" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="truncate font-display text-lg font-black tracking-tight text-sv-ink">{title}</h2>
            <p className="mt-0.5 text-xs font-semibold uppercase tracking-wider text-sv-ink/55">{kindLabel(feature.kind, de)}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="grid h-10 w-10 min-h-[44px] min-w-[44px] shrink-0 place-items-center rounded-full text-sv-ink/60 transition hover:bg-sv-ink/5 hover:text-sv-ink active:scale-95"
          aria-label={de ? 'Schließen' : 'Close'}
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      <div className="flex-1 space-y-5 overflow-y-auto overscroll-contain p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]">
        <div className="flex items-center gap-2.5 rounded-control bg-sv-blue/8 px-3.5 py-2.5 text-xs font-bold text-sv-blue-deep dark:text-sv-blue-light border border-sv-blue/15">
          <BadgeCheck className="h-4 w-4 shrink-0 text-sv-blue" aria-hidden />
          <span>
            {de ? 'Amtliche Geometrie · Regierungsquelle' : 'Official geometry · government source'}
          </span>
        </div>

        <dl className="space-y-2 divide-y divide-sv-ink/5 text-sm">
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
            <div className="flex items-center justify-between gap-4 py-0.5">
              <dt className="text-sv-ink/60 text-[13px]">{de ? 'Höhe' : 'Height'}</dt>
              <dd className="text-right font-semibold text-sv-ink tabular-nums text-[13px]">
                {Math.round(feature.height)} m
                <span className="mt-0.5 block text-[11px] font-normal text-sv-ink/60">{hNote}</span>
              </dd>
            </div>
          ) : null}
          {feature.areaM2 != null ? (
            <Row
              label={de ? 'Fläche' : 'Area'}
              value={`${Math.round(feature.areaM2).toLocaleString(de ? 'de-DE' : 'en-GB')} m²`}
            />
          ) : null}
          <div className="flex items-center justify-between gap-4 py-1">
            <dt className="text-sv-ink/60 text-[13px]">{de ? 'Quellen-ID' : 'Source id'}</dt>
            <dd className="flex items-center gap-1.5 font-mono text-xs text-sv-ink/80">
              <span className="max-w-[180px] truncate" title={feature.id}>{feature.id}</span>
              <button
                type="button"
                onClick={handleCopyId}
                className="grid h-7 w-7 place-items-center rounded-md hover:bg-sv-ink/5 text-sv-ink/60 hover:text-sv-ink transition"
                title={de ? 'ID kopieren' : 'Copy ID'}
              >
                {copied ? <Check className="h-3.5 w-3.5 text-sv-green" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </dd>
          </div>
        </dl>

        {pdf ? (
          <a
            href={pdf}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-control bg-sv-navy px-4 py-3 text-xs font-black text-white shadow-sm transition hover:bg-sv-blue hover:shadow active:scale-98"
          >
            <ExternalLink className="h-4 w-4" aria-hidden />
            {de ? 'Amtlichen B-Plan öffnen (PDF)' : 'Open official plan (PDF)'}
          </a>
        ) : null}

        <section className="rounded-module border border-sv-ink/8 bg-sv-cloud/50 p-4">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-sv-ink/60">
            {de ? 'Herkunft & Integrität' : 'Provenance & Integrity'}
          </h3>
          <p className="mt-1 text-xs font-bold text-sv-ink">{SOURCE_LABEL[feature.source]}</p>
          <p className="mt-1 text-[11px] leading-relaxed text-sv-ink/60">
            {de
              ? 'Geometrie direkt aus dem offiziellen Geodatenportal Berlin (GDI-Berlin / ALKIS / StEP Wohnen). Keine KI-Halluzinationen.'
              : 'Geometry directly from official Berlin Geodata portal (GDI-Berlin / ALKIS / StEP Wohnen). Zero AI hallucinations.'}
          </p>
        </section>
      </div>
    </aside>
  )
}
