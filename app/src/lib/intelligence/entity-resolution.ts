import { db } from "@/lib/db";
import type { EntityType } from "@/generated/prisma/enums";
import type { EntityMatchCandidate, EntityMatchResult } from "./types";
import { normalizeGermanAddress } from "./normalize-de";
export { normalizeGermanAddress };

function normalizeGeorgian(s: string): string {
  return s
    .toLowerCase()
    .replace(/[''`]/g, "")
    .replace(/[^\w\s\u10A0-\u10FF]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeTransliteration(s: string): string {
  const geoMap: Record<string, string> = {
    "ა": "a", "ბ": "b", "გ": "g", "დ": "d", "ე": "e", "ვ": "v", "ზ": "z",
    "თ": "t", "ი": "i", "კ": "k", "ლ": "l", "მ": "m", "ნ": "n", "ო": "o", "პ": "p",
    "ჟ": "zh", "რ": "r", "ს": "s", "ტ": "t", "უ": "u", "ფ": "f", "ღ": "gh", "ყ": "q", "შ": "sh",
    "ჩ": "ch", "ც": "c", "ძ": "dz", "წ": "ts", "ჭ": "ch", "ხ": "h", "ჯ": "j", "ჰ": "h"
  };
  return s
    .toLowerCase()
    .replace(/[''`]/g, "")
    .split("")
    .map((c) => geoMap[c] || c)
    .join("");
}

function normalizeEnglish(s: string): string {
  return s
    .toLowerCase()
    .replace(/[''`]/g, "")
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}



function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
  return dp[m][n];
}

function similarity(a: string, b: string, method: "ge" | "translit" | "en" = "en"): number {
  const na = method === "ge" ? normalizeGeorgian(a) : method === "translit" ? normalizeTransliteration(a) : normalizeEnglish(a);
  const nb = method === "ge" ? normalizeGeorgian(b) : method === "translit" ? normalizeTransliteration(b) : normalizeEnglish(b);
  if (na === nb) return 1;
  const maxLen = Math.max(na.length, nb.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(na, nb) / maxLen;
}

function jaccardTokens(a: string, b: string): number {
  const ta = new Set(normalizeEnglish(a).split(/\s+/));
  const tb = new Set(normalizeEnglish(b).split(/\s+/));
  const inter = new Set([...ta].filter((x) => tb.has(x)));
  const union = new Set([...ta, ...tb]);
  return union.size === 0 ? 0 : inter.size / union.size;
}

function containsToken(haystack: string, needle: string): boolean {
  const h = normalizeEnglish(haystack);
  const n = normalizeEnglish(needle);
  return h.includes(n);
}

export function scoreCandidateMatch(
  input: { 
    name: string; 
    country?: string; 
    city?: string; 
    lat?: number; 
    lng?: number; 
    website?: string;
    externalId?: string;
  },
  candidate: EntityMatchCandidate,
): EntityMatchResult {
  const reasons: string[] = [];
  let score = 0;

  // 1. Exact name match (highest weight)
  const nameSimEn = similarity(input.name, candidate.name, "en");
  const nameSimGeo = similarity(input.name, candidate.name, "ge");
  const nameSimTranslit = similarity(input.name, candidate.name, "translit");
  const nameSimDe =
    input.country === "DE" || candidate.country === "DE"
      ? (() => {
          const a = normalizeGermanAddress(input.name);
          const b = normalizeGermanAddress(candidate.name);
          if (a === b) return 1;
          const maxLen = Math.max(a.length, b.length);
          return maxLen === 0 ? 1 : 1 - levenshtein(a, b) / maxLen;
        })()
      : 0;
  const nameSim = Math.max(nameSimEn, nameSimGeo, nameSimTranslit, nameSimDe);

  if (nameSim >= 0.98) { score += 50; reasons.push("exact_name_match"); }
  else if (nameSim >= 0.9) { score += 40; reasons.push("fuzzy_name_match"); }
  else if (nameSim >= 0.75) { score += 25; reasons.push("partial_name_match"); }
  else if (nameSim >= 0.6) { score += 10; reasons.push("weak_name_match"); }

  // 2. Alias matching
  for (const alias of candidate.aliases) {
    const aliasNorm = normalizeEnglish(alias);
    const inputNorm = normalizeEnglish(input.name);
    if (inputNorm === aliasNorm) { score += 45; reasons.push(`exact_alias_match:${alias}`); break; }
    else if (containsToken(inputNorm, aliasNorm) || containsToken(aliasNorm, inputNorm)) {
      score += 30; reasons.push(`token_alias:${alias}`); break;
    }
    const aliasSim = similarity(input.name, alias, "en");
    if (aliasSim >= 0.9) { score += 35; reasons.push(`alias_match:${alias}`); break; }
    if (aliasSim >= 0.75) { score += 20; reasons.push(`fuzzy_alias:${alias}`); break; }
  }

  // 3. Website/domain matching
  if (input.website && candidate.website) {
    try {
      const inputHost = new URL(input.website).hostname.replace(/^www\./, "").toLowerCase();
      const candHost = new URL(candidate.website).hostname.replace(/^www\./, "").toLowerCase();
      if (inputHost === candHost) { score += 35; reasons.push("same_domain"); }
      else if (inputHost.includes(candHost) || candHost.includes(inputHost)) { score += 15; reasons.push("domain_substring"); }
    } catch { /* ignore invalid URLs */ }
  }

  // 4. External ID matching (company registration, VNUB, etc.)
  if (input.externalId && candidate.externalId) {
    if (input.externalId === candidate.externalId) { score += 40; reasons.push("exact_external_id"); }
    else if (normalizeEnglish(input.externalId) === normalizeEnglish(candidate.externalId)) {
      score += 30; reasons.push("normalized_external_id");
    }
  }

  // 5. Country matching
  if (input.country && input.country === candidate.country) { score += 5; reasons.push("same_country"); }

  // 6. City matching
  if (input.city && candidate.city && normalizeGeorgian(input.city) === normalizeGeorgian(candidate.city)) {
    score += 5; reasons.push("same_city_geo");
  }
  if (input.city && candidate.city && normalizeEnglish(input.city) === normalizeEnglish(candidate.city)) {
    score += 3; reasons.push("same_city_en");
  }

  // 7. Geospatial proximity
  if (input.lat && input.lng && candidate.lat && candidate.lng) {
    const R = 6371;
    const dLat = ((candidate.lat - input.lat) * Math.PI) / 180;
    const dLng = ((candidate.lng - input.lng) * Math.PI) / 180;
    const aVal =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((input.lat * Math.PI) / 180) *
        Math.cos((candidate.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    const distKm = R * 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal));
    if (distKm < 0.1) { score += 20; reasons.push("within_100m"); }
    else if (distKm < 0.5) { score += 15; reasons.push("very_close_location"); }
    else if (distKm < 2) { score += 8; reasons.push("close_location"); }
    else if (distKm > 50) { score -= 10; reasons.push("far_location"); }
  }

  // 8. Token overlap
  const tokensA = jaccardTokens(input.name, candidate.name);
  if (tokensA > 0.3) { score += 8; reasons.push("token_overlap"); }
  if (tokensA > 0.5) { score += 12; reasons.push("strong_token_overlap"); }

  // 9. Name length proximity (shorter names are more significant when matching)
  const nameLenDiff = Math.abs(input.name.length - candidate.name.length);
  if (nameLenDiff <= 2) { score += 3; reasons.push("similar_length"); }
  else if (nameLenDiff <= 5) { score += 1; reasons.push("mild_length_diff"); }

  // 10. Confidence: penalize if only weak signals
  if (nameSim < 0.6 && score < 20) { score -= 5; reasons.push("weak_signals"); }

  return { 
    candidate, 
    score: Math.min(100, Math.max(0, Math.round(score))) , 
    reasons 
  };
}

export async function findMatches(
  entityType: EntityType,
  input: { 
    name: string; 
    country?: string; 
    city?: string; 
    lat?: number; 
    lng?: number; 
    website?: string;
    externalId?: string;
  },
  limit = 5,
): Promise<EntityMatchResult[]> {
  const aliases = await db.entityAlias.findMany({
    where: { entityType },
    select: { entityId: true, alias: true, language: true },
  });

  const entityMap = new Map<string, { 
    name: string; 
    aliases: string[]; 
    country: string; 
    city?: string; 
    lat?: number; 
    lng?: number; 
    website?: string;
    externalId?: string;
  }>();
  for (const a of aliases) {
    if (!entityMap.has(a.entityId)) {
      entityMap.set(a.entityId, { name: "", aliases: [], country: "GE" });
    }
    const e = entityMap.get(a.entityId)!;
    e.aliases.push(a.alias);
    // Also collect other fields from aliases if available
    if (a.language && !e.city) e.city = a.language === "ka" ? a.alias : e.city;
  }

  const candidates: EntityMatchCandidate[] = [];
  for (const [entityId, data] of entityMap) {
    candidates.push({
      entityType,
      entityId,
      name: data.name || data.aliases[0] || "",
      aliases: data.aliases,
      country: data.country,
      city: data.city,
      lat: data.lat,
      lng: data.lng,
      website: data.website,
      externalId: data.externalId,
    });
  }

  return candidates
    .map((c) => scoreCandidateMatch(input, c))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function shouldMerge(a: EntityMatchResult, threshold: number = 70): boolean {
  // Never silently merge if uncertain - create candidate relationship instead
  if (a.score < threshold) return false;
  // Check if there are conflicting signals
  const hasWeakSignals = a.reasons.some(r => r.startsWith("weak_") || r.startsWith("partial_"));
  if (hasWeakSignals && a.score < threshold + 15) return false;
  return true;
}

export function needsReview(a: EntityMatchResult): boolean {
  // Score in the "uncertain" range - requires manual verification
  return a.score >= 50 && a.score < 75;
}

export function isDefiniteMatch(a: EntityMatchResult): boolean {
  // High-confidence match that can be safely merged
  return a.score >= 85 && 
    a.reasons.some(r => r.startsWith("exact_") || r.startsWith("same_"));
}