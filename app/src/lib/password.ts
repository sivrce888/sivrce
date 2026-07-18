/**
 * Password hashing via Node scrypt — no bcrypt dep.
 * Format: `saltHex:hashHex` (16-byte salt, 64-byte derived key).
 */
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto"
import { promisify } from "node:util"

const scryptAsync = promisify(scrypt)
const KEYLEN = 64
const MIN_LEN = 8
const MAX_LEN = 128

export function validatePassword(password: string): string | null {
  if (password.length < MIN_LEN) return `პაროლი უნდა იყოს მინიმუმ ${MIN_LEN} სიმბოლო`
  if (password.length > MAX_LEN) return "პაროლი ძალიან გრძელია"
  return null
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex")
  const derived = (await scryptAsync(password, salt, KEYLEN)) as Buffer
  return `${salt}:${derived.toString("hex")}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(":")
  if (!salt || !hash) return false
  const derived = (await scryptAsync(password, salt, KEYLEN)) as Buffer
  const expected = Buffer.from(hash, "hex")
  if (expected.length !== derived.length) return false
  return timingSafeEqual(expected, derived)
}

// ponytail: one assert-based check — fails if hash/verify regresses
if (process.env.NODE_ENV !== "production" && process.argv[1]?.endsWith("password.ts")) {
  void (async () => {
    const h = await hashPassword("sivrce-test-9")
    console.assert(await verifyPassword("sivrce-test-9", h), "verify ok")
    console.assert(!(await verifyPassword("wrong", h)), "reject wrong")
    console.assert(validatePassword("short") !== null, "min length")
    console.log("password.ts ok")
  })()
}
