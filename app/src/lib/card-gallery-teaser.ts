/** Card photo teaser — first N frames; rest on detail. */
export const CARD_PHOTO_CAP = 4

export function cardGalleryTeaser(images: string[], fallback: string, cap = CARD_PHOTO_CAP) {
  const photos = (images.length > 0 ? images : [fallback]).slice(0, cap)
  return {
    photos,
    morePhotos: Math.max(0, images.length - photos.length),
    multi: photos.length > 1,
    // ponytail: always `cap` dashes — live count made rails look 2-vs-3
    dashSlots: cap,
  }
}
