/**
 * Attach already-uploaded CDN URLs as ListingMedia rows (upload route already
 * sharp-processed). Gallery itself stays un-watermarked (BRAND.md).
 */

import { db } from "@/lib/db"

export async function linkListingMedia(opts: {
  listingId: string
  urls: string[]
  uploadedBy?: string | null
}): Promise<number> {
  if (opts.urls.length === 0) return 0
  let n = 0
  for (let i = 0; i < opts.urls.length; i++) {
    const url = opts.urls[i]!
    // storagePath = path after host; fall back to full URL.
    let storagePath = url
    try {
      storagePath = new URL(url).pathname.replace(/^\//, "")
    } catch {
      /* keep url */
    }
    await db.listingMedia.create({
      data: {
        listingId: opts.listingId,
        kind: "photo",
        storageBucket: "listing-media",
        storagePath,
        cdnUrl: url,
        position: i,
        isCover: i === 0,
        processingStatus: "ready",
        processedAt: new Date(),
        mimeType: "image/webp",
        uploadedBy: opts.uploadedBy ?? null,
      },
    })
    n += 1
  }
  return n
}
