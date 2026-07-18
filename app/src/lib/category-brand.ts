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
  // Daily-rent collections (locked 2026-07-18, owner request)
  partyHouses: { hue: '#C026D3', chip: '#FAE8FD', chipVar: 'var(--chip-party)' }, // სახლები წვეულებებისთვის — party fuchsia
  selfCheckIn: { hue: '#0D9488', chip: '#E6F6F4', chipVar: 'var(--chip-self-checkin)' }, // უკონტაქტო ჩექინი — key teal
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
  pledge: SERVICE_BRAND.mortgage.hue,        // გირავდება — locked mortgage green
  newProjects: CATEGORY_BRAND.newProjects.hue, // ახალი პროექტები
} as const

/**
 * Map / listing status hues (BRAND.md §3.4).
 * Construction = newProjects sky blue — owner revert 2026-07-18 (orange = CTAs only).
 */
export const STATUS_BRAND = {
  construction: {
    hue: CATEGORY_BRAND.newProjects.hue, // #5B8BFF
    chip: CATEGORY_BRAND.newProjects.chip,
    chipVar: CATEGORY_BRAND.newProjects.chipVar,
  },
} as const satisfies Record<string, CategoryBrand>

export type CategoryKey = keyof typeof CATEGORY_BRAND
export type ServiceKey = keyof typeof SERVICE_BRAND
export type DealKey = keyof typeof DEAL_BRAND
export type StatusKey = keyof typeof STATUS_BRAND
