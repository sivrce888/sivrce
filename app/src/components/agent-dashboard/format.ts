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

const L = {
  ka: {
    listing: {
      active: "აქტიური",
      sold: "გაყიდული",
      pending: "მოლოდინში",
      expired: "ვადაგასული",
      withdrawn: "მოხსნილი",
    },
    tier: {
      standard: "სტანდარტი",
      vip: "VIP",
      super_vip: "Super VIP",
      diamond: "Diamond",
    },
    lead: {
      new: "ახალი",
      contacted: "დაკავშირებული",
      viewing_scheduled: "ვიზიტი დაგეგმილი",
      offer_made: "შეთავაზება გაკეთდა",
      negotiating: "მოლაპარაკება",
      closed_won: "მოგებული",
      closed_lost: "წაგებული",
      disqualified: "დისკვალიფიცირებული",
    },
    tour: {
      pending: "მოლოდინში",
      confirmed: "დადასტურებული",
      cancelled_by_guest: "სტუმარმა გააუქმა",
      cancelled_by_agent: "აგენტმა გააუქმა",
      completed: "დასრულებული",
      no_show: "არ გამოცხადდა",
    },
  },
  en: {
    listing: {
      active: "Active",
      sold: "Sold",
      pending: "Pending",
      expired: "Expired",
      withdrawn: "Withdrawn",
    },
    tier: {
      standard: "Standard",
      vip: "VIP",
      super_vip: "Super VIP",
      diamond: "Diamond",
    },
    lead: {
      new: "New",
      contacted: "Contacted",
      viewing_scheduled: "Viewing scheduled",
      offer_made: "Offer made",
      negotiating: "Negotiating",
      closed_won: "Won",
      closed_lost: "Lost",
      disqualified: "Disqualified",
    },
    tour: {
      pending: "Pending",
      confirmed: "Confirmed",
      cancelled_by_guest: "Cancelled by guest",
      cancelled_by_agent: "Cancelled by agent",
      completed: "Completed",
      no_show: "No-show",
    },
  },
  de: {
    listing: {
      active: "Aktiv",
      sold: "Verkauft",
      pending: "Ausstehend",
      expired: "Abgelaufen",
      withdrawn: "Zurückgezogen",
    },
    tier: {
      standard: "Standard",
      vip: "VIP",
      super_vip: "Super VIP",
      diamond: "Diamond",
    },
    lead: {
      new: "Neu",
      contacted: "Kontaktiert",
      viewing_scheduled: "Besichtigung geplant",
      offer_made: "Angebot unterbreitet",
      negotiating: "Verhandlung",
      closed_won: "Gewonnen",
      closed_lost: "Verloren",
      disqualified: "Disqualifiziert",
    },
    tour: {
      pending: "Ausstehend",
      confirmed: "Bestätigt",
      cancelled_by_guest: "Vom Gast abgesagt",
      cancelled_by_agent: "Vom Agent abgesagt",
      completed: "Abgeschlossen",
      no_show: "Nicht erschienen",
    },
  },
} as const

type Loc = keyof typeof L

function locOf(lang: string): Loc {
  return lang === "en" ? "en" : lang === "de" ? "de" : "ka"
}

export function listingStatusLabel(lang: string): Record<string, string> {
  return L[locOf(lang)].listing
}

export function tierLabel(lang: string): Record<string, string> {
  return L[locOf(lang)].tier
}

export function leadStatusLabel(lang: string): Record<string, string> {
  return L[locOf(lang)].lead
}

export function tourStatusLabel(lang: string): Record<string, string> {
  return L[locOf(lang)].tour
}

export const listingStatusTone: Record<string, BadgeTone> = {
  active: "green",
  sold: "blue",
  pending: "orange",
  expired: "neutral",
  withdrawn: "red",
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

export const tourStatusTone: Record<string, BadgeTone> = {
  pending: "orange",
  confirmed: "green",
  cancelled_by_guest: "red",
  cancelled_by_agent: "red",
  completed: "blue",
  no_show: "neutral",
}
