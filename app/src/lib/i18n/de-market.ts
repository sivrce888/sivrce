/**
 * Germany-market chrome overlay.
 *
 * `de.ts` is German-for-Georgia (sivrce.ge/de). On the Germany market
 * (sivrce.com/de, sivrce.de) the same locale must not mention Tiflis.
 * Overlay is a Partial — Georgia keys stay unless replaced.
 *
 * Server-only: layout merges this into the RSC dict prop. Do not import
 * from 'use client' modules (i18n.check bans dicts on the client; this
 * file is the overlay, not the table, but keeping it server-side avoids
 * a second chrome path).
 *
 * ponytail: Partial overlay, not a second dictionary. Ceiling: de+en only
 * (the two languages German visitors actually use). Other locales on /de
 * keep their Georgia-flavoured chrome until a visitor volume justifies it.
 */
import type { DictKey } from './ka'
import type { Lang } from './core'

const DE: Partial<Record<DictKey, string>> = {
  'search.keywordPlaceholder': 'Wohnung in Berlin… oder Telefon, ID, Flurstück',
  'search.ex1': '2-Zimmer-Wohnung in Berlin',
  'search.ex2': 'Haus in München unter 800.000 €',
  'search.ex3': 'Mietwohnung mit Balkon in Mitte',
  'search.seoHint':
    'Immobilien in Deutschland: Wohnungen, Häuser und Gewerbe – kaufen und mieten. Notar, Grundbuch, Energieausweis, jedes Inserat geprüft.',
  'loc.searchPh': 'Stadt, Bezirk, Stadtteil oder Straße',
  'loc.georgiaHint': 'Ganz Deutschland',
  'footer.tagline':
    'sivrce – Immobilien in Deutschland. Wohnungen, Häuser, Neubau – kaufen und mieten. Notar, Grundbuch, Energieausweis, 3D-Karte.',
  'footer.location': 'Berlin, Deutschland',
  'add.subtitle': 'Eine Seite – ausfüllen und veröffentlichen. Ihre Immobilie auf sivrce in Deutschland.',
  'add.streetPh': 'z. B. Torstraße',
  'add.districtPh': 'z. B. Mitte',
  'add.cadastral': 'Flurstück',
  'add.cadastralNote': 'Optional – legt das ALKIS-Flurstück auf die Karte',
  'add.cadastralChecking': 'ALKIS wird geprüft…',
  'add.cadastralFound': 'Flurstück gefunden – Karte auf das Grundstück gelegt',
  'add.cadastralMiss': 'Nicht im Kataster gefunden – Nr. bitte prüfen',
}

const EN: Partial<Record<DictKey, string>> = {
  'search.keywordPlaceholder': 'Apartment in Berlin… or phone, ID, parcel',
  'search.ex1': '2-room apartment in Berlin',
  'search.ex2': 'House in Munich under €800,000',
  'search.ex3': 'Rental with balcony in Mitte',
  'search.seoHint':
    'Real estate in Germany: apartments, houses and commercial — buy and rent. Notary, land register, energy certificate, every listing verified.',
  'loc.searchPh': 'City, borough, district or street',
  'loc.georgiaHint': 'All of Germany',
  'footer.tagline':
    'sivrce — real estate in Germany. Apartments, houses, new-builds — buy and rent. Notary, Grundbuch, energy certificate, 3D map.',
  'footer.location': 'Berlin, Germany',
  'add.subtitle': 'One page — fill in and publish. Your property on sivrce in Germany.',
  'add.streetPh': 'e.g. Torstraße',
  'add.districtPh': 'e.g. Mitte',
  'add.cadastral': 'Parcel no.',
  'add.cadastralNote': 'Optional — pins the ALKIS parcel on the map',
  'add.cadastralChecking': 'Checking ALKIS…',
  'add.cadastralFound': 'Parcel found — map centred on the plot',
  'add.cadastralMiss': 'Not in the cadastre — please check the number',
}

export const DE_SITE_META: Partial<Record<Lang, { title: string; description: string }>> = {
  de: {
    title: 'Immobilien in Deutschland — Wohnungen, Häuser, Neubau | sivrce',
    description:
      'Wohnungen, Häuser und Neubauten in Deutschland — kaufen und mieten. Berlin, München, Hamburg, Frankfurt, Köln. Notar, Grundbuch, Energieausweis, 3D-Karte.',
  },
  en: {
    title: 'Real Estate in Germany — Apartments, Houses, New-builds | sivrce',
    description:
      'Apartments, houses and new-builds in Germany — buy and rent. Berlin, Munich, Hamburg, Frankfurt, Cologne. Notary, land register, energy certificate, 3D map.',
  },
}

export const DE_SITE_KEYWORDS: Partial<Record<Lang, string[]>> = {
  de: [
    'immobilien deutschland',
    'wohnung kaufen berlin',
    'wohnung mieten berlin',
    'wohnung kaufen münchen',
    'haus kaufen hamburg',
    'neubau deutschland',
    'grunderwerbsteuer',
    'energieausweis',
    'sivrce',
  ],
  en: [
    'real estate germany',
    'apartments berlin',
    'buy apartment munich',
    'rent hamburg',
    'new builds germany',
    'transfer tax germany',
    'energy certificate',
    'sivrce',
  ],
}

export function deMarketOverlay(lang: Lang): Partial<Record<DictKey, string>> | null {
  if (lang === 'de') return DE
  if (lang === 'en') return EN
  return null
}

/** Clone + overlay. Never mutates the shared dictionary table. */
export function withDeMarketDict(
  dict: Record<DictKey, string>,
  lang: Lang,
): Record<DictKey, string> {
  const o = deMarketOverlay(lang)
  return o ? { ...dict, ...o } : dict
}
