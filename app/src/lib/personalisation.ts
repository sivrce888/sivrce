/**
 * SIVRCE Personalisation Engine
 * Pure scoring, client/server safe, ultra-lightweight, 0 runtime dependencies.
 * Computes user affinity profiles from browsing behavior (recent views, saved searches, favorites)
 * and ranks listings with explainable matching reasons across all 10 locales.
 */

import type { Listing } from '@/data/listings'
import type { Lang } from '@/lib/i18n/core'

export interface UserAffinityProfile {
  deals: Record<string, number>
  cities: Record<string, number>
  districts: Record<string, number>
  propTypes: Record<string, number>
  priceSamples: number[]
  targetPriceMedian: number | null
  viewedIds: Set<string>
  totalInteractions: number
}

export interface PersonalizedRecommendation {
  listing: Listing
  score: number
  reasonKey: RecommendationReason
  reasonLabel: string
}

export type RecommendationReason =
  | 'district_match'
  | 'budget_match'
  | 'type_match'
  | 'deal_match'
  | 'trending'

const REASON_LABELS: Record<Lang, Record<RecommendationReason, string>> = {
  ka: {
    district_match: 'თქვენთვის საინტერესო უბანში',
    budget_match: 'თქვენს საფასო დიაპაზონში',
    type_match: 'თქვენი რჩეული ტიპის ქონება',
    deal_match: 'შესაბამისი გარიგების ტიპი',
    trending: 'პოპულარული შეთავაზება',
  },
  en: {
    district_match: 'In your preferred district',
    budget_match: 'In your target budget',
    type_match: 'Matches your preferred property type',
    deal_match: 'Matches your deal type',
    trending: 'Trending high-demand match',
  },
  ru: {
    district_match: 'В интересующем вас районе',
    budget_match: 'В вашем ценовом диапазоне',
    type_match: 'Подходящий тип недвижимости',
    deal_match: 'Соответствует типу сделки',
    trending: 'Популярное предложение',
  },
  de: {
    district_match: 'In Ihrem bevorzugten Stadtteil',
    budget_match: 'In Ihrem Preisbudget',
    type_match: 'Passender Immobilientyp',
    deal_match: 'Passende Angebotsart',
    trending: 'Beliebtes Angebot',
  },
  tr: {
    district_match: 'Tercih ettiğiniz bölgede',
    budget_match: 'Bütçenize uygun',
    type_match: 'Tercih ettiğiniz emlak tipi',
    deal_match: 'İşlem türüne uygun',
    trending: 'Öne çıkan fırsat',
  },
  uk: {
    district_match: 'У бажаному районі',
    budget_match: 'У вашому ціновому діапазоні',
    type_match: 'Відповідний тип нерухомості',
    deal_match: 'Відповідає типу угоди',
    trending: 'Популярна пропозиція',
  },
  he: {
    district_match: 'באזור המועדף עליך',
    budget_match: 'בטווח התקציב שלך',
    type_match: 'מתאים לסוג הנכס המועדף',
    deal_match: 'תואם לסוג העסקה',
    trending: 'הצעה פופולרית',
  },
  ar: {
    district_match: 'في منطقتك المفضلة',
    budget_match: 'ضمن ميزانيتك المحددة',
    type_match: 'يطابق نوع العقار المفضل',
    deal_match: 'يطابق نوع الصفقة',
    trending: 'عرض مميز وشائع',
  },
  hy: {
    district_match: 'Ձեր նախընտրած թաղամասում',
    budget_match: 'Ձեր գնային միջակայքում',
    type_match: 'Համապատասխան գույքի տեսակ',
    deal_match: 'Համապատասխանում է գործարքի տեսակին',
    trending: 'Հանրաճանաչ առաջարկ',
  },
  az: {
    district_match: 'Seçdiyiniz rayonda',
    budget_match: 'Büdcənizə uyğun',
    type_match: 'Uyğun əmlak növü',
    deal_match: 'Əməliyyat növünə uyğun',
    trending: 'Populyar təklif',
  },
}

/** Compute median from a list of numbers. Returns null if empty. */
export function calculateMedian(nums: number[]): number | null {
  if (nums.length === 0) return null
  const sorted = [...nums].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

/**
 * Derives a user affinity profile from listing interactions.
 */
export function buildAffinityProfile(
  viewedListings: Listing[],
  savedSearchQueries: string[] = [],
  favoritedListings: Listing[] = [],
): UserAffinityProfile {
  const profile: UserAffinityProfile = {
    deals: {},
    cities: {},
    districts: {},
    propTypes: {},
    priceSamples: [],
    targetPriceMedian: null,
    viewedIds: new Set<string>(),
    totalInteractions: 0,
  }

  for (const item of viewedListings) {
    profile.viewedIds.add(item.id)
    profile.totalInteractions++

    if (item.dealType) profile.deals[item.dealType] = (profile.deals[item.dealType] || 0) + 1
    if (item.city) profile.cities[item.city] = (profile.cities[item.city] || 0) + 1
    if (item.district) profile.districts[item.district] = (profile.districts[item.district] || 0) + 1
    if (item.propType) profile.propTypes[item.propType] = (profile.propTypes[item.propType] || 0) + 1
    if (item.priceUSD && item.priceUSD > 0) profile.priceSamples.push(item.priceUSD)
  }

  // Favorites are the strongest intent signal — weight 3×, and suppressed from
  // recommendations (already saved) while still shaping the affinity profile.
  for (const item of favoritedListings) {
    profile.viewedIds.add(item.id)
    profile.totalInteractions += 3

    if (item.dealType) profile.deals[item.dealType] = (profile.deals[item.dealType] || 0) + 3
    if (item.city) profile.cities[item.city] = (profile.cities[item.city] || 0) + 3
    if (item.district) profile.districts[item.district] = (profile.districts[item.district] || 0) + 4
    if (item.propType) profile.propTypes[item.propType] = (profile.propTypes[item.propType] || 0) + 3
    if (item.priceUSD && item.priceUSD > 0) {
      profile.priceSamples.push(item.priceUSD, item.priceUSD, item.priceUSD)
    }
  }

  // Parse saved search queries (e.g. 'deal=sale&city=tbilisi&district=vake&minPrice=50000&maxPrice=150000')
  for (const query of savedSearchQueries) {
    if (!query) continue
    profile.totalInteractions += 2 // Saved searches carry higher intent
    const params = new URLSearchParams(query)
    const deal = params.get('deal') || params.get('dealType')
    const city = params.get('city')
    const district = params.get('district')
    const type = params.get('type') || params.get('propType')
    const minP = Number(params.get('minPrice') || params.get('priceMin'))
    const maxP = Number(params.get('maxPrice') || params.get('priceMax'))

    if (deal) profile.deals[deal] = (profile.deals[deal] || 0) + 3
    if (city) profile.cities[city] = (profile.cities[city] || 0) + 3
    if (district) profile.districts[district] = (profile.districts[district] || 0) + 4
    if (type) profile.propTypes[type] = (profile.propTypes[type] || 0) + 3
    if (minP && maxP && minP > 0 && maxP >= minP) {
      profile.priceSamples.push((minP + maxP) / 2)
    } else if (maxP > 0) {
      profile.priceSamples.push(maxP * 0.8)
    }
  }

  profile.targetPriceMedian = calculateMedian(profile.priceSamples)
  return profile
}

/**
 * Scores a candidate listing against a user affinity profile.
 * Returns score (0-100) and dominant match reason.
 */
export function scoreListingAffinity(
  listing: Listing,
  profile: UserAffinityProfile,
): { score: number; reason: RecommendationReason } {
  // If user has zero interactions, fallback to badge & freshness
  if (profile.totalInteractions === 0) {
    const badgeBonus = listing.badge === 'SUPER VIP' ? 30 : listing.badge === 'VIP+' ? 20 : listing.badge === 'VIP' ? 10 : 0
    const photosBonus = (listing.images?.length || 0) >= 3 ? 15 : 5
    return { score: badgeBonus + photosBonus, reason: 'trending' }
  }

  // If already viewed, penalize so user sees fresh recommendations
  if (profile.viewedIds.has(listing.id)) {
    return { score: -10, reason: 'trending' }
  }

  let score = 0
  let topReason: RecommendationReason = 'trending'
  let highestReasonWeight = 0

  // 1. District Match (up to 35 pts)
  if (listing.district && profile.districts[listing.district]) {
    const dScore = Math.min(35, profile.districts[listing.district] * 12)
    score += dScore
    if (dScore > highestReasonWeight) {
      highestReasonWeight = dScore
      topReason = 'district_match'
    }
  }

  // 2. City Match (up to 15 pts)
  if (listing.city && profile.cities[listing.city]) {
    score += Math.min(15, profile.cities[listing.city] * 5)
  }

  // 3. Deal Match (up to 20 pts)
  if (listing.dealType && profile.deals[listing.dealType]) {
    const dealScore = Math.min(20, profile.deals[listing.dealType] * 8)
    score += dealScore
    if (dealScore > highestReasonWeight) {
      highestReasonWeight = dealScore
      topReason = 'deal_match'
    }
  }

  // 4. Property Type Match (up to 15 pts)
  if (listing.propType && profile.propTypes[listing.propType]) {
    const typeScore = Math.min(15, profile.propTypes[listing.propType] * 6)
    score += typeScore
    if (typeScore > highestReasonWeight) {
      highestReasonWeight = typeScore
      topReason = 'type_match'
    }
  }

  // 5. Budget Match (up to 25 pts)
  if (profile.targetPriceMedian && listing.priceUSD && listing.priceUSD > 0) {
    const ratio = listing.priceUSD / profile.targetPriceMedian
    if (ratio >= 0.75 && ratio <= 1.35) {
      const budgetScore = Math.round(25 * (1 - Math.abs(1 - ratio)))
      score += budgetScore
      if (budgetScore > highestReasonWeight) {
        highestReasonWeight = budgetScore
        topReason = 'budget_match'
      }
    }
  }

  // Quality & VIP boost (up to 10 pts)
  if (listing.badge === 'SUPER VIP') score += 10
  else if (listing.badge === 'VIP+') score += 5
  else if (listing.badge === 'VIP') score += 2
  if ((listing.images?.length || 0) >= 4) score += 5

  return { score, reason: topReason }
}

/**
 * Returns top personalized recommendations from a listing catalog.
 */
export function getPersonalizedRecommendations(
  catalog: Listing[],
  profile: UserAffinityProfile,
  limit = 8,
  lang: Lang = 'ka',
): PersonalizedRecommendation[] {
  const scored = catalog
    .map((listing) => {
      const { score, reason } = scoreListingAffinity(listing, profile)
      const reasonLabel = REASON_LABELS[lang]?.[reason] || REASON_LABELS.en[reason]
      return { listing, score, reasonKey: reason, reasonLabel }
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)

  return scored.slice(0, limit)
}

/**
 * Reads local browsing history and saved searches to construct a live affinity profile on the client.
 * Returns empty profile during SSR.
 */
export function buildProfileFromStorage(catalog: Listing[] = []): UserAffinityProfile {
  if (typeof window === 'undefined') {
    return {
      deals: {},
      cities: {},
      districts: {},
      propTypes: {},
      priceSamples: [],
      targetPriceMedian: null,
      viewedIds: new Set<string>(),
      totalInteractions: 0,
    }
  }

  let recentIds: string[] = []
  try {
    const raw = localStorage.getItem('sivrce:recent')
    const parsed: unknown = raw ? JSON.parse(raw) : []
    recentIds = Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : []
  } catch {
    recentIds = []
  }

  let favIds: string[] = []
  try {
    const raw = localStorage.getItem('sivrce:favs')
    const parsed: unknown = raw ? JSON.parse(raw) : []
    favIds = Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : []
  } catch {
    favIds = []
  }

  let savedQueries: string[] = []
  try {
    const raw = localStorage.getItem('sivrce:saved-searches')
    const parsed: unknown = raw ? JSON.parse(raw) : []
    if (Array.isArray(parsed)) {
      savedQueries = parsed
        .map((x) => (x && typeof (x as { query?: unknown }).query === 'string' ? (x as { query: string }).query : ''))
        .filter(Boolean)
    }
  } catch {
    savedQueries = []
  }

  const catalogMap = new Map<string, Listing>()
  for (const l of catalog) catalogMap.set(l.id, l)

  const viewedListings = recentIds
    .map((id) => catalogMap.get(id))
    .filter((l): l is Listing => !!l)

  const favoritedListings = favIds
    .map((id) => catalogMap.get(id))
    .filter((l): l is Listing => !!l)

  return buildAffinityProfile(viewedListings, savedQueries, favoritedListings)
}

/**
 * True when the visitor has any local intent signal (views, favorites, saved
 * searches). Used to gate the personalized rail so first-time visitors never
 * see a redundant "trending" clone of the paid rails. SSR-safe (false).
 */
export function hasPersonalisationSignal(): boolean {
  if (typeof window === 'undefined') return false
  for (const key of ['sivrce:recent', 'sivrce:favs', 'sivrce:saved-searches']) {
    try {
      const raw = window.localStorage.getItem(key)
      if (raw && raw !== '[]' && raw !== '{}') return true
    } catch {
      /* private mode / storage disabled — treat as no signal */
    }
  }
  return false
}

/**
 * Returns personalized recommendations derived from client storage.
 */
export function getRecommendedFromStorage(
  catalog: Listing[],
  limit = 8,
  lang: Lang = 'ka',
): PersonalizedRecommendation[] {
  const profile = buildProfileFromStorage(catalog)
  return getPersonalizedRecommendations(catalog, profile, limit, lang)
}

