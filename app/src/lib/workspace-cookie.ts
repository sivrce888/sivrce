/** Server-only persona cookie. Keep next/headers out of workspace.ts (client-safe). */
import "server-only"
import { cookies } from "next/headers"

import type { UserRole } from "@/generated/prisma/client"
import { PERSONA_COOKIE, personaFromRole, type Persona } from "@/lib/workspace"

export async function readPersona(role: UserRole): Promise<Persona> {
  const jar = await cookies()
  return personaFromRole(role, jar.get(PERSONA_COOKIE)?.value)
}

export async function writePersonaCookie(persona: Persona): Promise<void> {
  const jar = await cookies()
  jar.set(PERSONA_COOKIE, persona, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    httpOnly: true,
  })
}
