# Germany data layer — source inventory, coverage, pipeline

Berlin-first, then national. No completeness claims: every number below is
measured (`GET /api/intel/coverage`, admin → Data Intelligence).

## Source inventory (all official/open, dl-de-zero-2.0 unless noted)

| slug | publisher | facts | use |
|---|---|---|---|
| `de-alkis` | SenStadtWo (GDI WFS) | address, coords, permits | legal lots + footprints → `geo_features` |
| `de-step-wohnen-2040` | SenStadtWo (GDI WFS) | status, coords, potentials | StEP Wohnen 2040 (verified typeNames) |
| `de-berlin-opendata` | Land Berlin | address, coords, permits, status | dataset index |
| `de-boris` | Gutachterausschuss | price context | land values since 1964 |
| `de-bplaene` | SenStadtWo (GDI WFS) | permits, status | binding + in-procedure B-Pläne |
| `de-mietspiegel` | SenStadtWo | rents | regulated benchmarks |
| `de-statistik-bb` | AfS Berlin-Brandenburg | prices, completions | supply pipeline |
| `de-destatis` | Destatis | prices, completions | national supply |
| `de-handelsregister` | Justizportal | company identity | registration |
| `official-developer` | each developer | price, availability, specs, media | per-entity, robots.txt enforced |
| `global-osm` | OSM (ODbL) | coords, address | buildings/POIs/geocoding |

Registry lives in `src/lib/intel/core.ts` (`SOURCE_REGISTRY`); DB mirror in
`data_sources` via `scripts/ingest-de-intel.ts`. Reliability differs per fact
(`sourceReliability`): permits → government beats marketing; asking price →
official developer beats listings.

## Geography

`src/lib/countries/de.ts`: 12 Berlin Bezirke, Ortsteil→Bezirk map, 16 cities
(mirrors `MARKETS.de`), Grunderwerbsteuer per state (verify yearly),
buyer acquisition-cost helper.

## Seeded catalog (static → DB-mirrored)

- `src/data/projects-new-berlin.ts`: ~28 Berlin developers, ~40 street-verified projects.
- `src/data/projects-new-germany.ts`: 10 national developers (listed + municipal),
  official sites only, `verified:false` until editorial review, no phone placeholders.
- Buildings: OSM ingest already covers the Berlin bbox (`ingest:buildings`);
  ALKIS footprints via `lib/map/berlin-gov.ts`.

## Pipeline

discover → fetch (SSRF-guarded, `isFetchableUrl`) → parse → normalize
(`normalizeName`: ka + de folds, legal suffixes) → resolve (`matchEntities`:
resemblance alone never merges) → extract → validate → score → provenance
(`IntelFact` + `IntelEvidence`) → version (`IntelChange`, immutable) →
index → publish with `verified … conflicting` labels.

## Spatial (PostGIS + MVT)

Canonical geometries land in `geo_features` (GIST, validity trigger, provenance
columns). Browser never receives Germany-wide GeoJSON.

| layer | zoom | source |
|---|---|---|
| `step` | 9–16 | StEP Wohnen 2040 WFS (verified typeNames) |
| `bplan` | 10–16 | Bebauungspläne festgesetzt + im Verfahren |
| `buildings` | 14–18 | ALKIS Gebäude → `alkis_building` |
| `parcels` | 16–19 | ALKIS Flurstücke |
| `developments` | 10–16 | subset of StEP potentials + quartiers |

Tiles: `GET /api/tiles/{layer}/{z}/{x}/{y}` via `ST_AsMVT`.
Seed: `npm run ingest:berlin-sample` · full ALKIS: `ingest:alkis -- --geo` ·
StEP only: `ingest:step` · B-Pläne: `ingest:bplan`.

**LoD2 roofs (separate track):** CityGML bulk download, not WFS — extrusion uses
official ALKIS `hoh` or `aog×3`; unknown height stays null (map coalesces 12 m
visually, never shown as fact). Repealed B-Pläne (`bplan:c_bp_ak`) not ingested.

## Refresh cadence

price/availability 24h · status 72h · permits/completion 168h ·
company/address 720h · coordinates 2160h. Stale facts queue `stale_data`
review via `refreshTick`.

## Coverage (measured, never claimed)

`coverageScoreOf`: developer / project / active-project / geographic /
source-health / freshness / verified-ratio. Berlin is the deepest dataset;
national cities start as guides + developer seeds until verified inventory lands.
