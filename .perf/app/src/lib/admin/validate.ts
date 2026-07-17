/** FormData validation helpers for admin server actions (no zod in deps). */

export function reqString(fd: FormData, name: string, max = 500): string {
  const v = fd.get(name)
  if (typeof v !== "string" || !v.trim()) throw new Error(`Missing field: ${name}`)
  const s = v.trim()
  if (s.length > max) throw new Error(`Field too long: ${name}`)
  return s
}

export function optString(fd: FormData, name: string, max = 2000): string | null {
  const v = fd.get(name)
  if (typeof v !== "string" || !v.trim()) return null
  const s = v.trim()
  if (s.length > max) throw new Error(`Field too long: ${name}`)
  return s
}

export function reqEnum<T extends string>(
  fd: FormData,
  name: string,
  allowed: readonly T[],
): T {
  const v = reqString(fd, name, 120)
  if (!(allowed as readonly string[]).includes(v)) {
    throw new Error(`Invalid value for ${name}`)
  }
  return v as T
}

export function optInt(fd: FormData, name: string, min = 0, max = 1_000_000_000): number | null {
  const v = fd.get(name)
  if (typeof v !== "string" || !v.trim()) return null
  const n = Number(v)
  if (!Number.isInteger(n) || n < min || n > max) throw new Error(`Invalid number: ${name}`)
  return n
}
