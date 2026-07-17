import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** JSON-LD for inline <script> tags — escapes `<` so `</script>` can't break out. */
export function jsonLd(obj: unknown) {
  return JSON.stringify(obj).replace(/</g, "\\u003c")
}
