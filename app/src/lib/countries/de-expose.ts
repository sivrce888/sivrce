/**
 * German exposé facts parsed from listing copy.
 * Leaf: no DE_CITIES, no DB — safe on listing/search clients (device-budget).
 *
 * Never invents a class or year. Missing → omitted.
 */
export const DE_ENERGY_CLASSES = ['A+', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] as const
export type DeEnergyClass = (typeof DE_ENERGY_CLASSES)[number]

export interface DeExposeFacts {
  energyClass?: DeEnergyClass
  yearBuilt?: number
  kfw?: string
}

const YEAR_RE = /Baujahr\s+(1[89]\d{2}|20[0-2]\d)\b/i
const KFW_RE = /KfW\s*(\d{2})\b/i
/** A+ before A. No `\b` after `+` — `+` is non-word so `A+\b` never matches. */
const ENERGY_RE = /Energieausweis\s+(A\+|[A-H])(?![A-Z+])/i

export function parseDeExpose(text: string): DeExposeFacts {
  const hay = text.replace(/\s+/g, ' ')
  const raw = hay.match(ENERGY_RE)?.[1]?.toUpperCase()
  const yearM = hay.match(YEAR_RE)
  const yearBuilt = yearM ? Number(yearM[1]) : undefined
  const kfwM = hay.match(KFW_RE)
  return {
    energyClass: DE_ENERGY_CLASSES.find((c) => c === raw),
    yearBuilt: yearBuilt && yearBuilt >= 1800 && yearBuilt <= 2030 ? yearBuilt : undefined,
    kfw: kfwM ? `KfW ${kfwM[1]}` : undefined,
  }
}

export function formatEur(n: number, loc = 'de-DE'): string {
  return `${Math.round(n).toLocaleString(loc)} €`
}
