import { FACT_TYPES, type FactType, type Freshness, type VerificationLabel, SOURCE_REGISTRY } from './core'

/**
 * Fact rows → what a visitor may read: value, who said it, when it was last
 * checked, how sure we are, and any value we did NOT pick. Pure: no DB, no
 * React — the page passes rows to <SourcesSection />.
 *
 * Never claims official verification: `verified` means "two independent
 * sources agree", which is what resolveConflict() measures.
 */

export interface FactLike {
  factType: string
  value: string
  confidence: number
  verification: string
  freshness: string
  lastSeenAt: Date | string
  lastVerifiedAt?: Date | string | null
  alternatives?: unknown
  evidence?: { sourceSlug: string; url?: string | null; retrievedAt: Date | string }[]
}

export interface PublicFactRow {
  fact: FactType
  label: string
  value: string
  verification: VerificationLabel
  verificationLabel: string
  confidence: number
  freshness: Freshness
  /** yyyy-mm-dd, last time a source restated this value. */
  checkedAt: string
  sourceName: string
  sourceUrl: string | null
  /** Values other sources asserted — shown, never silently dropped. */
  alternatives: string[]
}

const FACT_LABELS: Record<FactType, [en: string, de: string]> = {
  permit_status: ['Permit status', 'Genehmigungsstand'],
  project_status: ['Construction status', 'Baustatus'],
  price: ['Price', 'Preis'],
  availability: ['Availability', 'Verfügbarkeit'],
  completion_date: ['Completion', 'Fertigstellung'],
  address: ['Address', 'Adresse'],
  coordinates: ['Coordinates', 'Koordinaten'],
  amenities: ['Amenities', 'Ausstattung'],
  company_identity: ['Company', 'Unternehmen'],
  contact: ['Contact', 'Kontakt'],
  specifications: ['Specifications', 'Eckdaten'],
  media: ['Media', 'Medien'],
}

const VERIFICATION_TEXT: Record<VerificationLabel, [en: string, de: string]> = {
  verified: ['Multi-source verified', 'Mehrfach bestätigt'],
  high_confidence: ['High confidence', 'Hohe Sicherheit'],
  likely: ['Likely', 'Wahrscheinlich'],
  unverified: ['Single source', 'Einzelquelle'],
  outdated: ['Outdated', 'Veraltet'],
  conflicting: ['Sources disagree', 'Quellen widersprechen'],
}

const STATUS_TEXT: Record<string, [en: string, de: string]> = {
  announced: ['Announced', 'Angekündigt'],
  pre_launch: ['Pre-launch', 'Vorvermarktung'],
  planned: ['Planned', 'Geplant'],
  permitted: ['Permitted', 'Genehmigt'],
  under_construction: ['Under construction', 'Im Bau'],
  near_completion: ['Near completion', 'Kurz vor Fertigstellung'],
  completed: ['Completed', 'Fertiggestellt'],
  suspended: ['Suspended', 'Gestoppt'],
  cancelled: ['Cancelled', 'Abgebrochen'],
  unknown: ['Unknown', 'Unbekannt'],
}

const SOURCE_NAMES = new Map(SOURCE_REGISTRY.map((s) => [s.slug, s.name]))
const ORDER = new Map(FACT_TYPES.map((f, i) => [f as string, i]))

function pick(pair: [string, string], lang: string): string {
  return lang === 'de' ? pair[1] : pair[0]
}

function isFactType(v: string): v is FactType {
  return ORDER.has(v)
}

function toDate(v: Date | string): Date {
  return v instanceof Date ? v : new Date(v)
}

function displayValue(fact: FactType, raw: string, lang: string): string {
  const v = raw.trim()
  if (!v) return ''
  if (fact === 'project_status' || fact === 'permit_status') {
    const hit = STATUS_TEXT[v]
    return hit ? pick(hit, lang) : v.replace(/_/g, ' ')
  }
  if (fact === 'coordinates') {
    const [lat, lng] = v.split(',').map((n) => Number(n.trim()))
    if (Number.isFinite(lat) && Number.isFinite(lng)) return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
  }
  return v
}

/** Human source label: registry name, else the evidence host, else the slug. */
function sourceLabel(slug: string, url: string | null): string {
  const known = SOURCE_NAMES.get(slug)
  if (known && slug !== 'official-developer') return known
  if (url) {
    try {
      return new URL(url).hostname.replace(/^www\./, '')
    } catch {
      /* fall through to slug */
    }
  }
  return known ?? slug
}

export function toPublicFacts(facts: FactLike[], lang = 'en'): PublicFactRow[] {
  const rows: PublicFactRow[] = []
  for (const f of facts) {
    if (!isFactType(f.factType)) continue
    const value = displayValue(f.factType, f.value ?? '', lang)
    if (!value) continue
    // Newest evidence names the source: that is the row a reader can go check.
    const ev = [...(f.evidence ?? [])].sort(
      (a, b) => toDate(b.retrievedAt).getTime() - toDate(a.retrievedAt).getTime(),
    )[0]
    const verification = (VERIFICATION_TEXT[f.verification as VerificationLabel]
      ? (f.verification as VerificationLabel)
      : 'unverified')
    const alts = Array.isArray(f.alternatives)
      ? [...new Set((f.alternatives as unknown[]).filter((a): a is string => typeof a === 'string' && !!a.trim()))]
          .map((a) => displayValue(f.factType as FactType, a, lang))
          .filter((a) => a && a !== value)
      : []
    rows.push({
      fact: f.factType,
      label: pick(FACT_LABELS[f.factType], lang),
      value,
      verification,
      verificationLabel: pick(VERIFICATION_TEXT[verification], lang),
      confidence: Math.max(0, Math.min(100, Math.round(f.confidence ?? 0))),
      freshness: (f.freshness || 'unknown') as Freshness,
      checkedAt: toDate(f.lastVerifiedAt ?? f.lastSeenAt).toISOString().slice(0, 10),
      sourceName: sourceLabel(ev?.sourceSlug ?? '', ev?.url ?? null),
      sourceUrl: ev?.url ?? null,
      alternatives: alts,
    })
  }
  return rows.sort((a, b) => (ORDER.get(a.fact) ?? 99) - (ORDER.get(b.fact) ?? 99))
}

export function sourcesHeading(lang: string): { title: string; note: string } {
  return lang === 'de'
    ? {
        title: 'Quellen und Prüfstand',
        note: 'Jeder Wert nennt seine Quelle und das Datum der letzten Prüfung. Widersprüche werden gezeigt, nicht überschrieben. Keine amtliche Bestätigung durch sivrce.',
      }
    : {
        title: 'Sources and verification',
        note: 'Every value names its source and the date it was last checked. Disagreements are shown, not overwritten. This is not official government verification.',
      }
}
