<agent_swarm_result>
<summary>completed: 7, failed: 1, aborted: 1</summary>
<resume_hint>Call AgentSwarm with resume_agent_ids using the agent_id values in this result to continue unfinished work.</resume_hint>
<subagent agent_id="agent-0" item="ROLE: რუკა_სართულები_Auditor. In the repo /Users/mac/Desktop/sivrce888/app: (1) How do projects appear on the map — find the map page(s) (src/app/[lang]/map, src/components map-related), how project pins / 3D construction ghosts / render images are rendered, which data fields they consume (coords, img, gallery, floors), and whether the hero render is shown on the map pin/card. (2) Find ALL floor-selection UI (src/lib/map/floors.ts, BuildingFloor/Building3D usage, projects/[slug]/page.tsx floor stack, any apartment-picker per floor). (3) Recommend the single cleanest way to TEMPORARILY disable floor selection (feature flag vs code removal) — name exact files/lines. Report: components map, data flow, disable-floor plan." outcome="completed"># რუკა_სართულები_Auditor — Map & Floor-Stack Audit (read-only)

## 1. How projects appear on the map

**Route chain:** `[lang]/map/page.tsx:20-67` (server) → fetches `getDbBuildingClusters()` + `getMapListings()` + `projectsLive()` → `Map3DLazy` (`[lang]/map/Map3DLazy.tsx:5`, `ssr:false`) → `Map3DInner` (`components/map/Map3D.tsx:388`).

### Component map

| Piece | File | Role |
|---|---|---|
| `Map3D` / `Map3DInner` | `src/components/map/Map3D.tsx:388-1781` | Main MapLibre GL map (1781 lines) |
| `BuildingPanel` | `src/components/map/BuildingPanel.tsx` | Right/bottom sheet on building click |
| `BuildingFloorExplorer` | `src/components/map/BuildingFloorExplorer.tsx` | `/buildings/[slug]` floor strip + card filtering |
| `BuildingFloorsMap(Lazy)` | `src/components/map/BuildingFloorsMap.tsx` / `...Lazy.tsx` | Focused one-building 3D stack |
| Cluster/data lib | `src/lib/map/buildings.ts` | listings→clusters, projects→ghosts, merges |
| Floor math | `src/lib/map/floors.ts` | floor count, availability, GeoJSON, tooltips |
| Shared floor layers | `src/lib/map/floorLayers.ts:431-487` (`ensureFloorLayers`) | source + fill/line/label layer ids |
| DB adapter | `src/lib/map/db-buildings.ts` | `MapBuilding`/`Building3D`/`BuildingFloor` rows → clusters |

### Data flow (per render)

1. `clusterListingsToBuildings(listings)` — listings grouped by `buildingSlug` → street|number → 60 m grid (`buildings.ts:254-358`)
2. `projectsToConstructionBuildings(projects)` — every catalog/live project w/ valid coords → construction cluster `dev-{slug}` (`buildings.ts:361-408`); skips slugs already in `data/buildings.ts` catalog (+ hardcoded `axis-towers-vake` alias, `buildings.ts:368`)
3. `applyLiveProjectPins(...)` — re-pins clusters to live project `coords`/`location` (`buildings.ts:411-435`)
4. `mergeDbBuildings(...)` — DB-curated rows win lat/lng/address/ring/inventory (`buildings.ts:445-472`)
5. `filterBuildings(deal, status)` → GeoJSON sources (`Map3D.tsx:597-656`)

### Map layers & fields consumed

| Layer | id (const) | Zoom | Consumes (`buildingProps`, `buildings.ts:579-604`) |
|---|---|---|---|
| Cluster circles + count | `sivrce-buildings-cluster(-count)` `Map3D.tsx:139-140,182-216` | < 13.5 | point geom from `lat/lng`, `point_count` |
| Deal/status dots | `...-dot` `Map3D.tsx:219-235` | < 13.5 | `hue` |
| Footprint fill | `...-fill` `Map3D.tsx:237-246` | ≥ 13.5 | `color` (alpha baked), ring/`buildingFootprint` |
| **3D extrusion ("ghost")** | `...-3d` `Map3D.tsx:248-260` | ≥ 13.5 | `color`, `height` (= `heightM`, full planned height) |
| Name label | `...-label` `Map3D.tsx:262-291` | ≥ 13.5 | `label` → `code` → listing count fallback |
| Floor stack (selected only) | `sivrce-floors-3d/hover/label` `floorLayers.ts:80-83` | always / label ≥ 14.5 | per-floor `base`,`top`,`available`,`minPrice`,`ghost`,`label` |

**Ghost rendering:** construction + 0 listings ⇒ synthetic slab footprint `ghostFootprintHalfM(floors)` when no usable OSM ring (`buildings.ts:562-577`), 0.78 alpha massing (`buildings.ts:588-592`), 0.45 alpha floor slabs (`floors.ts:92,107-110`), full planned height `min(floors*3.15,110)` (`buildings.ts:397`). **Ghosts are extruded polygons, not images.**

**Hero render on map pin/card: NO.**
- Pins/dots/extrusions/labels carry **no image field** — `buildingProps` exports only text/count/color (`buildings.ts:579-604`); the map itself loads images only for POI Lucide sprites (`Map3D.tsx:170`, `poi-icons.ts`).
- Clicked-building panel shows a 56 px `building.img` thumb **only for catalog/DB buildings** (`BuildingPanel.tsx:55-58`). Construction-project clusters (`dev-*`) never set `img` (`buildings.ts:383-406` sets no img) → panel falls back to colored `HardHat` icon (`BuildingPanel.tsx:59-69`). So construction hero renders appear nowhere on `/map`.
- `gallery` is never consumed by any map code; used only on `/projects/[slug]` (`page.tsx:371-393`). `floors` consumed by `buildingFloorCount` (`floors.ts:33-38`) and extrusion height.

Other map behaviors: deep-links `?building=` / `?status=` (`Map3D.tsx:686-713`); vague pins reverse-geocoded via `/api/geocode` (`Map3D.tsx:613-643`); refresh via `/api/map-data` (`Map3D.tsx:539-562`); click-anywhere nearest ≤ 90 m (`buildings.ts:489-506`, `Map3D.tsx:781-798`).

## 2. ALL floor-selection UI

| # | Surface | File:line | Interactive? | Mechanism |
|---|---|---|---|---|
| 1 | `/map` floor stack + click select | `Map3D.tsx:658-684` (show/hide), `819-856` (hover tooltip), `858-868` (`onFloorClick` → `floorRef` → `setFloorFilter`, only when building has listings), state `433,608-611` | **Yes** | `buildingShowsFloorStack` gate (`floors.ts:44-47`); selection filters `BuildingPanel` list (`BuildingPanel.tsx:41-43`) + chip (`233-243`) |
| 2 | `/buildings/[slug]` explorer | `BuildingFloorExplorer.tsx:28-84`; wired at `[lang]/buildings/[slug]/page.tsx:312-322`; cards tagged `data-card-floor` (`page.tsx:294`) | **Yes** | floor strip buttons + slab clicks set state; filtering = injected CSS rule hiding other floors (`BuildingFloorExplorer.tsx:79-84`) |
| 3 | `/projects/[slug]` stack | `[lang]/projects/[slug]/page.tsx:114-116,329-348` | **No** (view-only) | `onSelectFloor`/`selectedFloor` omitted → click handler no-ops (`BuildingFloorsMap.tsx:60,69,175-178`) |
| 4 | Slab click plumbing | `BuildingFloorsMap.tsx:40-41,175-178` | conditional | only active when parent passes `onSelectFloor` (only #2 does) |
| 5 | Admin inventory editor | `[lang]/admin/buildings/floors.tsx` (+ `actions.ts:137-179` `enableFloorInventory`) | admin-only | edits `Building3D`/`BuildingFloor` rows → `inventory` on cluster (`db-buildings.ts:312-323`) |

**No per-floor apartment-picker exists** (grep: no unit/flat picker; floor granularity only). Floor stack data priority: admin `inventory` → catalog `floors` → listing-derived → height formula (`floors.ts:33-47`).

## 3. Recommended temporary disable — feature flag, NOT removal

Repo has **no flag system** (`src/lib/features.ts` = amenity vocabulary; `NEXT_PUBLIC_*` used only for service config). Code removal would touch ≥ 6 files + dead exports + check files — wrong for "temporary".

**Plan: one exported const + 3 call-site gates (≤ 4-line diff).**

1. `src/lib/map/floors.ts` — add near line 29:
   `export const FLOOR_STACKS_ON = process.env.NEXT_PUBLIC_FLOOR_STACKS !== '0'`
2. `src/lib/map/floors.ts:44-47` — first line of `buildingShowsFloorStack`: `if (!FLOOR_STACKS_ON) return false` → kills `/map` stack render, hover tooltips, click-select, and `BuildingPanel` floor chip (filter state never set) in one blow; selected building keeps solid extrusion (existing fallback path `Map3D.tsx:662-684`).
3. `src/app/[lang]/buildings/[slug]/page.tsx:110` — `const floorsFc = FLOOR_STACKS_ON && cluster && listings.length > 0 ? floorsToGeoJSON(cluster) : null` → existing `floorsFc ? explorer : grid` ternary (`page.tsx:312-325`) auto-falls back to plain grid.
4. `src/app/[lang]/projects/[slug]/page.tsx:114` — same gate on `floorsFc` → existing ternary (`page.tsx:329-369`) auto-falls back to the `MapEmbed` location section.

Revert = unset env / flip const. Keep admin editor (#5) untouched — it's inventory data entry, not selection UI. If the owner wants projects' view-only stack kept, skip step 4 (selection is already inert there).

## Unverified / notes
- `projectsLive()` internals (`lib/directory-live.ts`) not read — Map3D comment (`Map3D.tsx:396`) says "live directory projects (korter coords)"; treat as source of live pin coords, unverified by me.
- `buildingShowsFloorStack` gate also disables **inventory-backed** stacks on `/map` (`floors.ts:45` returns true for DB inventory) — intended for full disable; if admin inventory should stay, gate only the `status === 'construction'` branch (`floors.ts:46`).
- No files were modified (read-only audit).</subagent>
<subagent agent_id="agent-1" item="ROLE: SEO_Auditor. In the repo /Users/mac/Desktop/sivrce888/app audit SEO for the directory side: (1) src/app/sitemap.ts + robots.ts — are all developer/project slugs covered, including [lang] variants? (2) src/app/[lang]/developers/page.tsx, developers/[slug]/page.tsx, projects/page.tsx, projects/[slug]/page.tsx — metadata (generateMetadata), JSON-LD structured data present or missing, canonical/hreflang. (3) The [...seo] catch-all route — what it covers. (4) i18n message files location for ka/en/ru and whether directory pages have SEO copy blocks/FAQ. (5) List exactly what to add for 'SEO 100/100': missing JSON-LD types, FAQ sections, metadata gaps — with file:line anchors." outcome="completed">Audit complete. Findings below — verified against code; nothing could be fetched from a live DB, so live-row counts are flagged.

# SEO Audit — Directory (developers / projects)

## 1. sitemap.ts + robots.ts

**sitemap.ts** (`src/app/sitemap.ts`) — coverage is good:

| Item | Status | Anchor |
|---|---|---|
| `/developers` hub | ✅ daily, 0.8 | sitemap.ts:67 |
| `/projects` hub | ✅ daily, 0.85 | sitemap.ts:56 |
| Developer detail slugs | ✅ live DB merge, fallback to static `DEVELOPERS` | sitemap.ts:74–83 |
| Project detail slugs | ✅ live DB merge, fallback to static `PROJECTS` | sitemap.ts:75–86 |
| hreflang cluster per entry | ✅ 9 locales + `x-default` on **every** entry | sitemap.ts:23–39 |
| `revalidate = 3600` | ✅ fresh live slugs hourly | sitemap.ts:16 |

⚠️ **Caveat:** sitemap emits hreflang for 9 locales on developer/project pages, but those pages are **ka-only in content and metadata** (see §4) — Google can flag hreflang to near-duplicate/untranslated pages.

⚠️ **Caveat:** `getLiveDeveloper`/`projectsLive` unmatched-DB-slug appends mean sitemap only contains DB slugs if `directory-live` returns them at revalidate; a DB outage silently reverts to the static catalog (sitemap.ts:80) — acceptable but invisible.

**robots.ts** (`src/app/robots.ts`) — clean:

| Rule | Status | Anchor |
|---|---|---|
| `/developers`, `/projects` allowed | ✅ (only singular dashboards `/developer/`, `/agent`, `/agency` disallowed) | robots.ts:12–25 |
| sitemap reference | ✅ `https://sivrce.ge/sitemap.xml` | robots.ts:27 |

## 2. Page-level SEO

| Page | generateMetadata | Canonical + hreflang | JSON-LD | Visible FAQ block |
|---|---|---|---|---|
| `[lang]/developers/page.tsx` | static ka meta (line 14) | ✅ line 18 | `ItemList` (line 47–60) | ❌ none — only H1 + 1-line sub (lines 67–72) |
| `[lang]/developers/[slug]/page.tsx` | ✅ dynamic (line 38–78) | ✅ line 58–61 | `Organization`+geo+`AggregateRating`+`Offer` (105–145), `BreadcrumbList` (147), `ItemList` (162), `FAQPage` (176) | ❌ FAQ is JSON-LD-only — **no visible FAQ section in the DOM** (Google: FAQ rich results require visible content; ld-only FAQ risks being ignored) |
| `[lang]/projects/page.tsx` | static ka meta (line 15) | ✅ line 19 | `ItemList` (41–52) | ❌ none |
| `[lang]/projects/[slug]/page.tsx` | ✅ dynamic (line 61–88) | ✅ line 71 | `ApartmentComplex`+`AggregateOffer`+geo (125–179), `BreadcrumbList` (181), `FAQPage` (196–247) | ❌ same: FAQ is ld+json only, no rendered `<section>` |

Note: Google deprecated most FAQ rich-result display (Aug 2023, reduced to gov/health sites) — [developers.google.com/search/blog/2023/08/howto-faq-changes](https://developers.google.com/search/blog/2023/08/howto-faq-changes). The markup is harmless but low-yield; visible FAQ copy is what matters for relevance now.

## 3. `[...seo]` catch-all

- Route: `src/app/[lang]/[...seo]/page.tsx` (56 lines) → parses deal × type × city × district (+room) combos via `lib/seo-pages.ts` (`generateAllSeoParams`, line 300; only combos with ≥1 listing).
- Covers programmatic landings (`/sale/apartments/tbilisi/…`), rendered in **all 9 locales**; copy corpus exists only ka/en/ru — other 6 render English copy under their prefix ([...seo]/page.tsx:9–11, 28–30).
- **Does NOT cover developers or projects** — no developer/project slugs in `seo-pages.ts` (grep: 0 matches). Directory SEO relies entirely on the 4 pages in §2.
- SeoLanding JSON-LD: `Place`, `CollectionPage`, `ItemList`, `BreadcrumbList`, `FAQPage` (`SeoLanding.tsx:116–171`) + visible FAQ (`faqsOf`, line 138). Good template to copy for directory pages.

## 4. i18n & SEO copy

| Fact | Status |
|---|---|
| i18n dicts | `src/lib/i18n/{ka,en,ru,he,ar,tr,uk,hy,az}.ts` (~545 lines each); no JSON message files |
| Directory pages use dict/`lang` param | ❌ **None** — `[lang]/developers/page.tsx` and `projects/page.tsx` hardcode ka strings; `params` type omits `lang` (developers/[slug]/page.tsx:30–32) |
| `/en/developers`, `/ru/developers` | Serve **Georgian H1/copy/meta** while sitemap + hreflang advertise 9 locales — duplicate-content risk across `/en`, `/ru` … `/az` variants of all 88 dev + 153 project pages |
| `generateStaticParams` | ka-only prerender (developers/[slug]:25–28; projects/[slug]:37–40); other locales SSR |
| Site meta per locale | only ka/en/ru real (`lib/i18n/server.ts:40–65`); 6 locales fall back to English |

## 5. To reach "SEO 100/100" — add list

| # | Gap | Where |
|---|---|---|
| 1 | **Localize directory pages for en/ru** (title/description/H1 per lang via `getServerT(lang)`); currently all 9 hreflang variants return ka content | `[lang]/developers/page.tsx:14–36`; `[lang]/projects/page.tsx:15–37`; `[slug]/page.tsx` title/desc use `.ka` always (developers/[slug]:52, projects/[slug]:65–66) |
| 2 | **Render the FAQ copy visibly** on dev/project detail pages (ld-only FAQ today); reuse `SeoLanding`'s faq section pattern | developers/[slug]/page.tsx:176–203 (FAQ exists only as JSON-LD); projects/[slug]/page.tsx:196–247 |
| 3 | Add **SEO prose block + FAQ on hub pages** (`/developers`, `/projects` have 1 line of copy; thin for a hub targeting "დეველოპერები საქართველოში") | developers/page.tsx:67–72; projects/page.tsx:59–64 |
| 4 | Localized og:locale per lang (hardcoded `ka_GE` even on /en, /ru URLs) | developers/page.tsx:26; projects/page.tsx:27; detail pages same; helper exists: `OG_LOCALE` in lib/i18n/server.ts:22 |
| 5 | `Organization` JSON-LD on dev detail could add `RealEstateAgent` type + `areaServed` + `sameAs` socials (only website today) | developers/[slug]/page.tsx:105–114 |
| 6 | `ApartmentComplex` could add `amenityFeature`, `petsAllowed`, `numberOfBedrooms` range, `tourBookingPage` — data partially exists in professionals.ts | projects/[slug]/page.tsx:125–179 |
| 7 | Video/`ImageObject` schema for official renders gallery (gallery renders at projects/[slug]:371–393 emit plain `<Image>` only) | projects/[slug]/page.tsx:118–120 (only hero+gallery URLs in `image`) |
| 8 | Consider `/developers/[slug]/projects` sub-landing or developer×city landing pages — long-tail queries ("m² პროექტები საბურთალოში") currently have no page; extend `seo-pages.ts` or new route | seo-pages.ts:300 (no dev/project coverage) |
| 9 | Translate `SITE_META` + seo-pages corpus for he/ar/tr/uk/hy/az before advertising those hreflang pairs — or drop them from sitemap until translated | sitemap.ts:23; lib/i18n/server.ts:56–65; [...seo]/page.tsx:28 |
| 10 | `BreadcrumbList` names hardcoded ka ("მთავარი", "დეველოპერები") on all locales | developers/[slug]:151–152; projects/[slug]:185–186 |

**Unverified:** live DB row counts (korter merge) — `developersLive()`/`projectsLive()` (lib/directory-live.ts) couldn't be executed; static catalog confirmed at 88 devs / 153 projects via `professionals.ts:143` and `:1497`. Whether DB-appended slugs render valid metadata/JSON-LD on first request is not runtime-verified (pages fall back correctly per code read).

**Bottom line:** technical skeleton (sitemap, robots, canonical, hreflang, JSON-LD breadth) is ~90% done; the 100/100 blocker is content i18n — hreflang advertises 9 locales while directory pages are Georgian-only, plus missing visible FAQ/prose blocks on hubs and detail pages.</subagent>
<subagent agent_id="agent-2" item="ROLE: მონაცემები_Media_Auditor. In the repo /Users/mac/Desktop/sivrce888/app: (1) Read src/lib/directory-live.ts fully — how DB rows overlay the static catalog, and what happens for projects NOT in DB (do they keep /images placeholders?). (2) Check DB state read-only: using DATABASE_URL from .env.local via `npx tsx -e` or node with the generated prisma client (src/generated/prisma/client), count ProjectDirectory and DeveloperProfile rows (non-deleted), and sample 5 ProjectDirectory rows (slug, address, lat, lng, image, gallery length, sourceUrl). NEVER write to the DB. If DB is unreachable, say so. (3) Read src/lib/storage.ts — can we upload files to R2/cdn.sivrce.ge from a script (which env vars it needs)? (4) Check scripts/localize-directory.ts rest — what it expects as input to mirror media. Report: merge rules, DB census, media upload feasibility." outcome="completed"># მონაცემები_Media_Auditor — Brief

All checks done read-only. DB reachable via `DATABASE_URL` from `.env.local` (Supabase, PrismaPg adapter, `npx tsx -e`).

## 1. Merge rules — `app/src/lib/directory-live.ts` (455 lines, read fully)

| Rule | Behavior | Source |
|---|---|---|
| Placeholder def | `!img \|\| img.startsWith('/images/')` | directory-live.ts:17-19 |
| Owned media def | `cdn.sivrce.ge` / `images.sivrce.ge` only | directory-live.ts:22-24 |
| Row filters | Projects: `deletedAt:null, status≠'draft'`; Devs: `deletedAt:null` | directory-live.ts:386-388, 375-377 |
| Match order | slug → exact name (diff slug) → fuzzy media-steal (exact → contains ≥8 chars → ≥2 token overlap) | directory-live.ts:262-290, 113-136 |
| Projects NOT in DB | Keep **all** static catalog values incl. `/images/` placeholder imgs | directory-live.ts:264 (`if (!r) return p`) |
| ⚠️ Public-list purge | If **any** project in merged corpus has real media → all placeholder-only cards w/o gallery are **hidden** from list; no-op only when DB has zero real media | directory-live.ts:301-304 |
| Image overlay | DB `image` wins only if non-placeholder; never downgrades to stock art | directory-live.ts:196-198 |
| Gallery overlay | DB gallery replaces static only if non-empty | directory-live.ts:212 |
| Coords/address | Precision heuristic wins: curated street pin beats vague DB district centroid; invalid DB coords ignored | directory-live.ts:48-66, 26-36 |
| Price | Curated ₾ wins; DB `$pricePerSqmFrom` fills gaps only | directory-live.ts:207-209 |
| Body | DB body wins only if longer than curated SEO copy | directory-live.ts:215-217 |
| DB-only rows | Append as new cards; `img` falls back to `/images/np1.webp`; NaN coords → card shows, map pin dropped | directory-live.ts:292-297, 234, 250 |
| Sort | owned CDN → other http → placeholders last | directory-live.ts:307-311 |
| DB failure | `safeQuery` → `[]`, silent fallback to static catalog | directory-live.ts:373-392 |

## 2. DB census (live query, read-only)

| Metric | ProjectDirectory | DeveloperProfile |
|---|---|---|
| Total / non-deleted | 149 / 149 | 79 / 79 |
| Status | 143 active, 6 completed, 0 draft | — |
| `sourceUrl` set | **0** (all cleared) | — |
| image = `/images/` placeholder | **149 / 149 (100%)** | — |
| image on cdn.sivrce.ge | 0 | 0 |
| image external http | 0 | 0 |
| gallery length > 0 | **0 / 149** | — |
| missing lat/lng | 0 | — |
| missing address | 0 | — |
| logoUrl | — | **0 (all 79 null)** |
| website | — | 0 |
| owner-claimed (`ownerId`) | — | 0 |

Static catalog says 88 devs / 153 projects (mission); DB adds 79 devs / 149 projects → union after name-dedupe is the live corpus, but **all DB media is placeholder**.

Sample 5 `ProjectDirectory` rows (slug ASC):

| slug | address | lat | lng | image | gallery | sourceUrl |
|---|---|---|---|---|---|---|
| alliance-centropolis | Shota Rustaveli St, 52, ბათუმი | 41.64485 | 41.61831 | `/images/np2.webp` | 0 | null |
| alliance-highline | ჭავჭავაძის გამზ. 49ბ, ვაკე, თბილისი | 41.7118 | 44.7772 | `/images/np2.webp` | 0 | null |
| alliance-palace | Sherif Khimshiashvili St, 5, ბათუმი | 41.64170 | 41.61617 | `/images/np2.webp` | 0 | null |
| alliance-privilege | Shota Rustaveli St, 42, ბათუმი | 41.64867 | 41.62372 | `/images/np1.webp` | 0 | null |
| alpha-home-gldani | თენგიზ შეშელიძის ქ. 18, გლდანი, თბილისი | 41.795 | 44.825 | `/images/np2.webp` | 0 | null |

→ Every row has address + pin; **zero real renders anywhere in DB**. The placeholder-purge (directory-live.ts:301) is currently inactive because no real media exists.

## 3. R2 upload feasibility — `app/src/lib/storage.ts` (139 lines, read fully)

| Item | Fact | Source |
|---|---|---|
| Script-uploadable? | Yes — `uploadFile({key, body, contentType})` is a plain async fn, already used by scripts | storage.ts:82-100 |
| Required env | `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` (client), `R2_BUCKET_NAME`, `R2_PUBLIC_URL` | storage.ts:24-44 |
| Public URL shape | `${R2_PUBLIC_URL}/${key}` | storage.ts:62-69 |
| Missing-env behavior | warns + returns `/placeholder/<key>`, **no upload** | storage.ts:85-88, 63-68 |
| `.env.local` | ❌ none of the 5 R2 vars (15 keys present: DATABASE_URL, DIRECT_URL, AUTH_*, RESEND_API_KEY, etc.) | grep of key names |
| `.env.production.local` | ❌ also no R2 vars (looks like a Vercel build-env dump) | grep of key names |
| `.env.example` | Documents all 5; `R2_PUBLIC_URL=https://cdn.sivrce.ge` | .env.example:59-70 |

**Verdict: uploads NOT possible from a local script right now** — creds must be added to `.env.local` first. Unverified: whether R2 keys exist in Vercel project env (absent from the pulled `.env.production.local`, which suggests not set — or the file is stale; needs `vercel env ls` to confirm, not run).

## 4. `scripts/localize-directory.ts` — input expectations (382 lines, read fully)

| Phase | Input it needs | Source |
|---|---|---|
| Env | `.env.local` + `.env`; hard-aborts without `DATABASE_URL` or `R2_ACCOUNT_ID`/`R2_PUBLIC_URL` | localize-directory.ts:21-22, 34-38, 358-361 |
| `enrichProjects()` (skipped w/ `--mirror-only`) | Rows where `sourceUrl≠null` AND (`gallery` empty OR `body` null) → re-fetches korter page, extracts `buildingLandingStore` (gallery cap 16, body ≤8000, passport, hero, lat/lng, address, floors); also updates MapBuilding | localize-directory.ts:189-247, 32, 79 |
| `mirrorAll()` | Devs: `logoUrl` containing `googleapis.com`; Projects: external-http `image`/`passportUrl`/`gallery` not on our CDN; MapBuilding: `img` containing `googleapis.com` | localize-directory.ts:250-270 |
| Mirror output | Key `directory/{logos\|projects\|passports}/<sha1(url)[0:16]>.<ext>` → `uploadFile` → DB update, sets `sourceUrl:null` | localize-directory.ts:166-176, 317-327 |
| Finalize | Clears all remaining `sourceUrl LIKE %korter.%` | localize-directory.ts:370-374 |
| Safety | Re-run safe (skips CDN URLs); 2-wide concurrency + `dbRetry` (P1008/P1017, Supabase pooler) | localize-directory.ts:31, 158, 199, 143-154 |

**Against current DB the script is a no-op**: 0 rows with `sourceUrl` (enrich finds nothing), 0 external-http media, 0 googleapis logos (mirror finds nothing) — and it would abort at line 358 anyway (R2 env missing locally).

## Red flags

1. **Media pipeline ran backwards**: `sourceUrl` fully cleared (finalize step ran) but 0 CDN URLs exist → mirror never succeeded or rows were re-imported from `import-korter.ts` after clearing. Provenance to re-fetch renders is gone from DB; `scripts/import-korter.log` may retain URLs (not inspected — out of scope).
2. **Placeholder-purge is armed**: the moment ≥1 real CDN render lands, all 149 placeholder-only DB rows without galleries vanish from the public list (directory-live.ts:301-304) unless static catalog covers the slug. Media backfill must be all-or-nothing per project.
3. All 79 DB developers have **no logo, no website, no owner** — they overlay nothing onto curated cards and append bare DB-only cards otherwise.
4. Could not verify Vercel-side R2 env (no CLI check run); local env files definitely lack R2 creds.</subagent>
<subagent agent_id="agent-3" item="ROLE: კვლევა_თბილისი_Premium. Web research (korter.ge, official developer sites, geoln.com, homeguide, news): list every ACTIVE (on-sale or under construction 2025–2026) premium/large new-build project in Tbilisi from: m2 (all active), Archi (all active), Axis, Blox, King David, White Square, Biograpi, Anagi (Tbilisi), Domus, Maqro, Lisi Development, Archi Isani/ Digomi etc. For EACH project give: official name, developer, district + street address (as precise as published), GPS coords (from Google Maps/OSM/korter), price-from per m² (GEL/USD), completion quarter/year, floors count, total units, official site URL, and a hero RENDER image URL from the OFFICIAL developer site (not aggregator) if findable. Also flag projects completed/closed in 2024–2025 that should be removed from 'active' lists. Table format." outcome="completed">Research complete. Final brief below.

---

# კვლევა_თბილისი_Premium — Tbilisi Active New-Build Brief (2025–2026)

Sources: official developer sites (m2.ge, archi.ge, blox.ge, axis.ge, lisi.ge, tbilisiacres.ge, maqrocitytbilisi.com) + korter.ge aggregator (prices/completions). GPS coords could NOT be machine-verified (Google/OSM blocked in-session) — all coords omitted rather than fabricated; exact pins available on each korter.ge project page map. Render URLs: official sites are JS-galleries; project page URLs given as render source — direct image URLs need per-site scrape (flagged, §4).

## 1. Active projects by developer

### m² (m2.ge) — current per official offers page (valid through Dec 2026) [m2.ge/en/offers, m2.ge/en/projects]
| Project | Address / District | Price from | Completion | Facts | Source |
|---|---|---|---|---|---|
| m² Highlight | 23 Marshal Gelovani Ave, Saburtalo | n/a (promos 0% down) | 2027-06-30 | 2 towers, 36 & 26 fl; co-work+office; first m² skyscraper | m2.ge/en/offers |
| m² at Mtatsminda Park | 20 Innovation St (Okrokana), Mtatsminda | 4,050 GEL (~$1,500) | end-2025 → 2026 | 6× 5-storey bldgs on 20,000 m² | m2.ge/en/offers |
| m² at Mirtskhulava | 9/11 A. Mirtskhulava St, Didube | n/a | 2026-06-30 | 10 residential bldgs | m2.ge/en/offers |
| m³ Saburtalo | 1 Marshal Gelovani Ave | n/a | phased; bldgs VII–X done 2024–25, later stages active | ~3,000-family district | m2.ge/en/offers |
| m² at Chkondideli | 22 G. Chkondideli St, Didube | n/a | active (installment to 2026) | — | m2.ge/en/offers |
| m² at Nutsubidze 2 | 125a Sh. Nutsubidze St, Saburtalo | n/a | active | 2 min from Vazha-Pshavela metro | m2.ge/en/offers |

### Archi (archi.ge + korter.ge/en/archi) — 14 Tbilisi ongoing
| Project | Address / District | $/m² from | Completion | Source |
|---|---|---|---|---|
| King Tamar by Archi | 15 Merab Aleksidze St | n/a | ongoing | archi.ge/en/projects |
| Grand Avenue by Archi | 32 Ts. Dadiani St, Nadzaladevi | n/a | ongoing (A,B) | archi.ge |
| Archi Universe | 15a University St, Saburtalo | n/a | ongoing (A,B) | archi.ge |
| Archi Horizon | 109 V. Gorgasali St, Ortachala/Krtsanisi | n/a | Q1 2029 (B,C) | archi.ge; korter |
| Archi Nutsubidze 2 | 15 K. Kapaneli St, Vake | $1,415 | Q3 2026 | korter.ge/en/archi |
| Archi Lisi Sunrise | 11 M. Matchavariani St, Lisi | n/a | ongoing (B,C) | archi.ge |
| Archi Rivertown | D. Aghmashenebeli Alley | n/a | ongoing B,C (A done) | archi.ge |
| Archi Panorama | Marshal Gelovani Ave nr Agrohub (korter: Brotseuli 5/1), Saburtalo | $1,240 | Q2 2027 | archi.ge; korter |
| Archi Lilacs | R. Gabashvili St, Gldani | $1,160 | ongoing (A,B,C) | archi.ge; korter |
| Archi Kikvidze Garden | 4 Z. Kikvidze St, Nadzaladevi | $1,400 | Q4 2027 (A done) | korter |
| Archi Akhmeteli | T. Sheshelidze × A. Gobronidze, Gldani | $1,400 | Q4 2027 | korter |
| Archi Guramishvili | 64 D. Guramishvili Ave, Nadzaladevi | $1,151 | Q1 2027; 32 fl | korter |
| Archi Isani 2 | Beri Gabriel Salosi Ave, Isani | n/a | ongoing | archi.ge |
| Archi Dighomi 3 | King Pharnavaz Ave, Didi Digomi | n/a | ongoing (A–D), 4×25 fl | archi.ge |

### Axis (axis.ge) — current cards on official homepage
| Project | Address / District | Notes | Source |
|---|---|---|---|
| Axis Palace 2 | near TSU (Shatberashvili area), Vake | 10% single-pay discount; selling | axis.ge/en |
| Axis Palace 1 | Saburtalo | selling | axis.ge/en |
| Axis Palace at Sairme | Sairme St, Saburtalo | selling | axis.ge/en |
| Axis Avlabari | 25 Bochorma St, Avlabari | selling | axis.ge/en |
| Axis Chavchavadze 49 | 49 Chavchavadze Ave, Vake | selling (interior-works promo) | axis.ge/en |
| Axis Tsinamdzghvrishvili 125 | 125 Tsinamdzghvrishvili St, Chugureti | selling | axis.ge/en |
| Axis Hippodrome | Hippodrome area, Saburtalo | promo (likely finishing) | axis.ge/en |

### Blox (blox.ge) — % = share sold per official site
| Project | Address | Status | Source |
|---|---|---|---|
| BLOX Krtsanisi | 49 Krtsanisi St | built, Premium, selling | blox.ge/en |
| BLOX Avlabari | 18 Bochorma St | built, Premium | blox.ge/en |
| BLOX Didi Digomi (Tavdadebuli) | D. Tavdadebuli St | 33% sold, ongoing | blox.ge/en |
| BLOX Ortachala | 21 Sh. Davitashvili St | 31% sold, ongoing | blox.ge/en |
| BLOX Sarajishvili | 20 Sheshelidze St | 37% sold, ongoing | blox.ge/en |
| BLOX Didi Digomi (Teimuraz I 6) | 6 Teimuraz I St | 100% built, available | blox.ge/en |

### Biograpi Living (Wissol Group × Riverside Invest; korter.ge/en/biograpi — 8 current + Libretto)
| Project | Address / District | $/m² from | Completion | Source |
|---|---|---|---|---|
| Sakeni | 25 Vaja-Pshavela Ave, Saburtalo | $2,940 (houzer: $2,300) | Q4 2026 | 35 fl, 364 units, $72M project; korter+houzer |
| Matiani | 45 Akaki Tsereteli Ave (bdgroup: 20 I. Evdoshvili St — address conflict ⚠), Didube | $1,830 | Q4 2026 | korter; bdgroup.ge |
| Chantan | 9 V. Maiakovski St, Didube | $2,000 | Q2 2027 | korter |
| Hisni | 69 Ts. Ketevan Dedoflis Ave, Isani | $1,700 | Q4 2028 | korter |
| Bare by Biograpi | 3 N. Lomouri St, Isani | $3,800 | Q4 2027; 5 fl boutique | korter |
| Daira by Biograpi | 73/1 V. Gorgasali St, Krtsanisi | $1,920 | Q1 2029 | korter |
| Mozaika | 10 Gazapkhuli St, Saburtalo | $1,858 | Q2 2029 | korter |
| Gardani | 6 A. Gobronidze St, Gldani | $1,325 | Q4 2029 | korter |
| Libretto by Biograpi | Vake (exact st. n/a) | n/a | selling | korter.ge/en/libretto-by-biograpi-tbilisi |

### Domus (korter.ge/en/domus-development)
| Project | Address / District | $/m² from | Completion | Source |
|---|---|---|---|---|
| Domus Trees | 31 I. Chavchavadze Ave, Vake | $3,200 | Q4 2026 | korter |
| Domus Sera | 7 Z. Paliashvili St, Vake | $4,000 | under construction | korter |
| Domus Gazapkhuli | Gazapkhuli St, Vake/Saburtalo | $1,800 | Q4 2027 | korter |
| Domus Nea | 22b P. Kavtaradze St, Vake | $1,900 | Q4 2028 | korter |
| Domus Avlabari | 14 Ialbuzi St, Isani | $1,800 | Q2 2028 | korter |

### Maqro, Anagi, Lisi, White Square, King David
| Project | Developer | Address / District | $/m² | Completion | Source |
|---|---|---|---|---|---|
| Maqro City Tbilisi | Maqro | 30 Noe Ramishvili St, Isani | $1,733 (launch $1,250, 06/2025) | under constr.; 19 bldgs, 350k m² | korter; maqrocitytbilisi.com |
| Tbilisi Acres | Anagi Collab | Napetvrebi road, Vake–Saburtalo edge | $1,945 (promo $1,750 02/2026) | Q3 2028; constr. start 20 Oct 2025; 90,000 m² site, bldgs A7–A13+ | korter.ge/en/tbilisi-acres; tbilisiacres.ge |
| Lisi Green Town | Lisi Development | Lisi St 5-11 + 8 more sts, Lisi/Saburtalo | n/a | phased ongoing | korter.ge/en/lisi-development; lisi.ge |
| Lisi Lake | Lisi Development | Lisi lakeside | n/a | ongoing (newest line) | lisi.ge/en |
| White Square Varketili 5 | White Square (BK Holding) | Varketili III massif, Q-X, bldg 9, Samgori | n/a | active | korter.ge/en/white-square-varketili-5-tbilisi |
| White Square Varketili 2 | White Square | Varketili | n/a | 10 fl, 95 units, white frame | korter.ge/en/white-square-varketili-2-tbilisi |

## 2. Completed/closed 2018–2025 — REMOVE from "active"
| Project | Dev | Status | Source |
|---|---|---|---|
| King David Residences, 12 M. Aleksidze | King David/Rezid Holding | completed Q3 2018; resale only ($2,700/m²) | korter.ge/en/king-david-residences-tbilisi |
| Archi Isani, 1 Navtlugi St | Archi | completed 2024, sold out | korter.ge/en/archi |
| Maqro Prestige Kostava, 65-67 M. Kostava | Maqro | completed 2025 | korter.ge/en/maqro-development |
| Maqro Green Diamond, 32 Bob Walsh | Maqro | completed 2025, sold out | korter |
| Domus Hippodrome 2 (2022) / 3 (2023) | Domus | sold out | korter.ge/en/domus-development |
| Domus Chavchavadze 29 | Domus | completed 2023, sold out | korter |
| m² at Kazbegi 2 | m² | completed, housed | m2.ge/en/offers |
| Axis Towers, 37 Chavchavadze | Axis | completed (Pullman hotel operating) | investor.ge AmCham list |
| BLOX Beliashvili 84 / Beliashvili 68a / Nutsubidze 7 / Varketili 35 | Blox | sold out | blox.ge/en |
| Anagi Park Home Saburtalo / Park Home Vake | Anagi Dev | completed (2023 / 2021) | georgiatoday.ge; anagi.ge |

## 3. Local file anchors (for parent agent)
professionals.ts entries: m² `app/src/data/professionals.ts:146` · Archi `:207` · Axis `:222` · King David `:237` · Blox `:252` · White Square `:312` · Anagi `:402` · Biograpi `:447` · Lisi Dev `:492` · Maqro `:901` · Domus `:916`.

## 4. Could NOT verify / flags
- GPS coords: not verifiable in-session — pull per-project lat/lng from korter.ge project pages (embedded maps) or OSM geocode of the addresses above.
- Official render image URLs: dev sites (m2.ge, archi.ge, biograpi.ge, whitesquare.ge, kd.ge) are JS-rendered; direct .jpg render URLs need a browser scrape. biograpi.ge and whitesquare.ge returned no extractable content; kd.ge unreachable (possible site down/rebrand — King David brand shows no active construction since 2018).
- Matiani address conflict: korter "45 A. Tsereteli Ave" vs bdgroup "20 I. Evdoshvili St" (adjacent corners — likely same plot, unconfirmed).
- m2.ge/en/projects page renders only 3 cards (Highlight, Mtatsminda Park, Mirtskhulava); the 6-project list comes from the official offers page — treat Chkondideli/Nutsubidze 2/m³ Saburtalo as "selling, late-stage".
- White Square: korter lists 9 projects total; only Varketili 5 + Varketili 2 confirmed active here.
- Floors/units: only captured where published above (Sakeni 35 fl/364 u; Axis Palace n/a; m² Highlight 36+26 fl; WS Varketili 2: 10 fl/95 u; King David 32 fl). Remaining floors/units need per-project page fetch.</subagent>
<subagent agent_id="agent-4" item="ROLE: კვლევა_თბილისი_Mid. Web research: every ACTIVE 2025–2026 mid/economy new-build project in Tbilisi + suburbs (Digomi, Gldani, Varketili, Isani, Samgori, Temka, Lisi, Tskneti, Rustavi highway) from: Dirsi, Metropol, Redix, ELT Group, Tekto, Next Group, Guru Holding, Mziuri Development, Build Group, Altergeo, Nexus, DS Group, Tower Group, Citron, Arcon, Milestone, Orbi Tbilisi, and any notable NEW entrant. Per project: official name, developer, address, GPS coords, price-from per m², completion, floors, units, official URL, hero render URL from official site. Flag closed/completed projects. Table format." state="started" outcome="aborted">The user manually interrupted this subagent batch before this subagent finished.</subagent>
<subagent agent_id="agent-5" item="ROLE: კვლევა_ბათუმი. Web research: every ACTIVE 2025–2026 new-build project in BATUMI from: Alliance Group (Alliance Palace/Privilege etc), Orbi Group (Orbi City/Sea Towers/Beach Tower etc), Metropol Batumi, Mardi Holding, Gumbati, Anagi Batumi, Ambassadori Batumi, Pontus, NEXT Group Batumi, ELT (Calligraphy Towers), Real Palace, and NEW entrants incl. Eagle Hills Gonio. Per project: official name, developer, address, GPS coords, price-from per m² (USD common in Batumi), completion, floors, units, official URL, hero render URL from official site. Flag completed/closed ones. Table format." outcome="completed"># კვლევა_ბათუმი — Batumi New-Build Research Brief (2025–2026)
Basis: web pass on 2026-07-18. Read-only; nothing edited. `⚠` = unverified/conflicting. Prices are developer/listing "from" prices, USD/m².

## A. ACTIVE projects (selling / under construction)

| # | Project | Developer | Address | $/m² from | Compl. | Floors/Units | Src |
|---|---|---|---|---|---|---|---|
| 1 | Alliance Centropolis (Hyatt Centric Boulevard) | Alliance Group | New Boulevard, 50 m from sea | €3,120–6,197 (from €102,869) | 2029 | $420M inv., WTC+casino | S1 |
| 2 | Orbi Millennium | Orbi Group | Batumi Blvd, 50 m from sea | $2,500 | ⚠ active | 2×25F (file:2641) | S2 |
| 3 | ORBI Continental | Orbi Group | 50 m from sea | from $75,500/unit | ⚠ active | new tower | S2 |
| 4 | ORBI Beach Tower | Orbi Group | New Batumi beach | ⚠ | ⚠ active | — | S2 |
| 5 | Orbi Residence | Orbi Group | Batumi coastline | ⚠ | ⚠ active | studios–family | S2 |
| 6 | Orbi Plaza | Orbi Group | walk-to-beach | ⚠ | ⚠ active | — | S2 |
| 7 | Central Park Towers | Orbi Group | Kazbegi St, 200 m from Central Park | ⚠ | ⚠ active | — | S2 |
| 8 | Orbi City (+ Mall, opening 2026) | Orbi Group | 9 Sherif Khimshiashvili St | ~$1,400 (2024 data) | phased; mall 2026 | largest complex EU | S2,S3 |
| 9 | Avenue by Orbi | Orbi Group | 10 min from sea | ⚠ | ⚠ active | — | S2 |
| 10 | Avant-garde by Orbi | Orbi Group | Alley of Heroes, 250 m from sea | ⚠ | ground works done | — | S2 |
| 11 | Comfort by Orbi | Orbi Group | Alley of Heroes, 250 m from sea | ⚠ | ⚠ active | — | S2 |
| 12 | Orbi Crystal (coming soon) | Orbi Group | Makhinjauri beach | ⚠ | announced | — | S2 |
| 13 | Orbi Sunset Boulevard (coming soon) | Orbi Group | Batumi Blvd waterfront | ⚠ | announced | — | S2 |
| 14 | ORBI Marjanishvili | Orbi Group | 12 Marjanishvili St | ⚠ | ⚠ active | 4F / 15 apts | S2 |
| 15 | ORBI Old Batumi | Orbi Group | near Piazza Sq | ⚠ | ⚠ active | 5F+attic | S2 |
| 16 | ORBI Old City | Orbi Group | Old Batumi | ⚠ | ⚠ active | — | S2 |
| 17 | Orbi City Park | Orbi Group | Batumi | ⚠ | ⚠ active | — | S2 |
| 18 | Metropol Cube (Royal Tulip) | Metropol | 7 Jiuli Shartava Ave | $1,595–1,678 | Q4 2027 | 36F tower / 332 apts + 82-key hotel | S4,S5 |
| 19 | Metropol Oval (Royal Tulip 5*) | Metropol | Alley of Heroes ⚠ | ~$1,700 | Q3 2027 ⚠ | 34F / 523 apts + 100 rooms | S6,S7 |
| 20 | Metropol Parallel | Metropol | central Batumi (cad. 05.24.08.116) | $1,598–1,962 | Q4 2027 | 2 blocks / 474 apts, 32–184 m² | S8,S9 |
| 21 | Mardi Aquapark (Mercure) | Mardi Holding | Makhinjauri | $1,640 | ⚠ active | — | S10 |
| 22 | Mardi Hills | Mardi Holding | Kakhaberi | ⚠ | ⚠ active | — | file:1028 |
| 23 | Mardi City Center | Mardi Holding | central Batumi | ⚠ | ⚠ active | — | file:1028 |
| 24 | Midtown | Gumbati Group | center, 500 m from beach | ⚠ | near-completion | 14F / 53.1–144.3 m² | S11 |
| 25 | Montemar by Gumbati | Gumbati Group | Kvariati | from $65,000 (€2,054–2,437) | 2028 | 16F, 3 blocks | S12 |
| 26 | Gumbati Residence Gonio | Gumbati Group | Gonio | $2,750 (from $110,000) | ⚠ active | renovated+furnished | S13 |
| 27 | Ambassadori Island — First Tower | Ambassadori Group | artificial island, Odissey Dimitriadi side | $2,980–3,100 (studio from $110,447) | 2029 (full 2035) | 58F/216 m / 1,350 apts; SHoP+Arup | S14,S15 |
| 28 | Pontus Rotana Resort & Spa | Pontus Development | Gonio coast | min inv. $128,885 | ⚠ u/c | 546 keys, $70M, 25,600 m² | S16 |
| 29 | Calligraphy Towers (Hampton by Hilton / Hilton Garden Inn) | ⚠ Grand Maison vs ELT — conflict | 18 Zhiuli Shartava St, Alley of Heroes | $1,250–1,694 (studio $62,350) | Sep 2026 | A 35F hotel, B 45F, G 40F | S17,S18,S19 |
| 30 | Real Palace Blue | Real Palace | New Boulevard | $1,285 (from $46,000) | ⚠ active | — | S20 |
| 31 | Real Palace Green | Real Palace | Batumi | ⚠ | ⚠ active | — | file:1043 |
| 32 | Gonio Yachts & Marina (Gonio Marina) | Eagle Hills (Alabbar/Emaar-affil.) | Gonio, 260 ha | on request | phased, TBA | villas, townhouses, 1–3BR, 180-berth marina, ~800 serviced apts | S21,S22 |
| 33 | Silk Towers | Silk Road Group (Silk Dev) | Gogebashvili St, Old Batumi | $3,090–3,450 | Q1 2030 | premium old-town | S23,S24 |
| 34 | Archi Ramada Batumi | Archi | Inasaridze St | $1,678 | ⚠ active | Ramada-branded | S23 |
| 35 | King's Garden Residence | ⚠ dev n/a | Rustaveli district | $5,720–6,000 | Q3 2026–27 | ultra-premium | S24 |
| 36 | Lagoon Resort Batumi | ⚠ dev n/a | Batumi | $1,850–2,400 | Q2–3 2027 | — | S24 |
| 37 | Wyndham Grand Batumi Gonio (ultra all-inclusive) | ⚠ dev n/a | Gonio | n/a | ⚠ u/c | 1,055 rooms, 100+ facilities | S25,S26 |

## B. Completed / closed — flag in catalog
| Project | Dev | Status | Src |
|---|---|---|---|
| Alliance Palace (Courtyard Marriott) | Alliance Group | ✅ completed, opened 2024, 5 Sh. Khimshiashvili | S27 |
| Alliance Privilege | Alliance Group | ⚠ likely completed/sold (~2023) — verify | — |
| Orbi Sea Towers | Orbi Group | ✅ completed (15 Sh. Khimshiashvili) | S2,S28 |
| Subtropic City | Gumbati | ✅ completed, operating apart-hotel | S12 |
| Gumbati in Kheivani (A/B/C) | Gumbati | ✅ completed, sold out | S29 |
| Gumbati Shota Rustaveli 24 | Gumbati | ✅ completed 2017, sold out | S30 |
| Blue Sky Tower (Holiday Inn) | — | ✅ in operation (from $1,700–2,450 resale) | S24 |
| Hilton Belle Vue | — | ✅ in operation (from $5,970) | S24 |

## C. Unverified / conflicts / gaps
- **Anagi Batumi**: no active Anagi-branded sales project found — Anagi operates as contractor in Batumi (White Sails, Batumi View, stadium); dev arm sells "Geverse Batumi" (50 26 May St) ⚠ status unclear. [S31]
- **NEXT Group Batumi**: no active Batumi project verified; NEXT Group portfolio is Tbilisi-focused (11 projects, korter.ge). ⚠ Treat as no Batumi presence unless owner has other intel.
- **ELT vs Grand Maison**: mission brief says "ELT (Calligraphy Towers)"; korter.ge + realting name **Grand Maison** as developer; ELT known for Barceló Residences Tbilisi (file:334). Resolve before publishing.
- **GPS coords**: not reliably verifiable in this pass — all addresses above are geocode-ready; recommend geocoding pass (Google/Mapbox) before pins. Do NOT reuse old pin data (per e5e991e drift history).
- **Hero renders**: official sites are JS-heavy; direct render URLs not extractable except: Ambassadori masterplan `https://share-architects.com/wp-content/uploads/2026/06/share-architects.com-armenia-and-georgia-2026-architecture-and-construction-projects-reshaping-yerevan-and-tbilisi-07.jpg` [S15]; Gonio Marina `https://snoopy.archdaily.com/images/archdaily/media/images/691d/7d5b/35d7/5212/5cbc/26bc/slideshow/masterplan-for-gonio-yachts-and-marina-a-new-era-in-georgian-development_3.jpg` [S22]. Others: scrape per-project pages on orbi.ge / metropol-batumi.ge / gumbati.ge.
- **Market context**: new-build avg $1,865/m² end-2025 (+9.4% YoY); ~12,400 unsold units; 58,000 units planned 2025–29. [S32]

## D. Local catalog cross-refs (`app/src/data/professionals.ts`)
Alliance L169 · Orbi L184 (Orbi City L1674, Millennium L2641) · ELT L334 · Mardi L1028 · Real Palace L1043 — verify stale entries vs table A/B.

## Sources
S1 realting.com/news/5-modern-residential-complexes-in-batumi · S2 orbi.ge/en/projects · S3 devskey.com/real-estate-construction-projects-in-batumi · S4 metropol-batumi.ge/projects/cube · S5 korter.ge/en/cube-batumi · S6 forbes.ge/en/modern-residential-complex…metropol-parallel… · S7 homesoverseas.ru/eng/objects/2123474 · S8 seasidegeorgia.ge/batumi/the-parallel · S9 batumiresidence.com/en/projects/473 · S10 korter.ge/en/mardi-aquapark-batumi · S11 gumbati.ge/en/projects/midtown · S12 realting.com/news/5-modern-residential-complexes-in-batumi · S13 korter.ge/en/gumbati-residence-batumi · S14 globihome.com/en/blog/batumi-real-estate-high-returns · S15 share-architects.com/armenia-and-georgia-2026… · S16 korter.ge/en/pontus-rotana-resort-spa-gonio-gonio · S17 korter.ge/en/calligraphy-towers-batumi · S18 propertygeorgia.ge/en/properties/newdevelopment/1558… · S19 batumi.estate/en/calligraphy-towers · S20 residence-estate.ge/en/projects/batumi-view · S21 metropolitan.realestate/batumi/gonio-yachts-marina… · S22 archdaily.com/1036202/gonio-yachts-and-marina… · S23 batumiresidence.com/en/projects · S24 gruzjadlaciebie.pl/ceny-nieruchomosci-w-gruzji · S25 siteselection.com/country-of-georgia-rising-trends… · S26 internationalinvestment.biz/en/georgia/5941-gonio… · S27 uk.trip.com/hotels/batumi-hotel-detail-102771356/alliance-palace · S28 trip.com/…/orbi-tower-batumi · S29 korter.ge/en/gumbati-in-kheivani-batumi · S30 korter.ge/en/gumbati-holding · S31 batumi.estate/en/developers/anagi · S32 internationalinvestment.biz/en/real-estate/7423…

**Bottom line**: 37 active rows found; 8 completed/closed flagged; Anagi + NEXT have no verified active Batumi sales project; ELT/Calligraphy attribution conflicts; GPS + render URLs need a dedicated scrape/geocode pass.</subagent>
<subagent agent_id="agent-6" item="ROLE: კვლევა_რეგიონები_Mega. Web research: (1) ACTIVE 2025–2026 new-builds in Kutaisi, Rustavi, Gudauri, Bakuriani, Kobuleti, Shekvetili, Telavi (developers: Redco, European Village, Altergeo Gudauri, Studio Apart/Aparta, Kazbegi View, etc). (2) MEGA projects announced/started 2024–2026: Eagle Hills Georgia ($6B+ Tbilisi + Gonio projects — exact locations, scope, status), Tbilisi Hills, any new large mixed-use developments. Per project: name, developer, location, coords, price-from, completion, official URL, render URL. Table format." outcome="completed"># კვლევა_რეგიონები_Mega — Research Brief

**Scope:** Active 2025–26 regional new-builds + mega projects. **Catalog cross-check:** `app/src/data/professionals.ts` (88 devs / 153 projects) — already covers Eagle Hills + both mega masterplans, Tbilisi Hills/Mira Verde, Redco (Batumi only), Altergeo (Tbilisi only), European Village, Bakuriani 4Rest, Villa Kokhta Mitarbi, Mziani Valley, Blox Gudauri. **Coords:** approximate site/city coords — verify against cadastral before pinning. Renders: no direct image URLs verified; pull from official sites / ArchDaily.

## 1. MEGA projects 2024–2026

| Project | Developer | Location | Coords (approx) | Scope / Investment | Price from | Status / Completion | Source |
|---|---|---|---|---|---|---|---|
| **Tbilisi Waterfront** | Eagle Hills Georgia (Alabbar/Emaar) | Krtsanisi, Mtkvari riverfront (aka Krtsanisi Park; some sources say Ponichala stretch) | 41.670, 44.840 | ~590–600 ha; apts, townhouses, villas, Bristol-branded hotel, retail, spa; ~$3B+ of $6.5B total; masterplan Sebastian Treese Architekten (Berlin) | ~$2,090/m²; apts ~$115–200K | Phase 1 sold out day-one Jan/Feb 2026 (~300 units); Phase 2 sold out May 7, 2026; townhouses/villas next | [finchannel](https://finchannel.com/tbilisi-waterfront-sells-out-second-sales-phase-in-a-single-day/130637/american-business-trends/2026/05/) · [propertyacross](https://propertyacross.com/is-eagle-hills-6-5b-georgia-mega-deal-the-smartest-entry-point-for-foreign-property-investors-in-2026/) · [metropolitan](https://metropolitan.realestate/georgia/tbilisi-waterfront-krtsanisi-tbilisi-georgia/) |
| **Gonio Yachts & Marina** | Eagle Hills | Gonio, Adjara (S of Batumi) | 41.563, 41.574 | 260 ha (some sources 200 ha); 30,000 residents; 1,265,962 m² GFA; 180-berth marina; 1 km lagoon; 2× 5-star hotels; ~800 branded serviced apts; 80 ha nature reserve; Spectrum Architecture + SOG + F&M; 600 m beach | Ask price (off-plan) | Announced/sales prep; handover ~2029 (TBA, phased) | [archdaily](https://www.archdaily.com/1036202/gonio-yachts-and-marina-masterplan-by-spectrum-architecture-to-transform-georgias-black-sea-coast) · [civil.ge](https://civil.ge/archives/711355) · [dxboffplan](https://dxboffplan.com/developers/uae/eagle-hills/) |
| **Ambassadori Island Batumi** | Ambassadori Group (+SHoP Architects NY, Arup, Yüksel Proje) | Black Sea off Batumi port — 2 peninsulas + 1 island | 41.645, 41.630 | 84 ha artificial island; ~$3B; 1st tower 58 fl / 1,350 apts; casino, marina, 49% parks | $115K; $2,700/m² (Mar 2025) → $3,100/m² (Apr 2026) | 26 ha commissioned Sep 2025; vertical construction started Sep/Dec 2025; 1st tower 2029, full 2035 | [georgiatoday](https://georgiatoday.ge/ambassadori-island-batumi-commissions-26-hectare-land/) · [share-architects](https://share-architects.com/armenia-and-georgia-2026-architecture-and-construction-projects-reshaping-yerevan-and-tbilisi/) · [rli.uk](https://www.rli.uk.com/new-vision-revealed-for-black-sea-scheme/) · [batumi-ambassadori-island.com](https://batumi-ambassadori-island.com/) |
| **Tbilisi Hills Golf & Residences** | Tbilisi Hills (incl. Mira Verde by Mira Developments) | Krtsanisi, SE Tbilisi | 41.668, 44.858 | Golf resort (Top-100 continental Europe course); apts, villas, plots; Mira Verde = Trussardi-branded residences | $173,400 (TH); $192,500 studios (Mira Verde) | Active sales; Mira Verde handover Q3 2029 | [tbilisihills.com](https://tbilisihills.com/estate/why-should-you-invest-in-tbilisi-hills-in-2025/) · [opr.ae](https://opr.ae/projects/tbilisi-hills-golf-residences-krtsanisi-tbilisi-georgia) · [mira-verde.com](https://mira-verde.com/property-for-sale-georgia/) |

Catalog coverage: Eagle Hills + both masterplans at `professionals.ts:1267`, `:4314`, `:4333`; Mira Verde `:1289`, `:4353`. **Ambassadori Island — NOT in catalog (gap).**

## 2. Regional active new-builds (2025–26)

| City | Project | Developer | Address | Price from | Completion | Source |
|---|---|---|---|---|---|---|
| Kutaisi | White Square Kutaisi | White Square (w2.ge) | Lado Asatiani St 96 | ~$790–800/m²; apts ~₾95K | u/c, 15 fl / 307 apts | [w2.ge](https://w2.ge/en/project/kutaisi) · [korter](https://korter.ge/en/panorama-gardens-kutaisi-kutaisi) |
| Kutaisi | Panorama Gardens Chavchavadze | — | Ilia Chavchavadze Ave 8 | ~₾2,434/m² | active | [korter](https://korter.ge/en/apartments-for-sale-kutaisi-cheap) |
| Kutaisi | Riverside Balakhvani | — | Gandja St 20 | ~₾2,299/m² | active | same ↑ |
| Kutaisi | Panorama Kutaisi | — | Tsereteli St 184 | ~$1,000/m² | active | [korter](https://korter.ge/en/panorama-kutaisi-kutaisi) |
| Kutaisi | (market) 15 complexes handing over 2026 | — | — | city floor $1,048–1,094/m² | 2026 | [korter](https://korter.ge/en/new-projects-kutaisi-ready-in-2026) |
| Rustavi | Rustaveli XVII | Rustaveli Group (Basisbank $6.3M) | Pantsulaia St | n/a; 245 apts, 11 fl, from 48.8 m² | 2026 | [bb.ge](https://bb.ge/en/business/news/2635-bazisbankis-partniorobit-rustavshi-mravalfunqtsiuri-satskhovrebeli-kompleqsi-rustaveli-xvii-shendeba) |
| Rustavi | Kura Rustavi | — | Lomouri St 10 | — | active | [korter](https://korter.ge/en/commercial-property-sale-rustavi) |
| Rustavi | Archi Rustavi | Archi | TBA | announced (2023 plan, status stale) | TBA | [goldenbrand](https://goldenbrand.ge/archi-to-build-new-residential-complexes-hotels-apart-hotels-in-georgia/) |
| Rustavi | (market) | — | — | city floor ~$903–906/m²; apts from $26,000 | — | [korter](https://korter.ge/en/new-projects-in-rustavi) |
| Gudauri | New Gudauri (Twins + Resort Residence) | Redco | New Gudauri, 2,200 m | 44 m² = $33,990 (~$773/m²); 2-rm from $76K; Twins ~$2,077/m² | Loft 1–2, Blocks 1–4, Atrium, Suites delivered; Twins u/c | [redco.ge](https://redco.ge/en/new-gudauri-by-redco-3/) · [korter](https://korter.ge/en/new-gudauri-resort-residence-gudauri) · [karas-group](https://karas-group.com/en/projects/new-gudauri-by-redco) |
| Gudauri | Blox Gudauri | BLOX | New Gudauri, near gondola | ~10% ROI product | Nov 2027 (in catalog `:2946`) | [bloxgudauri.com](https://bloxgudauri.com/) |
| Gudauri | (market) 4–6 complexes | — | — | floor ~$1,512/m²; apts from $42K | — | [korter](https://korter.ge/en/new-projects-in-gudauri) |
| Bakuriani | Bakuriani 4Rest | X2 Development | Koba Tsakadze St 32 | $800/m² (full)–$900 (30%) | active (catalog `:2226`) | [korter](https://korter.ge/en/4rest-bakuriani) |
| Bakuriani | Villa Kokhta Mitarbi | Gumbati Holding | Kokhtis Dziri | $1,200/m² | active (catalog `:2181`) | [korter](https://korter.ge/en/new-projects-in-bakuriani) |
| Bakuriani | Mziani Valley | Tower Group | Koba Tsakadze St 14 | from $50,240 | active (catalog `:1092`) | same ↑ |
| Bakuriani | Crystal Loft (C block) / Crystal Resort / Crystal Park Hotel | Crystal | Trialeti St 38–44 | price on request | active | [korter](https://korter.ge/en/crystal-resort-bakuriani) |
| Bakuriani | Bakuriani Prospect / Bakuriani Residence | — | Bakuriani | — | active | [korter](https://korter.ge/en/bakuriani-prospect-bakuriani) |
| Kobuleti | Kvirike Residence | — | Kobuleti | $34,100; $1,100–1,300/m² | active (4 houses) | [korter](https://korter.ge/en/kvirike-residence-kobuleti) |
| Kobuleti | Kobuleti Wellness Residence | — | New Boulevard, seafront | $23,432; Block A 60 apts (23.2–83.7 m²) + wellness Block B | commissioning 2025 | [eliteestate](https://eliteestate.ge/property/kobuleti-wellness-residence-a-seafront-property-with-a-wellness-center/) |
| Shekvetili | Shekvetili Forest Beach | — (via mbany) | next to Paragraph Hotel | 40,000 m², 5 phases, private beach | active | [mbany](https://www.mbany.com/en/projects/shekvetili-forest-beach) |
| Shekvetili | Shekvetili (Stage 5) | Sun Estate | Shekvetili | $2,400–2,500/m² turnkey | active | [sunestate](https://sunestate.ge/en/shekvetili-apartment-25-stage-5/) |
| Shekvetili | Alpha Home Shekvetili | Alpha Home | — | — | in catalog `:1320` | catalog |
| Telavi | TelaValley Residence | — | Telavi; 20,000 m² plot; ₾2M invested | — | started | [cbw.ge](https://cbw.ge/real-estate/2-million-invested-in-construction-of-residential-complex-in-telavi) |
| Telavi | Telavi Sun | Kakheti Telavi Sun | Telavi center | premium; 58 residences | active | [telavismze.com](https://telavismze.com/en) |
| Telavi | Telavi Residence | Telavi Estate | Telavi center | $32,000–92,000; 3 blocks / 6 fl | active | [telaviestate.com](https://telaviestate.com/en/projects/telavi-residence) |
| Telavi area | Alazani Valley Residence (townhouses) | — | Kisiskhevi Village | $359,976; $1,272/m² | active | [korter](https://korter.ge/en/new-projects-in-telavi) |

## 3. Could NOT verify (flags)

- **"Studio Apart / Aparta" Gudauri** — no such developer found; likely confusion with aparthotel *operators* (Gudauri Travel) or Apart Development (Tbilisi/Batumi only, [korter](https://korter.ge/en/apart-development)). Treat as unverified.
- **"Altergeo Gudauri"** — Altergeo (altergeo.ge, founded 2021) has no Gudauri project found; catalog only has Makhata Tower Tbilisi (`professionals.ts:656`, `:2786`).
- **"Kazbegi View"** — no development entity found in Stepantsminda; only rental cottages (Booking/ge-hotels). Unverified as a sellable project.
- **m² Kutaisi** — m² runs CSR with Kutaisi City Hall ([m2.ge](https://m2.ge/en/insights)); no confirmed m² residential complex in Kutaisi.
- Developer names missing for: Panorama Gardens, Riverside Balakhvani, Kvirike Residence, Kobuleti Wellness, TelaValley, Crystal Bakuriani — korter/aggregator pages didn't surface them.
- Eagle Hills exact parcel boundaries + first-phase completion dates: not published; phase sell-outs ≠ construction start confirmation.

## 4. Gaps vs catalog (add candidates)
Ambassadori Island Batumi · White Square Kutaisi · Rustaveli XVII (Rustavi) · Redco New Gudauri Twins · Crystal Loft/Resort Bakuriani · Kvirike Residence & Wellness Residence (Kobuleti) · Shekvetili Forest Beach · Telavi Sun / Telavi Residence / TelaValley. City price floors for SEO pages: Kutaisi $1,048/m², Rustavi $903, Gudauri $1,512, Bakuriani $1,327, Kobuleti $1,338, Shekvetili $1,568, Telavi $776 ([korter Kutaisi-2026](https://korter.ge/en/new-projects-kutaisi-ready-in-2026)).</subagent>
<subagent agent_id="agent-7" item="ROLE: დეველოპერი_Verifier. Web research: for the TOP ~50 Georgian developers (m2, Archi, Axis, Alliance, Orbi, Dirsi, Blox, Next Group, Metropol, Redix, White Square, ELT, Guru, Tekto, Apart Group, Anagi, Lisi Development, Horizon Group, Maqro, Domus, Monolith, Mardi, Ambassadori, Pontus, Citron, X2, Biograpi, King David, Gumbati, Milestone, Mziuri, Nexus, DS Group, Tower Group, Pala, Arcon, Tempo, Kolos, Ande, Reside, Livin, Redco, Eagle Hills Georgia, Silk Development, York Towers, GRG, Solana, One Development, Gulstream, Symbol, Like House, Stellar, Seven Group, Eco Lisi, Grande, Premium House): official website URL, HQ city, founding year, completed projects count, active projects count, phone. Flag any developer that is DEAD/inactive/bankrupt (should be removed). Compact table." state="started" outcome="failed">[provider.connection_error] Connection error.</subagent>
<subagent agent_id="agent-8" item="ROLE: SEO_კივორდები. Web research for SEO on Georgian new-build real estate: (1) Top 30 hot search keywords in Georgian (ბინები ახალ პროექტებში, ახალი კორპუსები თბილისში, etc), 20 in English (buy apartment Tbilisi new build etc), 20 in Russian (купить квартиру в новостройке Тбилиси etc) — grouped by intent (buy/invest/rent/price). (2) Top 20 'People Also Ask' questions buyers ask about new developments in Georgia (deposit, ipoteka, frame condition/კარკასი, white frame, ჩაბარება, სარგებელი ინვესტიცია) — in ka/en/ru. (3) What structured data (schema.org types) top competitors (korter.ge, ss.ge, myhome.ge) use on project pages. Compact tables." outcome="completed"># SEO_კივორდები — Keyword & Schema Brief (Georgian new-build market)

**Verification status:** competitor schema checked by direct HTML fetch (2026 turn). Keyword lists = derived from competitor SEO landing pages + market reports + standard query patterns. ⚠️ **No access to Google Keyword Planner/Ahrefs — search volumes are NOT verified; treat ranking as intent-prioritized, not volume-proven.**

---

## 1. Georgian keywords (ka) — Top 30 by intent

**BUY (transactional, highest value)** — korter.ge targets these exact stems via SEO landing pages ([korter.ge footer links, verified](https://korter.ge/)):

| # | Keyword | Notes |
|---|---|---|
| 1 | მშენებარე ბინები თბილისი | korter URL stem `mshenebare-binebi-tbilisi` (563 projects listed) |
| 2 | ბინები ახალ პროექტებში თბილისში | core head term |
| 3 | ახალი კორპუსები თბილისში | |
| 4 | ბინების ყიდვა გაყიდვა თბილისში | korter stem `binebis-yidva-gayidva-tbilisi` (30 494 ads) |
| 5 | მშენებარე ბინები ბათუმი | korter stem, 266 projects |
| 6 | ბინები თეთრი კარკასით თბილისში | korter has dedicated page `/mshenebare-binebi-tbilisi-tetri-karkasi` |
| 7 | ბინები შავი კარკასით | |
| 8 | ბინები მწვანე კარკასით | |
| 9 | საცხოვრებელი კომპლექსები თბილისი | korter category label |
| 10 | ბინა დეველოპერისგან / სამშენებლო კომპანიიდან | |
| 11 | ბინები ვაკეში ახალ პროექტში | district-modified (ვაკე, საბურთალო, დიდი დიღომი, ისანი, გლდანი) |
| 12 | ბინები საბურთალოზე ახალ კორპუსში | |
| 13 | მშენებარე ბინები გონიო / ჩაქვი / კობულეთი | coast cluster (korter stems exist) |
| 14 | მშენებარე ბინები ბაკურიანი / გუდაური | mountain cluster |
| 15 | კოტეჯები თბილისი | korter stem `kotejebi-tbilisi` |

**PRICE (commercial investigation)**

| # | Keyword |
|---|---|
| 16 | ბინების ფასები თბილისში 2025/2026 |
| 17 | კვადრატული მეტრის ფასი თბილისში |
| 18 | ახალი პროექტების ფასები |
| 19 | იაფი ბინები ახალ კორპუსში |
| 20 | ბინების ფასები ბათუმში |

**PAYMENT / FINANCING**

| # | Keyword |
|---|---|
| 21 | ბინა განვადებით თბილისში |
| 22 | შიდა განვადება ბინაზე |
| 23 | იპოთეკა ახალ პროექტზე / საბინაო იპოთეკა |
| 24 | ბინა პირველადი შენატანით |

**INVEST**

| # | Keyword |
|---|---|
| 25 | საინვესტიციო ბინები თბილისში / ბათუმში |
| 26 | უძრავი ქონება საქართველოში ინვესტიცია |
| 27 | ბინის შეძენა გასაქირავებლად |

**RENT**

| # | Keyword |
|---|---|
| 28 | ქირავდება ბინები ახალაშენებულ კორპუსში თბილისი |
| 29 | ბინები ქირით თბილისში (korter: 68 042 ads — biggest rent demand) |
| 30 | დღიურად ბინები ბათუმი / თბილისი |

---

## 2. English keywords (en) — Top 20

| Intent | Keywords |
|---|---|
| Buy | buy apartment Tbilisi · buy flat Tbilisi new build · new developments Tbilisi · new residential complexes Tbilisi · apartments for sale in new buildings Tbilisi · buy property in Georgia · off-plan apartments Tbilisi · buy apartment Batumi sea view |
| Invest | real estate investment Georgia · invest in Tbilisi property · rental yield Tbilisi · Batumi investment apartments · Georgia property for foreigners · buy-to-let Tbilisi |
| Price | Tbilisi apartment prices 2026 · price per square meter Tbilisi · cost of new build apartment Tbilisi |
| Process | white frame apartment Georgia · black frame vs white frame Tbilisi · installment plan apartment Tbilisi · can foreigners buy property in Georgia |

*Grounding: foreign buyers = 86% of foreign purchases in new projects; Israelis 11%, Russians active ([georgiatoday.ge](https://georgiatoday.ge/tbilisi-and-batumi-apartment-sales-surpass-4-3-billion-in-2025/), [internationalinvestment.biz](https://internationalinvestment.biz/en/real-estate/6047-georgias-real-estate-market-tbilisi-and-batumi-show-growth-in-2025.html)).*

## 3. Russian keywords (ru) — Top 20

| Intent | Keywords |
|---|---|
| Buy | купить квартиру в новостройке Тбилиси · новостройки Тбилиси от застройщика · купить квартиру в Тбилиси · жилые комплексы Тбилиси · апартаменты в Батуми у моря · купить квартиру в Батуми новостройка · недвижимость в Грузии купить · квартира в Тбилиси вторичка vs новостройка |
| Invest | инвестиции в недвижимость Грузии · квартира в Батуми для сдачи в аренду · доходность аренды Тбилиси |
| Price | цены на квартиры в Тбилиси 2026 · стоимость квадратного метра Тбилиси · цены на новостройки Батуми |
| Process | квартира в рассрочку Тбилиси · первоначальный взнос квартира Тбилиси · белый каркас что это Грузия · чёрный/белый/зелёный каркас отличия · ипотека в Грузии для нерезидентов · как купить квартиру в Тбилиси россиянину |

---

## 4. People-Also-Ask — Top 20 (ka / en / ru)

| # | KA | EN | RU |
|---|---|---|---|
| 1 | რა არის თეთრი კარკასი? | What is a white frame apartment? | Что такое белый каркас? |
| 2 | რა განსხვავებაა შავ, თეთრ და მწვანე კარკასს შორის? | Black vs white vs green frame — difference? | Отличия чёрного, белого и зелёного каркаса? |
| 3 | როდის ჩაიბარება პროექტი / ბინა? | When will the project be handed over? | Когда сдадут дом? |
| 4 | რა არის შიდა განვადება და როგორ მუშაობს? | How do developer installment plans work? | Как работает внутренняя рассрочка от застройщика? |
| 5 | რამდენია პირველადი შენატანი? | How much is the down payment? | Сколько составляет первый взнос? |
| 6 | შეიძლება თუ არა იპოთეკით ყიდვა მშენებარე ბინაში? | Can you mortgage an under-construction flat? | Можно ли купить новостройку в ипотеку? |
| 7 | რა საპროცენტო განაკვეთია იპოთეკაზე? | What are mortgage rates in Georgia? | Какая ставка по ипотеке в Грузии? |
| 8 | არის თუ არა ახალ პროექტში ყიდვა კარგი ინვესტიცია? | Is buying in a new development a good investment? | Выгодно ли вкладываться в новостройки Тбилиси? |
| 9 | რამდენია გაქირავების შემოსავალი / ROI? | What rental yield can I expect? | Какая доходность от аренды? |
| 10 | შეუძლია თუ არა უცხოელს ბინის ყიდვა საქართველოში? | Can foreigners buy property in Georgia? | Могут ли иностранцы покупать квартиры в Грузии? |
| 11 | როგორ შევამოწმო დეველოპერის სანდოობა? | How to check a developer's reliability? | Как проверить застройщика? |
| 12 | რა დოკუმენტები სჭირდება ბინის შესაძენად? | What documents are needed to buy? | Какие документы нужны для покупки? |
| 13 | როგორ ხდება ბინის რეგისტრაცია საჯარო რეესტრში? | How is ownership registered? | Как регистрируется право собственности? |
| 14 | რა გადასახადები არის ბინის ყიდვისას? | What taxes when buying an apartment? | Какие налоги при покупке квартиры? |
| 15 | რომელი უბანია საუკეთესო საცხოვრებლად თბილისში? | Best districts to live in Tbilisi? | Какой район Тбилиси лучше для жизни? |
| 16 | რომელი უბანია საუკეთესო ინვესტიციისთვის? | Best districts for investment? | Какие районы лучше для инвестиций? |
| 17 | რატომ იზრდება ბინების ფასები თბილისში? | Why are Tbilisi prices rising? | Почему растут цены на квартиры в Тбилиси? |
| 18 | უნდა ვიყიდო მშენებარე თუ დასრულებული ბინა? | Off-plan vs completed — which to buy? | Что лучше: строящийся или готовый дом? |
| 19 | რა არის აპარტ-სასტუმრო და ღირს თუ არა მისი ყიდვა? | Are aparthotels worth buying? | Стоит ли покупать апарт-отель? |
| 20 | როგორ მოვძებნო ოფიციალური რენდერები/გეგმარებები პროექტის? | Where to find official renders and floor plans? | Где найти рендеры и планировки ЖК? |

*Grounding: korter.ge publishes explainer pages for white/green/black frame ([korter.ge/mshenebare-binebi-tbilisi-tetri-karkasi](https://korter.ge/mshenebare-binebi-tbilisi-tetri-karkasi), [um.ge](https://um.ge/news/tetri-karkasi-vs-shavi-karkasi), [ss.ge blog](https://ss.ge/ru/blog/details/93)) — proof these questions drive traffic.*

---

## 5. Structured data on competitor project pages (verified this turn)

| Site | JSON-LD | Microdata | OG tags | Evidence |
|---|---|---|---|---|
| korter.ge (home + project page) | **0 blocks** | **none** | og:title/desc/image/url/locale | `grep -c 'schema.org'` = 0 on raw HTML of `/` and `/aleksandre-ioselianis-kucha-38-tbilisi` |
| home.ss.ge (landing + listing) | **0 blocks** | **none** | og:title/desc/image/type/url | `grep -c` = 0 on raw HTML |
| myhome.ge | ⚠️ **UNVERIFIED** — Cloudflare challenge blocks curl; needs headless browser | — | — | CF "Just a moment..." page |

**⚠️ Caveat:** korter/ss may inject schema client-side via JS; only server-rendered HTML was checked. Confirm with browser render before final claim.

**Opportunity (big):** ship what they lack — `ApartmentComplex` + `Residence` + `Offer` (price, priceCurrency), `GeoCoordinates`, `BreadcrumbList`, `FAQPage` (PAA above = ready-made FAQ content), `RealEstateListing`, `ImageObject` for official renders, `Organization` for developer pages.

## Flags
- Keyword volumes: **unverified** (no Keyword Planner access). Relative priority inferred from korter.ge's SEO URL architecture + category ad counts.
- RU keyword set: derived from market pattern (Russian buyers active, [centrarium.com](https://centrarium.com/en/blog/rynok-zhiloj-nedvizhimosti-tbilisi-v-2025-godu-336.html)), not from RU SERP scraping.
- myhome.ge schema: unverified (Cloudflare).</subagent>
</agent_swarm_result>