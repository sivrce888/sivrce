/**
 * Self-check for passkey RP / codec / credential-id helpers.
 * Run: npx tsx src/lib/auth-passkey.check.ts
 */
import assert from "node:assert/strict"
import { config } from "dotenv"

config({ path: ".env.local" })

async function main() {
  const {
    decodePublicKey,
    encodePublicKey,
    isCredentialId,
    joinTransports,
    parseTransports,
    rpFromHost,
    rpIdFor,
  } = await import("./auth-passkey")

  assert.equal(isCredentialId("abc"), false)
  assert.equal(isCredentialId(""), false)
  assert.equal(isCredentialId("a".repeat(7)), false)
  assert.equal(isCredentialId("SGVsbG9QYXNza2V5"), true)
  assert.equal(isCredentialId("hello_world-passkey"), true)
  assert.equal(isCredentialId("abc+def/ghi="), true)
  assert.equal(isCredentialId("<script>"), false)
  assert.equal(isCredentialId("id;drop table"), false)

  assert.equal(rpIdFor("sivrce.ge"), "sivrce.ge")
  assert.equal(rpIdFor("admin.sivrce.ge"), "sivrce.ge")
  assert.equal(rpIdFor("localhost"), "localhost")
  assert.equal(rpIdFor("admin.localhost"), "localhost")
  assert.equal(rpIdFor("sivrce-git-main.vercel.app"), "sivrce-git-main.vercel.app")

  const prod = rpFromHost("sivrce.ge", "https")
  assert.equal(prod.rpID, "sivrce.ge")
  assert.equal(prod.origin, "https://sivrce.ge")

  const admin = rpFromHost("admin.sivrce.ge", "https")
  assert.equal(admin.rpID, "sivrce.ge")
  assert.equal(admin.origin, "https://admin.sivrce.ge")

  const local = rpFromHost("localhost:3000", "http")
  assert.equal(local.rpID, "localhost")
  assert.equal(local.origin, "http://localhost:3000")

  const key = new Uint8Array([1, 2, 3, 255])
  assert.deepEqual(decodePublicKey(encodePublicKey(key)), key)

  assert.equal(joinTransports(["internal", "hybrid"]), "internal,hybrid")
  assert.deepEqual(parseTransports("internal,hybrid"), ["internal", "hybrid"])
  assert.equal(parseTransports(null), undefined)

  console.log("auth-passkey.check: ok")
}

void main()
