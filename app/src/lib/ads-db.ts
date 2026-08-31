/**
 * Live banner reads — one cached list, pick in memory.
 * ponytail: table stays small; per-slot cache if volume ever hurts.
 */

import { unstable_cache, updateTag } from "next/cache"

import {
  filterCandidates,
  pickWeighted,
  toPublicAd,
  type AdAudience,
  type AdCandidate,
  type AdSlotId,
  type PublicAd,
} from "@/lib/ads"
import { db, dbAvailable } from "@/lib/db"
import type { Lang } from "@/lib/i18n/core"

export const ADS_TAG = "ad-banners"

function rowToCandidate(r: {
  id: string
  slot: string
  format: string
  status: string
  title: string
  subtitle: string | null
  ctaLabel: string | null
  href: string
  imageUrl: string | null
  advertiser: string | null
  audiences: string[]
  langs: string[]
  weight: number
  startsAt: Date | null
  endsAt: Date | null
}): AdCandidate {
  return {
    id: r.id,
    slot: r.slot as AdSlotId,
    format: r.format as AdCandidate["format"],
    title: r.title,
    subtitle: r.subtitle,
    ctaLabel: r.ctaLabel,
    href: r.href,
    imageUrl: r.imageUrl,
    advertiser: r.advertiser,
    weight: r.weight,
    audiences: r.audiences,
    langs: r.langs,
    startsAt: r.startsAt,
    endsAt: r.endsAt,
    status: r.status,
  }
}

const readLive = unstable_cache(
  async (): Promise<AdCandidate[]> => {
    try {
      if (!(await dbAvailable())) return []
      const rows = await db.adBanner.findMany({
        where: { status: "live" },
        orderBy: { updatedAt: "desc" },
        take: 200,
      })
      return rows.map(rowToCandidate)
    } catch (e) {
      console.warn("[ads] live read failed:", e instanceof Error ? e.message : e)
      return []
    }
  },
  ["ad-banners-live"],
  { tags: [ADS_TAG], revalidate: 60 },
)

export async function pickAd(
  slot: AdSlotId,
  opts: { audience: AdAudience; lang: Lang },
): Promise<PublicAd | null> {
  const live = await readLive()
  const hit = pickWeighted(filterCandidates(live, slot, opts.audience, opts.lang))
  return hit ? toPublicAd(hit) : null
}

export async function pickAds(
  slots: AdSlotId[],
  opts: { audience: AdAudience; lang: Lang },
): Promise<Partial<Record<AdSlotId, PublicAd>>> {
  const live = await readLive()
  const out: Partial<Record<AdSlotId, PublicAd>> = {}
  for (const slot of slots) {
    const hit = pickWeighted(filterCandidates(live, slot, opts.audience, opts.lang))
    if (hit) out[slot] = toPublicAd(hit)
  }
  return out
}

export function bustAdsCache(): void {
  updateTag(ADS_TAG)
}
