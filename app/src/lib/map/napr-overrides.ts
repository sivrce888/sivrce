/**
 * Official pin overrides — TAS permit (building) wins over NAPR lot.
 * Written by scripts/snap-official-footprints.ts / snap-napr-pins.ts.
 *
 * ~1.2 MB of JSON: dynamic import (same pattern as building-footprints.json),
 * chained into ensureFootprints() — every consumer of naprOverrideFor already
 * awaits that, so pins never ship this in the JS chunk.
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

export let NAPR_PIN_OVERRIDES: Record<string, NaprPinOverride> = {}

let overridesOnce: Promise<void> | null = null

export function ensureNaprOverrides(): Promise<void> {
  overridesOnce ??= Promise.all([
    import('@/data/napr-pin-overrides.json'),
    import('@/data/tas-pin-overrides.json'),
  ])
    .then(([napr, tas]) => {
      NAPR_PIN_OVERRIDES = {
        ...((napr.default as unknown as FileShape).overrides ?? {}),
        ...((tas.default as unknown as FileShape).overrides ?? {}),
      }
    })
    .catch((err) => {
      console.error('[map] pin overrides unavailable, using catalog coords', err)
    })
  return overridesOnce
}

export function naprOverrideFor(slug: string): NaprPinOverride | null {
  return NAPR_PIN_OVERRIDES[slug] ?? null
}
