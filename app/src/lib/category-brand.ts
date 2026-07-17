/**
 * SIVRCE — Locked Category Branding (BRAND.md §3.1)
 *
 * Every category / service icon has its OWN locked hue + chip tint.
 * Approved by the owner 2026-07-17 from the live screenshots — this file is
 * the ONLY source of truth. Never recolor, never cycle, never invent new
 * tints for these items. New categories get a new locked row here first.
 *
 * `hue`  — icon glyph color (also used for links/accents of that category)
 * `chip` — the icon's soft tinted background (never raw white)
 */

export type CategoryBrand = {
  /** icon glyph + accent color */
  hue: string
  /** soft tinted chip background behind the icon (light theme, locked) */
  chip: string
  /** theme-aware chip — flips to a translucent hue tint in dark mode */
  chipVar: string
}

export const CATEGORY_BRAND = {
  apartments:  { hue: '#2E6BFF', chip: '#EFF3FF', chipVar: 'var(--chip-apartments)' }, // ბინები — brand blue
  houses:      { hue: '#FF6A2D', chip: '#FFF3EF', chipVar: 'var(--chip-houses)' }, // სახლები — action orange
  cottages:    { hue: '#16A34A', chip: '#EDF8F1', chipVar: 'var(--chip-cottages)' }, // აგარაკები — garden green
  land:        { hue: '#D97706', chip: '#FCF4EB', chipVar: 'var(--chip-land)' }, // მიწის ნაკვეთები — earth amber
  commercial:  { hue: '#7C3AED', chip: '#F5F0FE', chipVar: 'var(--chip-commercial)' }, // კომერციული — business violet
  dailyRent:   { hue: '#E11D48', chip: '#FDEDF1', chipVar: 'var(--chip-daily-rent)' }, // დღიური ქირა — rose
  hotels:      { hue: '#0891B2', chip: '#ECF6F9', chipVar: 'var(--chip-hotels)' }, // სასტუმროები — sea cyan
  newProjects: { hue: '#5B8BFF', chip: '#EFF3FF', chipVar: 'var(--chip-new-projects)' }, // ახალი პროექტები — sky blue
} as const satisfies Record<string, CategoryBrand>

export const SERVICE_BRAND = {
  agents:     { hue: '#2E6BFF', chip: '#EFF3FF', chipVar: 'var(--chip-apartments)' }, // აგენტები და სააგენტოები — brand blue
  developers: { hue: '#7C3AED', chip: '#F5F0FE', chipVar: 'var(--chip-commercial)' }, // დეველოპერები — violet
  renovation: { hue: '#FF6A2D', chip: '#FFF3EF', chipVar: 'var(--chip-houses)' }, // რემონტი და კალკულატორი — orange
  mortgage:   { hue: '#16A34A', chip: '#EDF8F1', chipVar: 'var(--chip-cottages)' }, // იპოთეკა და ფინანსები — green
} as const satisfies Record<string, CategoryBrand>

/** Hero deal tabs + search deal chips (BRAND.md §3.2) — hues map to categories */
export const DEAL_BRAND = {
  sale: CATEGORY_BRAND.apartments.hue,       // იყიდება
  rent: CATEGORY_BRAND.commercial.hue,       // ქირავდება
  daily: CATEGORY_BRAND.dailyRent.hue,       // დღიურად
  newProjects: CATEGORY_BRAND.newProjects.hue, // ახალი პროექტები
} as const

export type CategoryKey = keyof typeof CATEGORY_BRAND
export type ServiceKey = keyof typeof SERVICE_BRAND
export type DealKey = keyof typeof DEAL_BRAND
