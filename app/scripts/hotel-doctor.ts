/**
 * Hotel provider doctor — run: npm run hotels:doctor
 *
 * Answers one question: will the hotels page show real prices right now, and
 * if not, which credential is missing or which upstream is down. Hits the live
 * providers on purpose, so it is NOT part of prebuild (no network in checks).
 *
 * Exit 1 only on a real misconfiguration — credentials present but broken.
 * Credentials simply absent is a valid state and exits 0 with instructions,
 * because that is the project's current reality, not a failure.
 */

import { config } from "dotenv"

config({ path: ".env.local", quiet: true })
config({ path: ".env", quiet: true })

const TBILISI = { lat: 41.7151, lng: 44.8271 }
const ok = (s: string) => `  ✓ ${s}`
const bad = (s: string) => `  ✗ ${s}`
const warn = (s: string) => `  ! ${s}`

function isoDaysOut(n: number): string {
  return new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10)
}

const checkIn = isoDaysOut(30)
const checkOut = isoDaysOut(33)

let fatal = false

/* ── 1. Which credentials exist ─────────────────────────────────────────── */

const vars = {
  LITEAPI_KEY: process.env.LITEAPI_KEY,
  AMADEUS_CLIENT_ID: process.env.AMADEUS_CLIENT_ID,
  AMADEUS_CLIENT_SECRET: process.env.AMADEUS_CLIENT_SECRET,
  AMADEUS_ENV: process.env.AMADEUS_ENV,
  HOTEL_MARGIN_PCT: process.env.HOTEL_MARGIN_PCT,
  HOTEL_BOOKING_AID: process.env.HOTEL_BOOKING_AID,
  HOTEL_EXPEDIA_AFFLID: process.env.HOTEL_EXPEDIA_AFFLID,
}

console.log("\nCredentials")
for (const [k, v] of Object.entries(vars)) {
  console.log(v ? ok(`${k} set`) : warn(`${k} not set`))
}

const hasAmadeus = Boolean(vars.AMADEUS_CLIENT_ID && vars.AMADEUS_CLIENT_SECRET)
const base =
  process.env.AMADEUS_BASE ??
  (vars.AMADEUS_ENV === "prod" ? "https://api.amadeus.com" : "https://test.api.amadeus.com")

async function main() {
  /* ── 1b. LiteAPI: the bookable path, and the first one tried ────────────── */

  console.log("\nLiteAPI (Nuitee Connect)")
  if (!process.env.LITEAPI_KEY) {
    console.log(warn("LITEAPI_KEY not set — skipped, nothing bookable on the site."))
    console.log("    Free sandbox key, no credit card: https://liteapi.travel → sign up →")
    console.log("    dashboard → Developers → API Keys → copy the sandbox key.")
    console.log("    This is the fastest route to real prices AND real bookings.")
  } else {
    const t0 = Date.now()
    try {
      const res = await fetch("https://api.liteapi.travel/v3.0/hotels/rates", {
        method: "POST",
        headers: { "content-type": "application/json", "X-API-Key": process.env.LITEAPI_KEY },
        body: JSON.stringify({
          checkin: checkIn,
          checkout: checkOut,
          currency: "EUR",
          guestNationality: process.env.LITEAPI_GUEST_NATIONALITY ?? "GE",
          occupancies: [{ adults: 2 }],
          latitude: TBILISI.lat,
          longitude: TBILISI.lng,
          radius: 8000,
          limit: 60,
          timeout: 6,
          includeHotelData: true,
        }),
        signal: AbortSignal.timeout(20_000),
      })
      const ms = Date.now() - t0
      if (!res.ok) {
        fatal = true
        console.log(bad(`rates ${res.status} in ${ms}ms — ${(await res.text()).slice(0, 160)}`))
        console.log("    401 = bad/expired key. Re-copy it from the dashboard API Keys tab.")
      } else {
        const json = (await res.json()) as {
          data?: { hotelId?: string; hotel?: { name?: string }; roomTypes?: unknown[] }[]
        }
        const rows = json.data ?? []
        const priced = rows.filter((r) => (r.roomTypes?.length ?? 0) > 0)
        console.log(
          priced.length
            ? ok(`${priced.length} Tbilisi hotels with live rates in ${ms}ms`)
            : warn(`0 priced hotels in ${ms}ms — sandbox inventory may not cover Tbilisi`),
        )
        for (const r of priced.slice(0, 3)) {
          console.log(`      ${r.hotel?.name ?? r.hotelId} — ${r.roomTypes!.length} offers`)
        }
        if (priced.length) {
          console.log(ok("Hotels page will use LiteAPI. Xotelo is off the path entirely."))
          console.log(
            "    This also answers the coverage question nobody publishes: that count IS",
          )
          console.log("    the real Tbilisi inventory. Compare it against Booking.com for the same dates.")
        }
      }
    } catch (err) {
      fatal = true
      console.log(bad(`rates request failed — ${(err as Error).message}`))
    }
  }

  /* ── 2. Amadeus: token, then a real Tbilisi search ──────────────────────── */

  console.log(`\nAmadeus GDS  (${hasAmadeus ? base : "skipped — no keys"})`)

  if (!hasAmadeus) {
    console.log(warn("No keys → every search falls back to the OSM directory + Xotelo."))
    console.log(
      "    Amadeus Self-Service is CLOSED to new signups (paused Mar 2026, portal sunset) —\n" +
        "    existing keys still work, new ones cannot be created. LiteAPI above is the free\n" +
        "    signup route for real prices AND bookings.",
    )
  } else {
    let token: string | null = null
    try {
      const res = await fetch(`${base}/v1/security/oauth2/token`, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: vars.AMADEUS_CLIENT_ID!,
          client_secret: vars.AMADEUS_CLIENT_SECRET!,
        }),
      })
      const json = (await res.json()) as { access_token?: string; error_description?: string }
      if (!res.ok || !json.access_token) {
        fatal = true
        console.log(bad(`token ${res.status} — ${json.error_description ?? "no access_token"}`))
        console.log("    Keys are set but rejected. Re-copy them from My Self-Service Workspace.")
        console.log(`    If the app is a Production app, set AMADEUS_ENV=prod (currently ${vars.AMADEUS_ENV ?? "test"}).`)
      } else {
        token = json.access_token
        console.log(ok("token acquired"))
      }
    } catch (err) {
      fatal = true
      console.log(bad(`token request failed — ${(err as Error).message}`))
      console.log("    DNS or network. api.amadeus.com must resolve from wherever this runs.")
    }

    if (token) {
      try {
        const listRes = await fetch(
          `${base}/v1/reference-data/locations/hotels/by-geocode` +
            `?latitude=${TBILISI.lat}&longitude=${TBILISI.lng}&radius=8&radiusUnit=KM&hotelSource=ALL`,
          { headers: { authorization: `Bearer ${token}` } },
        )
        const listJson = (await listRes.json()) as { data?: { hotelId?: string }[] }
        const ids = (listJson.data ?? []).map((h) => h.hotelId).filter(Boolean).slice(0, 20)
        console.log(ids.length ? ok(`${ids.length} hotels near Tbilisi`) : bad("0 hotels near Tbilisi"))

        if (ids.length) {
          const offRes = await fetch(
            `${base}/v3/shopping/hotel-offers?hotelIds=${ids.join(",")}&adults=2` +
              `&checkInDate=${checkIn}&checkOutDate=${checkOut}&roomQuantity=1` +
              `&currencyCode=EUR&bestRateOnly=true&includeClosed=false`,
            { headers: { authorization: `Bearer ${token}` } },
          )
          const offJson = (await offRes.json()) as {
            data?: { hotel?: { name?: string }; offers?: { price?: { total?: string; currency?: string } }[] }[]
          }
          const priced = (offJson.data ?? []).filter((e) => e.offers?.[0]?.price?.total)
          console.log(
            priced.length
              ? ok(`${priced.length} priced offers for ${checkIn} → ${checkOut}`)
              : warn(`0 priced offers for ${checkIn} → ${checkOut} (normal on test inventory)`),
          )
          for (const e of priced.slice(0, 3)) {
            const p = e.offers![0].price!
            console.log(`      ${e.hotel?.name} — ${p.total} ${p.currency}`)
          }
          if (priced.length) {
            console.log(ok("Hotels page will render GDS prices. Xotelo is no longer on the path."))
          }
        }
      } catch (err) {
        fatal = true
        console.log(bad(`search failed — ${(err as Error).message}`))
      }
    }
  }

  /* ── 3. Xotelo: the fallback everything currently depends on ────────────── */

  console.log("\nXotelo OTA fallback  (unofficial, unauthenticated)")
  {
    // Rooms Hotel Tbilisi — the verified seed key. If this returns rates, the
    // fallback is alive; empty means throttled or upstream-blocked, and the
    // hotels page will (honestly) show no prices.
    const url =
      "https://data.xotelo.com/api/rates?hotel_key=g294195-d7171589" +
      `&chk_in=${checkIn}&chk_out=${checkOut}&currency=EUR&adults=2`
    const t0 = Date.now()
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(20_000) })
      const json = (await res.json()) as { result?: { rates?: { name?: string; rate?: number }[] } }
      const rates = json?.result?.rates ?? []
      const ms = Date.now() - t0
      if (rates.length) {
        const min = Math.min(...rates.map((r) => Number(r.rate)).filter(Number.isFinite))
        console.log(ok(`${rates.length} OTA rates in ${ms}ms — best €${min}/night`))
      } else {
        console.log(warn(`0 rates in ${ms}ms — throttled or upstream blocked`))
        console.log("    Returns error:null + rates:[] when rate-limited, indistinguishable from")
        console.log("    genuine no-availability. This is why the page must not depend on it.")
      }
      if (ms > 12_000) {
        console.log(bad(`slower than the ${12_000}ms client budget in hotels.ts — raise XOTELO_TIMEOUT_MS`))
      }
    } catch (err) {
      console.log(warn(`unreachable — ${(err as Error).message}`))
    }
  }

  /* ── 4. Affiliate links: the revenue path ───────────────────────────────── */

  console.log("\nAffiliate revenue")
  console.log(
    vars.HOTEL_BOOKING_AID
      ? ok("Booking.com aid set — outbound links tracked")
      : warn("HOTEL_BOOKING_AID not set — Booking.com clicks earn nothing"),
  )
  console.log(
    vars.HOTEL_EXPEDIA_AFFLID
      ? ok("Expedia afflid set — outbound links tracked")
      : warn("HOTEL_EXPEDIA_AFFLID not set — Expedia clicks earn nothing"),
  )
  if (!vars.HOTEL_BOOKING_AID || !vars.HOTEL_EXPEDIA_AFFLID) {
    console.log("    Booking.com: free affiliate program (booking.com/affiliate-program).")
    console.log("    Expedia: creator.expediagroup.com/affiliates — approval takes a few days.")
    console.log("    Both issue the ID in their dashboard after approval; it cannot be fabricated.")
  }

  /* ── Verdict ────────────────────────────────────────────────────────────── */

  console.log(
    `\n${
      fatal
        ? "FAIL — credentials are present but not working (see ✗ above)."
        : hasAmadeus
          ? "OK — Amadeus path is live."
          : "OK — no credentials set; running on the directory + OTA fallback by design."
    }\n`,
  )
  process.exit(fatal ? 1 : 0)
}

main()
