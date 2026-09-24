/**
 * Dashboard persona — UI identity on top of UserRole.
 * tenant → buyer, landlord → seller. Cookie is the only extra state.
 * Client-safe — cookie I/O lives in workspace-cookie.ts (server-only).
 * ponytail: no Prisma enum for landlord/tenant; add DB roles if CRM must diverge.
 */
import type { UserRole } from "@/generated/prisma/client"
import { panelLang } from "@/lib/i18n/core"

export const PERSONA_COOKIE = "sv-persona"

export const CONSUMER_PERSONAS = ["buyer", "tenant", "seller", "landlord"] as const
export const PRO_PERSONAS = ["agent", "agency", "developer"] as const
export const PERSONAS = [...CONSUMER_PERSONAS, ...PRO_PERSONAS, "admin"] as const

export type ConsumerPersona = (typeof CONSUMER_PERSONAS)[number]
export type ProPersona = (typeof PRO_PERSONAS)[number]
export type Persona = (typeof PERSONAS)[number]

export function isPersona(value: string): value is Persona {
  return (PERSONAS as readonly string[]).includes(value)
}

export function parsePersonaIntent(raw: string | null | undefined): Persona | null {
  const v = String(raw ?? "").trim()
  if (v === "admin") return null
  return isPersona(v) ? v : null
}

export function roleForPersona(persona: Persona): UserRole {
  switch (persona) {
    case "tenant":
      return "buyer"
    case "landlord":
      return "seller"
    default:
      return persona
  }
}

export function personaFromRole(role: UserRole, cookie?: string | null): Persona {
  if (role === "buyer") return cookie === "tenant" ? "tenant" : "buyer"
  if (role === "seller") return cookie === "landlord" ? "landlord" : "seller"
  return role
}

export const PERSONA_LABEL_KA: Record<Exclude<Persona, "admin">, { title: string; blurb: string }> = {
  buyer: { title: "მყიდველი", blurb: "ძიება, ფავორიტები და ტურები" },
  tenant: { title: "დამქირავებელი", blurb: "ქირა, შენახული ძიებები, ვიზიტები" },
  seller: { title: "გამყიდველი", blurb: "გაყიდვა, განცხადებები და ლიდები" },
  landlord: { title: "გამქირავებელი", blurb: "ქირა, განცხადებები და დამქირავებლები" },
  agent: { title: "აგენტი", blurb: "პორტფოლიო, ტურები, კლიენტები" },
  agency: { title: "სააგენტო", blurb: "გუნდი, ანალიტიკა, ლიდები" },
  developer: { title: "დეველოპერი", blurb: "პროექტები, ბინები და ლიდები" },
}

/** Dashboard shell title per persona + locale (ka default keeps old behavior). */
export function panelTitle(persona: Persona, lang = "ka"): string {
  const T: Record<Persona, { ka: string; en: string; de: string }> = {
    buyer: { ka: "ჩემი სივრცე", en: "Buyer account", de: "Käufer-Konto" },
    tenant: { ka: "დამქირავებლის პანელი", en: "Tenant dashboard", de: "Mieter-Dashboard" },
    seller: { ka: "გამყიდველის პანელი", en: "Seller dashboard", de: "Verkäufer-Dashboard" },
    landlord: { ka: "გამქირავებლის პანელი", en: "Landlord dashboard", de: "Vermieter-Dashboard" },
    agent: { ka: "აგენტის პანელი", en: "Agent dashboard", de: "Makler-Dashboard" },
    agency: { ka: "სააგენტოს პანელი", en: "Agency dashboard", de: "Agentur-Dashboard" },
    developer: { ka: "დეველოპერის პანელი", en: "Developer dashboard", de: "Bauträger-Dashboard" },
    admin: { ka: "ადმინ პანელი", en: "Admin panel", de: "Admin-Panel" },
  }
  const t = T[persona]
  return t[panelLang(lang)]
}

export function isRentFocus(persona: Persona): boolean {
  return persona === "tenant" || persona === "landlord"
}

export function addListingHref(persona: Persona): string {
  if (persona === "landlord") return "/add-listing?deal=rent"
  if (persona === "developer") return "/add-listing?deal=sale&propType=apartment"
  return "/add-listing"
}

export function searchHref(deal: "sale" | "rent"): string {
  return `/search?deal=${deal}`
}

export function personaFromDealType(dealType: string): "seller" | "landlord" {
  return dealType === "buy" || dealType === "mortgage" ? "seller" : "landlord"
}
