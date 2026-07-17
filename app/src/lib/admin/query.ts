/** Shared query-string helpers for admin list pages. */

export const ADMIN_PAGE_SIZE = 25

export function parsePage(raw: string | string[] | undefined): number {
  const n = Number(Array.isArray(raw) ? raw[0] : raw)
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1
}

/** First string value of a search param, trimmed; "" when absent. */
export function param(raw: string | string[] | undefined): string {
  return (Array.isArray(raw) ? raw[0] : raw)?.trim() ?? ""
}

export type SearchParams = Record<string, string | string[] | undefined>

/** Merge current params with overrides; drops empty values and resets page unless kept. */
export function mergeParams(
  current: SearchParams,
  overrides: Record<string, string | number | undefined>,
): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(current)) {
    const val = Array.isArray(v) ? v[0] : v
    if (val) out[k] = val
  }
  for (const [k, v] of Object.entries(overrides)) {
    if (v === undefined || v === "") delete out[k]
    else out[k] = String(v)
  }
  return out
}

export function hrefWithParams(
  base: string,
  params: Record<string, string>,
): string {
  const qs = new URLSearchParams(params).toString()
  return qs ? `${base}?${qs}` : base
}
