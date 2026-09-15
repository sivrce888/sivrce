# Hotel providers — what to register, in what order

Researched 2026-09-14. Run `npm run hotels:doctor` (in `app/`) after every step —
it reports exactly which credential is missing or which upstream is failing.

## Why this document exists

`searchHotels` tries three paths in order:

1. **LiteAPI (Nuitee Connect)** — used when `LITEAPI_KEY` is set. The only
   *bookable* path (search → prebook → book), so it is the one that lets sivrce
   be merchant of record. Adapter is written and tested; it needs only a key.
2. **Amadeus GDS** — used when `AMADEUS_CLIENT_ID` + `AMADEUS_CLIENT_SECRET` are set.
3. **OSM directory + Xotelo OTA mins** — the fallback. No key, and the only path running today.

Neither Amadeus key is set, so *every* search takes the fallback. The fallback's
price source (Xotelo) is an unofficial, unauthenticated scraper that rate-limits
by IP and, when throttled, returns `error: null` with `rates: []` — indistinguishable
from a hotel genuinely having no availability. That is why the hotels page shows a
"live prices unavailable" notice instead of a price-less directory: the code cannot
tell the difference, so it stops claiming.

**No amount of code fixes this.** It needs credentials.

## 1. LiteAPI — do this first

Free sandbox key, no credit card, and it is the only option that makes hotels
*bookable* rather than a referral wall.

1. Sign up at <https://liteapi.travel>.
2. Dashboard → **Developers** → **API Keys** → copy the sandbox key.
3. Into `app/.env.local`:
   ```
   LITEAPI_KEY=<sandbox key>
   ```
4. `npm run hotels:doctor` → it runs a real Tbilisi rates search and prints the
   properties it found.

That doctor output also settles the coverage question no vendor publishes: the
count it prints **is** the real Tbilisi inventory. Compare it against
Booking.com for the same dates before committing to this provider.

Production needs a card on file (dashboard → Payment Methods) — same base URL,
the key decides the environment, so no code change.

### Pricing rule, already implemented

LiteAPI returns two numbers per offer. `offerRetailRate` is what we pay;
`suggestedSellingPrice` is what their terms require be displayed publicly. The
adapter shows SSP and books at retail, making the spread the fee.
`HOTEL_MARGIN_PCT` is only a fallback for offers with no SSP. Applying our flat
margin on top of retail would both break their revenue rules and misprice
against the market.

## 2. Amadeus Self-Service

Free, self-serve, keys in minutes. This is the one that actually removes the
Xotelo dependency.

1. Register at <https://developers.amadeus.com>, activate via the emailed link.
2. Sign in → username menu (top right) → **My Self-Service Workspace**.
3. **Create new app** → name it → Create.
4. Scroll to **App keys** → copy the Key and Secret.
5. Into `app/.env.local`:
   ```
   AMADEUS_CLIENT_ID=<key>
   AMADEUS_CLIENT_SECRET=<secret>
   AMADEUS_ENV=test
   ```
6. `npm run hotels:doctor` → expect "token acquired".

### The catch: test keys return test inventory

Test keys authenticate fine and return *Amadeus test data*, not real Tbilisi
hotels. They prove the code path works; they do not produce sellable prices.
Expect the doctor to report hotels found but few or zero priced offers — that is
normal on test, not a bug.

### Moving to production

Same workspace → select the app → **Get Production environment** → personal +
billing + app details → choose payment method → sign the ToS on DocuSign →
status goes *pending* until validated.

Then set `AMADEUS_ENV=prod`. The code already switches the base URL to
`https://api.amadeus.com` on that value alone.

Free monthly request quota carries over to production; overage is billed per the
Amadeus pricing page, and rates differ per API.

> Amadeus auto-revokes keys it finds published. Keep them in `.env.local`
> (gitignored) — never in source.

## 3. Affiliate IDs — the extra revenue path

Outbound "book" links currently earn nothing. These IDs are issued in each
partner's dashboard after approval and **cannot be fabricated** — a link with an
invented ID simply does not track.

| Var | Program | Gate |
|---|---|---|
| `HOTEL_BOOKING_AID` | Booking.com Affiliate Partner Program | Free to join |
| `HOTEL_EXPEDIA_AFFLID` | Expedia — <https://creator.expediagroup.com/affiliates> | Approval, a few days |

### Booking.com Demand API is *not* an option yet

Worth knowing so nobody plans around it: the Demand API (real search/book
inventory, as opposed to deep links) requires **Managed** Affiliate Partner
status — a signed contract and an assigned Account Manager who enables Partner
Centre and issues credentials. Even the sandbox is gated. Booking through the
Orders endpoints needs a further "Search, Look & Book" approval.

The plain affiliate program is a much lower bar and is all `HOTEL_BOOKING_AID`
needs. Our code only deep-links; it never calls the Demand API.

### Booking.com partner terms restrict AI involvement

Booking.com's General Partner Terms (v5) prohibit using an AI system — or
technology integrated with one — in performing the agreement without their prior
written approval, and separately prohibit using their materials to train an AI
system. Their Customer Terms likewise prohibit unauthorised automated assistants
interacting with the site.

This is a business/legal call, not a technical one. It bears on how this codebase
is allowed to interact with Booking.com if the relationship ever goes beyond
affiliate deep links. Raise it with them in writing rather than assuming.

## 4. Optional

```
HOTEL_MARGIN_PCT=8     # 0–30, added to the provider quote. Default 8.
```

## Current state

```
LITEAPI_KEY           (not set)   → bookable path never runs
AMADEUS_CLIENT_ID     (not set)   → GDS path never runs
AMADEUS_CLIENT_SECRET (not set)
HOTEL_BOOKING_AID     (not set)   → Booking.com clicks earn nothing
HOTEL_EXPEDIA_AFFLID  (not set)   → Expedia clicks earn nothing
Xotelo                throttled   → 0 rates, ~7.6s per request
```

Hotels is a directory with outbound links: no first-party prices, no revenue.
Step 1 changes that in an afternoon. Steps 2–3 add depth and monetise the rest.

## Provider comparison

Scored for this codebase's situation — access is the blocker, Tbilisi is the
market. Weights: access today 30%, Georgia coverage 25%, bookable 20%, fit with
existing code 15%, commercials 10%.

| Provider | Score | Access | Bookable |
|---|---|---|---|
| LiteAPI (Nuitee) | 80 | Sandbox key, no card, minutes | Yes |
| RateHawk (ETG) | 72 | Approval → sandbox in 48h | Yes |
| Amadeus Self-Service | 70 | Already wired | Limited |
| Travelpayouts / Hotellook | 61 | Free signup | No — redirect only |
| Hotelbeds APItude | 61 | Enterprise onboarding | Yes |
| TBO Holidays | 56 | Verified agency account | Yes |
| Expedia Rapid | 55 | Contract + site review | Yes |
| Booking.com Demand API | 52 | Managed partner + contract | Gated further |

The Georgia-coverage column is inference from each provider's regional strength,
not measured fact — nobody publishes Tbilisi property counts. A LiteAPI sandbox
key measures it for free in minutes; trust that over this table.

**RateHawk is worth starting in parallel**: strongest signal for CIS / Eastern
Europe / emerging markets, aggregates 200+ suppliers (including Hotelbeds and
WebBeds) through one integration, no IATA and no volume minimums. It is the slow
one — certification plus a cited 2–3 months of engineering — so apply early.
