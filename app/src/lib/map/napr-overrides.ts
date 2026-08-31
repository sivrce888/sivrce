/**
 * NAPR pin overrides — written by scripts/snap-napr-pins.ts when CadRepGeo is up.
 * Empty overrides until first successful snap. Safe to import when file missing fields.
 */
export type NaprPinOverride = {
  lat: number
  lng: number
  uniqCode: string
  ring: [number, number][]
  source: 'napr'
}

type FileShape = {
  attribution?: string
  updatedAt?: string | null
  overrides?: Record<string, NaprPinOverride>
}

// ponytail: static JSON import; regenerate via snap-napr-pins.ts
import raw from '@/data/napr-pin-overrides.json'

const data = raw as FileShape

export const NAPR_PIN_OVERRIDES: Record<string, NaprPinOverride> = data.overrides ?? {}

export function naprOverrideFor(slug: string): NaprPinOverride | null {
  return NAPR_PIN_OVERRIDES[slug] ?? null
}
