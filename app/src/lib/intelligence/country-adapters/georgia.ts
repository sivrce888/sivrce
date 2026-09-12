import type { IngestionSource, ParsedRecord } from "../ingestion-pipeline";
import type { EntityType, FactConfidence } from "@/generated/prisma/enums";

export const GEORGIA_SOURCES: IngestionSource[] = [
  {
    slug: "korter-ge",
    name: "Korter.ge",
    kind: "public_listing",
    reliability: "verified_company",
    country: "GE",
    url: "https://korter.ge",
  },
  {
    slug: "ss-ge",
    name: "SS.ge",
    kind: "public_listing",
    reliability: "verified_company",
    country: "GE",
    url: "https://ss.ge",
  },
  {
    slug: "myhome-ge",
    name: "MyHome.ge",
    kind: "public_listing",
    reliability: "verified_company",
    country: "GE",
    url: "https://myhome.ge",
  },
  {
    slug: "matsne-ge",
    name: "Matsne.gov.ge (Official Registry)",
    kind: "government",
    reliability: "official_government",
    country: "GE",
    url: "https://matsne.gov.ge",
  },
  {
    slug: "nbg-ge",
    name: "National Bank of Georgia",
    kind: "government",
    reliability: "official_government",
    country: "GE",
    url: "https://nbg.ge",
  },
  {
    slug: "geostat-ge",
    name: "National Statistics Office of Georgia",
    kind: "open_data",
    reliability: "official_government",
    country: "GE",
    url: "https://geostat.ge",
  },
  {
    slug: "tbilisi-gov-ge",
    name: "Tbilisi City Hall",
    kind: "government",
    reliability: "official_government",
    country: "GE",
    url: "https://tbilisi.gov.ge",
  },
  {
    slug: "openstreetmap",
    name: "OpenStreetMap",
    kind: "geospatial",
    reliability: "established_institution",
    country: "GE",
    url: "https://www.openstreetmap.org",
  },
];

export function parseKorterProject(data: Record<string, unknown>): ParsedRecord | null {
  const name = String(data.name ?? "");
  if (!name) return null;

  return {
    entityType: "project" as EntityType,
    externalId: String(data.id ?? ""),
    name,
    facts: {
      name,
      status: String(data.status ?? "unknown"),
      developer: String(data.developer ?? ""),
      city: String(data.city ?? "Tbilisi"),
      district: String(data.district ?? ""),
      address: String(data.address ?? ""),
      price_from: String(data.priceFrom ?? ""),
      units: String(data.units ?? ""),
      ready_by: String(data.readyBy ?? ""),
    },
    confidence: "high_confidence" as FactConfidence,
    sourceUrl: data.url ? String(data.url) : undefined,
    lat: data.lat ? Number(data.lat) : undefined,
    lng: data.lng ? Number(data.lng) : undefined,
    country: "GE",
    city: String(data.city ?? "Tbilisi"),
  };
}

export function parseGovernmentPermit(data: Record<string, unknown>): ParsedRecord | null {
  const permitNumber = String(data.permit_number ?? "");
  if (!permitNumber) return null;

  return {
    entityType: "project" as EntityType,
    externalId: permitNumber,
    name: String(data.project_name ?? data.address ?? ""),
    facts: {
      permit_number: permitNumber,
      permit_date: String(data.date ?? ""),
      permit_status: String(data.status ?? "issued"),
      address: String(data.address ?? ""),
      developer: String(data.applicant ?? ""),
    },
    confidence: "verified" as FactConfidence,
    sourceUrl: data.url ? String(data.url) : undefined,
    country: "GE",
  };
}

export function parseGeostatData(data: Record<string, unknown>): ParsedRecord | null {
  const city = String(data.city ?? "");
  if (!city) return null;

  return {
    entityType: "city" as EntityType,
    name: city,
    facts: {
      population: String(data.population ?? ""),
      region: String(data.region ?? ""),
      housing_starts: String(data.housing_starts ?? ""),
      construction_permits: String(data.construction_permits ?? ""),
    },
    confidence: "verified" as FactConfidence,
    country: "GE",
    city,
  };
}
