/** Card gallery — full set; mount only current ±1. */
export function cardGalleryTeaser(images: string[], fallback: string) {
  const photos = images.length > 0 ? images : [fallback]
  return { photos, multi: photos.length > 1 }
}

/** Keep current ±1 in the DOM so swipe is instant. Wrap-around. */
export function photoMountIdx(i: number, n: number): number[] {
  if (n <= 1) return [0]
  if (n === 2) return [0, 1]
  return [(i - 1 + n) % n, i, (i + 1) % n]
}
