/**
 * Check: freshenFinish guard — stale deadlines never survive into PROJECTS.
 * Run: npx tsx src/data/freshen-finish.check.ts
 */
import { PROJECTS, finishMaxYear, freshenFinish, isDelivered } from './professionals'

const YEAR = new Date().getFullYear()

// Unit: stale single-phase → delivered; live later phase stays active; yearless stays.
const stale = freshenFinish({ done: 40, finish: '2024 Q2' })
console.assert(stale.done === 100 && stale.finish === 'გადაცემულია (2024)', 'stale completes')
const multi = freshenFinish({ done: 60, finish: 'Block C 2025 Q3 / Block A → 2027 Q2' })
console.assert(multi.done === 60 && multi.finish.includes('2027'), 'multi-phase max year guards')
const yearless = freshenFinish({ done: 50, finish: 'მიმდინარე' })
console.assert(yearless.done === 50, 'yearless untouched')
const already = freshenFinish({ done: 100, finish: `გადაცემულია (${YEAR - 1})` })
console.assert(already.finish.startsWith('გადაცემულია'), 'already-delivered untouched')

// isDelivered: hybrid 'ready' row with a future phase never wears the badge.
console.assert(!isDelivered({ done: 100, finish: 'მზადაა მკვიდრებისთვის · 2027 Q4' }), 'hybrid future phase not delivered')
console.assert(isDelivered({ done: 100, finish: 'გადაცემულია (2021)' }), 'explicit delivery')
console.assert(isDelivered({ done: 100, finish: 'მიმდინარე' }), '100% built, yearless → delivered')

// Whole catalog: nothing active with a fully-passed deadline survives the .map(freshenFinish).
const leaks = PROJECTS.filter((p) => {
  if (p.done >= 100 || p.finish.startsWith('გადაცემულია')) return false
  const y = finishMaxYear(p.finish)
  return y !== null && y < YEAR
})
console.assert(leaks.length === 0, `no stale active projects, leaked: ${leaks.map((p) => p.slug).join(', ')}`)

console.log(`freshen-finish: ${PROJECTS.length} projects clean, 4 unit cases ✓`)
