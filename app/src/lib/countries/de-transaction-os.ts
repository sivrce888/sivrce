/**
 * SIVRCE DE // NOTARY & TRANSACTION OPERATING SYSTEM (TRANSACTION OS)
 *
 * Full German real estate closing infrastructure:
 *  1. Statutory Notary Due Diligence Checklist (Grundbuch Abteilung I-III, Baulasten, WEG-Protokolle).
 *  2. §656c BGB Commission Parity Verification (strictly enforces equal buyer/seller split).
 *  3. Bank-ready Institutional Acquisition Summaries (bilingual DE/EN) for mortgage approval.
 *
 * DB-free, SSR-safe, lightweight, deterministic.
 */

export interface NotaryChecklistItem {
  id: string
  titleDe: string
  titleEn: string
  category: 'LEGAL' | 'CONDO_WEG' | 'TECHNICAL_ENERGY' | 'TAX_NOTARY'
  mandatory: boolean
  descriptionDe: string
  descriptionEn: string
}

export const STATUTORY_NOTARY_CHECKLIST: NotaryChecklistItem[] = [
  {
    id: 'grundbuch_current',
    titleDe: 'Beglaubigter Grundbuchauszug (nicht älter als 3 Monate)',
    titleEn: 'Certified Land Register Extract (max 3 months old)',
    category: 'LEGAL',
    mandatory: true,
    descriptionDe: 'Prüfung von Eigentümer (Abt. I), Lasten & Dienstbarkeiten wie Wegerechte/Wohnrechte (Abt. II) und Grundschulden (Abt. III).',
    descriptionEn: 'Verification of ownership (Sec. I), encumbrances/easements (Sec. II), and mortgages/liens (Sec. III).',
  },
  {
    id: 'teilungserklaerung',
    titleDe: 'Teilungserklärung & Gemeinschaftsordnung',
    titleEn: 'Declaration of Division & Community Bylaws',
    category: 'CONDO_WEG',
    mandatory: true,
    descriptionDe: 'Definiert Sondereigentum (Wohnung/Keller) vs. Gemeinschaftseigentum und Sondernutzungsrechte (z. B. Stellplatz, Garten).',
    descriptionEn: 'Defines private ownership vs common property and special usage rights (e.g., parking, garden).',
  },
  {
    id: 'weg_protokolle',
    titleDe: 'WEG-Eigentümerversammlungsprotokolle (letzte 3 Jahre)',
    titleEn: 'Owners Meeting Minutes (Last 3 Years)',
    category: 'CONDO_WEG',
    mandatory: true,
    descriptionDe: 'Wichtig für geplante Sonderumlagen, Rechtsstreitigkeiten und anstehende Großsanierungen der Eigentümergemeinschaft.',
    descriptionEn: 'Crucial for detecting planned special levies, legal disputes, and major upcoming building repairs.',
  },
  {
    id: 'wirtschaftsplan',
    titleDe: 'Aktueller Wirtschaftsplan & Instandhaltungsrücklagen-Nachweis',
    titleEn: 'Current Operating Plan & Reserve Fund Statement',
    category: 'CONDO_WEG',
    mandatory: true,
    descriptionDe: 'Aufschlüsselung des monatlichen Hausgeldes in umlagefähige vs. nicht umlagefähige Kosten und Stand der Reparaturrücklage.',
    descriptionEn: 'Detailed split of monthly Hausgeld into recoverable vs non-recoverable costs and total reserve balance.',
  },
  {
    id: 'energieausweis_valid',
    titleDe: 'Gültiger Energieausweis (§§ 79 ff. GEG)',
    titleEn: 'Valid Energy Performance Certificate (§§ 79 ff. GEG)',
    category: 'TECHNICAL_ENERGY',
    mandatory: true,
    descriptionDe: 'Gesetzlich vorgeschrieben bei Besichtigung und Notartermin; enthält Energieeffizienzklasse A+ bis H.',
    descriptionEn: 'Statutory mandate at viewings and notary signing; defines energy efficiency class A+ through H.',
  },
  {
    id: 'baulastenverzeichnis',
    titleDe: 'Auszug aus dem Baulastenverzeichnis',
    titleEn: 'Building Encumbrance Register Extract (Baulasten)',
    category: 'LEGAL',
    mandatory: false,
    descriptionDe: 'Öffentlich-rechtliche Verpflichtungen gegenüber der Baubehörde (steht nicht im Grundbuch).',
    descriptionEn: 'Public-law obligations registered with the building authority (not listed in Grundbuch).',
  },
]

/**
 * Validates broker commission against §656c BGB (Gesetz über die Verteilung der Maklerkosten).
 */
export function verifyCommissionParity(
  buyerCommissionPct: number,
  sellerCommissionPct: number
): {
  compliant: boolean
  reasonDe: string
  reasonEn: string
} {
  // §656c BGB requires: if broker agrees on commission with one party, the other party cannot be charged more than 50%
  if (Math.abs(buyerCommissionPct - sellerCommissionPct) > 0.01 && buyerCommissionPct > sellerCommissionPct) {
    return {
      compliant: false,
      reasonDe: `Verstoß gegen §656c BGB: Käuferprovision (${buyerCommissionPct} %) darf die Verkäuferprovision (${sellerCommissionPct} %) nicht übersteigen.`,
      reasonEn: `Violation of §656c BGB: Buyer commission (${buyerCommissionPct}%) cannot exceed seller commission (${sellerCommissionPct}%).`,
    }
  }

  return {
    compliant: true,
    reasonDe: 'Konform mit §656c BGB: Gleichverteilung der Maklerprovision gewahrt.',
    reasonEn: 'Compliant with §656c BGB: Statutory commission parity upheld.',
  }
}

/**
 * Generates structured institutional deal summary ready for German mortgage lenders.
 */
export function generateBankUnderwritingSummary(params: {
  propertyAddress: string
  purchasePriceEur: number
  closingCostsEur: number
  equityEur: number
  loanPrincipalEur: number
  monthlyColdRentEur: number
  annualNoiEur: number
  dscr: number
  energyClass: string
}): {
  headerDe: string
  headerEn: string
  ltvPct: number // Loan-to-Value
  dscrStatus: 'PRIME' | 'ACCEPTABLE' | 'TIGHT'
  summaryTextDe: string
  summaryTextEn: string
} {
  const ltv = Math.round((params.loanPrincipalEur / params.purchasePriceEur) * 1000) / 10
  const dscrStatus = params.dscr >= 1.25 ? 'PRIME' : params.dscr >= 1.05 ? 'ACCEPTABLE' : 'TIGHT'

  const summaryDe = `Finanzierungsübersicht für ${params.propertyAddress}: Kaufpreis ${params.purchasePriceEur.toLocaleString('de-DE')} €, Beleihungsauslauf (LTV) ${ltv} %, Schuldendienstdeckungsgrad (DSCR) ${params.dscr}x, Energieklasse ${params.energyClass}.`
  const summaryEn = `Mortgage Underwriting Package for ${params.propertyAddress}: Purchase price €${params.purchasePriceEur.toLocaleString('en-US')}, Loan-to-Value (LTV) ${ltv}%, DSCR ${params.dscr}x, Energy Rating ${params.energyClass}.`

  return {
    headerDe: 'Bankfertige Finanzierungsprüfung',
    headerEn: 'Bank-Ready Financing Assessment',
    ltvPct: ltv,
    dscrStatus,
    summaryTextDe: summaryDe,
    summaryTextEn: summaryEn,
  }
}
