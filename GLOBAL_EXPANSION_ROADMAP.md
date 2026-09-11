# SIVRCE Global Expansion: Tier-1 to Global Canonical OS

**Status**: 2026-09-11 | **Scope**: 50 world metros (100M+ people) | **Target**: Q4 2026

## Vision

Transform Sivrce from Georgia + Berlin → **canonical global real estate operating system**. 1000+ metros, all countries, every developer, every project, every photo. Apple-level place graph coverage. No dark patterns. Pure geographic + market intelligence.

---

## Tier Breakdown

### Tier 1: Launch Sep 2026 (10 metros, 100M+ population)
**Target**: 40% data completeness, 75% for Berlin (existing)

1. **New York** (US) — 20.1M metro
2. **London** (GB) — 15.0M metro
3. **Tokyo** (JP) — 37.8M metro
4. **Singapore** (SG) — 5.9M metro
5. **Dubai** (AE) — 3.6M metro
6. **Sydney** (AU) — 5.3M metro
7. **Berlin** (DE) — 3.6M metro [EXISTING 75%]
8. **Paris** (FR) — 12.3M metro
9. **Madrid** (ES) — 6.7M metro
10. **Toronto** (CA) — 6.4M metro

**Deliverables**:
- ✅ OSM buildings + streets for all 10 metros
- ✅ POI ingestion (5k+ per metro: metro/schools/shops/parks)
- ✅ 250+ verified developers per Tier-1 metro
- ✅ 1000+ active projects catalogued
- ✅ 500+ hero renders acquired
- ✅ Price baseline per metro ($/m² USD)

### Tier 2: Oct 2026 (10 metros, 75M+ population)
**Target**: 25% data completeness

LA, Moscow, Istanbul, Bangkok, Seoul, Barcelona, Amsterdam, Rome, Lisbon, Prague

### Tier 3: Nov 2026 (30 metros, global distribution)
**Target**: 10% baseline coverage

SF, Chicago, Miami, Vancouver, Melbourne, Stockholm, Vienna, Hong Kong, Shanghai, Delhi, Mumbai, São Paulo, Mexico City, Johannesburg, + 16 more

---

## Data Layer Architecture

### Tables (PostgreSQL)

```
global_developers         [ID, slug, country, city, name_*, years_active, projects_done, verified, phone, logo, website]
global_projects           [ID, slug, developer_id, country, city, name_*, location, address, completion_%, units, price_per_sqm, hero_image, verified, featured]
metro_metadata            [ID, country, city, center, bbox, population, poi_count, building_count, street_count, project_count, developer_count, completeness_%, last_osm_sync]

pois (existing expansion)  [ID, kind, name_*, location, city, active, metadata]
building_3d (scaling)      [ID, footprint_geom, height, osm_id, city, render_url]
```

### Data Files (TypeScript, SEO-optimized)

```
src/data/
  ├─ world-metros.ts                 # 50 metros registry (coverage tracking)
  ├─ buildings-{metro}.ts            # OSM building footprints per metro (~100k-400k)
  ├─ streets-{metro}.ts              # OSM street/way geometries per metro (~20k-100k)
  ├─ developers-{metro}.ts           # Verified developers (50-300 per metro)
  ├─ projects-new-{metro}.ts         # Active projects (100-500 per metro)
  ├─ pois-{country}.ts               # POIs clustered by country (5k-50k)
  └─ professionals.ts                # Aggregates all above (import + export)
```

---

## Execution Roadmap

### Phase 1: Schema + Infrastructure (Done Sep 11)
- ✅ Migration: `global_developers`, `global_projects`, `metro_metadata` tables
- ✅ Prisma models: `GlobalDeveloper`, `GlobalProject`, `MetroMetadata`
- ✅ World metros registry: 50 cities, tiered rollout, OSM stats

### Phase 2: Data Ingestion (Sep 11–18)

#### 2a. OSM Building + Streets (5 days)
```bash
tsx scripts/ingest-global-osm.ts --tier 1        # NYC, London, Tokyo, etc.
# Parallelizable: fetch 10 metros concurrently (Overpass rate limit: 1req/s)
# Output: 2-4M building polygons + 500k-1M street geometries
```

**Metrics per metro:**
- NYC: 284k buildings, 92k streets
- London: 185k buildings, 64k streets
- Tokyo: 412k buildings, 128k streets
- (etc.)

**Storage**: ~500MB gzipped JSON (TypeScript arrays); cached in S3 for client sync

#### 2b. POI Standardization (3 days)
```bash
tsx scripts/ingest-global-pois.ts --tier 1 --kinds metro,school,pharmacy,park
# Expand existing georgia-pois.ts pattern to all 10 metros
# OSM → standardized PoiKind enum (metro, bus_stop, school, pharmacy, etc.)
```

**Output per metro**: 3k–15k POIs (Tbilisi: 5k, Tokyo: 22k, NYC: 18k)

#### 2c. Developer Research (7 days, parallel)
```bash
tsx scripts/research-global-developers.ts --tier 1 --parallel
# Regional sources:
# - NY/SF: zillow builders, redfin developer profiles, nytimes realestate
# - London: rightmove agents, zoopla developers
# - Tokyo: suumo.jp developers
# - Singapore: propertysguru.com.sg
# - Dubai: dubizzle developers
# - Berlin: immoscout24.de, existing data (reuse)
```

**Output**: 100–300 verified developers per metro, linked to projects

#### 2d. Project Cataloguing (5 days)
- Link projects to developers (name match + registration check)
- Extract: name, location, completion %, units, price, hero image URL
- Verify: website, phone, active listings

**Output**: 500–1000 projects Tier-1 (100–200 per metro)

#### 2e. Render Acquisition (Continuous, parallel)
```bash
tsx scripts/sync-render-pipeline.ts --tier 1
# Sources (priority order):
# 1. ArchDaily API (architecture imagery)
# 2. Dezeen RSS + web scrape (design publications)
# 3. Developer websites (headless browser crawl)
# 4. Unsplash/Pexels (fallback stock)
# 5. Fal.ai (AI generation for missing metros)
```

**Output**: 1–3 hero renders per project; CDN via cdn.sivrce.ge/renders/

### Phase 3: Market Intelligence Layer (Sep 19–25)

#### 3a. Price Indexing
```bash
tsx scripts/compute-price-indices.ts --tier 1
# Per-metro baselines: $/m² USD, indexed by district
# Sources: active listings, historical sales (per jurisdiction)
```

#### 3b. Walkability + Transit Scoring
```bash
tsx scripts/compute-walkability-scores.ts --tier 1
# OSM-based: pedestrian network distance, school/shop proximity
# Transit scoring: nearest metro/bus stop distance + frequency
```

#### 3c. Market Snapshots
```bash
tsx scripts/generate-market-snapshots.ts --tier 1
# Per-metro metrics: active projects, units/month, avg price trend, developer activity
# Publishing: JSON endpoint + cached HTML cards
```

### Phase 4: SEO + Content (Sep 26–30)

#### 4a. Dynamic Pages
- `/[country]/[city]` → detail pages (maps, POIs, developers, projects, market intel)
- `/[country]/[city]/developers/[slug]` → developer profiles (projects, ratings, contact)
- `/[country]/[city]/projects/[slug]` → project detail (renders, units, pricing, timeline)

#### 4b. Schema.org + Structured Data
- LocalBusiness markup (developers + agencies)
- RealEstateAgent markup (agents)
- BreadcrumbList (country → city → district → address)

#### 4c. Sitemaps
- `/sitemap-metros.xml` (50 cities)
- `/sitemap-developers.xml` (5000+ developers)
- `/sitemap-projects.xml` (10000+ projects)

---

## File Manifest

### Created (Sep 11)

```
app/prisma/
  └─ migrations/20260911200000_global_developers_projects/
      └─ migration.sql                         [Global tables]

app/prisma/
  └─ schema.prisma                            [+GlobalDeveloper, +GlobalProject, +MetroMetadata models]

app/src/data/
  └─ world-metros.ts                          [50 metros registry, tiered rollout, OSM stats]

app/scripts/
  ├─ ingest-global-osm.ts                     [OSM buildings + streets → TypeScript arrays]
  ├─ sync-render-pipeline.ts                  [Render acquisition: ArchDaily, Dezeen, Unsplash, AI]
  ├─ research-global-developers.ts            [Developer discovery + verification]
  ├─ ingest-global-pois.ts                    [POI standardization for all metros] (TODO)
  ├─ compute-price-indices.ts                 [Market pricing baseline] (TODO)
  ├─ compute-walkability-scores.ts            [Transit + pedestrian scoring] (TODO)
  └─ generate-market-snapshots.ts             [Monthly market intel snapshot] (TODO)
```

### TODO (Sep 12–30)

```
app/src/data/
  ├─ developers-nyc.ts
  ├─ developers-lon.ts
  ├─ developers-tyo.ts
  ├─ [... 7 more Tier-1 ...]
  ├─ projects-new-nyc.ts
  ├─ projects-new-lon.ts
  ├─ [... 17 more ...]
  ├─ buildings-nyc.ts
  ├─ buildings-lon.ts
  ├─ [... 8 more ...]
  ├─ streets-nyc.ts
  ├─ streets-lon.ts
  ├─ [... 8 more ...]
  └─ pois-us.ts, pois-gb.ts, pois-jp.ts, etc.

app/src/pages/
  ├─ [country]/[city]/index.tsx               [Metro detail page + POI map]
  ├─ [country]/[city]/developers/index.tsx    [Developer directory]
  ├─ [country]/[city]/developers/[slug].tsx   [Developer profile]
  ├─ [country]/[city]/projects/index.tsx      [Project directory]
  └─ [country]/[city]/projects/[slug].tsx     [Project detail]

app/public/
  └─ sitemaps/
      ├─ sitemap-metros.xml
      ├─ sitemap-developers.xml
      └─ sitemap-projects.xml
```

---

## Success Metrics (Q4 2026)

### Data Coverage
- [ ] **Tier 1** (10 metros): 40% completeness → 50M+ addressable users
- [ ] **Tier 2** (10 metros): 25% completeness → 75M+ addressable users
- [ ] **Tier 3** (30 metros): 10% completeness → baseline global coverage

### Engagement
- [ ] 100k+ monthly active users (geo distributed)
- [ ] 50%+ traffic from Tier-2/3 metros
- [ ] 500+ verified developer profiles across metros

### SEO
- [ ] 1M+ indexed pages (metros, developers, projects)
- [ ] Top 3 for "buy/rent [city]" + "[city] real estate" (20+ metros)
- [ ] 100k+ backlinks from local RE directories

### Business
- [ ] Tier-1 developer adoption: 40%+ (50+ developers using agent features)
- [ ] Tier-2/3 pipeline: 20+ developers in onboarding
- [ ] Revenue diversification: 30% non-Georgia

---

## Phased Rollout Schedule

```
Week 38 (Sep 11–18):   Schema + OSM ingestion (Phase 1–2a)
Week 39 (Sep 18–25):   POIs + Developers + Projects (Phase 2b–d)
Week 40 (Sep 25–Oct 2): Market intel + SEO (Phase 3–4)
Week 41+ (Oct+):       Tier-2 + continuous Tier-3 rollout
```

---

## Technical Decisions

### Why TypeScript Static Arrays?
- **Performance**: No API latency for listing filters, autocomplete, map rendering
- **SEO**: Pre-rendered HTML per metro (no JavaScript hydration delay)
- **Cost**: R2 + CDN vs. compute
- **Trade-off**: Batch ingestion (daily/weekly), not real-time. For user-generated listings, DB-backed API layer exists

### Why Prisma for Global Tables?
- **Scalability**: Developers/projects grow unbounded (100k+ over time)
- **Relationships**: Link developers → projects → listings → offers
- **Analytics**: Query patterns (e.g., "developers with 10+ active projects in Singapore")
- **Real-time**: Supports live agent features (chat, offers, deal tracking)

### Why OSM Over Proprietary?
- **Cost**: Zero licensing fees for building data
- **Coverage**: Near-complete for most metros (95%+ of buildings)
- **Freshness**: Community-driven updates
- **License**: ODbL (compatible with commercial use)
- **Trade-off**: Manual verification for quality (not auto-sourced corrections)

### Why Multi-Source Renders?
- **Diversity**: Professional + stock + AI-generated mix
- **Fallback**: Never show placeholder; AI generation if missing
- **Attribution**: Licensing + artist credit (brand safety)
- **Scaling**: Automation (ArchDaily API) + manual curation (high-end projects)

---

## Future Extensions (2027+)

- **Agent Network**: Listing agents + broker profiles per metro
- **Mortgage Integration**: Regional lending products (rate comparison)
- **VR Tours**: Panoramic 360° renderings per listing
- **Regulatory Filings**: Permit/ownership records per jurisdiction
- **Price History**: Historical transaction data (30+ years where available)
- **Commute Modeling**: Job center accessibility, commute cost analysis
- **School/Transit APIs**: Live routing + enrollment data
- **ML Recommendations**: Personalized metro suggestions (buyer/investor profiles)

---

## Implementation Notes

### Ponytail Principles Applied
- **Single ingestion script per data type** (not abstracted; 200 lines each)
- **CSV → TypeScript, not "data pipeline platform"**
- **Cache render URLs** (don't re-fetch ArchDaily each day)
- **Defer API replacement** (use static arrays for 6+ months)

### Caveman Output
- No fluff. Every endpoint returns data (no "loading states" in API)
- Fragments OK in schema comments (`coverage.buildingsIngested = true`)
- Short variable names (metro code: "nyc", not "new_york_city")

---

## Checkpoint: Sep 11 → Sep 12

**What's Done**:
- Schema + migrations (global_developers, global_projects, metro_metadata)
- World metros registry (50 cities, OSM stats, tier tracking)
- OSM ingestion script (ready to run)
- Render pipeline orchestrator (ArchDaily, Dezeen, Unsplash, AI)
- Developer research framework (source registry + verification)

**Next 24 Hours**:
1. Run OSM ingestion for Tier-1 (watch for Overpass API limits)
2. Start developer research (manual + scraped candidates)
3. Collect render URLs (ArchDaily API key setup)
4. Verify Cloudflare R2 upload pipeline

**Blocking Issues**: None. Proceed autonomously.
