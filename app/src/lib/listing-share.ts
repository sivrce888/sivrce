/**
 * Agent 1-click pack: title + price + m² + place + URL.
 * WhatsApp / clipboard / Web Share all consume the same string.
 */

export type ListingShareInput = {
  title: string
  district: string
  city: string
  priceLabel: string
  area?: number
  agentName?: string
  agency?: string
}

export function listingPriceLabel(price: number, currency: string): string {
  if (!(price > 0)) return ""
  const n = Math.round(price).toLocaleString("en-US")
  if (currency === "USD" || currency === "$") return `$${n}`
  if (currency === "GEL" || currency === "₾") return `${n} ₾`
  return `${n} ${currency}`
}

export function listingShareLines(input: ListingShareInput): string[] {
  const loc = [input.district.trim(), input.city.trim()].filter(Boolean).join(", ")
  const area =
    typeof input.area === "number" && input.area > 0 ? `${Math.round(input.area)} მ²` : ""
  const stats = [input.priceLabel.trim(), area, loc].filter(Boolean).join(" · ")
  const who = [input.agentName?.trim(), input.agency?.trim()].filter(Boolean).join(" · ")
  return [input.title.trim(), stats, who].filter((s) => s.length > 0)
}

export function listingShareText(input: ListingShareInput, url: string): string {
  return [...listingShareLines(input), url.trim()].filter(Boolean).join("\n")
}

/** Opens WhatsApp contact picker with the pack prefilled (no recipient number). */
export function waSendHref(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`
}
