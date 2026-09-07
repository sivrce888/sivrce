import { Building2, Heart, House, KeyRound, Mountain, PawPrint, Sofa, Star, Sun, Trees } from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { BRAND } from "./brand"

/**
 * Name-derived avatar visuals (BRAND.md §3 tokens only — no new hex).
 * Pure + deterministic: same name renders the same gradient on server
 * and client, so there is no hydration drift and nothing to store.
 */

const c = BRAND.colors

/** Two-stop gradients built exclusively from locked brand hues. */
const PAIRS: ReadonlyArray<readonly [string, string]> = [
  [c.blueLight, c.blue], // sky
  [c.blue, c.blueDeep], // ocean
  [c.blueDeep, c.navySoft], // deep sea
  [c.blue, c.violet], // brand aurora
  [c.violet, c.navySoft], // dusk
  [c.blueLight, c.violet], // periwinkle
  [c.orangeLight, c.orange], // sunrise
  [c.orange, c.orangeDeep], // ember
  [c.orangeDeep, c.violet], // magma
  [c.orangeLight, c.orangeDeep], // peach
]

// Angle family around the locked 120° brand gradient angle.
const ANGLES = [110, 125, 140, 155, 170]

/** Swatch palette for the settings picker — same source as the render path. */
export const GRADIENTS: ReadonlyArray<readonly [string, string]> = PAIRS

/** Curated glyphs a user can pin over their gradient (settings → avatar).
 * Tree-shaken lucide set — closed allowlist, never render arbitrary names. */
export const ICONS = {
  house: House,
  building: Building2,
  key: KeyRound,
  star: Star,
  heart: Heart,
  sun: Sun,
  mountain: Mountain,
  trees: Trees,
  sofa: Sofa,
  paw: PawPrint,
} as const satisfies Record<string, LucideIcon>

export type AvatarIcon = keyof typeof ICONS

/** Trust-boundary bounds check for a user-chosen glyph key. */
export function isValidAvatarIcon(icon: string | null | undefined): icon is AvatarIcon {
  return typeof icon === "string" && icon in ICONS
}

/** Trust-boundary bounds check for a user-chosen style index. */
export function isValidAvatarStyle(style: number | null | undefined): style is number {
  return typeof style === "number" && Number.isInteger(style) && style >= 0 && style < PAIRS.length
}

/** FNV-1a 32-bit + splitmix32 finalizer — stable across Node/browser,
 * no deps; the avalanche stops look-alike names from clustering. */
function hash32(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  h ^= h >>> 16
  h = Math.imul(h, 0x7feb352d)
  h ^= h >>> 15
  h = Math.imul(h, 0x846ca68b)
  h ^= h >>> 16
  return h >>> 0
}

/** 10 pairs × 5 angles = 50 distinct, always-on-brand visuals per name.
 * A user-chosen `style` (settings → avatar) pins the pair and picks a stable
 * angle from the same family; null/undefined keeps the name-derived default. */
export function avatarVisual(
  name: string,
  style?: number | null,
): {
  from: string
  to: string
  angle: number
} {
  if (isValidAvatarStyle(style)) {
    const [from, to] = PAIRS[style]
    return { from, to, angle: ANGLES[style % ANGLES.length] }
  }
  const h = hash32(name.trim().toLowerCase())
  const [from, to] = PAIRS[h % PAIRS.length]
  return { from, to, angle: ANGLES[(h >>> 4) % ANGLES.length] }
}

/** Up to 2 leading initials ("ნიკა გელაშვილი" → "ნგ"); "S" when empty. */
export function avatarInitials(name: string | null | undefined): string {
  const words = (name ?? "").trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return "S"
  return words
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")
}
