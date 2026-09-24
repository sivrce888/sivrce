import { panelLang } from "@/lib/i18n/core"
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
    inquiry: {
      new: "ახალი",
      contacted: "დაკავშირებული",
      qualified: "კვალიფიცირებული",
      closed: "დახურული",
    },
    project: {
      construction: "მშენებარე",
      completed: "დასრულებული",
      planned: "დაგეგმილი",
      draft: "მონახაზი",
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
    inquiry: {
      new: "New",
      contacted: "Contacted",
      qualified: "Qualified",
      closed: "Closed",
    },
    project: {
      construction: "Under construction",
      completed: "Completed",
      planned: "Planned",
      draft: "Draft",
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
    inquiry: {
      new: "Neu",
      contacted: "Kontaktiert",
      qualified: "Qualifiziert",
      closed: "Abgeschlossen",
    },
    project: {
      construction: "Im Bau",
      completed: "Fertiggestellt",
      planned: "Geplant",
      draft: "Entwurf",
    },
  },
} as const

type Loc = keyof typeof L

function locOf(lang: string): Loc {
  return panelLang(lang)
}

const DATE_FMTS: Record<Loc, Intl.DateTimeFormat> = {
  ka: new Intl.DateTimeFormat("ka-GE", { day: "numeric", month: "short", year: "numeric" }),
  en: new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }),
  de: new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "short", year: "numeric" }),
}

const NUM_FMTS: Record<Loc, Intl.NumberFormat> = {
  ka: new Intl.NumberFormat("ka-GE"),
  en: new Intl.NumberFormat("en-GB"),
  de: new Intl.NumberFormat("de-DE"),
}

export function fmtDate(d: Date, lang = "ka"): string {
  return DATE_FMTS[locOf(lang)].format(d)
}

export function fmtNum(n: number, lang = "ka"): string {
  return NUM_FMTS[locOf(lang)].format(n)
}

export function fmtPrice(price: number, currency: string, lang = "ka"): string {
  const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : "₾"
  const loc = locOf(lang)
  const n = NUM_FMTS[loc].format(price)
  return loc === "de" ? `${n} ${symbol}` : `${symbol}${n}`
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

export function inquiryStatusLabel(lang: string): Record<string, string> {
  return L[locOf(lang)].inquiry
}

export function projectStatusLabel(lang: string): Record<string, string> {
  return L[locOf(lang)].project
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
