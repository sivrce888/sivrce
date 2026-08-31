/** Recent-search chip helpers for the homepage hero. */

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

/** Build a short chip label from search params. */
export function recentLabel(params: URLSearchParams, dealLabel: string): string {
  const bits = [dealLabel]
  const city = params.get('city')
  const district = params.get('district')
  if (district) bits.push(district)
  else if (city) bits.push(city)
  const q = params.get('q')
  if (q) bits.push(q)
  const rooms = params.get('rooms')
  const beds = params.get('beds')
  if (rooms) bits.push(`${rooms}+ ოთ.`)
  else if (beds) bits.push(`${beds}+ საძ.`)
  const max = params.get('max')
  if (max) bits.push(`≤$${Number(max).toLocaleString('en-US')}`)
  return bits.slice(0, 3).join(' · ')
}
