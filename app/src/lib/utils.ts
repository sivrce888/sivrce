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
 * Social-share image: CDN uploads use a runtime .og.jpg twin (ogOf).
 * Local /images/*.webp pass through — per-page JPEG derivatives under
 * /images/og/ were dropped (repo weight). Prefer og-brand.png at call sites
 * when a dedicated share asset is required.
 */
export function ogImage(src: string): string {
  return ogOf(src) ?? src
}

/**
 * og:image list: share twin first; original kept as second tag only for
 * pipeline uploads (covers listings created before the .og.jpg twin existed).
 */
export function ogImages(src: string): string[] {
  return ogOf(src) ? [ogImage(src), src] : [ogImage(src)]
}
