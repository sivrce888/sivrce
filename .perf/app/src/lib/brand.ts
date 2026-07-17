/**
 * SIVRCE — Locked Brand Tokens (FROZEN 2026-07-17 · BRAND.md v1.2)
 * Single source of truth. Every new component, section, or page MUST
 * consume these tokens instead of inventing new values.
 * Change only with owner approval + BRAND.md version bump.
 */

export const BRAND = {
  name: 'სივრცე',
  domain: 'sivrce.ge',
  tagline: {
    ka: 'უძრავი ქონება ერთ სივრცეში',
    en: 'Real estate in one space',
  },

  colors: {
    /** Primary — trust, technology, the brand itself */
    blue: '#2E6BFF',
    blueLight: '#8FB4FF',
    blueDeep: '#1A3FC0',
    violet: '#7A5CFF', // only inside gradients, never standalone

    /** Accent — action, energy, VIP. CTAs and highlights only */
    orange: '#FF6A2D',
    orangeLight: '#FFB25E',
    orangeDeep: '#FF4D6D', // only inside gradients (VIP, SUPER VIP)

    /** Foundations */
    navy: '#050B26', // darkest background (hero, dark sections)
    navySoft: '#0A1440',
    ink: '#0A1030', // primary text on light
    paper: '#FFFFFF',
    cloud: '#F6F7FB', // light section background

    /** Semantic */
    success: '#4ADE80',
  },

  gradients: {
    brand: 'linear-gradient(120deg, #8FB4FF 0%, #2E6BFF 55%, #7A5CFF 100%)',
    action: 'linear-gradient(120deg, #FFB25E 0%, #FF6A2D 60%, #FF4D6D 100%)',
    vip: 'linear-gradient(90deg, #2E6BFF, #7A5CFF)',
    superVip: 'linear-gradient(90deg, #FF6A2D, #FF4D6D)',
  },

  radius: {
    card: '26px',
    tile: '22px',
    module: '16px', // nested modules inside cards (score strips, stat cells)
    control: '12px',
    pill: '999px',
  },

  type: {
    family: '"Manrope", "Noto Sans Georgian", ui-sans-serif, system-ui, sans-serif',
    displayWeight: 900, // headlines — always black weight, tracking -0.02em…-0.045em
    bodyWeight: 500,
  },

  elevation: {
    card: '0 2px 8px -2px rgba(10,16,48,.08), 0 12px 32px -12px rgba(10,16,48,.12)',
    cardHover: '0 6px 16px -4px rgba(10,16,48,.12), 0 24px 56px -16px rgba(10,16,48,.28)',
    soft: '0 20px 60px -20px rgba(10,16,48,.25)',
    glowOrange: '0 12px 32px -8px rgba(255,106,45,.8)',
    glowOrangeHover: '0 20px 56px -12px rgba(255,106,45,.95)',
    glowBlue: '0 16px 48px -12px rgba(46,107,255,.7)',
    glowBlueSm: '0 6px 16px -6px rgba(46,107,255,.7)', // compact controls (chips, toggles)
    glowNavy: '0 16px 48px -12px rgba(5,11,38,.5)', // navy buttons on light sections
    panelDark: '0 30px 80px -20px rgba(1,4,20,.65)', // navy-based, never pure black
    showcaseBlue: '0 40px 120px -30px rgba(46,107,255,.45)',
  },

  motion: {
    ease: [0.21, 0.65, 0.2, 1] as const,
    revealY: 28,
    duration: 0.7,
  },

  vipTiers: {
    VIP: { style: 'bg-sv-ink/85 text-white backdrop-blur', icon: 'Flame' },
    'VIP+': { style: 'bg-gradient-to-r from-sv-blue to-sv-violet text-white', icon: 'Flame' },
    'SUPER VIP': { style: 'bg-gradient-to-r from-sv-orange to-sv-orange-deep text-white', icon: 'Crown' },
  },
} as const

/** VIP badge class per tier — the only allowed source (BRAND.md §8) */
export const VIP_BADGE_STYLE: Record<keyof typeof BRAND.vipTiers, string> = {
  VIP: BRAND.vipTiers.VIP.style,
  'VIP+': BRAND.vipTiers['VIP+'].style,
  'SUPER VIP': BRAND.vipTiers['SUPER VIP'].style,
}

export type Brand = typeof BRAND
