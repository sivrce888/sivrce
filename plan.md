# Sivrce → 100/100 · n1 Georgia → global

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
switcher.

1. **10 — Route-based i18n** (`app/[lang]/…` server-rendered ka/en/ru + hreflang).
   The only structural SEO gap vs myhome/ss/korter; every other technical SEO
   item is done. Own session: moves ~150 routes, rewrites every Link, translates
   1,486 programmatic pages. Gets costlier the longer we wait.
2. ~~**9 — Static → DB on read paths**~~ **DONE 2026-07-17** (b9f7baf): homepage
   featured rail + sitemap read `getAllListings()` with static fallback;
   /, /en, /ru, sitemap.xml revalidate hourly.
3. **8 — Search Console**: verify property, submit sitemap, watch queries.
   Owner's Google account needed — 10 minutes, no code.
4. **7 — Mobile LCP** (~85 on mobile): server-component split of homepage
   sections, framer-motion only in leaf islands.
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
