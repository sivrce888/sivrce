/**
 * Thin adapter over Vercel AI SDK + Google Gemini.
 * All functions degrade gracefully: if GOOGLE_GENERATIVE_AI_API_KEY is
 * missing, they return null/fallback — never throw.
 *
 * ponytail: single-model (gemini-3-flash-preview), no streaming, no retry.
 * Upgrade path: add model router, fallback chain, or prompt caching.
 */

import { generateText, generateObject } from "ai"
import { google } from "@ai-sdk/google"
import { z } from "zod" // ponytail: zod ships with the project; if not, add `npm i zod`

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hasAi(): boolean {
  return Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY)
}

function model() {
  // Gemini 3 Flash — fast, cheap, good enough for real estate tasks.
  return google("gemini-3-flash-preview")
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PriceEstimate {
  minUSD: number
  maxUSD: number
  confidence: number // 0-100
  reasoning: string // Georgian
}

export interface ParsedSearchFilters {
  dealType?: "sale" | "rent" | "daily"
  propertyType?: "apartment" | "house" | "commercial" | "land"
  city?: string
  district?: string
  minPrice?: number
  maxPrice?: number
  rooms?: number
  minArea?: number
  maxArea?: number
  keywords?: string
}

// ---------------------------------------------------------------------------
// generateListingDescription
// ---------------------------------------------------------------------------

export async function generateListingDescription(listingData: {
  title: string
  propType: string
  dealType: string
  city: string
  district: string
  address: string
  rooms: number
  area: number
  floor?: number
  totalFloors?: number
  features?: string[]
}): Promise<string | null> {
  if (!hasAi()) return null

  const prompt = `შენ ხარ ქართული უძრავი ქონების მარკეტინგის ექსპერტი.
მოცემული მონაცემების მიხედვით დაწერე მიმზიდველი და დეტალური აღწერა ქართულ ენაზე (3-5 წინადადება).
გაითვალისწინე:
- ტიპი: ${listingData.propType}
- გარიგების ტიპი: ${listingData.dealType}
- ქალაქი: ${listingData.city}, რაიონი: ${listingData.district}
- ოთახები: ${listingData.rooms}, ფართი: ${listingData.area}მ²
${listingData.floor ? `- სართული: ${listingData.floor}/${listingData.totalFloors ?? "?"}` : ""}
${listingData.features?.length ? `- მახასიათებლები: ${listingData.features.join(", ")}` : ""}
სათაური: ${listingData.title}
მისამართი: ${listingData.address}

დაწერე მხოლოდ აღწერა, სხვა ტექსტის გარეშე.`

  try {
    const result = await generateText({ model: model(), prompt })
    return result.text.trim() || null
  } catch (e) {
    console.error("[ai] generateListingDescription failed:", (e as Error).message)
    return null
  }
}

// ---------------------------------------------------------------------------
// translateText
// ---------------------------------------------------------------------------

export async function translateText(
  text: string,
  targetLang: "ka" | "en" | "ru",
): Promise<string | null> {
  if (!hasAi()) return null

  const langNames: Record<string, string> = {
    ka: "ქართული",
    en: "ინგლისური",
    ru: "რუსული",
  }

  try {
    const result = await generateText({
      model: model(),
      prompt: `Translate the following text to ${langNames[targetLang]} (${targetLang}). Return only the translation, nothing else.\n\n${text}`,
    })
    return result.text.trim() || null
  } catch (e) {
    console.error("[ai] translateText failed:", (e as Error).message)
    return null
  }
}

// ---------------------------------------------------------------------------
// parseSearchQuery
// ---------------------------------------------------------------------------

const searchFilterSchema = z.object({
  dealType: z.enum(["sale", "rent", "daily"]).optional().describe("Deal type inferred from query"),
  propertyType: z.enum(["apartment", "house", "commercial", "land"]).optional().describe("Property type"),
  city: z.string().optional().describe("City name in Georgian"),
  district: z.string().optional().describe("District/neighborhood name in Georgian"),
  minPrice: z.number().optional().describe("Minimum price in USD"),
  maxPrice: z.number().optional().describe("Maximum price in USD"),
  rooms: z.number().optional().describe("Minimum number of rooms"),
  minArea: z.number().optional().describe("Minimum area in square meters"),
  maxArea: z.number().optional().describe("Maximum area in square meters"),
  keywords: z.string().optional().describe("Free-text keywords extracted from query"),
})

export async function parseSearchQuery(query: string): Promise<ParsedSearchFilters | null> {
  if (!hasAi()) return null

  try {
    const result = await generateObject({
      model: model(),
      schema: searchFilterSchema,
      prompt: `Parse this Georgian real estate search query into structured filters.
The query is: "${query}"

Rules:
- dealType: "sale" (იყიდება), "rent" (ქირავდება), "daily" (დღიურად) 
- propertyType: "apartment" (ბინა), "house" (სახლი), "commercial" (კომერციული), "land" (მიწა)
- All prices are in USD. Convert "K" (thousands) and "M" (millions). "$200K" = 200000.
- Only include fields that are clearly mentioned in the query.
- City and district names should be in Georgian.
- "ვაკე", "საბურთალო", "ისანი" etc. are districts of Tbilisi.`,
    })
    return result.object as ParsedSearchFilters
  } catch (e) {
    console.error("[ai] parseSearchQuery failed:", (e as Error).message)
    return null
  }
}

// ---------------------------------------------------------------------------
// estimatePropertyValue
// ---------------------------------------------------------------------------

const priceEstimateSchema = z.object({
  minUSD: z.number().describe("Minimum estimated value in USD"),
  maxUSD: z.number().describe("Maximum estimated value in USD"),
  confidence: z.number().min(0).max(100).describe("Confidence score 0-100"),
  reasoning: z.string().describe("Brief reasoning in Georgian"),
})

export async function estimatePropertyValue(listingData: {
  propType: string
  dealType: string
  city: string
  district: string
  rooms: number
  area: number
  floor?: number
  totalFloors?: number
  features?: string[]
  yearBuilt?: number
}): Promise<PriceEstimate | null> {
  if (!hasAi()) return null

  const prompt = `You are a Georgian real estate valuation expert.
Estimate the market value (in USD) for this property:

- Type: ${listingData.propType}
- Deal: ${listingData.dealType}
- City: ${listingData.city}, District: ${listingData.district}
- Rooms: ${listingData.rooms}, Area: ${listingData.area}м²
${listingData.floor ? `- Floor: ${listingData.floor}/${listingData.totalFloors ?? "?"}` : ""}
${listingData.yearBuilt ? `- Year built: ${listingData.yearBuilt}` : ""}
${listingData.features?.length ? `- Features: ${listingData.features.join(", ")}` : ""}

Provide a realistic market value range in USD based on current (2026) Georgian real estate market conditions.
For Tbilisi apartments, typical ranges:
- Economy: $800-1200/m²
- Comfort: $1200-2000/m²  
- Premium (Vake, Mtatsminda): $2000-3500/m²
- Batumi sea-view: $1500-3000/m²
- Houses vary by land size and location.

Provide reasoning in Georgian.`

  try {
    const result = await generateObject({
      model: model(),
      schema: priceEstimateSchema,
      prompt,
    })
    return result.object as PriceEstimate
  } catch (e) {
    console.error("[ai] estimatePropertyValue failed:", (e as Error).message)
    return null
  }
}
