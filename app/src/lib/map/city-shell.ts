/**
 * City shell types — shared by the RSC builder (server) and Map3D (client).
 * ponytail: plain data only; 220-row caps keep the RSC payload ~25 KB.
 */

export type CityShellPin = { n: string; la: number; ln: number; k: 'metro' | 'landmark' }
export type CityShellHood = { n: string; la: number; ln: number }

export type CityShell = {
  slug: string
  en: string
  ka: string
  cc: string
  hoods: CityShellHood[]
  pins: CityShellPin[]
}

/** Render caps — committed data keeps more, the map shows the top slice. */
export const SHELL_HOOD_CAP = 60
export const SHELL_LANDMARK_CAP = 40
export const SHELL_METRO_CAP = 120
