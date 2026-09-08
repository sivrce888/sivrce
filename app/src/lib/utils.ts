import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

import { ogOf } from "@/lib/media"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** JSON-LD for inline <script> tags — escapes `<` so `</script>` can't break out. */
export function jsonLd(obj: unknown) {
  return JSON.stringify(obj).replace(/</g, "\\u003c")
}

/**
 * Social-share image: local photos get a build-time JPEG derivative
 * (scripts/og-derivatives.mjs), uploaded pipeline photos a runtime
 * .og.jpg twin (src/lib/media.ts ogOf) — WhatsApp/Viber/FB crawlers
 * skip WebP. External URLs and non-WebP files pass through unchanged.
 */
export function ogImage(src: string): string {
  return ogOf(src) ?? src.replace(/^\/images\/(.+)\.webp$/, "/images/og/$1.jpg")
}

/**
 * og:image list: share twin first; original kept as second tag only for
 * pipeline uploads (covers listings created before the .og.jpg twin existed).
 */
export function ogImages(src: string): string[] {
  return ogOf(src) ? [ogImage(src), src] : [ogImage(src)]
}
