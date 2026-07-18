/** Hero count filter: GE sale/rent = rooms (SEO); daily = beds (Airbnb); hide when N/A. */
export type CountMode = 'rooms' | 'beds' | 'hide'

export function countFilterMode(tab: number, type: string): CountMode {
  if (tab === 3 || type === 'land' || type === 'commercial' || type === 'hotel') return 'hide'
  if (tab === 2) return 'beds'
  return 'rooms'
}

/** Deal-aware max-price chips (Airbnb progressive disclosure). */
export function pricePresets(tab: number): readonly { label: string; max: string }[] {
  if (tab === 2) return [
    { label: '≤$50', max: '50' },
    { label: '≤$100', max: '100' },
    { label: '≤$200', max: '200' },
  ]
  if (tab === 1) return [
    { label: '≤$500', max: '500' },
    { label: '≤$1K', max: '1000' },
    { label: '≤$2K', max: '2000' },
  ]
  return [
    { label: '≤$100K', max: '100000' },
    { label: '≤$200K', max: '200000' },
    { label: '≤$500K', max: '500000' },
  ]
}

export const RECENT_KEY = 'sivrce:hero-recent'

export type RecentSearch = { path: string; label: string }

export function readRecent(): RecentSearch | null {
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    if (!raw) return null
    const j = JSON.parse(raw) as RecentSearch
    return typeof j.path === 'string' && typeof j.label === 'string' ? j : null
  } catch {
    return null
  }
}

export function writeRecent(r: RecentSearch): void {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(r))
  } catch {
    /* private mode / quota — ignore */
  }
}

/** Build a short chip label from search params (Airbnb recent searches). */
export function recentLabel(params: URLSearchParams, dealLabel: string): string {
  const bits = [dealLabel]
  const city = params.get('city')
  const district = params.get('district')
  if (district) bits.push(district)
  else if (city) bits.push(city)
  const rooms = params.get('rooms')
  const beds = params.get('beds')
  if (rooms) bits.push(`${rooms}+ ოთ.`)
  else if (beds) bits.push(`${beds}+ საძ.`)
  const max = params.get('max')
  if (max) bits.push(`≤$${Number(max).toLocaleString('en-US')}`)
  return bits.slice(0, 3).join(' · ')
}
