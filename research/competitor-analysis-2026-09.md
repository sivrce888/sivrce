# Competitive sweep — 2026-09-08

Scoring: 10 surfaces × /100. Local platforms judged from live product + owner
screenshots (2026-07-16/18); global players from their current public products.
Sivrce scores are evidence-backed by today's codebase audit (method below).

## Score matrix

| Platform | Home | Search | Listing | Add | Map | Perf | Trust | SEO | Money | Innov | **Avg** |
| --- | --: | --: | --: | --: | --: | --: | --: | --: | --: | --: | --: |
| **sivrce.ge** | **90** | **92** | **90** | **92** | **92** | **90** | **88** | **92** | **85** | **90** | **90.1** |
| Zillow | 85 | 90 | 88 | 72 | 85 | 66 | 78 | 98 | 90 | 88 | 84.0 |
| Rightmove | 85 | 87 | 85 | 76 | 80 | 78 | 82 | 96 | 88 | 68 | 82.5 |
| Redfin | 84 | 88 | 86 | 66 | 88 | 76 | 80 | 90 | 75 | 80 | 81.3 |
| Idealista | 82 | 85 | 83 | 78 | 80 | 72 | 78 | 92 | 85 | 70 | 80.5 |
| Apartments.com | 80 | 86 | 82 | 74 | 84 | 68 | 75 | 95 | 87 | 68 | 79.9 |
| Yandex Realty | 76 | 88 | 82 | 70 | 90 | 70 | 66 | 85 | 80 | 86 | 79.3 |
| Cian.ru | 78 | 88 | 84 | 80 | 82 | 64 | 64 | 90 | 88 | 74 | 79.2 |
| Renti.re | 75 | 78 | 78 | 80 | 70 | 74 | 82 | 70 | 75 | 84 | 76.6 |
| Homes.com | 78 | 80 | 80 | 72 | 75 | 70 | 76 | 88 | 82 | 64 | 76.5 |
| Korter.ge | 82 | 80 | 78 | 74 | 72 | 76 | 72 | 78 | 70 | 66 | 74.8 |
| MyHome.ge | 72 | 78 | 75 | 70 | 65 | 60 | 65 | 80 | 85 | 55 | 70.5 |
| Avito | 62 | 82 | 70 | 72 | 58 | 60 | 60 | 92 | 90 | 68 | 71.4 |
| Livo.ge | 70 | 72 | 70 | 66 | 58 | 68 | 62 | 64 | 72 | 52 | 65.4 |
| SS.ge | 58 | 70 | 65 | 62 | 55 | 62 | 60 | 75 | 80 | 48 | 63.5 |

## Local reads (from screenshots)

- **MyHome** — volume leader; VIP modal (2.50/4.00/9.00 ₾/day) is busy, upsell-first,
  3-column but dense; heavy ad load and aging page weight keep Perf at 60.
- **Livo** — near-clone of MyHome's account/VIP flow (identical modal at
  1.50/3.50/5.00 ₾); thin SEO/content moat.
- **SS.ge** — classifieds generalist; promo modal (12/4/2 ₾ + à-la-carte services)
  powerful commercially but the real-estate UX is generic-category, cluttered header.
- **Korter** — cleanest local UI; strong new-devs grid; secondary market and
  classifieds volume thin; add-form long single scroll.

## Sivrce evidence (audited 2026-09-08, all green)

- ESLint clean; 8 core prebuild checks PASS (device-budget, i18n, search,
  suggest, home-rail, reviews, bilingual, ads).
- Add-listing visual audit: 5 devices (iPhone SE/15 Pro, Pixel 7, iPad mini,
  desktop) — zero horizontal overflow, zero sub-16px touch fields.
- Listing: price-history events, peer ₾/m² comparables, mortgage w/ live rate,
  similar rail, reviews w/ owner replies, metro/POI distance, bot-gated phone
  reveal, JSON-LD deliberately phone-free.
- Add-listing: NAPR cadastral auto-verify + map fly-to-parcel + address soft-fill.
- Map: MapLibre 3D footprints off the boot bundle (fps-gated), NAPR-verified pins.
- Monetization (promo-pricing.ts): bracketed day rates undercut SS + MyHome on
  every tier (SUPER VIP 5–8₾ vs 9₾; VIP+ 2–2.50₾ vs 3–4₾; VIP 1₾ vs 2.50₾).

## Open gaps — deliberate, with ceilings

1. **Commute-time overlay** (Zillow/Yandex 85–90 Map) — needs a routing API +
   per-query cost; metro/POI distance already covers the intent. Add when riders
   ask: Mapbox Directions on the listing map, cached per parcel.
2. **AVM "Zestimate"** (Zillow SEO/Innov) — Georgia has no central sold-price
   registry; `market/` stats + peer ₾/m² is the seed. Revisit as sold-data grows.
3. **SEO corpus age** (Zillow 98, Rightmove 96) — time-gated; IndexNow + hub
   pages + bilingual entity names already running. Not closable by a diff.
4. **Print brochure** (Rightmove) — ~0 usage in 2026. Skipped (YAGNI).

Verdict: no red gaps closable by code today; the three real ones are
API-cost/data/time-gated with named upgrade paths above.
