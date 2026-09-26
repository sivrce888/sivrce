/**
 * Lead fact detection (pure) — what the buyer's own words state, nothing more.
 * Regex floor over ka/en/ru/tr messages; the AI pass (lib/ai.ts) may add the
 * same fields but may never invent one: a field is either present in text or
 * absent from the lead. ponytail: heuristics, not NLP — upgrade to model
 * extraction when the regex recall measurably starves the inbox.
 */

export interface LeadFacts {
  /** Stated budget, normalized to whole GEL. */
  budgetGEL?: number
  rooms?: number
  areaM2?: number
  /** Free-form window exactly as stated ("ოქტომბერში", "12–20 სექტემბერი", "next week"). */
  timeframe?: string
  urgency?: "high" | "normal"
  /** Detected intent beyond the listing's own deal type. */
  intent?: "buy" | "rent" | "daily" | "invest"
}

const GEL_PER_USD = 2.65
const GEL_PER_EUR = 2.9

/** "80k", "80 000", "80,000", "80.000" (EU thousands), "1.2M" → number. */
function parseNum(raw: string): number {
  const s = raw.replace(/\s|\u00a0|,/g, "").replace(/\.(?=\d{3}\b)/g, "")
  const mult = /k$/i.test(s) ? 1_000 : /m$/i.test(s) ? 1_000_000 : 1
  const n = Number.parseFloat(s.replace(/[km]$/i, ""))
  return Number.isFinite(n) ? n * mult : NaN
}

/** "80k$", "80 000 ლარი", "2000 gel", "€500", bare "1500" after the word budget. */
const BUDGET_RE =
  /(\d[\d\s.,]{0,11})\s*(k|m)?\b\s*(\$|usd|dollar|დოლარ|ლარი|gel|lari|€|eur|euro|ევრო)/i
/** "$120,000", "€1500" — symbol first. */
const BUDGET_PREFIX_RE = /([€$])\s*(\d[\d\s.,]{0,11})\s*(k|m)?\b/i
const BUDGET_BARE_RE = /(?:budget|ბიუჯეტი|бюджет)\D{0,12}(\d[\d\s.,]{0,11})\s*(k|m)?\b/i
const ROOMS_RE =
  /(\d{1,2})\s*[- ]?\s*(ოთახიანი|ოთახი|ოთახს|rooms?|bedrooms?|zimmer|комнат[а-у]?)/i
const AREA_RE = /(\d{2,4})\s*(?:მ2|მ²|m2|m²|кв\.? ?м|square ?m)/i

const URGENT_RE =
  /(სასწრაფოდ|სასწრაფო|დაუყოვნებლივ|აუცილებლად|urgent(ly)?|asap|срочно|dringend)/i
const BUY_RE =
  /(ვყიდულობ|ვეძებ შესაძენად|ვარ შემსყიდველი|გასაყიდ|want to buy|i'?m (interested in )?buying|kaufen|купить|покупк)/i
const RENT_RE =
  /(ვქირაობ|ვქირავდე|ქირავნობა|გამოსაქირავებლად|ვარენდებ|ქირავდება|დაქირავება|want to rent|for rent|аренд|mieten)/i
const DAILY_RE =
  /(დღიურად|დღიური|daily|per night|one night|на ночь|посуточно)/i
const INVEST_RE =
  /(ინვესტიცი|ინვესტორ|რენტაბელ|invest(ment)?|roi|rental yield|инвест|kapitalanlage)/i

const TIMEFRAME_WORDS = [
  // ka
  /(ამ კვირას|მომდევნო კვირას|ამ თვეს|მომდევნო თვეს|დღეს|ხვალ|ზეგ|ორშაბათს?[ა-მ]?)\b/i,
  // months with optional day numbers: "12-20 სექტემბერი", "ოქტომბერში"
  /(\d{1,2}\s*[-–—]\s*\d{1,2}\s+(იანვარი|თებერვალი|მარტი|აპრილი|მაისი|ივნისი|ივლისი|აგვისტო|სექტემბერი|ოქტომბერი|ნოემბერი|დეკემბერი))/i,
  /(იანვარს?|თებერვალს?|მარტს?|აპრილს?|მაისს?|ივნისს?|ივლისს?|აგვისტ[ოშ]|სექტემბერს?|ოქტომბერს?|ნოემბერს?|დეკემბერს?)\b/i,
  /\b(today|tomorrow|this week|next week|this month|next month)\b/i,
  /\b(сегодня|завтра|на этой неделе|на следующей неделе)\b/i,
  /(\d{1,2}\s*[-–—]\s*\d{1,2}\s+(januar|februar|märz|april|mai|juni|juli|august|september|oktober|november|dezember|january|february|march|may|june|july|august|october|november|december))/i,
]

function firstMatch(text: string, res: RegExp[]): string | null {
  for (const re of res) {
    const m = text.match(re)
    if (m) return m[0]
  }
  return null
}

/** Extract what the message itself states. No defaults, no inference, no rounding. */
export function detectLeadFacts(raw: string): LeadFacts {
  const text = raw.replace(/\u00a0/g, " ")
  const facts: LeadFacts = {}

  const b = text.match(BUDGET_RE) ?? null
  const p = text.match(BUDGET_PREFIX_RE)
  if (b || p) {
    let n: number
    let cur: string
    if (p) {
      n = parseNum(p[2]) * (/k/i.test(p[3] ?? "") ? 1_000 : /m/i.test(p[3] ?? "") ? 1_000_000 : 1)
      cur = p[1]
    } else if (b) {
      n = parseNum(b[1]) * (/k/i.test(b[2] ?? "") ? 1_000 : /m/i.test(b[2] ?? "") ? 1_000_000 : 1)
      cur = b[3] ?? "$"
    } else {
      const bare = text.match(BUDGET_BARE_RE)!
      n = parseNum(bare[1]) * (/k/i.test(bare[2] ?? "") ? 1_000 : /m/i.test(bare[2] ?? "") ? 1_000_000 : 1)
      cur = "$"
    }
    if (Number.isFinite(n) && n >= 50 && n <= 500_000_000) {
      cur = cur.toLowerCase()
      const rate = /€|eur|ევრ/.test(cur) ? GEL_PER_EUR : /ლარ|gel|lari/.test(cur) ? 1 : GEL_PER_USD
      facts.budgetGEL = Math.round(n * rate)
    }
  }

  const r = text.match(ROOMS_RE)
  if (r) {
    const n = Number.parseInt(r[1], 10)
    if (n >= 1 && n <= 20) facts.rooms = n
  }

  const a = text.match(AREA_RE)
  if (a) {
    const n = Number.parseInt(a[1], 10)
    if (n >= 10 && n <= 5_000) facts.areaM2 = n
  }

  if (URGENT_RE.test(text)) facts.urgency = "high"

  if (DAILY_RE.test(text)) facts.intent = "daily"
  else if (RENT_RE.test(text)) facts.intent = "rent"
  else if (BUY_RE.test(text)) facts.intent = "buy"
  else if (INVEST_RE.test(text)) facts.intent = "invest"

  const tf = firstMatch(text, TIMEFRAME_WORDS)
  if (tf) facts.timeframe = tf.trim()

  return facts
}

const NUM_FACT_KEYS = ["budgetGEL", "rooms", "areaM2"] as const

/** Detection inputs may carry explicit nulls (AI schema) — same shape, but
 * every field additionally accepts null and is treated as "not stated". */
export type LeadFactsInput = { [K in keyof LeadFacts]: LeadFacts[K] | null }

/**
 * Merge newer detection over stored facts. Numeric fields prefer the newer
 * value (buyers refine budgets as talks advance); free-form timeframe keeps
 * the newest mention; intent only ever fills an empty slot.
 */
export function mergeLeadFacts(
  prev: LeadFacts | null | undefined,
  next: LeadFactsInput,
): LeadFacts {
  const out: LeadFacts = { ...(prev ?? {}) }
  for (const k of NUM_FACT_KEYS) {
    const v = next[k]
    if (v !== undefined && v !== null) out[k] = v
  }
  if (next.timeframe) out.timeframe = next.timeframe
  if (next.urgency) out.urgency = next.urgency
  if (!out.intent && next.intent) out.intent = next.intent
  return out
}
