/**
 * Germany / Berlin country adapter — source registry + parsers.
 * Mirrors georgia.ts pattern; feeds intel/core.ts SOURCE_REGISTRY.
 *
 * Sources are ordered by reliability tier:
 *   1. Government / official registries
 *   2. Open data portals
 *   3. Official developer websites
 *   4. Established media / institutions
 *   5. Public listing platforms
 *
 * ponytail: parse functions are pure — no network, no DB.
 * Upgrade path: real HTTP fetchers in jobs/ once rate limits are profiled.
 */
import type { IngestionSource, ParsedRecord } from "../ingestion-pipeline"
import type { EntityType, FactConfidence } from "@/generated/prisma/enums"

// ─── Source Registry ───────────────────────────────────────────────────────────

export const GERMANY_SOURCES: IngestionSource[] = [
  // ── 1. Government / Official ──────────────────────────────────────────────
  {
    slug: "berlin-stadtentwicklung",
    name: "Berlin Senatsverwaltung für Stadtentwicklung (SenStadt)",
    kind: "government",
    reliability: "official_government",
    country: "DE",
    url: "https://www.stadtentwicklung.berlin.de",
  },
  {
    slug: "berlin-entwicklungskompass",
    name: "Berlin Entwicklungskompass (live project register)",
    kind: "government",
    reliability: "official_government",
    country: "DE",
    url: "https://www.stadtentwicklung.berlin.de/wohnen/entwicklungskompass/",
  },
  {
    slug: "berlin-amt-baugenehmigungen",
    name: "Bezirksamt Bauordnungsämter (building permits)",
    kind: "government",
    reliability: "official_government",
    country: "DE",
    url: "https://www.berlin.de/baupolizei/",
  },
  {
    slug: "berlin-statistik",
    name: "Amt für Statistik Berlin-Brandenburg",
    kind: "open_data",
    reliability: "official_government",
    country: "DE",
    url: "https://www.statistik-berlin-brandenburg.de",
  },
  {
    slug: "bundesbaublatt",
    name: "Bundesbaublatt (federal construction gazette)",
    kind: "government",
    reliability: "official_government",
    country: "DE",
    url: "https://www.bundesbaublatt.de",
  },
  {
    slug: "handelsregister-de",
    name: "Handelsregister (German commercial register)",
    kind: "official_registry",
    reliability: "official_registry",
    country: "DE",
    url: "https://www.handelsregister.de",
  },
  {
    slug: "gendienst-naturschutz",
    name: "GENDienst (nature conservation / urban development orders)",
    kind: "government",
    reliability: "official_government",
    country: "DE",
    url: "https://www.gendienst.de",
  },
  {
    slug: "berlin-energieagentur",
    name: "Berliner Energieagentur (energy efficiency / KfW data)",
    kind: "government",
    reliability: "official_government",
    country: "DE",
    url: "https://www.berlin.de/energieagentur/",
  },

  // ── 2. Open Data ──────────────────────────────────────────────────────────
  {
    slug: "daten-berlin-de",
    name: "daten.berlin.de (Berlin Open Data Portal)",
    kind: "open_data",
    reliability: "official_government",
    country: "DE",
    url: "https://daten.berlin.de",
  },
  {
    slug: "govdata-de",
    name: "GovData (German federal open data)",
    kind: "open_data",
    reliability: "official_government",
    country: "DE",
    url: "https://www.govdata.de",
  },
  {
    slug: "destatis",
    name: "Destatis (Federal Statistical Office)",
    kind: "open_data",
    reliability: "official_government",
    country: "DE",
    url: "https://www.destatis.de",
  },
  {
    slug: "osm-overpass",
    name: "OpenStreetMap Overpass API (buildings, POIs, transit)",
    kind: "geospatial",
    reliability: "established_institution",
    country: "DE",
    url: "https://overpass-api.de",
  },
  {
    slug: "openstreetmap",
    name: "OpenStreetMap (building footprints, addresses)",
    kind: "geospatial",
    reliability: "established_institution",
    country: "DE",
    url: "https://www.openstreetmap.org",
  },

  // ── 3. Official Developer / Company Websites ───────────────────────────────
  {
    slug: "wbm-de",
    name: "WBM (Wohnungsbaugesellschaft Berlin-Mitte)",
    kind: "official_company",
    reliability: "official_company",
    country: "DE",
    url: "https://www.wbm.de",
  },
  {
    slug: "degewo-de",
    name: "degewo",
    kind: "official_company",
    reliability: "official_company",
    country: "DE",
    url: "https://www.degewo.de",
  },
  {
    slug: "howoge-de",
    name: "HOWOGE",
    kind: "official_company",
    reliability: "official_company",
    country: "DE",
    url: "https://www.howoge.de",
  },
  {
    slug: "gewobag-de",
    name: "Gewobag",
    kind: "official_company",
    reliability: "official_company",
    country: "DE",
    url: "https://www.gewobag.de",
  },
  {
    slug: "stadtundland-de",
    name: "STADT UND LAND",
    kind: "official_company",
    reliability: "official_company",
    country: "DE",
    url: "https://www.stadtundland.de",
  },
  {
    slug: "gesobau-de",
    name: "GESOBAU",
    kind: "official_company",
    reliability: "official_company",
    country: "DE",
    url: "https://www.gesobau.de",
  },
  {
    slug: "buwog-de",
    name: "BUWOG (Vonovia)",
    kind: "official_company",
    reliability: "official_company",
    country: "DE",
    url: "https://www.buwog.de",
  },
  {
    slug: "pandion-de",
    name: "PANDION",
    kind: "official_company",
    reliability: "official_company",
    country: "DE",
    url: "https://www.pandion.de",
  },
  {
    slug: "instone-de",
    name: "Instone Real Estate",
    kind: "official_company",
    reliability: "official_company",
    country: "DE",
    url: "https://www.instone.de",
  },
  {
    slug: "bonava-de",
    name: "Bonava",
    kind: "official_company",
    reliability: "official_company",
    country: "DE",
    url: "https://www.bonava.de",
  },
  {
    slug: "euroboden-de",
    name: "Euroboden",
    kind: "official_company",
    reliability: "official_company",
    country: "DE",
    url: "https://www.euroboden.de",
  },
  {
    slug: "patrizia-ag",
    name: "Patrizia AG",
    kind: "official_company",
    reliability: "official_company",
    country: "DE",
    url: "https://www.patrizia.ag",
  },
  {
    slug: "dic-asset-de",
    name: "DIC Asset AG",
    kind: "official_company",
    reliability: "official_company",
    country: "DE",
    url: "https://www.dic-asset.de",
  },
  {
    slug: "union-investment-de",
    name: "Union Investment",
    kind: "official_company",
    reliability: "official_company",
    country: "DE",
    url: "https://www.union-investment.de",
  },
  {
    slug: "allianz-re-de",
    name: "Allianz Real Estate",
    kind: "official_company",
    reliability: "official_company",
    country: "DE",
    url: "https://www.allianzrealestate.com",
  },
  {
    slug: "corpus-sireo-de",
    name: "CORPUS SIREO (Deutsche Bank)",
    kind: "official_company",
    reliability: "official_company",
    country: "DE",
    url: "https://www.corpus-sireo.de",
  },
  {
    slug: "quartier-eins-de",
    name: "QUARTIER EINS",
    kind: "official_company",
    reliability: "official_company",
    country: "DE",
    url: "https://www.quartier-eins.de",
  },
  {
    slug: "groth-gruppe-de",
    name: "Groth Gruppe",
    kind: "official_company",
    reliability: "official_company",
    country: "DE",
    url: "https://www.groth-gruppe.de",
  },
  {
    slug: "otto-wulff-de",
    name: "OTTO WULFF",
    kind: "official_company",
    reliability: "official_company",
    country: "DE",
    url: "https://www.otto-wulff.de",
  },
  {
    slug: "primusimmobilien-de",
    name: "Primus Immobilien",
    kind: "official_company",
    reliability: "verified_company",
    country: "DE",
    url: "https://www.primusimmobilien.de",
  },
  {
    slug: "bauwert-de",
    name: "Bauwert",
    kind: "official_company",
    reliability: "verified_company",
    country: "DE",
    url: "https://www.bauwert.de",
  },
  {
    slug: "tag-immobilien-de",
    name: "TAG Immobilien",
    kind: "official_company",
    reliability: "official_company",
    country: "DE",
    url: "https://www.tag-immobilien.de",
  },
  {
    slug: "grand-city-de",
    name: "Grand City Properties",
    kind: "official_company",
    reliability: "official_company",
    country: "DE",
    url: "https://www.grandcityproperties.com",
  },

  // ── 4. Established Media / Institutions ─────────────────────────────────────
  {
    slug: "berliner-zeitung",
    name: "Berliner Zeitung",
    kind: "media",
    reliability: "reputable_media",
    country: "DE",
    url: "https://www.berliner-zeitung.de",
  },
  {
    slug: "berliner-morgenpost",
    name: "Berliner Morgenpost",
    kind: "media",
    reliability: "reputable_media",
    country: "DE",
    url: "https://www.morgenpost.de",
  },
  {
    slug: "tagesspiegel",
    name: "Der Tagesspiegel",
    kind: "media",
    reliability: "reputable_media",
    country: "DE",
    url: "https://www.tagesspiegel.de",
  },
  {
    slug: "entwicklungsstadt",
    name: "entwicklungsstadt.de (Berlin new-build tracker)",
    kind: "media",
    reliability: "reputable_media",
    country: "DE",
    url: "https://entwicklungsstadt.de",
  },
  {
    slug: "baunetz",
    name: "BauNetz (construction industry)",
    kind: "media",
    reliability: "reputable_media",
    country: "DE",
    url: "https://www.baunetz.de",
  },
  {
    slug: "immobilien-zeitung",
    name: "Immobilien Zeitung",
    kind: "media",
    reliability: "reputable_media",
    country: "DE",
    url: "https://www.iz.de",
  },

  // ── 5. Public Listing Platforms ─────────────────────────────────────────────
  {
    slug: "immobilienscout24-de",
    name: "ImmobilienScout24",
    kind: "public_listing",
    reliability: "public_listing",
    country: "DE",
    url: "https://www.immobilienscout24.de",
  },
  {
    slug: "immowelt-de",
    name: "Immowelt",
    kind: "public_listing",
    reliability: "public_listing",
    country: "DE",
    url: "https://www.immowelt.de",
  },
  {
    slug: "gewobag-wohnen",
    name: "Gewobag Wohnen",
    kind: "public_listing",
    reliability: "verified_company",
    country: "DE",
    url: "https://www.gewobag.de/wohnen",
  },
  {
    slug: "neubaukompass-de",
    name: "NeubauKompass",
    kind: "public_listing",
    reliability: "verified_company",
    country: "DE",
    url: "https://www.neubaukompass.de",
  },
  {
    slug: "prospekt-berlin",
    name: "Prospekt.de (Berlin new-build portal)",
    kind: "public_listing",
    reliability: "verified_company",
    country: "DE",
    url: "https://www.prospekt.de",
  },
]

// ─── Parsers ───────────────────────────────────────────────────────────────────

/**
 * Parse a Berlin development project from official/Stadtentwicklung data.
 * Each project should carry at minimum: name, address, developer, status.
 */
export function parseBerlinProject(data: Record<string, unknown>): ParsedRecord | null {
  const name = String(data.name ?? data.project_name ?? "")
  if (!name) return null

  return {
    entityType: "project" as EntityType,
    externalId: String(data.id ?? data.aktenzeichen ?? ""),
    name,
    facts: {
      name,
      status: String(data.status ?? data.project_status ?? "unknown"),
      developer: String(data.developer ?? data.bauherr ?? ""),
      city: String(data.city ?? "Berlin"),
      district: String(data.district ?? data.bezirk ?? ""),
      address: String(data.address ?? data.adresse ?? ""),
      price_from: String(data.priceFrom ?? data.preis_ab ?? ""),
      units: String(data.units ?? data.wohnungen ?? ""),
      ready_by: String(data.readyBy ?? data.fertigstellung ?? ""),
      floors: String(data.floors ?? data.geschosse ?? ""),
      energy_standard: String(data.energyStandard ?? data.eh_standard ?? ""),
    },
    confidence: "high_confidence" as FactConfidence,
    sourceUrl: data.url ? String(data.url) : undefined,
    lat: data.lat ? Number(data.lat) : undefined,
    lng: data.lng ? Number(data.lng) : undefined,
    country: "DE",
    city: String(data.city ?? "Berlin"),
  }
}

/**
 * Parse a Berlin building permit from Bezirksamt data.
 * German permits carry an Aktenzeichen (file reference).
 */
export function parseBerlinPermit(data: Record<string, unknown>): ParsedRecord | null {
  const permitNumber = String(data.aktenzeichen ?? data.permit_number ?? "")
  if (!permitNumber) return null

  return {
    entityType: "project" as EntityType,
    externalId: permitNumber,
    name: String(data.project_name ?? data.address ?? data.adresse ?? ""),
    facts: {
      permit_number: permitNumber,
      permit_date: String(data.date ?? data.datum ?? ""),
      permit_status: String(data.status ?? "issued"),
      address: String(data.address ?? data.adresse ?? ""),
      developer: String(data.applicant ?? data.antragsteller ?? ""),
      district: String(data.bezirk ?? ""),
      building_type: String(data.building_type ?? data.bauvorhaben ?? ""),
    },
    confidence: "verified" as FactConfidence,
    sourceUrl: data.url ? String(data.url) : undefined,
    country: "DE",
    city: "Berlin",
  }
}

/**
 * Parse Berlin statistical data (housing starts, completions, prices).
 */
export function parseBerlinStatistik(data: Record<string, unknown>): ParsedRecord | null {
  const district = String(data.district ?? data.bezirk ?? "")
  if (!district) return null

  return {
    entityType: "district" as EntityType,
    name: district,
    facts: {
      population: String(data.population ?? data.einwohner ?? ""),
      housing_stock: String(data.housing_stock ?? data.wohungsbestand ?? ""),
      new_permits: String(data.new_permits ?? data.baugenehmigungen ?? ""),
      completions: String(data.completions ?? data.fertiggestellt ?? ""),
      avg_price_sqm: String(data.avg_price_sqm ?? data.durchschnittspreis ?? ""),
      avg_rent_sqm: String(data.avg_rent_sqm ?? data.mietpreis ?? ""),
      vacancy_rate: String(data.vacancy_rate ?? data.leerstandsquote ?? ""),
    },
    confidence: "verified" as FactConfidence,
    country: "DE",
    city: "Berlin",
  }
}

/**
 * Parse a developer company from Handelsregister / official site.
 */
export function parseDeveloperCompany(data: Record<string, unknown>): ParsedRecord | null {
  const name = String(data.name ?? data.company_name ?? "")
  if (!name) return null

  return {
    entityType: "developer" as EntityType,
    externalId: String(data.register_number ?? data.handelsregister ?? ""),
    name,
    facts: {
      name,
      legal_form: String(data.legal_form ?? data.rechtsform ?? ""),
      headquarters: String(data.headquarters ?? data.sitz ?? ""),
      founded: String(data.founded ?? data.gruendung ?? ""),
      units_portfolio: String(data.units ?? data.wohnungen ?? ""),
      website: String(data.website ?? ""),
      phone: String(data.phone ?? data.telefon ?? ""),
    },
    confidence: "high_confidence" as FactConfidence,
    sourceUrl: data.url ? String(data.url) : undefined,
    country: "DE",
    city: String(data.city ?? "Berlin"),
  }
}
