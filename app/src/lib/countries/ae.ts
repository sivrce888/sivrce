/**
 * UAE country adapter — emirate-level statute, not Dubai copy-paste.
 * Transfer fees, title instrument and tenancy registry change at the
 * emirate border. Pure data, no DB, no network.
 *
 * As-of 2026. Re-check yearly. Never invent a national rate.
 * ponytail: one table. Calculator UI stays in MarketHome / TCO.
 */

export const AE_AS_OF = '2026'

/** 10-year Golden Visa via property — federal threshold, not an emirate fee. */
export const GOLDEN_VISA_AED = 2_000_000

export type AeTitle = 'freehold' | 'usufruct-100y'

export interface AeEmirate {
  slug: 'dubai' | 'abu-dhabi' | 'sharjah' | 'ras-al-khaimah'
  ka: string
  en: string
  ar: string
  /** Buyer-side land-department transfer fee, % of price. */
  transferFeePct: 4 | 2
  authority: string
  title: AeTitle
  /** Tenancy registration that makes a lease enforceable. */
  tenancy: string
  escrow: string
}

export const AE_EMIRATES: readonly AeEmirate[] = [
  {
    slug: 'dubai',
    ka: 'დუბაი',
    en: 'Dubai',
    ar: 'دبي',
    transferFeePct: 4,
    authority: 'Dubai Land Department (DLD)',
    title: 'freehold',
    tenancy: 'Ejari',
    escrow: 'RERA escrow (Law 8 of 2007)',
  },
  {
    slug: 'abu-dhabi',
    ka: 'აბუ-დაბი',
    en: 'Abu Dhabi',
    ar: 'أبوظبي',
    transferFeePct: 2,
    authority: 'Department of Municipalities and Transport (DMT)',
    title: 'freehold',
    tenancy: 'Tawtheeq',
    escrow: 'DMT escrow (Law 3 of 2015)',
  },
  {
    slug: 'sharjah',
    ka: 'შარჯა',
    en: 'Sharjah',
    ar: 'الشارقة',
    transferFeePct: 2,
    authority: 'Sharjah Real Estate Registration Department',
    title: 'usufruct-100y',
    tenancy: 'Sharjah Municipality',
    escrow: 'Sharjah escrow on designated off-plan',
  },
  {
    slug: 'ras-al-khaimah',
    ka: 'რას-ელ-ხაიმა',
    en: 'Ras Al Khaimah',
    ar: 'رأس الخيمة',
    transferFeePct: 2,
    authority: 'RAK Municipality',
    title: 'freehold',
    tenancy: 'RAK Municipality',
    escrow: 'RAK escrow on designated off-plan',
  },
]

const BY_SLUG = new Map(AE_EMIRATES.map((e) => [e.slug, e]))
const BY_KA = new Map(AE_EMIRATES.map((e) => [e.ka, e]))

export function aeEmirateBySlug(slug?: string | null): AeEmirate {
  return (slug && BY_SLUG.get(slug as AeEmirate['slug'])) || AE_EMIRATES[0]
}

export function aeEmirateByKa(ka: string): AeEmirate | undefined {
  return BY_KA.get(ka)
}

export function isAeProjectCity(ka: string): boolean {
  return BY_KA.has(ka)
}

/** Dubai 4%, every other launched emirate 2%. Unknown slug → Dubai (flagship). */
export function aeTransferFeePct(slug?: string | null): 4 | 2 {
  return aeEmirateBySlug(slug).transferFeePct
}

export function aeTitleLabel(e: AeEmirate, ar = false): string {
  if (e.title === 'usufruct-100y') {
    return ar ? 'حق انتفاع 100 سنة' : '100-year usufruct, not a Dubai-style freehold deed'
  }
  return ar ? 'تملك حر في المناطق المحددة' : 'Freehold in designated zones'
}
