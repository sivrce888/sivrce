# Stale notes — Batumi & regions (2026-07-19)

Format: `slug → what to fix`. Source: directory-research-2026-07-19.md agent-5/6 + korter pages fetched 2026-07-19.

## Completed / closed — catalog entries to fix (exist in professionals.ts)

- `orbi-sea-towers` → completed (15 Sh. Khimshiashvili, operating apart-hotel). Catalog has `done: 60, finish: '2027 Q4'` (L1539) → set `done: 100, finish: 'ჩაბარებული'`.
- `alliance-palace` → completed, opened 2024 as Courtyard Marriott (5 Sh. Khimshiashvili). Catalog has `done: 65, finish: '2027 Q3'` (L1679) → set `done: 100`, finish 2024.
- `alliance-privilege` → ⚠ likely completed/sold ~2023 (unverified). Catalog has `done: 35, finish: '2028 Q2'` (L3247) → verify status; if confirmed set `done: 100`.

## Completed / closed — NOT in catalog (no action, reference only)

- Gumbati in Kheivani (A/B/C) → completed, sold out (korter).
- Gumbati Shota Rustaveli 24 → completed 2017, sold out.
- Subtropic City (Gumbati) → completed, operating apart-hotel.
- Blue Sky Tower (Holiday Inn) → in operation; resale only.
- Hilton Belle Vue → in operation.
- `tower-group-panorama` → completed/closed per owner brief; no project entry in catalog — mentioned only inside Tower Group developer description (professionals.ts L1091-93); trim mention on next dev-description cleanup.

## Already in catalog — skipped during this pass (no fix needed)

- Batumi: `orbi-city`, `orbi-millennium`, `orbi-continental`, `orbi-beach-tower`, `orbi-residence`, `metropol-cube`, `mardi-hills`, `mardi-city-center`, `ambassadori-island-first-tower`, `pontus-rotana-gonio`, `real-palace-blue`, `real-palace-green`, `silk-towers`, `gonio-yachts-marina`, `european-village` (dev), `tempo-queens-residence`, `tempo-serenade`, `ande-metropolis`, `reside-dest-asatiani`, `tekto-rakurs`.
- Regions/mega: `tbilisi-waterfront`, `mira-verde`, `blox-gudauri`, `x2-bakuriani-4rest`, `gumbati-villa-kokhta-mitarbi`.
- Research's "King's Garden Residence (Batumi, $5,720–6,000)" = catalog `kings-garden` (Apollo G.S., Mirza Shafi St, Krtsanisi, Tbilisi, $5,736/m²) — same project, research geo-label was wrong; skipped.

## Conflicts flagged (verify before marketing use)

- `calligraphy-towers` → developer per korter/realting = Grand Maison; older brief said ELT Group. Added under `grand-maison` with inline comment.
- `like-house-azure-tower` → verify brief says Like House; korter lists MC Construction + 5M İnşaat. Added under `like-house` with inline comment.
- `new-gudauri-twins` → korter (fetched 2026-07-19): ready, $950/m²; research (redco.ge): u/c ~$2,077/m² — likely different Twins phases. Inline comment.
- `telavi-residence` → research names Telavi Estate (telaviestate.com); korter lists "Telavi Panorama". Inline comment.
- `wyndham-grand-gonio` → korter min price $8,000/m² on the Aqua tower looks like an outlier; priceFromM2 left 'მოთხოვნით'. Inline comment.
- `orbi-old-batumi` (Orbi Group, Melashvili 12, ready) ≠ korter's separate "Old Batumi" project (dev "Old Batumi", Brtskinvale 102) — different buildings, both exist on korter.

## Approximate pins (geocode fallbacks — verify vs cadastral)

- `orbi-crystal`, `orbi-sunset-boulevard` (announced; Makhinjauri / Blvd centroids), `orbi-old-city` (Old Batumi district), `ds-white-line`, `tempo-sensa`, `reside-riverside` (Batumi centroid, no published address), `tbilisi-hills` (research-level resort coords). Each carries a `ponytail:` comment in the data file.
- `rustaveli-xvii` → street-level geocode of Pantsulaia St, Rustavi (no korter page).
