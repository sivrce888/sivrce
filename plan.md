# Sivrce → 100/100 · n1 Georgia → global

## Shipped 2026-07-20 (2) — catalog listings into search (score 10 inventory)
Auto-picked after stock-render scrape failed (22/22 korter/official 404).

- **`scripts/seed-project-listings.ts`**: one searchable listing per CDN project
  with developer phone — title says "ახალი აშენება …/მ²-დან", `extendedFields.projectCatalog`,
  card badge **პროექტი**, link → `/projects/[slug]`. Indicative 50 m² × $/m².
- Result: **41 → 194** active listings (153 catalog). Skipped 61 (no developer phone).
- Card/DB mapping: `projectCatalog` / `projectSlug` on Listing + ListingCard.
- VAPID keys written to local `.env.local` (not committed). `npm run vapid:gen`
  for re-roll. **Still must paste into Vercel** (CLI unauthorized this session).
- npm: `directory:seed-listings`, `vapid:gen`.

Skipped: fake unit floorplans, competitor scrape, Meili/Twilio/bank keys (no creds).

## Shipped 2026-07-20 — directory CDN + DB catalog sync (best next step: 10/10)
Auto-picked over more features: inventory surface quality beats feature debt.

- **Seed**: re-ran `scripts/seed.ts` → **282** `project_directories` (was 149
  stock placeholders), 118 developers, map buildings synced from static catalog.
- **R2 mirror**: `localize-directory` now uploads **local** `/images/projects/*`
  heroes (skips stock `npN`/`pN`). `npm run directory:mirror` → **260** heroes
  + 3 map pins live on `cdn.sivrce.ge` (HTTP 200 smoke). 22 projects remain
  stock until official renders exist.
- Self-check: `npx tsx scripts/localize-directory.ts --check`.

### Scored next steps (auto-order — do top first)

| Score | Step | Owner |
| ---: | --- | --- |
| **10** | Agency/developer onboarding → real listing supply (41 → thousands) | Human BD |
| **9** | Prod env: Meili, VAPID, Gemini, Twilio WA, TBC+BOG, Sentry, PostHog | Human ops |
| **9** | Google Search Console verify + sitemap | Human (Google) |
| **8** | Payments 1₾ smoke after merchant onboarding | Human + banks |
| **6** | Cadastral pin audit (approx coords) | Human research |
| **5** | Gallery beyond hero / remaining 22 stock renders | Code when sources exist |
| **3** | Floor stacks re-enable, Stories, App Store | Later |

Skipped this wave: competitor scrape (retired), fake listings, new features.

## Shipped 2026-07-19 — full-site audit wave (70-shot sweep + console/error capture)
- **Global hydration mismatch (every page)**: Navbar `motion.header` entrance
  animated via framer-motion `initial` → SSR/client style diff → full-tree
  re-render everywhere. Replaced with paint-driven CSS `sv-nav-in` keyframe
  (same pattern as `sv-hero-in`), registered in reduced-motion kill-list.
- **/map buildings dots layer broken**: `circle-radius` nested zoom-interpolate
  inside `case` (MapLibre forbids) → whole layer failed validation. Split:
  base layer keeps top-level zoom interpolate; new `sivrce-buildings-dot-active`
  overlay paints hover/selected via paint-only feature-state (filters can't use
  feature-state in MapLibre) with radius 0 for inactive. Hide-on-explode filter
  mirrors base.
- **Duplicate React keys**: `/developers` rendered two `vr-holding` entries
  (Tbilisi + thin Shekvetili duplicate) → merged into the Tbilisi canonical
  entry; both projects (Krtsanisi, Shekvetili Forest-Beach) link to it.
- **Horizontal overflows**: /privacy mobile (+101px) — h1 "კონფიდენციალურობის"
  at 36px/30px overflowed 342px column in real Georgian font → `text-[27px]`
  mobile. /sale/[...seo] + /tbilisi street pages desktop (+18px) —
  `ListingCard` default `layout='grid'` is fixed 380px rail width; fluid grids
  now pass `layout='wide'` (2 call sites).
- **Lint 14→0**: react-hooks v6 fixes — refs written during render moved into
  effects (MapEmbed, Map3D), SSR-safe mount-hydration effects documented with
  targeted rule disables (AddListing draft/localStorage, HeroSearch recent,
  weather sessionStorage, SearchMapView ref-cleanup capture), aria-selected on
  listbox options, unused imports/directives dropped.
- **check:map gate-aware**: floor-stack asserts compare against FLOOR_STACKS_ON
  (feature paused behind NEXT_PUBLIC_FLOOR_STACKS=1).
- Audit tooling: `scripts/audit-shots.mjs` (35 routes × m/d/t viewport shots +
  console/network/overflow report → `shots/audit-*/report.txt`). Note: fullPage
  shots blank scroll-reveal sections — verify those with scrolled viewport shots.
- Gate after batch: lint 0 · tsc 0 · 10/10 checks PASS · build ✓ 1274 pages.
- Known benign: basemap "Expected number, found null" (OSM height tags),
  dev-only ERR_CONNECTION_REFUSED (local services), 192.168 CSP noise (dev LAN).

## Shipped 2026-07-18 (evening wave) — the "make all n1" batch
- **Route-based i18n** (`74e8375`+): `[lang]` segment, ka unprefixed canonical
  (zero link-juice loss), /en /ru prefixed, hreflang everywhere, localized
  sitemap, middleware negotiation, LocalizedLink. Build: 1221 static pages ✓
- **/search**: live DB location facets, `?page=N` URL pagination, daily-rent
  check-in/out dates (overlap-excluded), pets + owner/agency filters
  (migration `20260718160000_listing_pets_seller` — RUN IN PROD), list/map
  toggle `?view=map` with price pins (`7d714bb`)
- **Tours**: real availability picker, 409 double-book guard, guest cancel
- **Push**: end-to-end web-push (VAPID, subscribe UI, SW handlers, admin
  broadcast endpoint) — set VAPID vars in Vercel
- **Saved-search alerts**: match engine reusing `buildDbWhere`, in-app +
  email + push fan-out, dedupe via AlertLog (`ff716bc`)
- **Payments**: TBC tpay + BOG iPay real providers, verified callbacks,
  atomic exactly-once entitlement, /payment/success|failed pages (`9767b5d`)
  — needs merchant onboarding + env vars, then 1₾ smoke test
- **Images**: AVIF/WebP confirmed live; LQIP blur on search thumbs;
  `scripts/backfill-lqip.ts` for pre-pipeline media
- **Perf**: FCP −450ms (font preload); mobile LCP proven a localhost Lantern
  artifact — observed LCP 168ms. Re-measure on Vercel, not localhost.

## Shipped 2026-07-18 (6) — Neon → Supabase Postgres
- Cut over `DATABASE_URL` / `DIRECT_URL` to Supabase project `SIVRCE`
  (`azaijzufkrdsdreszwma`, eu-central-1). Prisma schema unchanged.
- Enabled `postgis` + `vector`; `prisma migrate deploy` applied all 10 migrations.
- Neon free-tier transfer quota had killed prod reads — retired. Data must be
  re-imported (Neon dump blocked by quota); static fallbacks cover until then.
- **Vercel env still needs the new URLs** (CLI is on wrong account) — set
  `DATABASE_URL` (pooler `:6543`) + `DIRECT_URL` (session `:5432`) in the
  sivrce team project, then redeploy.

## Shipped 2026-07-18 (5) — link integrity + hydration fix + ⚠ Neon quota (resolved → Supabase)
- **Broken slugs (4)**: korter import never slugified — `panorama gori-gori`
  (space), `…-51а-…` (Cyrillic), `сapro-1` (Cyrillic), `/process-group-2025-llc`
  (leading slash) all 404'd. Fixed at the boundary (`slugFromLink` now slugifies
  in `sync-korter.ts`) + 4 rows renamed + 2 `map_buildings` refs updated.
- **All DB-only developer pages 404 in prod**: `developers/[slug]`
  generateStaticParams omitted `lang` — Next treated the route as fully
  enumerated, on-demand SSR never ran. One-line fix (`lang: 'ka'`, same pattern
  as projects/agents).
- **Price hydration mismatch on every card**: `Intl.NumberFormat('ka')` groups
  with space in Node but comma in some browsers → server `$285 000` vs client
  `$285,000`, full tree re-render. `formatMoney` now groups manually (group3) —
  deterministic everywhere.
- Tree hygiene: duplicate mid-file import in `buildings.check.ts`, `any` ×2 in
  `sync-korter.ts` (typed `KorterState`).
- ⚠ **Neon data-transfer quota EXCEEDED** — resolved by switching to Supabase
  (see Shipped 2026-07-18 (6)).

## Shipped 2026-07-18 (4) — perf: one weather call on boot + tree unblocked
- `src/lib/weather.tsx`: in-flight promise dedupe per city — N weather widgets
  on cold boot share ONE Open-Meteo request (was 5 concurrent, ~950ms each).
  Mobile probe after: FCP 208ms · LCP 240ms · 0 longtasks (item 7's FCP
  regression confirmed dead — fonts were already optional/no-preload).
- Unblocked red tree: `?? undefined` at the Meilisearch doc boundary (asStr
  null vs exactOptionalPropertyTypes) + `Prisma.BuildingFloorUpdateManyArgs['data']`
  (WIP used a non-existent type). tsc 0 · lint 0 · build ✓.

## Shipped 2026-07-18 (3) — /search filter parity with myhome.ge/ss.ge
- Dead data made live: condition (6), building status (3), 14 feature chips
  (balcony/elevator/parking/heating/…) now filter end-to-end URL → API →
  Meili + Prisma fallback. Shared vocabulary extracted to `src/lib/features.ts`.
- New params: beds, baths, fmin/fmax, cond, bstat, feat, photo=1, verified=1,
  cur=USD|GEL price toggle, deal=pledge (was whitelisted out), sort m2asc/m2desc.
- UI: "მეტი ფილტრი" panel + mobile "ფილტრი (N)" bottom sheet (Escape/backdrop
  close, scroll lock, clear + show-N-results). Active chips + reset cover all.
- 16 i18n keys × 9 dicts. tsc 0 · lint 0 · build ✓.
- NOTE: Meili filterableAttributes changed → press admin sync-search button on
  deploy (until then DB fallback serves all new filters).

## Shipped 2026-07-18 (2) — 3D stacks on /projects/[slug]
- Every project page gets the "კორპუსი 3D-ში" section: ghost floor stack whose
  height tracks construction progress (`heightM × done%`), hover tooltip with
  progress %, catalogued projects show real per-floor availability instead.
  `BuildingFloorsMap` selection props now optional (view-only mode). Still SSG.

## Shipped 2026-07-18 — floor explorer on /buildings/[slug]
- Building pages (still 100% SSG) now ship the floor explorer: focused 3D
  stack (shared `src/lib/map/floorLayers.ts` — one implementation for /map and
  building pages), floor strip with live availability, click floor →
  server-rendered grid filters via one scoped CSS rule (no-JS = everything
  visible). Data computed at build time; island imports no listing dataset.

## Shipped 2026-07-17 late (6325511, on main) — 3D floor stacks
- `/map`: click a building → it explodes into per-floor 3D slabs (real OSM
  footprint, 0.35 m gaps, stack top = building height). Hover a floor →
  brand-dark tooltip: სართული N · X თავისუფალია · ₾-დან (price only when a
  single deal type is filtered). Click a floor → panel filters to that floor
  (dismissible chip). Construction ghosts explode too (progress tooltip, no
  fake availability). Engine: `src/lib/map/floors.ts`, gated in
  `npm run check:map`. Zero new deps — MapLibre fill-extrusion + feature-state.

## Shipped 2026-07-17 (commit 45e9079, pushed to main, Vercel auto-deploys)
- Security: `jsonLd()` `</script>`-escape at all 5 JSON-LD sites, COOP header,
  AUTH_SECRET prod assert, pinned session policy.
- SEO: og:image + Twitter cards on all programmatic `[...seo]` pages, listing OG
  url/siteName/locale + full JSON-LD (beds/baths/floor/seller/priceValidUntil),
  `/search` noindex, honest sitemap lastModified, robots `/api/` disallow,
  keyword-first homepage title, manifest id/categories/shortcuts.
- Perf: hero LCP no longer gated on JS hydration, `next/image` everywhere
  (sizes + priority), immutable cache headers, hero animations paused offscreen.
- A11y: contrast floors, 44px tap targets, focus rings, Escape mobile menu,
  reduced-motion kill-switch.
- Market: +995 phone validation in wizard, daily rental (დღიურად) real end-to-end,
  Google sign-in wired, minimal service worker (PWA).

## Next iteration (scored, best-first) — refreshed 2026-07-17 evening
Done since first pass: listings API + auth gate, 3D map (maplibre), inquiries
end-to-end, global ₾/$ provider, noindex on all 29 private/utility pages,
AI search (Gemini adapter + AISection), building reviews, segmented currency
switcher, room-count SEO pages (`/sale/apartments-2/tbilisi` — the "2-ოთახიანი
ბინა" query family ss.ge/myhome rank with) + 4 self-throttled districts
(ძველი თბილისი, ვარკეთილი, ჩუღურეთი, ნაძალადევი), singular-Georgian FAQ copy.

1. **10 — Route-based i18n** (`app/[lang]/…` server-rendered ka/en/ru + hreflang).
   The only structural SEO gap vs myhome/ss/korter; every other technical SEO
   item is done. Own session: moves ~150 routes, rewrites every Link, translates
   1,486 programmatic pages. Gets costlier the longer we wait.
2. ~~**9 — Static → DB on read paths**~~ **DONE 2026-07-17** (b9f7baf): homepage
   featured rail + sitemap read `getAllListings()` with static fallback;
   /, /en, /ru, sitemap.xml revalidate hourly.
3. **8 — Search Console**: verify property, submit sitemap, watch queries.
   Owner's Google account needed — 10 minutes, no code.
4. **7 — Mobile LCP**: hero fix `b706883` live ✓ (h1 paints with FCP now).
   Re-audit 2026-07-18: score 63-66 — **FCP regressed 1.6→3.6s** in the
   8f30397…26b5db1 batch (2 blocking CSS chunks, 4 fonts = 98KB woff2,
   root doc 730ms, weather/FX API calls on boot). h1 LCP also waits on the
   41KB Georgian webfont → candidates: `font-display: optional` on the
   display font, trim boot-time fetches, slim globals.css. Files owned by
   the active parallel wave — coordinate before editing layout.tsx/globals.css.
5. **6 — WhatsApp/email listing alerts** (Korter's only moat), saved-search →
   API, price-history block, compare tray, nonce-based CSP.

## Verify gate (every batch)
`npm run lint` 0 problems · `npm run build` exit 0 · push to main = production.


---

# Reviews + Conversion/Retention/Engagement swarm (2026-07-17, second wave)

Goal: every entity has reviews (listings, projects, developers, agents,
neighborhoods, accounts) + full conversion/retention/engagement stack.

Contracts (fixed signatures, created by orchestrator):
- `@/components/reviews/ReviewsSection` — `{ targetType, targetId, className? }`
- `@/components/lead/LeadForm` — `{ targetType, targetId, recipientName?, className? }`
- `@/lib/reviews/aggregate.getReviewAggregate(targetType, targetId)` → `{average,count} | null`
- API: `GET/POST /api/reviews`, `POST /api/reviews/[id]/helpful`,
  `GET /api/reviews?mine=1` (session), `POST /api/inquiries`

Workers (disjoint file ownership, parallel):
- A Reviews_Backend: prisma schema + migration, `src/lib/reviews/**`, `src/app/api/reviews/**`
- B Reviews_UI: `src/components/reviews/**` (implements contract)
- C Listing_Conversion: `src/app/listing/**`, `src/components/listing/**`
- D Lead_Backend: `src/app/api/inquiries/**`, `src/lib/inquiries/**`, `src/components/lead/**`
- E Entity_Pages: `src/app/{developers,agents,projects}/**`, `src/components/entities/**`, `src/data/professionals.ts`
- F Neighborhood_Pages: `src/app/neighborhoods/**`, `src/components/neighborhoods/**`, `src/data/neighborhoods.ts`
- G Retention_Engagement: `src/app/{search,favorites,account}/**`, `src/components/{search,favorites,account}/**`, `src/lib/saved-searches.ts`

Hard rules for all: no edits to `src/lib/i18n/*` (co-locate per-feature dicts,
ka/en/ru minimum), no edits to `globals.css`, no new npm deps, zod at trust
boundaries, ponytail minimal diffs, reuse `lib/utils`, `lib/db`, category-brand
tokens, existing favorites/recent patterns. Gate: `npm run typecheck && npm run lint`.

Wave 2 (orchestrator): navbar/homepage/sitemap wiring + `npm run build`.

---

# Wave 3 — Admin Console (2026-07-17, swarm)

Goal: 100/100 internal admin panel over the full Prisma schema — gated by
`role=admin`, audited, server-component-first, zero new deps.

Foundation (orchestrator, DONE): `src/lib/admin/{guard,audit,format,query,validate}.ts`,
`src/components/admin/ui/*` (PageHeader, StatCard, StatusPill, DataTable,
Pagination, SearchForm, FilterSelect, ConfirmButton, EmptyState, TabLinks),
`src/app/admin/layout.tsx` + `shell/AdminNav.tsx` (route map locked),
`src/types/next-auth.d.ts`, robots `/admin` disallow.

Workers (disjoint file ownership, parallel):
- D Dashboard: `src/app/admin/page.tsx`, `src/lib/admin/metrics.ts`, `src/components/admin/dashboard/**`
- L Listings_Ops: `src/app/admin/listings/**`, `src/components/admin/listings/**`, `src/lib/admin/listings.ts`
- U Users_Pro_Tours: `src/app/admin/{users,professionals,tours}/**`, matching components + lib
- M Trust_Safety: `src/app/admin/moderation/**`, matching components + lib
- C CRM_Inquiries: `src/app/admin/{crm,inquiries}/**`, matching components + lib
- Y Money: `src/app/admin/{auctions,payments}/**`, matching components + lib
- P Content_System: `src/app/admin/{content,system}/**`, matching components + lib
- R Repair: pre-existing tsc breakage in neighborhoods/projects/reviews

Hard rules: every mutation = server action → `requireAdminAction()` → validate
via `@/lib/admin/validate` → db → `logAdminAction()` → `revalidatePath`.
No new deps, no edits to foundation files/schema/globals.css/auth.ts.
All reads exclude soft-deleted rows (`deletedAt: null`) unless showing trash.
Gate per worker: `npx tsc --noEmit` clean on owned files + `npx eslint` on owned dirs.
Wave 2 (orchestrator): full `npm run lint` + `npm run build` + visual pass.

სართულები_MapThumbs_Engineer (2026-07): floor stacks paused behind `FLOOR_STACKS_ON` (`NEXT_PUBLIC_FLOOR_STACKS=1` re-enables) — gated in `src/lib/map/floors.ts` + buildings/projects [slug] pages.
Construction map clusters now pass `img: p.img` in `projectsToConstructionBuildings` so BuildingPanel shows the 56px project render instead of the HardHat fallback.
`MapBuildingCluster.img?` already existed — no type change; `npm run typecheck` clean.

## 2026-07-19 — Directory 100/100 (developers + projects + renders + SEO)
- Catalog: 88→104 developers, 153→245 projects (new: projects-new-{tbilisi,batumi,regions}.ts, research-driven 2025-26 data, verified addresses/coords; DEV_PREFIX +3 single-token devs).
- Renders: scripts/mirror-project-renders.ts mirrored 75/92 hero renders to public/images/projects/ (26 official, 49 korter fallback); 17 unfound reverted to stock art. Manifest: research/renders-manifest-2026-07.json.
- Map: construction clusters now carry img → BuildingPanel shows render thumb; floor stacks OFF (FLOOR_STACKS_ON, re-enable NEXT_PUBLIC_FLOOR_STACKS=1).
- SEO: visible FAQ ka/en/ru on all 4 directory pages (+JSON-LD sync), hub prose+FAQ, en/ru localized metadata/H1, og:locale per lang, ImageObject gallery LD. New: src/lib/directory-seo.ts, src/components/seo/FaqSection.tsx.
- Gates: tsc ✓ check:map ✓ check:media ✓ check:seo-hub ✓ check:seo-title ✓ build ✓.
- Done 2026-07-20: R2 heroes on cdn (260/282). Remaining: 22 stock renders +
  cadastral pin audit + gallery scrape when sources land.
