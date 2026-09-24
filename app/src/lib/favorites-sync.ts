/**
 * Favorites sync — pure, hook-free half. Shared by the client store
 * (lib/favorites.ts) and the server (API route, saved-listings). Keep React out:
 * server modules import this.
 */

/** Per-user cap, client and server. Far above any real shortlist. */
export const FAV_MAX = 500
export const ID_RE = /^[\w-]{1,120}$/

/** Validate an untrusted `{ add?, remove? }` body. null = malformed. */
export function parseFavPatch(body: unknown): { add: string[]; remove: string[] } | null {
  if (typeof body !== 'object' || body === null) return null
  const pick = (v: unknown): string[] | null => {
    if (v === undefined) return []
    if (!Array.isArray(v) || v.length > FAV_MAX) return null
    if (!v.every((x) => typeof x === 'string' && ID_RE.test(x))) return null
    return [...new Set(v as string[])]
  }
  const { add, remove } = body as { add?: unknown; remove?: unknown }
  const a = pick(add)
  const r = pick(remove)
  return a && r ? { add: a, remove: r } : null
}

/**
 * 3-way merge against `base` (the server list this device last saw). Local
 * adds/removes since then go up as a patch; removals made on another device
 * come down because they left the server but were in base. Empty base (new
 * device or new user) degrades to a union, so signed-out hearts are never lost.
 */
export function favPatch(local: string[], base: string[]): { add: string[]; remove: string[] } {
  const l = new Set(local)
  const b = new Set(base)
  return { add: local.filter((id) => !b.has(id)), remove: base.filter((id) => !l.has(id)) }
}

/** Local list after the server answered the patch. Ids the server could not
 * store (catalog-only listings) stay on this device. */
export function mergeFavs(local: string[], base: string[], server: string[]): string[] {
  const b = new Set(base)
  return [...new Set([...server, ...local.filter((id) => !b.has(id))])].slice(0, FAV_MAX)
}
