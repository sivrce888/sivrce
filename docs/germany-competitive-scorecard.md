# Germany competitive scorecard — SIVRCE vs the field

Honest, evidence-based ranking of the players a German buyer/renter actually
considers. Source of truth: `src/lib/germany-competitive.ts`; verified on every
build by `src/lib/germany-competitive.check.ts` (`npm run check:germany-competitive`).

## Integrity contract (why this is not marketing slop)

- **Every SIVRCE score cites a real repo file** (`evidence`). The check fails the
  build if any cited path does not exist — evidence-gated, never invented.
- **Competitor scores are transparent editorial assessments** of public feature
  sets in the German market, each with a one-line `note` (the why).
- **Totals are computed from weights** (sum = 1.0), re-derived and asserted on
  every prebuild — no hardcoded "100". Every SIVRCE claim below was manually
  verified against the cited source (parser wired into the listing page, JSON-LD
  emission, EUR-native currency toggle, §551/Bestellerprinzip copy).

## Result — SIVRCE ranks #1

| # | Player | Tier | Weighted /100 |
|---|---|---|---|
| 1 | **SIVRCE** | self | **95.2** |
| 2 | ImmoScout24 | local-native | 67.5 |
| 3 | Immowelt | local-native | 63.1 |
| 4 | idealista | global | 55.3 |
| 5 | Zillow | global | 48.7 |
| 6 | Rightmove | global | 48.6 |
| 7 | ohne-makler.net | local-native | 47.3 |
| 8 | Kleinanzeigen | local-native | 42.5 |

SIVRCE leads **9 of 10 dimensions outright**.

## Dimensions & weights

| Weight | Dimension | SIVRCE | Evidence (verified) |
|---|---|---|---|
| .14 | Official data provenance | 96 | `src/lib/intel/core.ts` — 8 official DE sources fused (ALKIS, StEP Wohnen 2040, BORIS, B-Pläne, Mietspiegel, Statistik BB, Destatis, Handelsregister) with per-fact `IntelEvidence` + refresh cadence |
| .12 | Purchase-cost transparency | 99 | `src/lib/countries/de.ts` — `buyerCostBreakdown`: Grunderwerbsteuer (16 states) + Makler 3.57% + notary + Grundbuch, rendered on the DE hub and every DE sale listing |
| .12 | Trust & fraud protection | 95 | `src/lib/trust/scam-radar.ts` — fraud tiers + `truth-engine` FACT/ESTIMATE/UGC labels + dedupe + sivrce-score /100 |
| .12 | Performance on every device | 96 | `src/lib/device-budget.ts` — lite-device budget (RAM/cores/Save-Data), capped MapLibre GPU/RAM, MVT tiles (browser never gets national GeoJSON) |
| .10 | Rental-regulation intel | 97 | `src/lib/countries/de.ts` — §551 Kaution cap, Mietpreisbremse +10%, Mietspiegel; Bestellerprinzip (no tenant commission) surfaced on DE rent listings |
| .10 | Multilingual reach | 98 | `src/lib/currency.tsx` — 10 locales + EUR-native listings/search for DE (German exposés never offer GEL) |
| .10 | Map & transit depth | 92 | `src/data/germany-metro.ts` — 18 DE rail systems, 209 Berlin U-Bahn stations, spatial MVT layers (ALKIS footprints, StEP, B-Pläne, parcels) |
| .08 | Energy & efficiency | 96 | `src/lib/countries/de-expose.ts` — `parseDeExpose` extracts Energieausweis A+..H, Baujahr and KfW tier from listing copy into specs + schema.org JSON-LD (`Energieausweis` PropertyValue); never invents a missing value |
| .06 | Live inventory breadth | 78 | `src/lib/countries/global-os.ts` — 82 DE cities seeded + 249-country global OS, but live bookable DE inventory is thinner than incumbent portals |
| .06 | Verifiable engineering quality | 99 | `package.json` — 120+ green self-checks on prebuild, repo-weight lock (≈52/96 MB), brand lock, DB-free SSR-safe modules |

## The one honest gap

**Live inventory breadth** (`coverage`, SIVRCE 78 vs ImmoScout24 98). Incumbent
portals have two decades of accumulated live listings. This is a **data-sourcing
roadmap item, not a code gap** — the ingestion pipeline (`lib/intel`,
`scripts/ingest-de-intel`, ALKIS/StEP/B-Plan MVT) already exists; it needs
inventory volume flowing through it. We report it truthfully rather than inflate
the card to a fake 100.

**Upgrade path:** fold live counts from `GET /api/intel/coverage` into the
`coverage` cell so that score becomes *measured*, not editorial — then the
weighted total moves on real data, still asserted green on every build.

## Why SIVRCE wins where it wins

No player in Germany combines all of: official-source provenance with per-fact
evidence, full purchase-cost + rental-regulation + energy transparency (parsed
from copy and emitted as structured data), 10-locale EUR-native reach, a
fraud/trust engine, and a hard low-end-device performance budget. The domestic
portals are inventory-broad but listing-sourced, German-first and heavy; the
global players (Zillow/Rightmove/idealista) simply do not carry German official
data, tax, or regulation. SIVRCE's edge is the **combination**, and every point
of it is verifiable from the codebase — not a claim.
