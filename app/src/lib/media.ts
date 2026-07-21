/**
 * Listing photo URL conventions.
 *
 * /api/upload stores, for every accepted photo, two R2 objects:
 *   uploads/YYYY/MM/<uuid>.webp        — master (EXIF-rotated, ≤2560px, q82)
 *   uploads/YYYY/MM/<uuid>.lqip.webp   — 16px blur placeholder
 *
 * lqipOf() derives the placeholder URL from the master URL, so blurDataURL
 * needs no DB column and works for every photo uploaded through the pipeline.
 * Static/demo images (Unsplash, local /images/*) have no placeholder and
 * return undefined — callers fall back to no blur.
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

/** next/image blur props for a listing photo — spread onto <Image>. */
export function blurProps(url: string): { placeholder: "blur"; blurDataURL: string } | { placeholder: "empty" } {
  const lqip = lqipOf(url)
  return lqip ? { placeholder: "blur", blurDataURL: lqip } : { placeholder: "empty" }
}
