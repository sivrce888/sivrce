/**
 * Official pin overrides — TAS permit (building) wins over NAPR lot.
 * Written by scripts/snap-official-footprints.ts / snap-napr-pins.ts.
 */
export type NaprPinOverride = {
  lat: number
  lng: number
  uniqCode?: string
  ring: [number, number][]
  source: 'napr' | 'tas'
}

type FileShape = {
  attribution?: string
  updatedAt?: string | null
  overrides?: Record<string, NaprPinOverride>
}

import naprRaw from '@/data/napr-pin-overrides.json'
import tasRaw from '@/data/tas-pin-overrides.json'

const naprData = naprRaw as unknown as FileShape
const tasData = tasRaw as unknown as FileShape

export const NAPR_PIN_OVERRIDES: Record<string, NaprPinOverride> = {
  ...(naprData.overrides ?? {}),
  ...(tasData.overrides ?? {}),
}

export function naprOverrideFor(slug: string): NaprPinOverride | null {
  return NAPR_PIN_OVERRIDES[slug] ?? null
}
