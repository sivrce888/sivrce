# Competitive sweep v2 — 2026-09-08 (41 sites)

Extends `competitor-analysis-2026-09.md` (15 real-estate platforms). This sweep
adds the wider field the owner asked for: Georgian top sites, global Next.js
flagships, and the "Apple tier" of design-led products. Method: live HTML/stack
inspection + rendered-page review, 2026-09-08. Sivrce rows are evidence-backed
by today's audit (bottom of file).

## Georgian top sites (14)

| Site | Visual | UX | Perf | Tech | Avg | Stack hints |
|---|---:|---:|---:|---:|---:|---|
| mymarket.ge | 78 | 82 | 72 | 84 | 79.0 | Next.js SSR + hreflang ka/en/ru; Cloudflare bot wall |
| tkt.ge | 82 | 85 | 55 | 88 | 77.5 | Next.js SSR; srcSet on ~67 imgs; 68 scripts, 564KB HTML |
| on.ge | 78 | 80 | 70 | 78 | 76.5 | Custom SSR; ld+json; 10 preconnects; 144KB HTML |
| zoommer.ge | 74 | 78 | 42 | 80 | 68.5 | Next.js SSR; 1.4MB HTML, 46 scripts — bloated |
| formula.ge | 72 | 70 | 85 | 60 | 71.8 | Custom lean SSR: 58KB, 8 scripts |
| tabula.ge | 70 | 70 | 70 | 80 | 72.5 | Next.js SSR; 193KB, 18 scripts |
| imedi.ge | 74 | 72 | 75 | 65 | 71.5 | Custom SSR; hero preload + webp |
| sputnik-georgia.com | 65 | 70 | 72 | 70 | 69.3 | Custom SSR; schema.org ×4, hreflang |
| 1tv.ge | 72 | 68 | 62 | 68 | 67.5 | WP-leaning custom SSR; 415KB HTML |
| tbilisi.gov.ge | 66 | 64 | 80 | 55 | 66.3 | Civic plain SSR: 6 scripts, 119KB |
| netgazeti.ge | 68 | 72 | 65 | 62 | 66.8 | WordPress; 152KB, 18 scripts |
| publika.ge | 66 | 64 | 55 | 62 | 61.8 | WordPress; 561KB HTML |
| forbes.ge | 80 | 74 | 45 | 60 | 64.8 | WordPress; strong webp/srcSet, 83 scripts |
| bpc.ge | 62 | 60 | 35 | 45 | 50.5 | Wix; 1.1MB HTML |

Read: sivrce outguns every local player on perf discipline (device-budget lock,
8 prebuild gates) and matches tkt/mymarket on stack while beating both on
visual system. Local best tricks worth keeping: tri-lingual hreflang, hero
preload, lean HTML (formula.ge is the weight benchmark to respect).

## Global Next.js flagships (15)

| Site | Visual | Motion | Perf | Tech | Innov | Avg |
|---|---:|---:|---:|---:|---:|---:|
| vercel.com | 96 | 92 | 93 | 98 | 95 | 94.8 |
| linear.app | 98 | 98 | 92 | 88 | 86 | 92.4 |
| v0.app | 88 | 82 | 85 | 96 | 99 | 90.0 |
| dub.co | 90 | 85 | 92 | 95 | 84 | 89.2 |
| resend.com | 97 | 88 | 90 | 90 | 80 | 89.0 |
| midday.ai | 93 | 86 | 90 | 92 | 82 | 88.6 |
| cursor.com | 90 | 80 | 88 | 86 | 97 | 88.2 |
| raycast.com | 86 | 84 | 86 | 88 | 92 | 87.2 |
| supabase.com | 86 | 78 | 88 | 92 | 90 | 86.8 |
| nextjs.org | 82 | 72 | 92 | 100 | 88 | 86.8 |
| cal.com | 88 | 90 | 85 | 88 | 78 | 85.8 |
| framer.com | 95 | 99 | 80 | 70 | 85 | 85.8 |
| clerk.com | 87 | 80 | 89 | 88 | 78 | 84.4 |
| notion.so | 78 | 70 | 78 | 82 | 92 | 80.0 |
| unkey.com | 84 | 76 | 84 | 86 | 76 | 81.2 |

Steal-list (applied or actionable for sivrce):
- next/image with explicit `sizes` + 10–16 srcset widths; q=70–75 photos (already standard here).
- ≤3 font families, variable woff2 subsets via next/font, zero-CLS `__variable_` classes (already: Noto Sans Georgian variable).
- Odometer count-ups on stats (dub.co NumberFlow pattern) — market/ KPIs candidate.
- Per-listing OG images via `opengraph-image.tsx` — sivrce already ships og-derivatives.
- Stream below-fold via RSC/Suspense; ISR city pages (already: home rail + hub pages).
- llms.txt + machine-readable catalog (already shipped: /llms.txt, /llms-full.txt).
- Respect `prefers-reduced-motion` globally (midday) — sivrce: map + carousels only; widen.
- View-transition feel on filter → results (Vercel) — CSS-only starter shipped in this sweep.

## Apple tier — design leaders (12)

| Site | Visual | Motion | Detail | Speed-feel | Restraint | Avg |
|---|---:|---:|---:|---:|---:|---:|
| apple.com/iphone | 96 | 93 | 97 | 88 | 97 | 94.2 |
| things.app | 93 | 92 | 94 | 95 | 96 | 94.0 |
| stripe.com | 95 | 90 | 95 | 90 | 93 | 92.6 |
| opal.camera | 97 | 90 | 92 | 87 | 96 | 92.4 |
| rive.app | 90 | 95 | 90 | 88 | 90 | 90.6 |
| lusion.co | 94 | 99 | 90 | 78 | 85 | 89.2 |
| superlist.com | 91 | 89 | 88 | 85 | 87 | 88.0 |
| arc.net | 88 | 87 | 88 | 86 | 88 | 87.4 |
| activetheory.net | 92 | 98 | 86 | 74 | 84 | 86.8 |
| Why Zero (SOTD Sep 7) | 88 | 90 | 86 | 83 | 85 | 86.4 |
| figma.com | 87 | 85 | 90 | 85 | 84 | 86.2 |
| United Carriers (SOTD Sep 6) | 90 | 93 | 84 | 80 | 82 | 85.8 |

The Apple formula (repeatable rules):
- Type: one family, 5–6 fixed steps ~1.25–1.333 ratio; display line-height 1.05; -0.02em tracking ≥32px.
- Spacing: 8px grid; section padding 80–160px vertical; one repeating section template.
- Color: neutral band alternation (#f5f5f7/#1d1d1f); saturated color only for the "product".
- Motion: 200–300ms micro, 400–600ms reveals, ONE easing everywhere; interruptible; nothing >600ms.
- Scroll: sticky + scale/opacity only; one scrollytelling moment per page.
- One idea per viewport; ~40 words max; footnotes exiled below fold.
- Detail: focus-visible rings, `prefers-color-scheme` tokens, true hairlines, matched icon strokes.
- Perceived speed: nav + hero in first paint; heavy media lazy-mounted.

## Sivrce audit — 2026-09-08 v2 (live pages, desktop + mobile, light + dark)

Scored against the Apple-tier axes: Visual 88, Motion 78, Detail 86,
Speed-feel 85, Restraint 82 → **83.8 design-tier avg** (product surfaces avg
90.1, see v1 doc). Gap to Apple tier is motion + copy restraint, not layout.

Closable gaps found in audit (all fixed or actioned in this sweep):

1. Hero subtitle copy keyword-stuffs "უძრავი ქონება" ×4 (ka) / reads machine
   translated (en: "Daily apartments in Tbilisi"). Apple rule: one idea, ~15
   words. → rewritten in ka/en (+parity langs).
2. Search bar shows label == placeholder ("ოთახები/ოთახები", "ფასი/ფასი").
   → placeholders now say something ("ნებისმიერი", "მაქს …").
3. Map3D race: `setLayerZoomRange("building-3d")` fires after style reload
   removed the layer (`Cannot set the zoom range of non-existing layer`). →
   guarded via getLayer check + style idle re-apply.
4. No global motion tokens; durations/easings ad-hoc per component. →
   `--ease-apple` + `--dur-*` tokens in globals.css, applied to shared
   interactive elements; `prefers-reduced-motion` honored.

Not closable by code (unchanged from v1): SEO corpus age, AVM sold-price data,
commute-time overlay API cost. Restraint ceiling: hero already one-idea; day/
night theme system matches Apple's product-as-only-color rule (orange accent
reserved for CTAs).
