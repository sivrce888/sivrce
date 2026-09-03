/** Card carousel — 4 frames max; leftover is a "+N" overlay, not more bytes. */
export const CARD_PHOTO_CAP = 4

/** Trim search/home payloads. `photoCount` keeps "+N" honest after the slice. */
export function cardPhotoPayload(images: string[]): { images: string[]; photoCount: number } {
  return { images: images.slice(0, CARD_PHOTO_CAP), photoCount: images.length }
}

export function cardGalleryTeaser(images: string[], fallback: string, photoCount?: number) {
  const all = images.length > 0 ? images : [fallback]
  const photos = all.slice(0, CARD_PHOTO_CAP)
  const total = Math.max(photoCount ?? 0, all.length)
  const more = Math.max(0, total - photos.length)
  return { photos, multi: photos.length > 1, more, total }
}

/** Keep current ±1 in the DOM so swipe is instant. Wrap-around. */
export function photoMountIdx(i: number, n: number): number[] {
  if (n <= 1) return [0]
  if (n === 2) return [0, 1]
  return [(i - 1 + n) % n, i, (i + 1) % n]
}
