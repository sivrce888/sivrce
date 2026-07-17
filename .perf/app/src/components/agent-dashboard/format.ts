const dateFmt = new Intl.DateTimeFormat("ka-GE", {
  day: "numeric",
  month: "short",
  year: "numeric",
})
const numFmt = new Intl.NumberFormat("ka-GE")

export function fmtDate(d: Date): string {
  return dateFmt.format(d)
}

export function fmtPrice(price: number, currency: string): string {
  const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : "₾"
  return `${symbol}${numFmt.format(price)}`
}

export type BadgeTone = "green" | "blue" | "orange" | "red" | "neutral"

export const listingStatusLabel: Record<string, string> = {
  active: "აქტიური",
  sold: "გაყიდული",
  pending: "მოლოდინში",
  expired: "ვადაგასული",
  withdrawn: "მოხსნილი",
}
export const listingStatusTone: Record<string, BadgeTone> = {
  active: "green",
  sold: "blue",
  pending: "orange",
  expired: "neutral",
  withdrawn: "red",
}

export const tierLabel: Record<string, string> = {
  standard: "სტანდარტი",
  vip: "VIP",
  super_vip: "Super VIP",
  diamond: "Diamond",
}

export const leadStatusLabel: Record<string, string> = {
  new: "ახალი",
  contacted: "დაკავშირებული",
  viewing_scheduled: "ვიზიტი დაგეგმილი",
  offer_made: "შეთავაზება გაკეთდა",
  negotiating: "მოლაპარაკება",
  closed_won: "მოგებული",
  closed_lost: "წაგებული",
  disqualified: "არაკვალიფიციური",
}
export const leadStatusTone: Record<string, BadgeTone> = {
  new: "blue",
  contacted: "orange",
  viewing_scheduled: "orange",
  offer_made: "orange",
  negotiating: "orange",
  closed_won: "green",
  closed_lost: "red",
  disqualified: "neutral",
}

export const tourStatusLabel: Record<string, string> = {
  pending: "მოლოდინში",
  confirmed: "დადასტურებული",
  cancelled_by_guest: "სტუმარმა გააუქმა",
  cancelled_by_agent: "აგენტმა გააუქმა",
  completed: "დასრულებული",
  no_show: "არ გამოცხადდა",
}
export const tourStatusTone: Record<string, BadgeTone> = {
  pending: "orange",
  confirmed: "green",
  cancelled_by_guest: "red",
  cancelled_by_agent: "red",
  completed: "blue",
  no_show: "neutral",
}
