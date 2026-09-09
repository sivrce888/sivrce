/**
 * Listing photo URL conventions.
 *
 * /api/upload stores, for every accepted photo, five R2 objects:
 *   uploads/YYYY/MM/<uuid>.webp        — master (EXIF-rotated, ≤2560px, q82)
 *   uploads/YYYY/MM/<uuid>.card.webp   — 800px grid/card (q78)
 *   uploads/YYYY/MM/<uuid>.card.avif   — 800px grid/card (q50, ~30% smaller)
 *   uploads/YYYY/MM/<uuid>.lqip.webp   — 16px blur placeholder
 *   uploads/YYYY/MM/<uuid>.og.jpg      — 1200×630 share card (WhatsApp/Viber/FB
 *                                        crawlers don't render WebP OG tags)
 *
 * lqipOf()/cardOf()/ogOf() derive sibling URLs from the master, so no DB column.
 * Static/demo images (Unsplash, local /images/*) have no twins.
 */

const MASTER_RE = /\/uploads\/\d{4}\/\d{2}\/[0-9a-f-]+\.webp$/

/** First-party R2 CDN — already webp ≤2560; skip Vercel Image Optimization. */
export function isCdnMedia(url: string): boolean {
  return (
    url.includes("cdn.sivrce.ge") ||
    url.includes("images.sivrce.ge") ||
    url.startsWith("/images/")
  )
}

/** True when the URL is a pipeline master (and therefore has an LQIP twin). */
export function hasLqip(url: string): boolean {
  return MASTER_RE.test(url)
}

/** LQIP blurDataURL for a pipeline master URL, undefined for anything else. */
export function lqipOf(url: string): string | undefined {
  return hasLqip(url) ? url.replace(/\.webp$/, ".lqip.webp") : undefined
}

/** 800px card twin — grid/search. Undefined for non-pipeline URLs. */
export function cardOf(url: string): string | undefined {
  return hasLqip(url) ? url.replace(/\.webp$/, ".card.webp") : undefined
}

/** 800px AVIF card twin — <picture> first choice; falls back to cardOf. */
export function avifCardOf(url: string): string | undefined {
  return hasLqip(url) ? url.replace(/\.webp$/, ".card.avif") : undefined
}

/** 1200×630 JPEG share twin — og:image. Undefined for non-pipeline URLs. */
export function ogOf(url: string): string | undefined {
  return hasLqip(url) ? url.replace(/\.webp$/, ".og.jpg") : undefined
}

/** next/image blur props for a listing photo — spread onto <Image>. */
export function blurProps(url: string): { placeholder: "blur"; blurDataURL: string } | { placeholder: "empty" } {
  const lqip = lqipOf(url)
  return lqip ? { placeholder: "blur", blurDataURL: lqip } : { placeholder: "empty" }
}
