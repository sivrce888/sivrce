import { PrismaAdapter } from "@auth/prisma-adapter"
import NextAuth, { type NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"

import { db } from "@/lib/db"
import { sendWelcomeEmail } from "@/lib/email"

const providers: NextAuthConfig["providers"] = []

// Google is enabled only when its credentials are configured, so a missing
// OAuth config can never crash boot or local development.
if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      // Google guarantees email ownership on the ID token, so linking an
      // existing account with the same verified email is safe. Any future
      // provider that does NOT verify email must not set this.
      allowDangerousEmailAccountLinking: true,
    }),
  )
}

// Fail fast: without AUTH_SECRET, production sessions would be signed with a weak default.
if (process.env.NODE_ENV === "production" && !process.env.AUTH_SECRET) {
  throw new Error("AUTH_SECRET must be set in production")
}

/** Comma-separated staff emails promoted to admin on create/sign-in. */
function adminEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  )
}

async function ensureAdminRole(userId: string, email: string | null | undefined) {
  if (!email || !adminEmails().has(email.toLowerCase())) return
  await db.user.updateMany({
    where: { id: userId, NOT: { role: "admin" } },
    data: { role: "admin" },
  })
}

// Share session across sivrce.ge + admin.sivrce.ge in production.
const crossSubdomainCookies: NextAuthConfig["cookies"] =
  process.env.NODE_ENV === "production"
    ? {
        sessionToken: {
          name: "__Secure-authjs.session-token",
          options: {
            httpOnly: true,
            sameSite: "lax",
            path: "/",
            secure: true,
            domain: ".sivrce.ge",
          },
        },
      }
    : undefined

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  providers,
  // Vercel / reverse proxies: trust X-Forwarded-Host for callback URLs.
  trustHost: true,
  cookies: crossSubdomainCookies,
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  callbacks: {
    // Database strategy: `user` is the adapter row, so role rides the session.
    async session({ session, user }) {
      session.user.id = user.id
      session.user.role = user.role
      return session
    },
  },
  events: {
    async createUser({ user }) {
      if (!user.email) return
      if (user.id) await ensureAdminRole(user.id, user.email)
      sendWelcomeEmail({
        to: user.email,
        name: user.name ?? user.email.split("@")[0] ?? "friend",
      })
    },
    async signIn({ user }) {
      if (user.id) await ensureAdminRole(user.id, user.email)
    },
  },
  // Database sessions via the Prisma adapter (Session model in schema).
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
})