/** Admin formatting helpers — one place for money/number/date rendering. */

const num = new Intl.NumberFormat("en-US")
const compact = new Intl.NumberFormat("en-US", { notation: "compact" })
const dateFmt = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
})
const dateTimeFmt = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
})

export function fmtNum(n: number | bigint | null | undefined): string {
  if (n === null || n === undefined) return "—"
  return num.format(Number(n))
}

export function fmtCompact(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—"
  return compact.format(n)
}

/** Whole-unit money (Listing.price etc. are stored in full units). */
export function fmtMoney(
  amount: number | null | undefined,
  currency = "GEL",
): string {
  if (amount === null || amount === undefined) return "—"
  const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : "₾"
  return `${symbol}${num.format(amount)}`
}

/** Tetri-denominated money (payments, bids, deposits) → major units. */
export function fmtTetri(
  tetri: number | bigint | null | undefined,
  currency = "GEL",
): string {
  if (tetri === null || tetri === undefined) return "—"
  return fmtMoney(Math.round(Number(tetri) / 100), currency)
}

export function fmtDate(d: Date | null | undefined): string {
  return d ? dateFmt.format(d) : "—"
}

export function fmtDateTime(d: Date | null | undefined): string {
  return d ? dateTimeFmt.format(d) : "—"
}

export function timeAgo(d: Date): string {
  const s = Math.max(1, Math.floor((Date.now() - d.getTime()) / 1000))
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const days = Math.floor(h / 24)
  if (days < 30) return `${days}d ago`
  return fmtDate(d)
}

export function fmtPct(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—"
  return `${Math.round(n * 10) / 10}%`
}
