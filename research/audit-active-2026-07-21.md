# Active projects audit — 2026-07-21

Scope: catalog vs official sites / FB / korter (secondary). Not a claim of 100/100 on all 247 UC rows — see gaps.

## Verified this pass

| Slug / entity | Finding | Action |
|---|---|---|
| `dirsi` / `dirsi-riverside` | **Completed.** Korter: 15 houses delivered, no developer stock. FB [dirsi.ge](https://www.facebook.com/dirsi.ge). AS Georgia page suspended; dirsi.ge often down. Avci “Phase 3” = **Unbuilt**. | `done:100`, flats≈5228, building `ready`. Removed phantom `dirsi-riverside-2` UC listing. Hero from project photo (korter CDN; official site down). |
| `blox-varketili` | Sold out / delivered Q3 2025 (blox.ge + korter) | Already `done:100` in catalog — OK |
| `anagi-m3-saburtalo` | m² project (Anagi = contractor) | Already `developerSlug: m2-development` — OK |
| `as-group-park-boulevard` | finish already გადაცემულია but done=90 | → `done:100` |
| `axis-palace` | finish already გადაცემულია but done=95 | → `done:100` |

## Renders pass 2026-07-21

Pass 1–3 (2026-07-21): korter/official remirrors + path fixes. Also: Solana Beach, Gumbati Villa Kokhta (gumbatiholding.ge), Mindeli (w2.ge).

### Cluster A/B remirror + pins (2026-07-21 evening)

**Renders fixed (11):** `anagi-m3-saburtalo`, `forms-tsatskhvebi-3-14`, `build-group-ketevan-74`, `tower-gelovani`, `nexus-residence-vakhtang`, `symbol-residences` (= Monogram), `livin-dadiani-263`, `gbg-andronikashvili`, `royal-didube-tower`, `metropol-lisi`, `metropol-shindisi`.

### Still shared placeholder (resolved 2026-07-21 night)

| Slug | Resolution |
|---|---|
| `horizon-premium-hotel` | Remirrored from korter Horizons Deluxe (Khimshiashvili) |
| `reside-riverside` | Real project (reside.ge Riverside New Boulevard); official site 403 — catalog uses stock until hand-in via `/admin/map` Renders |
| `downtown-residence` | Soft-retired → `np1` (no m2 project by this name) |
| `gulfstream-seaview` | Soft-retired → `np1` (broker, not developer hero) |
| `royal-bohema-residence` | Soft-retired → `np1` (no verified page) |

Manifest: **283/283 ok** (intentional Axis same-building shares only).

**Hand-in:** `reside-riverside` (+ any new) via admin Map → Renders upload.

**Pin / address fixes:**

| Slug | Was | Now (source) |
|---|---|---|
| `tower-gelovani` | 41.7225, 44.754 | **41.75779, 44.76668** (korter Sarajishvili 5a) |
| `gbg-andronikashvili` | Isani / 41.693, 44.853 | **Digomi, Luarsab Andronikashvili 1 · 41.77321, 44.76587** |
| `forms-tsatskhvebi-3-14` | 41.7312, 44.7528 | **41.73901, 44.74967** |
| `build-group-ketevan-74` | 41.6825, 44.8268 | **41.68759, 44.83102** |
| `anagi-m3-saburtalo` | 41.7505, 44.7709 | **41.75180, 44.77056** |
| `royal-didube-tower` | vague metro | **Tsereteli 35/37 · 41.72785, 44.78850** (OSM) |
| `nexus` / `livin` / `symbol` | OK | korter matches |

**Notes / hand drop:**

- `downtown-residence` — **no m2 project by this name** (m2 portfolio has Highlight / m³ / Mtatsminda…). Do not use Next “Tbilisi Downtown”.
- `gulfstream-seaview` — Gulfstream is a **broker**, not a developer project with a public hero.
- `royal-bohema-residence` — no korter/official page found matching the 10+12-floor brief.
- `reside-riverside` — not on Reside’s korter list (Breeze / Dream Side / DEST…). Angisa 95 OSM pin OK if project is real.

OK same-building shares: Axis Towers / Towers Vake; Ambassadori island variants.

**Hand-in:** `slug` + official URL/file → `app/public/images/projects/<slug>.webp`

Logs: `renders-remirror-2026-07-21.log`, `pass2`, `pass3`, `renders-cluster-ab-2026-07-21.log`.

## Status pass 2026-07-21 (20 slugs)

### → done:100 (verified)

| Slug | Evidence |
|---|---|
| `guru-status` | guruholding.ge Completed; korter Q4 2025 delivered |
| `gumbati-vake-residence` | korter Completed 2025; gumbatiholding fulfilling 12.2025 |
| `gumbati-villa-kokhta-mitarbi` | korter Completed 2024 |
| `orbi-residence` | korter delivered 2015 (was wrongly UC) |
| `blox-beliashvili` | korter Blocks A/B/C @72 delivered 2024; no developer stock |
| `white-square-shartava` | w2.ge “Construction is complete”; korter Completed 2025 |
| `archi-nutsubidze` | archi.ge Completed; address fixed → Avto Varazi 28a |
| `axis-chavchavadze-49` | korter 4 houses delivered; no developer stock |
| `ocean-vake-residences` | korter delivered 2018 |
| `anagi-police-city` | anagi.ge finished list Completion Nov 2025 |

### Still active — finish corrected

| Slug | Change |
|---|---|
| `blox-sarajishvili` | finish → **2028 Q4**, done 37 (blox.ge 37%) |
| `archi-guramishvili` | finish → **2027 Q1** |
| `console-lisi-townhouse` | finish → **2026 Q4** (console.ge Dec 2026) |
| `grg-orientiri-lisi` | finish → **2026 Q4** (orientiri.ge) |
| `kings-garden` | Block C done; Block A → **2027 Q2** |
| `tbilisi-gardens` | Tower 3 still UC Q2 2026 (korter); done 90 |
| `alpha-home-gldani` | still UC Q2 2026; done 90 |
| `mtatsminda-panorama` | still UC Q2 2026; done 90 |
| `horizon-nutsubidze` | still UC Q2 2026 |
| `livin-dadiani-263` | still UC Q2 2026 (korter) |

## Catalog snapshot (post Dirsi fix)

- ~281 projects (Phase 2 row removed)
- Active = `done < 100` (expect ~243 after park-boulevard + axis-palace + dirsi)
- Developers: 119

## Sources used

- blox.ge/en, m2.ge/en/offers, korter.ge/en/dirsi-tbilisi, facebook.com/dirsi.ge, asgeorgia.ge (suspended), avciarchitects.com/project/dirsi-masterplan, propertygeorgia.ge Dirsi / AS Group Phase 2 park article
