import { PrismaAdapter } from "@auth/prisma-adapter"
import NextAuth, { type NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"

import { finishLogin } from "@/lib/auth-passkey"
import { isPhoneEmail } from "@/lib/auth-phone"
import type { UserRole } from "@/generated/prisma/client"
import { findOrCreatePhoneUser, verifyPhoneOtp } from "@/lib/auth-phone-otp"
import { db, dbAvailable } from "@/lib/db"
import { sendWelcomeEmail } from "@/lib/email"
import { verifyPassword } from "@/lib/password"

const providers: NextAuthConfig["providers"] = []

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

providers.push(
  Credentials({
    id: "credentials",
    name: "Email",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const email = String(credentials?.email ?? "")
        .trim()
        .toLowerCase()
      const password = String(credentials?.password ?? "")
      if (!email || !password) return null

      const user = await db.user.findUnique({ where: { email } })
      if (!user?.passwordHash) return null
      if (!(await verifyPassword(password, user.passwordHash))) return null

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.role,
      }
    },
  }),
)

providers.push(
  Credentials({
    id: "passkey",
    name: "Passkey",
    credentials: { cred: { label: "cred", type: "text" } },
    async authorize(credentials) {
      const cred = String(credentials?.cred ?? "")
      if (!cred) return null
      return finishLogin(cred)
    },
  }),
)

providers.push(
  Credentials({
    id: "phone",
    name: "Phone",
    credentials: {
      phone: { label: "Phone", type: "tel" },
      code: { label: "Code", type: "text" },
    },
    async authorize(credentials) {
      const checked = await verifyPhoneOtp(
        String(credentials?.phone ?? ""),
        String(credentials?.code ?? ""),
      )
      if (!checked.ok) return null
      const user = await findOrCreatePhoneUser(checked.phone)
      return {
        id: user.id,
        email: user.email,
        name: user.name || checked.phone,
        image: user.image,
        role: user.role,
      }
    },
  }),
)

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
  trustHost: true,
  cookies: crossSubdomainCookies,
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  // Credentials require JWT. Adapter still persists Google users/accounts.
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!
        token.role = (user.role as UserRole) ?? "buyer"
        if (user.name) token.name = user.name
        return token
      }
      const id = String(token.id ?? token.sub ?? "")
      if (!id) return token
      token.id = id
      // Fresh role after onboarding/settings (PK lookup — same as DB sessions).
      // ponytail: never 500 /api/auth/session when Postgres is down — chrome polls this on every page.
      try {
        if (!(await dbAvailable())) return token
        const row = await db.user.findUnique({
          where: { id },
          select: { role: true, name: true },
        })
        if (row) {
          token.role = row.role
          if (row.name) token.name = row.name
        }
      } catch { /* keep last-known role */ }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id ?? token.sub)
        session.user.role = (token.role as UserRole) ?? "buyer"
        if (typeof token.name === "string") session.user.name = token.name
      }
      return session
    },
  },
  events: {
    async createUser({ user }) {
      if (!user.email || isPhoneEmail(user.email)) return
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
})
