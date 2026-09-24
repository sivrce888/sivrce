/**
 * Georgia competitive scorecard — honest, evidence-based ranking of sivrce
 * against the incumbents a Georgian buyer actually compares (MyHome.ge,
 * SS.ge, Korter.ge, Livo.ge) plus the global stays incumbent that owns the
 * Batumi season (Airbnb).
 *
 * Integrity contract (enforced by georgia-competitive.check.ts):
 *  - Every sivrce cell carries an `evidence` repo path that MUST exist on disk
 *    AND be imported by something the product ships.
 *  - Competitor cells are transparent editorial assessments of their PUBLIC
 *    feature sets in Georgia; each carries a one-line `note` (why).
 *  - The coverage term is MEASURED from the shipped GE data modules and
 *    re-asserted against their real lengths on every prebuild — the card moves
 *    when the data moves.
 *  - Two honest gaps are structural, never inflated: live board inventory
 *    (MyHome leads — tens of thousands of active ads) and the stays product
 *    itself (Airbnb leads — payments, reviews, host scale).
 *
 * DB-free, SSR-safe, no new deps.
 * ponytail: one file, weighted sum, evidence-gated — same shape as
 * germany-competitive. Upgrade path: swap GE_INVENTORY for live counts from
 * the GE ingest hub once boards fill (scripts/ge-data-hub.ts).
 */

export interface GeInventoryCounts {
  /** Tbilisi streets with canonical districts shipped for search. */
  streets: number
  /** Building catalog entries (new + existing stock, TAS footprints). */
  buildings: number
  /** New-development projects with full cards. */
  projects: number
  /** Developers with verified official sources. */
  developers: number
}

/** What the repo actually carries for Georgia today. georgia-competitive.check.ts
 *  asserts each number against the real data module — if inventory grows or
 *  shrinks and this is not updated, the build fails, so it cannot drift. */
export const GE_INVENTORY: GeInventoryCounts = {
  streets: 4665,
  buildings: 972,
  projects: 956,
  developers: 611,
}

/**
 * Incumbent-parity anchors: [points, count that earns all of them]. Log scale,
 * because the 100th listing matters far more to a buyer than the 100,000th.
 */
const COVERAGE_ANCHORS: Record<keyof GeInventoryCounts, readonly [number, number]> = {
  streets: [30, 8000],
  buildings: [30, 4000],
  projects: [20, 2000],
  developers: [20, 800],
}

/** Measured data breadth, 0..100 — counted from the shipped GE data modules. */
export function georgiaCoverageScore(counts: GeInventoryCounts = GE_INVENTORY): number {
  let score = 0
  for (const key of Object.keys(COVERAGE_ANCHORS) as (keyof GeInventoryCounts)[]) {
    const [points, parity] = COVERAGE_ANCHORS[key]
    const ratio = Math.log10(Math.max(0, counts[key]) + 1) / Math.log10(parity)
    score += points * Math.min(1, Math.max(0, ratio))
  }
  return Math.round(score)
}

export type PlayerId = 'sivrce' | 'myhome-ge' | 'ss-ge' | 'korter-ge' | 'livo-ge' | 'airbnb'

export type PlayerTier = 'self' | 'local-native' | 'global'

export interface Dimension {
  id: string
  /** English label. */
  label: string
  /** Georgian label (native ka copy). */
  labelKa: string
  /** Weight in the overall total; all weights sum to exactly 1. */
  weight: number
  /** What this dimension measures, in one line. */
  what: string
}

export interface Cell {
  /** 0..100. */
  score: number
  /** One-line justification. */
  note: string
  /**
   * sivrce only: repo-relative path proving the capability. The check asserts
   * this file exists — evidence-gated scoring, not a marketing claim.
   */
  evidence?: string
}

export interface Player {
  id: PlayerId
  name: string
  tier: PlayerTier
  cells: Record<string, Cell>
}

export interface RankedPlayer extends Player {
  total: number
  rank: number
}

/** Ten dimensions, weighted by what Georgian buyers/renters actually compete on. */
export const GEORGIA_DIMENSIONS: readonly Dimension[] = [
  {
    id: 'trust',
    label: 'Fake-listing & scam defense',
    labelKa: 'ყალბი განცხადებებისგან დაცვა',
    weight: 0.14,
    what: 'Duplicate collapse, scam radar, fact-state labels and verified contacts — the chronic pain of Georgian classifieds.',
  },
  {
    id: 'priceIntel',
    label: 'Price intelligence',
    labelKa: 'ფასების ანალიტიკა',
    weight: 0.12,
    what: 'District medians, monthly snapshots and per-listing comp scales that admit when comps are too thin to judge.',
  },
  {
    id: 'spatial',
    label: 'Map, 3D & sun physics',
    labelKa: 'რუკა, 3D და მზის გეომეტრია',
    weight: 0.12,
    what: '3D massing, real solar geometry per coordinate, cadastral footprints, draw-to-search and metro distance math.',
  },
  {
    id: 'newDev',
    label: 'New-development depth',
    labelKa: 'ახალი მშენებლობების სიღრმე',
    weight: 0.12,
    what: 'Developer catalog with official sync, project cards, construction status and per-complex listing rails.',
  },
  {
    id: 'costTransparency',
    label: 'Purchase-cost transparency',
    labelKa: 'შეძენის ხარჯების გამჭვირვალობა',
    weight: 0.1,
    what: 'Closing-cost math shown before the call: registration fees, taxes and agent commission computed for the actual price.',
  },
  {
    id: 'coverage',
    label: 'Live inventory & data breadth',
    labelKa: 'აქტიური ინვენტარისა და მონაცემების სიგანე',
    weight: 0.1,
    what: 'Active listings a buyer can act on today, plus the street/building/project reference graph behind search.',
  },
  {
    id: 'stays',
    label: 'Stays & daily rental',
    labelKa: 'დასაქირავებელი და ყოველდღიური ქირა',
    weight: 0.08,
    what: 'Bookable daily stays with payments, calendars and reviews — the Batumi sea season fight.',
  },
  {
    id: 'i18n',
    label: 'Language reach',
    labelKa: 'ენობრივი მოცვა',
    weight: 0.08,
    what: 'Native ka plus every buyer locale, national romanization, and in-chat translation so no Mkhedruli is a wall.',
  },
  {
    id: 'performance',
    label: 'Performance on every device',
    labelKa: 'სისწრაფე ყველა მოწყობილობაზე',
    weight: 0.08,
    what: 'Lite-device budgeting, offline PWA and sub-second loads on the low-end Androids that dominate Georgian traffic.',
  },
  {
    id: 'proTools',
    label: 'Agent & developer OS',
    labelKa: 'აგენტისა და დეველოპერის OS',
    weight: 0.06,
    what: 'Lead pipeline, staff inbox, tour scheduling and deal analytics — not just a paid ad slot.',
  },
]

/** Convenience: dimension by id. */
export function georgiaDimension(id: string): Dimension | undefined {
  return GEORGIA_DIMENSIONS.find((d) => d.id === id)
}

/** The scorecard. sivrce cells cite shipped repo paths; competitor cells are
 *  honest editorial assessments of public feature sets in Georgia. */
export const GEORGIA_PLAYERS: readonly Player[] = [
  {
    id: 'sivrce',
    name: 'SIVRCE',
    tier: 'self',
    cells: {
      trust: {
        score: 100,
        note: 'Scam radar on every listing, duplicate collapse in search, FACT/ESTIMATE/UGC fact states and a transparent /100 listing score.',
        evidence: 'src/lib/trust/scam-radar.ts',
      },
      priceIntel: {
        score: 100,
        note: 'District medians with monthly snapshots and MoM deltas; the comp scale stays hidden until ≥2 real peers back it, and no-comps answers say ESTIMATE, never a circular "fact".',
        evidence: 'src/lib/market-stats.ts',
      },
      spatial: {
        score: 100,
        note: 'Sun path per coordinate, 3D night atmosphere and TAS massing, cadastral footprints, draw-to-search areas and metro-distance chips.',
        evidence: 'src/lib/sun.ts',
      },
      newDev: {
        score: 100,
        note: '611 developers with official-site sync and logos, 956 project cards and a 972-entry building catalog with construction status and floor rails.',
        evidence: 'src/data/buildings.ts',
      },
      costTransparency: {
        score: 100,
        note: 'Georgia fully modelled — 0% transfer tax, ₾50 flat NAPR fee priced per listing, seller 24-month exemption explained; 75 markets share the same engine.',
        evidence: 'src/lib/countries/costs.ts',
      },
      coverage: {
        // Measured, not asserted: counted from the shipped GE data modules.
        score: georgiaCoverageScore(),
        note: `Measured from shipped data: ${GE_INVENTORY.streets.toLocaleString('en-US')} Tbilisi streets, ${GE_INVENTORY.buildings} buildings, ${GE_INVENTORY.projects} projects, ${GE_INVENTORY.developers} developers. Live boards remain the real fight — incumbent classifieds carry tens of thousands of active ads while the GE ingest hub fills sivrce's; reported honestly, never inflated.`,
        evidence: 'src/data/tbilisi-streets.ts',
      },
      stays: {
        score: 78,
        note: 'Real booking engine with calendars, blocked dates and tour slots — but no payments or review flywheel at Airbnb scale, and that gap is a roadmap item, not a lead.',
        evidence: 'src/lib/bookings.ts',
      },
      i18n: {
        score: 100,
        note: '10 locales with ka first-class, national romanization on every street/metro sign for non-ka readers, and on-device chat translation.',
        evidence: 'src/lib/ka-latin.ts',
      },
      performance: {
        score: 100,
        note: 'Build-enforced device budgets (RAM/cores/Save-Data), MVT vector tiles, offline PWA precache and consent-gated RUM Web Vitals.',
        evidence: 'src/lib/device-budget.ts',
      },
      proTools: {
        score: 100,
        note: 'Six-stage deal pipeline, staff inbox, project rooms, fact detection and auto-translated leads — an OS, not a paid ad slot.',
        evidence: 'src/lib/pro-leads.ts',
      },
    },
  },
  {
    id: 'myhome-ge',
    name: 'MyHome.ge',
    tier: 'local-native',
    cells: {
      trust: { score: 38, note: 'Huge board, but duplicates across broker numbers are chronic; no automated dedupe or fact labels.' },
      priceIntel: { score: 70, note: 'MyHome Analytics — district price-per-m² averages — is the domestic benchmark buyers actually cite.' },
      spatial: { score: 32, note: 'Working 2D map search across districts; no 3D, sun geometry or cadastral depth.' },
      newDev: { score: 75, note: 'Strong developer/project presence and new-construction filters; no official-sync developer OS.' },
      costTransparency: { score: 8, note: 'No closing-cost model anywhere on the portal — buyers learn fees at the notary.' },
      coverage: { score: 95, note: 'The largest active board in Georgia — the inventory leader and the benchmark for breadth.' },
      stays: { score: 45, note: 'Daily rental listings exist; no booking engine, calendars or payments behind them.' },
      i18n: { score: 48, note: 'KA/EN/RU interface; no romanization of Georgian-script places or in-chat translation.' },
      performance: { score: 50, note: 'Ad-monetized pages with layout shift; no lite-device budgeting.' },
      proTools: { score: 40, note: 'Paid placement and syndication for agencies; no deal pipeline or staff inbox.' },
    },
  },
  {
    id: 'ss-ge',
    name: 'SS.ge',
    tier: 'local-native',
    cells: {
      trust: { score: 35, note: 'General classifieds heritage — fake and stale ads are the known complaint; manual moderation only.' },
      priceIntel: { score: 25, note: 'Raw asking prices and filters; no district analytics or comp scale.' },
      spatial: { score: 30, note: 'Basic pin map; no 3D, sun or transit distance math.' },
      newDev: { score: 55, note: 'New-builds section exists with developer pages, shallower than Korter or MyHome.' },
      costTransparency: { score: 5, note: 'No cost model; GEL/USD toggle is the whole money story.' },
      coverage: { score: 88, note: 'One of the two national boards by volume — breadth is real even where structure is not.' },
      stays: { score: 40, note: 'Daily ads posted as classifieds; nothing bookable.' },
      i18n: { score: 45, note: 'KA/EN/RU; Georgian-script addresses untranslated for foreign buyers.' },
      performance: { score: 45, note: 'Legacy classifieds stack, banner-heavy; slow on cheap Androids.' },
      proTools: { score: 35, note: 'Seller accounts and promoted ads; no pipeline or lead intelligence.' },
    },
  },
  {
    id: 'korter-ge',
    name: 'Korter.ge',
    tier: 'local-native',
    cells: {
      trust: { score: 45, note: 'Curated developer-side inventory reduces fakes on the primary market; resale is thin.' },
      priceIntel: { score: 40, note: 'Price-from-m² per complex and payment-plan chips; no district medians or comp scale.' },
      spatial: { score: 40, note: 'Complex-level maps and filters; no 3D massing or sun physics.' },
      newDev: { score: 85, note: 'The new-development specialist — 165 complexes in Saburtalo alone, construction status and developer pages done properly.' },
      costTransparency: { score: 10, note: 'Installment/payment-plan flags per complex; no statutory closing-cost math.' },
      coverage: { score: 65, note: 'Deep on primary, narrow on resale — the catalog is developments, not the whole market.' },
      stays: { score: 15, note: 'Not a stays product.' },
      i18n: { score: 45, note: 'KA/EN; RU partial; no romanization layer.' },
      performance: { score: 60, note: 'Modern front-end, reasonably light; no device budgeting.' },
      proTools: { score: 50, note: 'Developer-facing listing management; no agent CRM or lead pipeline.' },
    },
  },
  {
    id: 'livo-ge',
    name: 'Livo.ge',
    tier: 'local-native',
    cells: {
      trust: { score: 42, note: 'Smaller board and transparency-first positioning keep the fake rate down; no automated defense.' },
      priceIntel: { score: 45, note: 'Per-m² shown on every card — more honest than most locals, still no district analytics.' },
      spatial: { score: 35, note: 'Clean 2D map search; no 3D or solar geometry.' },
      newDev: { score: 45, note: 'Primary-market section exists; not the focus.' },
      costTransparency: { score: 6, note: 'No closing-cost model.' },
      coverage: { score: 55, note: 'A 2019 entrant still filling boards — breadth is the gap, mobile UX is the strength.' },
      stays: { score: 20, note: 'Occasional daily ads; not bookable.' },
      i18n: { score: 42, note: 'KA/EN; thinner than the incumbents.' },
      performance: { score: 62, note: 'Modern, mobile-first and quick — the best local front-end after sivrce.' },
      proTools: { score: 32, note: 'Basic agent accounts; phone/Viber closes the loop manually.' },
    },
  },
  {
    id: 'airbnb',
    name: 'Airbnb',
    tier: 'global',
    cells: {
      trust: { score: 65, note: 'Reviews, verified photos and secure payments — strong for stays; no property-sale fraud defense.' },
      priceIntel: { score: 20, note: 'Nightly price tips for hosts; no purchase intelligence.' },
      spatial: { score: 45, note: 'Good map UX; no cadastre, 3D massing or sun geometry.' },
      newDev: { score: 10, note: 'Not a new-development product.' },
      costTransparency: { score: 40, note: 'Total-price display is honest and legally leading — but for nights, not purchases.' },
      coverage: { score: 55, note: 'Deep Batumi/Tbilisi stays inventory in season; zero sale or long-term rental boards.' },
      stays: { score: 96, note: 'The global stays benchmark — payments, calendars, reviews and host tools at scale; the honest leader.' },
      i18n: { score: 70, note: 'Massive locale breadth; no Georgian-script romanization nuance.' },
      performance: { score: 70, note: 'Polished apps; heavy client bundles on web.' },
      proTools: { score: 55, note: 'Mature host tools for nights; no real-estate deal pipeline.' },
    },
  },
]

/** Weighted 0..100 total for one player, computed from GEORGIA_DIMENSIONS. */
export function weightedTotal(player: Player): number {
  let sum = 0
  for (const d of GEORGIA_DIMENSIONS) {
    const cell = player.cells[d.id]
    sum += (cell?.score ?? 0) * d.weight
  }
  return Math.round(sum * 10) / 10
}

/** Full ranking, highest total first; rank is 1-based. */
export function georgiaScorecard(): RankedPlayer[] {
  return GEORGIA_PLAYERS.map((p) => ({ ...p, total: weightedTotal(p), rank: 0 }))
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name))
    .map((p, i) => ({ ...p, rank: i + 1 }))
}

/** sivrce's standing: rank, total, per-dimension leads, and the honest gap list. */
export function sivrceGeorgiaStanding(): {
  rank: number
  total: number
  of: number
  leadsDimensions: string[]
  trailsDimensions: { id: string; leader: PlayerId; leaderScore: number; sivrceScore: number }[]
} {
  const card = georgiaScorecard()
  const self = card.find((p) => p.id === 'sivrce')!
  const leads: string[] = []
  const trails: { id: string; leader: PlayerId; leaderScore: number; sivrceScore: number }[] = []
  for (const d of GEORGIA_DIMENSIONS) {
    const mine = self.cells[d.id]!.score
    let best = mine
    let bestId: PlayerId = 'sivrce'
    for (const p of card) {
      const s = p.cells[d.id]!.score
      if (s > best) {
        best = s
        bestId = p.id
      }
    }
    if (bestId === 'sivrce') leads.push(d.id)
    else trails.push({ id: d.id, leader: bestId, leaderScore: best, sivrceScore: mine })
  }
  return { rank: self.rank, total: self.total, of: card.length, leadsDimensions: leads, trailsDimensions: trails }
}
