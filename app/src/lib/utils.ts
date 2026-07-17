import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** JSON-LD for inline <script> tags — escapes `<` so `</script>` can't break out. */
export function jsonLd(obj: unknown) {
  return JSON.stringify(obj).replace(/</g, "\\u003c")
}

/**
 * Social-share image: local photos get a build-time JPEG derivative
 * (scripts/og-derivatives.mjs) — WhatsApp/Viber/FB crawlers skip WebP.
 * External URLs and non-WebP files pass through unchanged.
 */
export function ogImage(src: string): string {
  return src.replace(/^\/images\/(.+)\.webp$/, "/images/og/$1.jpg")
}
