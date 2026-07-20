/** Price-watch SavedSearch name helpers (no DB). */
export const PRICE_WATCH_PREFIX = '__price__:'

export function priceWatchName(listingId: string): string {
  return `${PRICE_WATCH_PREFIX}${listingId}`
}

export function isPriceWatchName(name: string): boolean {
  return name.startsWith(PRICE_WATCH_PREFIX)
}
