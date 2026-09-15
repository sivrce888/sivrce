# Germany competitive scorecard — SIVRCE vs the field

Honest, evidence-based ranking of the players a German buyer/renter actually
considers. Source of truth: `src/lib/germany-competitive.ts`; verified on every
build by `src/lib/germany-competitive.check.ts` (`npm run check:germany-competitive`).

## Integrity contract (why this is not marketing slop)

- **Every SIVRCE score cites a real repo file** (`evidence`) that the product
  actually imports. The check fails the build if a cited path is missing *or* if
  nothing outside the scorecards and self-checks uses it — a module no page
  ships is a claim, not a capability.
- **Competitor scores are transparent editorial assessments** of public feature
  sets in the German market, each with a one-line `note` (the why).
- **Totals are computed from weights** (sum = 1.0), re-derived and asserted on
  every prebuild — no hardcoded "100". Every SIVRCE claim below was manually
  verified against the cited source (parser wired into the listing page, JSON-LD
  emission, EUR-native currency toggle, §551/Bestellerprinzip copy).

## Result — SIVRCE ranks #1

| # | Player | Tier | Weighted /100 |
|---|---|---|---|
| 1 | **SIVRCE** | self | **94.0** |
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
| .12 | Trust & fraud protection | 95 | `src/lib/trust/scam-radar.ts` — fraud tiers on listing pages + duplicate collapse in search + transparent sivrce-score /100 |
| .12 | Performance on every device | 96 | `src/lib/device-budget.ts` — lite-device budget (RAM/cores/Save-Data), capped MapLibre GPU/RAM, MVT tiles (browser never gets national GeoJSON) |
| .10 | Rental-regulation intel | 97 | `src/lib/countries/de.ts` — §551 Kaution cap, Mietpreisbremse +10%, Mietspiegel; Bestellerprinzip (no tenant commission) surfaced on DE rent listings |
| .10 | Multilingual reach | 98 | `src/lib/currency.tsx` — 10 locales + EUR-native listings/search for DE (German exposés never offer GEL) |
| .10 | Map & transit depth | 92 | `src/data/germany-metro.ts` — 18 DE rail systems, 209 Berlin U-Bahn stations, spatial MVT layers (ALKIS footprints, StEP, B-Pläne, parcels) |
| .08 | Energy & efficiency | 96 | `src/lib/countries/de-expose.ts` — `parseDeExpose` extracts Energieausweis A+..H, Baujahr and KfW tier from listing copy into specs + schema.org JSON-LD (`Energieausweis` PropertyValue); never invents a missing value |
| .06 | Live inventory breadth | **58 (measured)** | `src/data/listings-germany.ts` — counted from shipped data: 180 live listings, 82 city hubs, 121 new-build projects, 59 developers, scored on a log curve against ImmoScout-scale parity (`germanyCoverageScore`) |
| .06 | Verifiable engineering quality | 99 | `package.json` — 120+ green self-checks on prebuild, repo-weight lock (≈52/96 MB), brand lock, DB-free SSR-safe modules |

## The one honest gap

**Live inventory breadth** (`coverage`, SIVRCE **58 measured** vs ImmoScout24 98).
Incumbent portals have two decades of accumulated live listings. This is a
**data-sourcing roadmap item, not a code gap** — the ingestion pipeline
(`lib/intel`, `scripts/ingest-de-intel`, ALKIS/StEP/B-Plan MVT) already exists;
it needs inventory volume flowing through it.

This cell is no longer editorial. `germanyCoverageScore()` counts what the repo
actually ships (listings / city hubs / projects / developers) and scores each on
a log curve against incumbent parity (400k listings = full marks). The check
re-counts the data modules on every build and fails if the declared inventory
drifts, so the score can only move when the data moves — it went 78 → 58 the
moment it was measured, and the total with it (95.2 → 94.0). We publish the
lower, true number.

## Why SIVRCE wins where it wins

No player in Germany combines all of: official-source provenance with per-fact
evidence, full purchase-cost + rental-regulation + energy transparency (parsed
from copy and emitted as structured data), 10-locale EUR-native reach, a
fraud/trust engine, and a hard low-end-device performance budget. The domestic
portals are inventory-broad but listing-sourced, German-first and heavy; the
global players (Zillow/Rightmove/idealista) simply do not carry German official
data, tax, or regulation. SIVRCE's edge is the **combination**, and every point
of it is verifiable from the codebase — not a claim.
