/** Map pointer X (0–1) → photo index. Yandex Realty / Zillow card scrub. */
export function photoIndexFromX(ratio: number, n: number): number {
  if (n <= 1) return 0
  return Math.min(n - 1, Math.max(0, Math.floor(ratio * n)))
}
