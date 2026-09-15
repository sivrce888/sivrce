/**
 * GEG § 87 — Pflichtangaben in Immobilienanzeigen (German mandatory energy
 * disclosure for property ads).
 *
 * Why this exists: in Germany, whoever publishes a commercial property ad must
 * state five facts from the Energieausweis. Omitting them is an
 * Ordnungswidrigkeit under § 108 Abs. 1 Nr. 9 GEG, fined up to 10.000 € — and
 * the fine lands on the advertiser, i.e. our seller. A portal that lets a
 * German seller publish a non-compliant ad is a portal that costs them money.
 *
 * § 87 Abs. 1 GEG — if an Energieausweis exists when the ad is placed, the ad
 * must name:
 *   1. Art des Energieausweises (Bedarfs- oder Verbrauchsausweis)
 *   2. der darin genannte Endenergiebedarf/-verbrauch in kWh/(m²·a)
 *   3. der wesentliche Energieträger der Heizung
 *   4. bei Wohngebäuden: das genannte Baujahr
 *   5. bei Wohngebäuden: die genannte Energieeffizienzklasse
 *
 * The duty attaches to the certificate, not to the building: no Ausweis, no
 * duty (§ 87 Abs. 1 "wenn ... ein Energieausweis vorliegt"). So the legal
 * exemptions are declared, not guessed — see DE_GEG_EXEMPTIONS.
 *
 * Leaf module by design: no DE_CITIES, no de-proptech-os, no DB. It is imported
 * by the publish parser AND by the add-listing wizard, so it must not drag a
 * catalog into the client bundle. The 7-value energy-source union is duplicated
 * from DeHeatingType on purpose — 7 strings cost less than 557 lines shipped to
 * a phone.
 *
 * ponytail: pure functions + one verdict object, no schema lib. Upgrade path:
 * if the Ausweis PDF ever gets parsed server-side, feed its fields in here
 * unchanged — the verdict shape does not need to move.
 */
import { DE_ENERGY_CLASSES, type DeEnergyClass } from './de-expose'

/** § 87 Abs. 1 Nr. 1 — the two certificate kinds the law recognises. */
export const DE_GEG_CERT_TYPES = ['bedarf', 'verbrauch'] as const
export type DeGegCertType = (typeof DE_GEG_CERT_TYPES)[number]

/** § 87 Abs. 1 Nr. 3 — wesentlicher Energieträger der Heizung. */
export const DE_GEG_ENERGY_SOURCES = [
  'gas',
  'oel',
  'fernwaerme',
  'nahwaerme',
  'waermepumpe',
  'strom',
  'pellets',
  'holz',
  'kohle',
  'solar',
] as const
export type DeGegEnergySource = (typeof DE_GEG_ENERGY_SOURCES)[number]

/**
 * Declared reasons no Energieausweis exists, so no § 87 duty attaches.
 *  - baudenkmal:        § 105 GEG — listed building, exempt from the Ausweis.
 *  - kleines_gebaeude:  § 111 GEG — ≤ 50 m² Nutzfläche.
 *  - kurzzeitnutzung:   building used under four months a year.
 *  - ausweis_beantragt: ordered but not yet issued (§ 87 needs one "vorliegend").
 */
export const DE_GEG_EXEMPTIONS = ['baudenkmal', 'kleines_gebaeude', 'kurzzeitnutzung', 'ausweis_beantragt'] as const
export type DeGegExemption = (typeof DE_GEG_EXEMPTIONS)[number]

/** The five § 87 Abs. 1 facts, as stable ids for UI + i18n. */
export type DeGegField = 'certType' | 'endenergie' | 'energySource' | 'yearBuilt' | 'energyClass'

export interface DeGegInput {
  /** Declared legal exemption; when set, the other fields are not required. */
  exemption?: DeGegExemption | null
  certType?: DeGegCertType | null
  /** Endenergiebedarf/-verbrauch in kWh/(m²·a), as printed on the Ausweis. */
  endenergieKwhSqmYear?: number | null
  energySource?: DeGegEnergySource | null
  yearBuilt?: number | null
  energyClass?: DeEnergyClass | null
  /**
   * Wohngebäude (residential). Nichtwohngebäude owe Nr. 1–3 only: Baujahr and
   * Effizienzklasse are Wohngebäude-only duties under Nr. 4 and Nr. 5.
   */
  residential?: boolean
}

export interface DeGegVerdict {
  /** Safe to publish in Germany. */
  ok: boolean
  /** A legal exemption was declared, so no disclosure is owed. */
  exempt: boolean
  /** Which § 87 facts are still missing. */
  missing: DeGegField[]
  /**
   * Set when the declared Effizienzklasse contradicts the kWh value. Not an
   * error — the Ausweis is the legal source of truth and rounding at a class
   * boundary is real — but it is surfaced, because a wrong class in an ad is
   * the single most common German listing defect.
   */
  classMismatch: { declared: DeEnergyClass; derived: DeEnergyClass } | null
  /** Ready-to-render Pflichtangaben line (German), or null when exempt. */
  disclosure: string | null
}

/**
 * Anlage 10 GEG — Energieeffizienzklassen für Wohngebäude, by Endenergie in
 * kWh/(m²·a). Upper bounds are inclusive ("bis" values in the table).
 */
const CLASS_MAX: readonly (readonly [DeEnergyClass, number])[] = [
  ['A+', 30],
  ['A', 50],
  ['B', 75],
  ['C', 100],
  ['D', 130],
  ['E', 160],
  ['F', 200],
  ['G', 250],
]

/** Anlage 10 lookup. Above 250 kWh/(m²·a) the class is H. */
export function energyClassFromKwh(kwh: number): DeEnergyClass {
  if (!Number.isFinite(kwh) || kwh < 0) return 'H'
  for (const [cls, max] of CLASS_MAX) if (kwh <= max) return cls
  return 'H'
}

/** German label for the certificate type, as § 87 Nr. 1 requires it named. */
export const DE_GEG_CERT_LABEL: Record<DeGegCertType, string> = {
  bedarf: 'Energiebedarfsausweis',
  verbrauch: 'Energieverbrauchsausweis',
}

/** German label for the Energieträger, as § 87 Nr. 3 requires it named. */
export const DE_GEG_SOURCE_LABEL: Record<DeGegEnergySource, string> = {
  gas: 'Gas',
  oel: 'Öl',
  fernwaerme: 'Fernwärme',
  nahwaerme: 'Nahwärme',
  waermepumpe: 'Wärmepumpe (Strom)',
  strom: 'Strom',
  pellets: 'Holzpellets',
  holz: 'Holz',
  kohle: 'Kohle',
  solar: 'Solarthermie',
}

export const DE_GEG_EXEMPTION_LABEL: Record<DeGegExemption, string> = {
  baudenkmal: 'Baudenkmal — kein Energieausweis erforderlich (§ 105 GEG)',
  kleines_gebaeude: 'Kleines Gebäude bis 50 m² — kein Energieausweis erforderlich (§ 111 GEG)',
  kurzzeitnutzung: 'Nutzung unter vier Monaten im Jahr — kein Energieausweis erforderlich',
  ausweis_beantragt: 'Energieausweis beantragt, liegt noch nicht vor',
}

const isCertType = (v: unknown): v is DeGegCertType => DE_GEG_CERT_TYPES.includes(v as DeGegCertType)
const isSource = (v: unknown): v is DeGegEnergySource => DE_GEG_ENERGY_SOURCES.includes(v as DeGegEnergySource)
const isExemption = (v: unknown): v is DeGegExemption => DE_GEG_EXEMPTIONS.includes(v as DeGegExemption)
const isClass = (v: unknown): v is DeEnergyClass => DE_ENERGY_CLASSES.includes(v as DeEnergyClass)

/** Plausible Endenergie window. Passivhaus ≈ 15, unsanierter Altbau ≈ 400. */
const isKwh = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1000
/** Ausweis Baujahr: no German building stock predates this in a certificate. */
const isYear = (v: unknown): v is number =>
  typeof v === 'number' && Number.isInteger(v) && v >= 1800 && v <= new Date().getFullYear() + 5

/**
 * Validate one listing's § 87 Pflichtangaben and build the ad disclosure line.
 * Pure — no clock beyond the Baujahr sanity bound, no I/O.
 */
export function checkGegPflichtangaben(input: DeGegInput): DeGegVerdict {
  if (isExemption(input.exemption)) {
    return { ok: true, exempt: true, missing: [], classMismatch: null, disclosure: null }
  }

  const residential = input.residential !== false
  const missing: DeGegField[] = []
  if (!isCertType(input.certType)) missing.push('certType')
  if (!isKwh(input.endenergieKwhSqmYear)) missing.push('endenergie')
  if (!isSource(input.energySource)) missing.push('energySource')
  if (residential && !isYear(input.yearBuilt)) missing.push('yearBuilt')
  if (residential && !isClass(input.energyClass)) missing.push('energyClass')

  if (missing.length > 0) {
    return { ok: false, exempt: false, missing, classMismatch: null, disclosure: null }
  }

  const certType = input.certType as DeGegCertType
  const kwh = input.endenergieKwhSqmYear as number
  const source = input.energySource as DeGegEnergySource
  const derived = energyClassFromKwh(kwh)
  const declared = input.energyClass as DeEnergyClass | null
  const classMismatch = residential && declared && declared !== derived ? { declared, derived } : null

  // Nr. 2 wording follows Nr. 1: a Bedarfsausweis states Bedarf, a
  // Verbrauchsausweis states Verbrauch. Mixing the two is itself a defect.
  const valueLabel = certType === 'bedarf' ? 'Endenergiebedarf' : 'Endenergieverbrauch'
  const parts = [
    DE_GEG_CERT_LABEL[certType],
    `${valueLabel} ${kwh.toLocaleString('de-DE')} kWh/(m²·a)`,
    `wesentlicher Energieträger: ${DE_GEG_SOURCE_LABEL[source]}`,
  ]
  if (residential) {
    parts.push(`Baujahr ${input.yearBuilt}`)
    parts.push(`Energieeffizienzklasse ${declared}`)
  }

  return { ok: true, exempt: false, missing: [], classMismatch, disclosure: parts.join(' · ') }
}

/**
 * Narrow an untrusted request body into DeGegInput. Trust boundary: everything
 * that fails its type guard becomes null, so a junk payload reads as "missing"
 * and is rejected — never as a silently accepted disclosure.
 */
export function parseGegBody(raw: unknown, residential: boolean): DeGegInput {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  return {
    exemption: isExemption(o.exemption) ? o.exemption : null,
    certType: isCertType(o.certType) ? o.certType : null,
    endenergieKwhSqmYear: isKwh(o.endenergieKwhSqmYear) ? Math.round(o.endenergieKwhSqmYear * 10) / 10 : null,
    energySource: isSource(o.energySource) ? o.energySource : null,
    yearBuilt: isYear(o.yearBuilt) ? o.yearBuilt : null,
    energyClass: isClass(o.energyClass) ? o.energyClass : null,
    residential,
  }
}

/**
 * Does § 87 apply to this ad at all? The duty covers Verkauf and Vermietung of
 * buildings. Land with no building has no Ausweis, and a nightly stay is not a
 * Vermietung in the GEG sense.
 */
export function gegAppliesTo(country: string, deal: string, propertyType: string): boolean {
  if (country.toUpperCase() !== 'DE') return false
  if (deal !== 'sale' && deal !== 'rent') return false
  return propertyType !== 'land'
}

/**
 * Wohngebäude vs Nichtwohngebäude — drives Nr. 4 and Nr. 5. Commercial and
 * hotel stock are Nichtwohngebäude: they owe the value, the cert kind and the
 * Energieträger, but not Baujahr or Effizienzklasse.
 */
export function isResidentialPropertyType(propertyType: string): boolean {
  return propertyType === 'apartment' || propertyType === 'house' || propertyType === 'villa'
}
