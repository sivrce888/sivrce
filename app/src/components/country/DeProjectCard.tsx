import Link from 'next/link'
import Image from 'next/image'
import { CalendarCheck } from 'lucide-react'
import type { Project } from '@/data/professionals'
import { BERLIN_BEZIRKE, DE_CITIES } from '@/lib/countries/de'
import { hasPriceFrom, ON_REQUEST } from '@/lib/directory-seo-lite'

/**
 * Shared DE catalog card — used by the /de rails (DeMarketHome) and the
 * Bezirk pages. Label slots stay ka/en (Georgian product); DE market rows
 * carry Latin place names in those slots.
 */
const CITY_EN = new Map([
  ...DE_CITIES.map((c) => [c.ka, c.de] as const),
  ['გელზენკირხენი', 'Gelsenkirchen'] as const,
])
// Catalog rows mix Bezirk-level and Ortsteil-level ka district labels —
// map both so the card eyebrow always shows a Latin place name.
const DISTRICT_EN = new Map([
  ...BERLIN_BEZIRKE.map((b) => [b.ka, b.de] as const),
  ['კროიცბერგი', 'Kreuzberg'],
  ['პრენცლაუერ-ბერგი', 'Prenzlauer Berg'],
  ['ფრიდრიხსფელდე', 'Friedrichsfelde'],
  ['შონებერგი', 'Schöneberg'],
  ['რაინიკენდორფი', 'Reinickendorf'],
  ['ტემპელჰოფი', 'Tempelhof'],
  ['ლიხტერფელდე', 'Lichterfelde'],
  ['შარლოტენბურგი', 'Charlottenburg'],
])

export function cityEn(p: Project): string {
  return CITY_EN.get(p.city) ?? 'Germany'
}

export function districtEn(p: Project): string {
  const parts = p.location.split(',').map((s) => s.trim()).filter(Boolean)
  const last = parts[parts.length - 1] ?? ''
  if (parts.length >= 2 && !/\d/.test(last) && last !== cityEn(p)) return last
  return (p.district && DISTRICT_EN.get(p.district)) || ''
}

const nf = new Intl.NumberFormat('en-US')
const nfDe = new Intl.NumberFormat('de-DE')
const priceLabel = (p: Project, de: boolean) =>
  p.priceFromM2 === ON_REQUEST ? (de ? 'Auf Anfrage' : 'On request') : p.priceFromM2
/** Catalog finish strings arrive in ka ('ჩაბარებული') or German ('In Planung'/'Im Bau') — show EN on /de. */
const FINISH_EN = new Map([
  ['ჩაბარებული', 'Completed'],
  ['In Planung', 'In planning'],
  ['Im Bau', 'Under construction'],
])
const finishLabel = (p: Project, de: boolean) =>
  (de && p.finish === 'ჩაბარებული' ? 'Fertiggestellt' : FINISH_EN.get(p.finish) ?? p.finish)

export default function DeProjectCard({ p, dev, de, full }: { p: Project; dev?: string; de: boolean; full?: boolean }) {
  return (
    <Link
      href={`/de/projects/${p.slug}`}
      className={`group flex ${full ? 'w-full' : 'w-[300px] shrink-0'} flex-col rounded-tile border border-sv-ink/[0.07] bg-sv-surface p-5 shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:border-sv-blue/30 hover:shadow-card-hover`}
    >
      <div className="relative -mx-5 -mt-5 mb-4 h-[170px] overflow-hidden rounded-tile rounded-b-none border-b border-sv-ink/[0.06]">
        <Image src={p.img} alt={`${p.name} — ${dev || 'Neubau'} render`} fill sizes="300px" className="object-cover" />
      </div>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-black uppercase tracking-wider text-sv-blue">
            {districtEn(p) || cityEn(p)}
          </p>
          <h3 className="mt-1 truncate text-[17px] font-black text-sv-ink">{p.name}</h3>
        </div>
        <span className="shrink-0 rounded-full bg-sv-ink/[0.06] px-3 py-1 text-[12px] font-extrabold text-sv-ink/70">
          {priceLabel(p, de)}
          {hasPriceFrom(p.priceFromM2) ? <span className="text-sv-ink/45">/m²</span> : null}
        </span>
      </div>
      <p className="mt-2 line-clamp-2 text-[13px] font-semibold leading-snug text-sv-ink/55">{p.location}</p>
      <div className="mx-0 mt-4 h-1.5 overflow-hidden rounded-full bg-sv-ink/[0.07]">
        <div className="h-full rounded-full bg-gradient-to-r from-sv-blue to-sv-violet" style={{ width: `${p.done}%` }} />
      </div>
      <div className="mt-3 flex items-center justify-between text-[12px] font-extrabold text-sv-ink/65">
        <span>{p.flats ? `${(de ? nfDe : nf).format(p.flats)} ${de ? 'WE' : 'units'} · ` : ''}{p.done}% {de ? 'fertig' : 'built'}</span>
        <span className="inline-flex items-center gap-1 text-sv-ink/45">
          <CalendarCheck className="h-3.5 w-3.5" aria-hidden /> {finishLabel(p, de)}
        </span>
      </div>
      {dev ? (
        <p className="mt-3 border-t border-sv-ink/[0.06] pt-3 text-[12px] font-bold text-sv-ink/50">
          {de ? 'Bauträger' : 'Developer'}: <span className="text-sv-ink/75">{dev}</span>
        </p>
      ) : null}
    </Link>
  )
}
