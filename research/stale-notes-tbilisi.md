# Stale / fix notes — Tbilisi (2026-07-19)

Source: research/directory-research-2026-07-19.md (კვლევა_თბილისი_Premium §2),
research/tbilisi-mid-2026-07.md. Format: `slug → what to fix`.

## Completed / sold-out 2023–2025 — verify against catalog, do NOT re-add as active

- `archi-isani` → completed 2024, sold out (1 Navtlugi St). Not in catalog — keep out.
- `maqro-prestige-kostava` → completed 2025 (65-67 M. Kostava St). Not in catalog — keep out.
- `maqro-green-diamond` → completed 2025, sold out (32 Bob Walsh St). Not in catalog — keep out.
- `domus-hippodrome-2` → sold out (2022). Not in catalog — keep out.
- `domus-hippodrome-3` → sold out (2023). Not in catalog — keep out.
- `domus-chavchavadze-29` → completed 2023, sold out. Not in catalog — keep out.
- `m2-at-kazbegi-2` → completed, housed (m2.ge/en/offers). Not in catalog — keep out.
- `blox-beliashvili` → blox.ge reports Beliashvili 84 / 68a SOLD OUT; catalog entry is Beliashvili 72კა (done:55) — different house number, likely still active, but verify address vs blox.ge before next sync.
- `blox-nutsubidze-7` → sold out per blox.ge. Not in catalog — keep out.
- `blox-varketili` → blox.ge reports "Varketili 35" SOLD OUT; catalog entry is Viktor Kupradze St 35 (done:80, finish 2025 Q3) — probably the same building; if confirmed, set done:100 / finish delivered.
- `anagi-park-homes` → Anagi Park Home Saburtalo (2023) + Park Home Vake (2021) completed. Not in catalog — keep out.
- `metropol-bagebi` → SOLD OUT / CLOSED 2024 (Tskneti Hwy 31). Not in catalog — keep out.
- `nexus-akhvlediani` → completed 2025, sold out (Tamar Skhirtladze 29). Not in catalog — keep out.

## Existing catalog entries to fix

- `anagi-m3-saburtalo` → wrong developer: m³ Saburtalo (Marshal Gelovani Ave 1) is an
  m² (m2-development) project per m2.ge/en/offers, not Anagi. Fix developerSlug →
  'm2-development' (or merge into an m² slug), re-verify address (catalog says გელოვანი 23,
  m2.ge says გელოვანი 1) and rename slug to `m3-saburtalo` / `m2-m3-saburtalo`.
- `king-david` (developer) → no active construction since 2018 (King David Residences,
  12 M. Aleksidze, completed Q3 2018; kd.ge unreachable). No new project added this batch;
  consider demoting from active-developer lists.

## Gaps / not added this batch (insufficient verified data)

- `cityzen-tower` added with developerSlug `ig-development` — developer confirmed via
  ArchDaily 2025-03-14 ("Developed by IG Development Georgia") + The Plan; Zaha Hadid
  Architects is the architect, NOT the developer (research brief ambiguous).
- `gtb-didi-digomi` → price not published (official site: "pricing tailored"); using
  'მოთხოვნით'. Floors 17, delivery Oct 2028, 28-month instalment (gtbdevelopment.com).
- Urbanique Mziuri (Urbanus Mziuri, 26 Simon St, Vake) → identity conflict vs
  `mziuri-residence` in catalog; research flags "needs owner clarification" — NOT added.
- GTB Didi Digomi / Moedani / Passage Gldani / Gldani Inn / G&G Sukhishvili /
  WS Varketili 5+2 / several Archi & Axis actives → no published $/m² — 'მოთხოვნით'
  placeholder; backfill from korter.ge on next price sync.
- Approximate pins (district centroid, flagged with ponytail comments in
  projects-new-tbilisi.ts): m2-at-chkondideli, archi-lisi-sunrise, axis-palace-1,
  axis-hippodrome, biograpi-libretto, white-square-varketili-2, gldani-inn,
  passage-gldani, moedani, cityzen-tower → verify vs cadastral before map publish.
- Matiani address conflict (korter "45 A. Tsereteli Ave" vs bdgroup "20 I. Evdoshvili St")
  — catalog uses korter address + OSM exact-match pin (41.7293784, 44.7872269).
