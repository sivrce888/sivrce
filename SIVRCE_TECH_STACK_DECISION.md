# SIVRCE — Autonomous Technology Selection
**CTO Decision Record · 2026-07-17 · Method: 10-domain parallel analysis, 3+ options per domain, 10 weighted criteria, 2026-current market data**

**Weights** (derived from stated priorities): Scalability 1.5 · Long-term competitiveness 1.5 · Development speed 1.3 · Performance 1.2 · Security 1.2 · Global expansion 1.2 · Maintenance cost 1.0 · SEO impact 1.0 · AI integration 1.0 · Hiring availability 0.8 (Σ = 11.7)

**Rule applied throughout:** the incumbent wins ties. A SWITCH is recommended only where expected value clearly beats switching cost on an already-shipped MVP (Next.js 16.2.10 · React 19.2.4 · Prisma 7 · Auth.js v5 · Vercel · 1,486 static SEO pages · ka/en/ru).

---

## 0. Executive Decision Table

| # | Domain | Winner | Verdict | Score vs runner-up | Trigger to revisit |
|---|--------|--------|---------|--------------------|--------------------|
| 1 | Frontend | **Next.js 16.2** | KEEP | 8.9 vs RRv7 7.5 | Vercel lock-in pain; Astro satellite for blog only |
| 2 | Backend | **Next.js full-stack modular monolith** | KEEP | 99.3 vs NestJS 84.4 | Team >10–15 eng, mobile public API, 100× divergent load |
| 3 | Database | **Neon serverless Postgres + Prisma 7** | KEEP | 93.1 vs Supabase 92.0 | Sustained OLTP ceiling, multi-region, HIPAA-class compliance → Aurora |
| 4 | Cloud / Hosting | **Vercel** (Cloudflare DNS in front) | KEEP | CF raw 96.4 vs Vercel 95.3 — delta < switching cost | Vercel bill >$300/mo sustained → Cloudflare Workers via OpenNext |
| 5 | AI Infrastructure | **Google Gemini API** via Vercel AI SDK + Gateway | ADOPT (greenfield) | 9.1 vs OpenAI 8.5 | ChatGPT-app distribution deal; quarterly re-score |
| 6 | Search | **Meilisearch** | KEEP | 8.4 vs Algolia 8.3 | p99 >200ms at scale or hired relevance team → Algolia |
| 7 | Storage / Media | **Cloudflare R2 + Images + Stream** | ADOPT (pre-commitment) | 99.2 vs S3+CloudFront 96.6 | WORM/Rekognition needs or multi-PB scale → AWS S3 |
| 8 | Analytics | **PostHog (EU)** + free GA4 tag | ADOPT (greenfield) | 99.3 vs GA4+BQ 91.2 | Paid ads >$30–50K/mo → add BigQuery warehouse |
| 9 | Payments | **TBC E-Commerce + BOG iPay** behind PSP-agnostic interface | BUILD | Stripe raw 94.3 vs 73.2 but fails feasibility gate (no Georgian onboarding/GEL/Connect payouts) | Market #2 or >15% non-GE cards → add Stripe Connect |
| 10a | Maps | **Google Maps Platform** behind adapter | ADOPT | 8.8 vs Mapbox 7.9 | Map bill >$5–7K/mo → MapLibre+MapTiler hybrid |
| 10b | Email | **Resend** (React Email) | ADOPT | 7.6 vs Postmark 7.4 | >200–500K emails/mo → AWS SES |
| 10c | SMS/OTP | **Twilio Verify**; SMSOffice.ge as GE cost-failover | ADOPT | 8.4 vs Vonage 7.4 | GE OTP >20–30K/mo → SMSOffice.ge primary GE route |
| 10d | Observability | **Sentry** | ADOPT | 8.5 vs Datadog 8.1 | Own K8s/multi-cloud + SRE hire → add Datadog |
| 10e | Auth | **Auth.js v5** | KEEP | Clerk raw 7.7 vs 6.9 — EV favors keep ($0.02/MAU at 1M MAU ≈ $20K/mo) | SAML/SCIM enterprise demand → Clerk; Auth.js stalls → Better Auth |

**One-line architecture:** Next.js 16 modular monolith on Vercel (Cloudflare DNS in front) · Neon Postgres + Prisma 7 (pgvector + PostGIS) · Meilisearch · R2/Images/Stream · Gemini via AI SDK/Gateway · PostHog + GA4 · TBC/BOG payments · Google Maps · Resend · Twilio · Sentry · Auth.js v5 — every external service behind a thin internal adapter so each migration is a days-scale swap, never a rewrite.

---

## 1. Frontend Framework — **Next.js 16.2 · KEEP (8.9 vs 7.5)**

- **Option A — Next.js 16.2 (App Router, RSC, PPR, Turbopack):** the only framework natively covering SSG at 1,486-page scale + ISR listing freshness + streaming RSC app surfaces. Stable Cache Components (`"use cache"`), stable PPR via `cacheComponents: true`, Turbopack default, DevTools MCP for AI-assisted debugging. Deepest AI-tooling ecosystem.
- **Option B — React Router v7 (framework mode):** merged Remix successor, deploy-anywhere, ~54M weekly downloads — but no ISR, no image pipeline, no PPR; you rebuild with CDN discipline what Next.js ships as primitives. Roadmap clouded by Remix 3's Preact fork. CVE-2026-40181 open-redirect in v7.0.0–7.14.0.
- **Option C — Astro 6 + React islands:** Cloudflare-owned (Jan 2026), undisputed content-LCP champion (~0.8s vs Next ~2.1s on identical content). But islands are awkward exactly where Sivrce lives — auth, SSE chat, booking, payments, dashboards — two mental models for the worst of both worlds.

| Criterion (weight) | A: Next.js | B: RRv7 | C: Astro |
|---|---|---|---|
| Scalability (1.5) | 9 | 8 | 6 |
| Performance (1.2) | 8 | 8 | 9 |
| Security (1.2) | 8 | 7 | 8 |
| Dev speed (1.3) | 9 | 8 | 6 |
| Maintenance (1.0) | 8 | 7 | 6 |
| Hiring (0.8) | 10 | 8 | 5 |
| Global expansion (1.2) | 9 | 7 | 7 |
| SEO (1.0) | 9 | 8 | 10 |
| AI integration (1.0) | 10 | 7 | 6 |
| Long-term (1.5) | 9 | 7 | 7 |
| **Weighted** | **103.7 → 8.9** | **87.7 → 7.5** | **82.1 → 7.0** |

**Why:** one framework covers content + app; PPR + Cache Components directly attack the LCP weapon; AI leverage (MCP, AI SDK, RSC streaming) is the force multiplier for a founder+AI team; React ~44–45% dev market; rewriting a shipped MVP ≈ 3–6 weeks + SEO regression risk for gains the stack mostly already delivers.
**Trigger/path:** enable `cacheComponents: true` now; `middleware.ts`→`proxy.ts` before removal; if marketing/blog surface grows, carve an Astro satellite on a subdomain; RRv7 is the clean exit if Vercel gravity ever hurts (65% of Next.js sites already run off Vercel).

## 2. Backend Architecture — **Next.js full-stack modular monolith · KEEP (99.3 vs 84.4)**

- **Option A — Next.js monolith (Route Handlers + Server Actions):** one codebase, one Prisma client, one deploy. 2025–26 consensus (Shopify modular monolith at 80k RPS, Prime Video −90% cost de-distributing) explicitly validates monoliths under ~10 engineers.
- **Option B — NestJS separate API:** strongest enterprise pattern; doubles pipelines, duplicates validation/types, network hop per mutation — a 30–40% velocity tax with zero user-visible benefit today. Right at 15+ engineers.
- **Option C — Hono/tRPC on edge:** Vercel Edge caps ~25ms CPU/128MB, no TCP DB (Prisma needs paid Accelerate or a Drizzle rewrite), no rendering story — additive infra, not a replacement.

| Criterion (weight) | A: Monolith | B: NestJS | C: Edge |
|---|---|---|---|
| Scalability (1.5) | 7 | 9 | 8 |
| Performance (1.2) | 8 | 8 | 7 |
| Security (1.2) | 8 | 8 | 7 |
| Dev speed (1.3) | 10 | 5 | 7 |
| Maintenance (1.0) | 9 | 5 | 7 |
| Hiring (0.8) | 9 | 7 | 5 |
| Global (1.2) | 7 | 8 | 9 |
| SEO (1.0) | 10 | 6 | 6 |
| AI (1.0) | 10 | 7 | 7 |
| Long-term (1.5) | 8 | 8 | 7 |
| **Weighted** | **99.3** | **84.4** | **83.2** |

**Stage verdict:** modular monolith now, extraction-ready — domain folders (`/modules/listings|chat|payments`), no cross-module DB access. Move long-running work (image variants, notifications) to queues/cron. Patch discipline (2025 Next.js CVEs). **Trigger:** team >10–15 eng, a 100×-load domain, native mobile needing a public API, or payment compliance isolation → extract ONE module (search or chat first, never auth/payments first), strangler-fig style.

## 3. Database — **Neon serverless Postgres + Prisma 7 · KEEP (93.1 vs 92.0)**

- **Option A — Self-managed/RDS/Aurora:** the Stripe/Airbnb endgame (Aurora Global, 128TB, full control). Right destination, wrong time — every ops hour is a product hour lost.
- **Option B — Neon:** compute/storage separation, scale-to-zero, ~500ms cold start, copy-on-write branching <1s (a full DB clone per PR / per AI-agent task), read replicas, first-party Vercel integration, pgvector + PostGIS. Databricks-owned (May 2025) — product active, free tier expanded; watch incident cadence (~4/90d, ~59min median). From $19/mo.
- **Option C — Supabase:** best compliance story (SOC 2 + HIPAA, EU residency) but its differentiators (Auth, Realtime, RLS) duplicate already-built Auth.js v5 + SSE chat; dedicated compute = cost floor; logs metered from July 2026.

| Criterion (weight) | A: RDS | B: Neon | C: Supabase |
|---|---|---|---|
| Scalability (1.5) | 9 | 8 | 7 |
| Performance (1.2) | 9 | 7 | 8 |
| Security (1.2) | 8 | 7 | 9 |
| Dev speed (1.3) | 4 | 10 | 7 |
| Maintenance (1.0) | 3 | 9 | 8 |
| Hiring (0.8) | 8 | 8 | 8 |
| Global (1.2) | 9 | 7 | 8 |
| SEO (1.0) | 7 | 8 | 7 |
| AI (1.0) | 7 | 9 | 9 |
| Long-term (1.5) | 9 | 7 | 8 |
| **Weighted** | **86.8** | **93.1** | **92.0** |

**Why:** DB branching is a superpower for a founder + parallel AI agents; zero ops; nothing already built is wasted; exit is cheap (wire-protocol Postgres — `pg_dump` to Aurora is a weekend, Prisma untouched). **Path:** Neon → read replicas near expansion markets → Aurora Global/sharded Postgres only when data forces it. If Postgres isn't already on Neon, moving is a `DATABASE_URL`-level change.

## 4. Cloud / Hosting — **Vercel · KEEP, Cloudflare is the declared destination (raw: CF 96.4 vs Vercel 95.3 vs AWS 94.7)**

- **Option A — Vercel:** zero-infrastructure, day-one Next.js 16.2 feature support, Fluid Compute, AI SDK/Gateway at cost. ~$874/mo estimated at 1M MAU on Pro; ~$45K/yr Enterprise cliff. No Georgia PoP — SSR in Frankfurt (~55–70ms RTT from Tbilisi), static from nearer edges.
- **Option B — AWS (Amplify/OpenNext):** unbeatable ceiling but Lambda cold starts 500–1500ms, self-owned ISR revalidation queue (the most-reported production failure — stale content, lethal for 1,486 SEO pages), CloudFront nearest edge Istanbul. Savings eaten by DevOps time.
- **Option C — Cloudflare Workers via OpenNext:** the ONLY provider with a Tbilisi PoP (335+ cities), unmetered bandwidth ($5/mo plan), sub-ms cold starts; adapter production-grade in 2026 (RSC, Server Actions, ISR via KV/R2, Auth.js v5 works). Caveats: adapter CVEs, CPU-time limits, chat needs Durable Objects.

| Criterion (weight) | A: Vercel | B: AWS | C: Cloudflare |
|---|---|---|---|
| Scalability (1.5) | 8 | 10 | 9 |
| Performance (1.2) | 8 | 7 | 9 |
| Security (1.2) | 8 | 9 | 8 |
| Dev speed (1.3) | 10 | 6 | 7 |
| Maintenance (1.0) | 6 | 7 | 9 |
| Hiring (0.8) | 9 | 8 | 7 |
| Global (1.2) | 7 | 9 | 9 |
| SEO (1.0) | 9 | 7 | 8 |
| AI (1.0) | 10 | 8 | 8 |
| Long-term (1.5) | 7 | 9 | 8 |
| **Weighted** | **95.3** | **94.7** | **96.4** |

**Why KEEP:** Cloudflare's +1.1 raw edge is cost+latency that barely matters at MVP scale and is fully capturable later via OpenNext portability; switching now costs 2–4 weeks of the scarcest resource (dev speed, weight 1.3). **Do TODAY:** Cloudflare DNS/proxy in front of Vercel (free, instant Tbilisi edge caching for static), avoid Vercel-only datastore lock-in, billing alert at $150/mo. **Written trigger to migrate to Workers:** Vercel bill >$300/mo sustained · >1TB bandwidth/mo · Enterprise quote lands · TTFB hurting Georgian rankings · chat scale demands Durable Objects economics.

## 5. AI Infrastructure — **Google Gemini API via Vercel AI SDK v6 + AI Gateway · ADOPT (9.1 vs OpenAI 8.5, Claude 8.1)**

Greenfield: no LLM SDK exists in the repo today — zero switching cost.

- **Option A — Anthropic Claude:** best agentic/coding DNA (already the dev tooling), but its own Opus 4.8 system card concedes it trails Gemini/GPT on multilingual benchmarks, has no first-party embeddings, no image generation, premium pricing. Its weakest dimension is Sivrce's most critical one (Georgian).
- **Option B — OpenAI:** widest price ladder (GPT-5-nano → GPT-5.6, 1M context), largest ecosystem, Realtime API, proven portal distribution (Zillow/Redfin ChatGPT apps). Mid-tiers run 2–6× Gemini's equivalent pricing. Best as a later distribution channel, not primary infra.
- **Option C — Google Gemini:** lineup fits the workload map exactly — 3 Flash ($0.50/$3, 196 tok/s, 0.74s TTFT) for search parsing, 3.5 Flash for descriptions/vision, Flash-Lite for bulk classification, 3.1 Pro for hard reasoning. Decisive: best low-resource-language performance of any frontier lab (GMMLU gap-to-English −2.1%; Kazakh national-exam study: Gemini 90.6% vs Claude 61.6%). Plus gemini-embedding (MTEB-Multilingual leader), native multimodal, Nano Banana image gen (virtual staging). Watch-outs: aggressive deprecations — build on 3.x only; paid tier in production.

| Criterion (weight) | A: Claude | B: OpenAI | C: Gemini |
|---|---|---|---|
| Scalability (1.5) | 8 | 8 | 10 |
| Performance (1.2) | 8 | 8 | 10 |
| Security (1.2) | 9 | 8 | 8 |
| Dev speed (1.3) | 8 | 9 | 9 |
| Maintenance (1.0) | 7 | 8 | 9 |
| Hiring (0.8) | 9 | 10 | 8 |
| Global (1.2) | 7 | 8 | 10 |
| SEO (1.0) | 8 | 9 | 8 |
| AI (1.0) | 8 | 9 | 9 |
| Long-term (1.5) | 9 | 9 | 9 |
| **Weighted** | **94.9 → 8.1** | **100.0 → 8.5** | **106.2 → 9.1** |

**Why:** Georgian is the product — Gemini is the only vendor with demonstrated low-resource superiority; ~100K parses/mo ≈ $190 on 3 Flash vs ~$350–380 on Haiku/GPT Luna, Flash-Lite ≈ $95 (at 100× scale a 3–6× unit-cost gap is a moat); embeddings + vision + image gen in one API; AI SDK + Gateway makes the model a config string. **Staff note:** do NOT build the AVM (price estimate) as an LLM call — Zestimate-class valuation is structured ML (gradient boosting on comps); the LLM only explains the estimate in ka/en/ru. **Path:** Gemini 3 Flash parsing + 3.5 Flash descriptions + gemini-embedding/pgvector recs + Batch API (−50%) for programmatic SEO; Vertex AI on EU entry; per-task Gateway routing later; quarterly re-score.

## 6. Search Engine — **Meilisearch · KEEP (8.4 vs Algolia 8.3)**

- **Option A — Meilisearch v1.18 (incumbent):** Rust/LMDB, Charabia tokenizer explicitly handles Georgian (segmentation + normalization — no engine anywhere has true ka morphology, level playing field), hybrid search (DiskANN + auto-embedders, `semanticRatio`), geo radius/bbox/polygon, faceting, built-in RAG — all in free CE. April 2026: Cloud sharding + replication + geo-replication GA — the old scale ceiling is retired. Cloud from $30/mo.
- **Option B — Algolia:** best raw relevance/typo/geo, `KA` in SupportedLanguage enum, 100K-QPS proven — but per-search+per-record billing ≈ $8,500/mo at 1M records/50M searches (vs ~$499 Meilisearch Cloud), NeuralSearch gated behind sales-priced Elevate, zero self-host exit. A structural tax on exactly the hypergrowth Sivrce plans.
- **Option C — Typesense v30:** free multi-node clustering, unlimited queries per cluster, `ka` via ICU, custom stemming dictionaries (the only engine offering that lever for Georgian) — but RAM-heavy, new integration from scratch while Meilisearch is already wired.
- **Option D — Elasticsearch/OpenSearch:** rejected — no Georgian analyzer, JVM ops burden, NRT lag (Vinted: 300s listing visibility; →Vespa cut it to 5s with half the servers). A destination, not a start.

| Criterion (weight) | Meili | Algolia | Typesense | ES/OS |
|---|---|---|---|---|
| Scalability (1.5) | 8 | 10 | 8 | 10 |
| Performance (1.2) | 8 | 9 | 9 | 7 |
| Security (1.2) | 9 | 9 | 7 | 8 |
| Dev speed (1.3) | 10 | 8 | 8 | 4 |
| Maintenance (1.0) | 9 | 3 | 8 | 3 |
| Hiring (0.8) | 8 | 10 | 7 | 9 |
| Global (1.2) | 7 | 10 | 7 | 9 |
| SEO (1.0) | 8 | 8 | 8 | 7 |
| AI (1.0) | 9 | 7 | 9 | 8 |
| Long-term (1.5) | 8 | 8 | 7 | 8 |
| **Weighted** | **98.2 → 8.4** | **97.0 → 8.3** | **91.1 → 7.8** | **86.2 → 7.4** |

**Do better now:** wire `_geo` radius/bbox sorting; per-language localized attributes; curated ka synonym/stopword lists (stopwords-iso has none — build one); hybrid embedder on title+description, `semanticRatio` ≈ 0.3–0.5 to compensate for missing stemming; tenant tokens; thin server-side search adapter (Vinted's "search contract" pattern); load-test 1M synthetic listings. **Triggers:** →Algolia if sharded Cloud p99 >200ms or a relevance team is hired; →Typesense if self-host HA economics pinch or ka dictionaries A/B-win.

## 7. Storage & Media — **Cloudflare R2 + Images + Stream · ADOPT (99.2 vs S3 96.6 vs Vercel Blob 84.5)**

Pre-commitment decision: no storage SDK exists in the repo — near-zero switching cost; the "switch" is only away from the Vercel path-of-least-resistance.

- **Option A — R2 + Images + Stream:** $0.015/GB-mo, **zero egress**, S3-compatible, 300+ PoPs (strong near Georgia). Images: AVIF-by-default variants via `imagedelivery.net` ($0.50/1K transforms after 5K free). Stream: video tours at $5/1K min stored + $1/1K min delivered, encoding included — no FFmpeg pipeline. June 2026 R2 price cut (~50% storage) signals trajectory. Custom `next/image` loader ≈ 15 lines.
- **Option B — S3 + CloudFront + Sharp/Lambda:** the Zillow/Airbnb reference at petabyte scale (Rekognition, Object Lock), but you own the transform pipeline and pay egress forever ($0.09/GB S3→internet; CloudFront $0.0085–0.085/GB).
- **Option C — Vercel Blob:** drop-in MVP UX, but $0.05–0.11/GB transfer + Fast Origin Transfer, 512MB cache cap (fatal for video), ~120 ops/s Pro limit → **$1,500+/mo at 30TB photo traffic vs ~$0 on R2**.

| Criterion (weight) | A: R2 | B: S3+CF | C: Blob |
|---|---|---|---|
| Scalability (1.5) | 9 | 10 | 7 |
| Performance (1.2) | 9 | 8 | 7 |
| Security (1.2) | 8 | 10 | 8 |
| Dev speed (1.3) | 8 | 4 | 9 |
| Maintenance (1.0) | 9 | 4 | 6 |
| Hiring (0.8) | 7 | 10 | 8 |
| Global (1.2) | 9 | 9 | 7 |
| SEO (1.0) | 9 | 8 | 7 |
| AI (1.0) | 7 | 9 | 6 |
| Long-term (1.5) | 9 | 10 | 7 |
| **Weighted** | **99.2** | **96.6** | **84.5** |

**Why:** at 6TB stored / 30TB served: R2 ≈ $100–300/mo · S3+CF ≈ $700–2,500 · Blob ≈ $1,600+ — the delta compounds monthly and funds growth. AVIF-by-default protects the 100/100 Lighthouse SEO weapon. S3 API = cheap exit both directions (Slurper/Sippy). **LQIP (vendor-independent):** ~20px blur at upload, base64 on the `ListingPhoto` row, `placeholder="blur"` — ~30 lines once. **Trigger→S3:** WORM/compliance audit trails, Rekognition-scale moderation, >1M unique transforms/mo, multi-PB committed-use economics.

## 8. Analytics — **PostHog (Cloud EU) + free GA4 tag · ADOPT (99.3 vs 91.2)**

- **Option A — PostHog EU (Frankfurt):** funnels + session replay + feature flags + experiments + surveys + warehouse/HogQL in one SDK — one vendor replaces four. Free tier covers the whole MVP (1M events, 5K replays, 1M flags/mo); ~$450/mo at 10M events. Cookieless + identified-only modes satisfy Georgia's GDPR-modeled law without a consent-banner tax on conversion. Agent-queryable (MCP, SQL/API) — fits the AI-dev workflow. $57.5M ARR Feb 2026, +99% YoY.
- **Option B — GA4 + BigQuery:** unmatched SEO/ads attribution and free BigQuery export — but Consent Mode v2 + CMP mandatory, EU-US DPF invalidation is a live risk, no replay/flags, GA360 cliff ~$150K/yr.
- **Option C — Plausible/Umami/Mixpanel:** privacy-lightweights lack replay/flags/dashboards; Mixpanel = second vendor, more expensive at scale than PostHog.

| Criterion (weight) | A: PostHog | B: GA4+BQ | C: Lightweight |
|---|---|---|---|
| Scalability (1.5) | 9 | 10 | 7 |
| Performance (1.2) | 8 | 7 | 9 |
| Security/Privacy (1.2) | 9 | 6 | 9 |
| Dev speed (1.3) | 9 | 6 | 7 |
| Maintenance (1.0) | 8 | 7 | 9 |
| Hiring (0.8) | 8 | 9 | 6 |
| Global (1.2) | 9 | 8 | 7 |
| SEO (1.0) | 6 | 10 | 7 |
| AI (1.0) | 9 | 7 | 5 |
| Long-term (1.5) | 9 | 8 | 6 |
| **Weighted** | **99.3** | **91.2** | **84.4** |

**Why:** marketplace funnels (search→listing→contact→booking), agent dashboards, A/B testing the AI-search hero — all without extra vendors; $0 through MVP. **Pattern:** standard 2026 dual-stack — PostHog for product, free GA4 tag for Search Console attribution only. **Trigger:** paid acquisition >$30–50K/mo or first data hire → GA4→BigQuery + PostHog batch export into one BigQuery project. No rip-and-replace at any point.

## 9. Payments — **TBC E-Commerce + BOG iPay behind a PSP-agnostic interface · BUILD (feasibility gate overrides raw math)**

Payments not yet shipped — greenfield.

- **Option A — TBC + BOG (local GEL duopoly):** covers virtually all locally issued Visa/MC + TBC Pay wallet. Native primitives match Sivrce exactly: pre-auth + delayed completion (escrow-like deposit holds), card-on-file recurring (agent subscriptions), refunds, and TBC native **split payments** — marketplace funds settle directly to agency sub-accounts without Sivrce holding third-party money (avoids NBG licensing exposure). Fees negotiable 1.5–3.0%. Weakness: Georgia-only, weaker DX, subscription lifecycle built in-house.
- **Option B — Stripe:** best marketplace platform on earth (Billing, Connect, Radar, GEL presentment) — **fatal gates:** Georgia is NOT on stripe.com/global (no onboarding for Georgian entities, no Connect payouts to +995 accounts, cross-border auth rates on GE cards). Requires a foreign entity and still doesn't fix Georgian payouts. Expected value of an inoperable rail is 0.
- **Option C — Adyen/Paddle:** Adyen has no Georgian acquiring, enterprise minimums; Paddle (MoR) accepts Georgian sellers but is digital-goods-only — deposits/escrow/marketplace payouts are outside its acceptable use. Paddle's only legitimate future role: international SaaS subscription billing.

| Criterion (weight) | A: TBC+BOG | B: Stripe | C: Adyen/Paddle |
|---|---|---|---|
| Scalability (1.5) | 7 | 10 | 8 |
| Performance — GE auth rates (1.2) | 9 | 5 | 6 |
| Security (1.2) | 8 | 10 | 9 |
| Dev speed (1.3) | 6 | 6 | 5 |
| Maintenance (1.0) | 6 | 5 | 7 |
| Hiring (0.8) | 7 | 9 | 7 |
| Global (1.2) | 2 | 9 | 8 |
| SEO (1.0) | 8 | 8 | 8 |
| AI (1.0) | 5 | 9 | 7 |
| Long-term (1.5) | 5 | 9 | 7 |
| **Weighted** | **73.2** | **94.3** | **84.2** |

**Why A despite the math:** feasibility gate — B has 0% operability for a Georgian entity in 2026. A is the only option satisfying GEL ✓ Georgian acquiring ✓ subscriptions ✓ escrow-like ✓ marketplace payouts ✓. Dual-rail = redundancy. **Build behind a thin `PaymentProvider` interface** (authorize/capture/cancel/refund/chargeSaved/split) so "Georgia-only" becomes a config swap. **Triggers:** add Stripe (not replace) at market #2, >15% non-GE card volume, or a US Delaware flip — multi-PSP routing by card BIN/country is exactly how Airbnb/Uber operate. **Watch:** if Stripe extends its network to Georgia (it recently added Ghana/Kenya/Nigeria), re-run this evaluation immediately — the math flips.

## 10. Third-Party Services Bundle

| Slot | Winner | Verdict | Runner-up | Trigger |
|---|---|---|---|---|
| Maps | **Google Maps Platform** | ADOPT (8.8) | Mapbox (7.9) | Bill >$5–7K/mo → MapLibre+MapTiler hybrid (keep Places) |
| Email | **Resend** | ADOPT (7.6) | Postmark (7.4) | >200–500K/mo → AWS SES |
| SMS/OTP | **Twilio Verify** | ADOPT (8.4) | Vonage (7.4) | GE >20–30K SMS/mo → SMSOffice.ge primary GE route |
| Monitoring | **Sentry** | ADOPT (8.5) | Datadog (8.1) | Own K8s + SRE → add Datadog |
| Auth | **Auth.js v5** | KEEP (6.9 raw vs Clerk 7.7) | Clerk | SAML/SCIM demand or auth incident |

**Maps — Google (8.8 vs Mapbox 7.9 vs MapLibre+MapTiler 7.7):** best POI/address data in Georgia = geocoding accuracy = the core data asset; Places Autocomplete session pricing is the most predictable model for property search; $200/mo credit ≈ $0 at MVP. MapTiler's free tier is non-commercial (halts at 5K sessions) — kills the "free OSM stack" assumption. Build behind a map adapter; near-drop-in MapLibre escape exists (5-step migration, documented 2026).

**Email — Resend (7.6 vs Postmark 7.4 vs SES 7.4):** dev speed decisive (~10 min vs 4–8h SES); React Email = best-looking trilingual transactional email; zero ops. Cost parity below ~200K/mo. Keep everything behind one `sendEmail()`; SES is the scale destination ($0.10/1K).

**SMS — Twilio Verify (8.4 vs Vonage 7.4 vs SMSOffice.ge 5.5):** Verify API = purpose-built OTP (fraud guard, throttling, channel fallback) — weeks of security-critical work avoided; one integration works in every future market (Global 10 vs SMSOffice 2, second-heaviest criterion). GE cost ≈ $0.05/msg is noise at MVP volume (<$150/mo). SMSOffice.ge (0.006–0.016 GEL/msg, 8–20× cheaper) becomes the primary GE route behind the provider interface at >20–30K SMS/mo — an addition, not a migration.

**Monitoring — Sentry (8.5 vs Datadog 8.1 vs Highlight 6.4):** ~90% of a Vercel app's monitoring needs at ~2% of Datadog's cost; Web Vitals monitoring feeds the Lighthouse-SEO strategy; LLM observability + Seer AI debugger shipping. Highlight effectively disqualified — service ended Feb 28, 2026 (LaunchDarkly migration, SDKs still beta). Instrument with OpenTelemetry conventions for portability.

**Auth — Auth.js v5 KEEP (raw 6.9 vs Clerk 7.7):** Clerk wins the matrix but loses the decision: migration = user/session data move + middleware rewrite + forced re-logins (~1–2 weeks high-risk) to buy DX on a feature already built; and Clerk's $0.02/MAU overage is a ≈$20K/mo tax at exactly the 1M-MAU scale Sivrce targets. Self-hosted = flat cost, users in your own Postgres (clean residency, direct joins for AI/analytics). **KEEP actions:** add passkeys/WebAuthn, tighten session config, rate-limit credentials, Sentry auth context. Watch Better Auth as the same-model near-drop-in upgrade if Auth.js stalls.

---

## 11. Target Architecture (2026 → global)

```
Users (ka/en/ru, mobile-first)
   │
Cloudflare DNS + CDN proxy          ← free Tbilisi PoP caching, do this week
   │
Vercel — Next.js 16.2 modular monolith (PPR + Cache Components)
   ├─ modules: listings · search · chat (SSE) · bookings · payments · ai
   ├─ Auth.js v5 (sessions in Postgres, passkeys next)
   ├─ Gemini via AI SDK v6 + AI Gateway (per-task routing, ka/en/ru)
   ├─ queues/cron for image variants + notifications (off request path)
   │
Neon Postgres (Prisma 7, pgvector + PostGIS, branch-per-PR)
Meilisearch (geo + facets + ka synonyms + hybrid semanticRatio≈0.4)
Cloudflare R2 + Images (AVIF) + Stream (video tours)   ← zero egress
PostHog EU (funnels/replay/flags) + GA4 tag (Search Console only)
TBC/BOG (GEL acquiring, pre-auth deposits, splits) ─ Stripe added at market #2
Google Maps (adapter) · Resend · Twilio Verify · Sentry (OTel)
```

**Cost envelope:** MVP ≈ **$100–400/mo** all-in. At 1M MAU ≈ **$2,000–3,500/mo** (Vercel ~$874 + R2 ~$100–300 + Meili ~$499 + PostHog ~$450 + services) — with the written Vercel→Cloudflare trigger likely cutting the largest line before it lands.

## 12. Written Migration Triggers (re-evaluate quarterly — "is this still best in 2026+?")

1. Vercel bill >$300/mo sustained → OpenNext on Cloudflare Workers (pre-planned, 2–4 wks)
2. Team >10–15 engineers or mobile public API → extract first module (search/chat) from the monolith
3. Neon: sustained OLTP ceiling / multi-region / HIPAA-class compliance → Aurora via logical replication
4. Gemini: quarterly re-score vs GPT/Claude on ka quality; Gateway makes it a routing change
5. Meilisearch: p99 >200ms sharded, or relevance team hired → Algolia
6. Storage: WORM/Rekognition/multi-PB economics → S3
7. Payments: market #2, >15% foreign cards, or Stripe adds Georgia → Stripe Connect alongside TBC/BOG
8. Maps bill >$5–7K/mo → MapLibre+MapTiler hybrid
9. Email >200–500K/mo → SES · SMS GE >20–30K/mo → SMSOffice.ge primary route
10. Auth: SAML/SCIM enterprise demand → Clerk; Auth.js maintenance stalls → Better Auth

## 13. Immediate Actions (this week, cheapest-first)

1. **Cloudflare DNS/proxy in front of Vercel** — free, instant in-country edge caching for static assets.
2. **Set Vercel billing alert at $150/mo** (migration tripwire at $300).
3. **Adopt R2 + `next/image` custom loader + LQIP-in-Postgres** before listing photos accumulate.
4. **Add PostHog EU + keep GA4 tag**; define the search→listing→contact→booking funnel.
5. **Stand up Gemini via AI SDK + Gateway** (paid tier; 3 Flash for search parsing, Batch for SEO content).
6. **Enable `cacheComponents: true`** and adopt `"use cache"` + `revalidateTag` on listing queries.
7. **Build the ka synonym/stopword list + hybrid search** in Meilisearch; load-test 1M synthetic listings.
8. **Define internal adapters now**: `PaymentProvider`, `sendEmail()`, SMS interface, map adapter, storage `getPublicUrl(key)` — every future migration becomes a days-scale swap.
9. **Build TBC+BOG payments behind the interface** (pre-auth deposits, card-on-file subscriptions, splits).
10. **Add Sentry** with OTel conventions; Web-Vitals monitoring wired to the Lighthouse budget.

*Every decision above is the simplest architecture capable of the mission today, with a priced, dated, trigger-based path to global scale. Technology serves the business; nothing here limits Sivrce's ambition.*
