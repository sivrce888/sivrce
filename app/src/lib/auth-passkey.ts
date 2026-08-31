/**
 * WebAuthn passkeys. Discoverable credentials → Face ID / Touch ID sign-in.
 * ponytail: Auth.js Passkey provider is experimental + wants DB sessions;
 * we verify with SimpleWebAuthn and mint the existing JWT via credentials.
 * Capacitor associated-domains if native WebView Face ID is needed later.
 */
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  type AuthenticationResponseJSON,
  type AuthenticatorTransportFuture,
  type RegistrationResponseJSON,
} from "@simplewebauthn/server"
import { cookies, headers } from "next/headers"

import { accountLabel } from "@/lib/auth-phone"
import { db } from "@/lib/db"

export const RP_NAME = "sivrce"
const CH_LOGIN = "sv_wa_auth"
const CH_REG = "sv_wa_reg"
const CH_MAX_AGE = 300

/** WebAuthn credential IDs are base64 / base64url. Reject anything else. */
const CREDENTIAL_ID_RE = /^[\w+/=-]{8,512}$/

export function isCredentialId(raw: string): boolean {
  return CREDENTIAL_ID_RE.test(raw)
}

export function rpIdFor(hostname: string): string {
  const host = hostname.toLowerCase()
  if (host === "localhost" || host.endsWith(".localhost")) return "localhost"
  if (host === "sivrce.ge" || host.endsWith(".sivrce.ge")) return "sivrce.ge"
  return host
}

export function rpFromHost(
  hostHeader: string,
  proto: string,
): { rpID: string; origin: string } {
  const host = hostHeader.split(",")[0]!.trim().toLowerCase()
  const hostname = host.split(":")[0] || "localhost"
  return { rpID: rpIdFor(hostname), origin: `${proto}://${host}` }
}

export async function relyingParty(): Promise<{ rpID: string; origin: string }> {
  const h = await headers()
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000"
  const proto =
    h.get("x-forwarded-proto") ||
    (host.includes("localhost") ? "http" : "https")
  return rpFromHost(host, proto)
}

export function encodePublicKey(key: Uint8Array): string {
  return Buffer.from(key).toString("base64url")
}

export function decodePublicKey(b64: string): Uint8Array<ArrayBuffer> {
  const buf = Buffer.from(b64, "base64url")
  const out = new Uint8Array(buf.byteLength)
  out.set(buf)
  return out
}

export function parseTransports(
  raw: string | null,
): AuthenticatorTransportFuture[] | undefined {
  if (!raw) return undefined
  const parts = raw.split(",").filter(Boolean)
  return parts.length ? (parts as AuthenticatorTransportFuture[]) : undefined
}

export function joinTransports(
  t?: AuthenticatorTransportFuture[],
): string | null {
  return t?.length ? t.join(",") : null
}

async function setChallenge(name: string, challenge: string) {
  const jar = await cookies()
  jar.set(name, challenge, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: CH_MAX_AGE,
  })
}

async function takeChallenge(name: string): Promise<string | null> {
  const jar = await cookies()
  const v = jar.get(name)?.value ?? null
  jar.delete(name)
  return v
}

export async function loginOptions() {
  const { rpID } = await relyingParty()
  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: "required",
  })
  await setChallenge(CH_LOGIN, options.challenge)
  return options
}

export async function registrationOptions(user: {
  id: string
  name: string | null
  email: string
}) {
  const { rpID } = await relyingParty()
  const existing = await db.authenticator.findMany({
    where: { userId: user.id },
    select: { credentialID: true, transports: true },
  })
  const label = accountLabel(user.name, user.email)
  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID,
    userName: label,
    userDisplayName: label,
    userID: new TextEncoder().encode(user.id),
    attestationType: "none",
    excludeCredentials: existing.map((c) => ({
      id: c.credentialID,
      transports: parseTransports(c.transports),
    })),
    authenticatorSelection: {
      residentKey: "required",
      userVerification: "required",
    },
  })
  await setChallenge(CH_REG, options.challenge)
  return options
}

export async function finishRegistration(
  userId: string,
  body: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const challenge = await takeChallenge(CH_REG)
  if (!challenge) return { ok: false, error: "ვადა ამოიწურა — სცადე თავიდან" }
  const { rpID, origin } = await relyingParty()
  let verification
  try {
    verification = await verifyRegistrationResponse({
      response: body as RegistrationResponseJSON,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
    })
  } catch {
    return { ok: false, error: "Passkey ვერ დაემატა" }
  }
  if (!verification.verified || !verification.registrationInfo) {
    return { ok: false, error: "Passkey ვერ დაემატა" }
  }
  const { credential, credentialDeviceType, credentialBackedUp } =
    verification.registrationInfo
  if (!isCredentialId(credential.id)) return { ok: false, error: "Passkey ვერ დაემატა" }
  try {
    await db.authenticator.create({
      data: {
        userId,
        credentialID: credential.id,
        providerAccountId: userId,
        credentialPublicKey: encodePublicKey(credential.publicKey),
        counter: credential.counter,
        credentialDeviceType,
        credentialBackedUp,
        transports: joinTransports(credential.transports),
      },
    })
  } catch {
    return { ok: false, error: "ეს Passkey უკვე დამატებულია" }
  }
  return { ok: true }
}

export async function finishLogin(credJson: string) {
  let body: AuthenticationResponseJSON
  try {
    body = JSON.parse(credJson) as AuthenticationResponseJSON
  } catch {
    return null
  }
  if (!body.id || !isCredentialId(body.id)) return null
  const challenge = await takeChallenge(CH_LOGIN)
  if (!challenge) return null
  const row = await db.authenticator.findUnique({
    where: { credentialID: body.id },
  })
  if (!row) return null
  const { rpID, origin } = await relyingParty()
  let verification
  try {
    verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
      credential: {
        id: row.credentialID,
        publicKey: decodePublicKey(row.credentialPublicKey),
        counter: row.counter,
        transports: parseTransports(row.transports),
      },
    })
  } catch {
    return null
  }
  if (!verification.verified) return null
  await db.authenticator.update({
    where: { credentialID: row.credentialID },
    data: { counter: verification.authenticationInfo.newCounter },
  })
  const user = await db.user.findUnique({ where: { id: row.userId } })
  if (!user) return null
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    role: user.role,
  }
}
