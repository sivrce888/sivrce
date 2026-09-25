/**
 * "12% below the Vake median" — one wording for the project page panel and the
 * hub cards. Leaf module: the client grid imports this, not project-page-copy.
 */
import type { DirLoc } from '@/lib/directory-seo-lite'

/** Within ±3% reads as "near the median" — smaller gaps are noise in "from" prices. */
const NEAR = 3

export function marketChip(loc: DirLoc | 'de', deltaPct: number, scope: string): string {
  const pct = `${Math.abs(deltaPct)}%`
  const near = Math.abs(deltaPct) < NEAR
  const below = deltaPct < 0
  if (loc === 'ka') return near ? `მედიანასთან ახლოს · ${scope}` : `${pct}-ით ${below ? 'იაფი' : 'ძვირი'} მედიანაზე · ${scope}`
  if (loc === 'ru') return near ? `Около медианы: ${scope}` : `На ${pct} ${below ? 'ниже' : 'выше'} медианы: ${scope}`
  if (loc === 'de') return near ? `Nahe am Median (${scope})` : `${pct} ${below ? 'unter' : 'über'} dem Median (${scope})`
  return near ? `Near the ${scope} median` : `${pct} ${below ? 'below' : 'above'} the ${scope} median`
}
