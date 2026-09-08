import { PrismaAdapter } from "@auth/prisma-adapter"
import { cookies } from "next/headers"
import NextAuth, { type NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"

import { finishLogin } from "@/lib/auth-passkey"
import { isPhoneEmail } from "@/lib/auth-phone"
import { normalizeSource, REF_COOKIE } from "@/lib/attribution"
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

/** Activity heartbeat — writes at most once per 5 min per user (atomic WHERE). */
const HEARTBEAT_MS = 5 * 60_000

function stampLastSeen(userId: string) {
  return db.user.updateMany({
    where: {
      id: userId,
      OR: [{ lastSeenAt: null }, { lastSeenAt: { lt: new Date(Date.now() - HEARTBEAT_MS) } }],
    },
    data: { lastSeenAt: new Date() },
  })
}

/** First-touch attribution — set exactly once, on sign-in, from the proxy cookie. */
async function stampSignupSource(userId: string) {
  try {
    const raw = (await cookies()).get(REF_COOKIE)?.value
    const source = normalizeSource(raw)
    await db.user.updateMany({
      where: { id: userId, signupSource: null },
      data: { signupSource: source },
    })
  } catch {
    /* no cookie context — leave null, it stamps on a later sign-in */
  }
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
        // Promote before stamping the JWT — else first login keeps stale buyer role
        // until the next session poll (admin bounce → /).
        if (user.email) await ensureAdminRole(user.id!, user.email)
        let role = (user.role as UserRole) ?? "buyer"
        try {
          if (await dbAvailable()) {
            await Promise.all([stampLastSeen(user.id!), stampSignupSource(user.id!)])
            const row = await db.user.findUnique({
              where: { id: user.id! },
              select: { role: true, name: true, image: true, avatarStyle: true, avatarColor: true, avatarIcon: true },
            })
            if (row) {
              role = row.role
              if (row.name) token.name = row.name
              if (row.image) token.picture = row.image
              else delete token.picture
              token.avatarStyle = row.avatarStyle
              token.avatarColor = row.avatarColor
              token.avatarIcon = row.avatarIcon
            }
          }
        } catch {
          /* adapter role */
        }
        token.role = role
        if (user.name && !token.name) token.name = user.name
        if (user.image && !token.picture) token.picture = user.image
        return token
      }
      const id = String(token.id ?? token.sub ?? "")
      if (!id) return token
      token.id = id
      // Fresh role/name/image/avatarStyle after onboarding/settings (PK lookup — same as DB sessions).
      // ponytail: never 500 /api/auth/session when Postgres is down — chrome polls this on every page.
      try {
        if (!(await dbAvailable())) return token
        const [row] = await Promise.all([
          db.user.findUnique({
            where: { id },
            select: { role: true, name: true, image: true, avatarStyle: true, avatarColor: true, avatarIcon: true },
          }),
          stampLastSeen(id),
        ])
        // DB reachable but the row is gone (deleted account) — null invalidates
        // the session cookie. Otherwise the ghost session P2025s every save
        // (avatar, settings) and 500s the page.
        if (!row) return null
        token.role = row.role
        if (row.name) token.name = row.name
        // Clearing the photo must clear the token too, or the removed
        // avatar lingers in the session until re-login.
        if (row.image) token.picture = row.image
        else delete token.picture
        token.avatarStyle = row.avatarStyle
        token.avatarColor = row.avatarColor
        token.avatarIcon = row.avatarIcon
      } catch { /* keep last-known role */ }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id ?? token.sub)
        session.user.role = (token.role as UserRole) ?? "buyer"
        if (typeof token.name === "string") session.user.name = token.name
        if (typeof token.picture === "string") session.user.image = token.picture
        if (typeof token.avatarStyle === "number" || token.avatarStyle === null) {
          session.user.avatarStyle = token.avatarStyle
        }
        if (typeof token.avatarColor === "string" || token.avatarColor === null) {
          session.user.avatarColor = token.avatarColor
        }
        if (typeof token.avatarIcon === "string" || token.avatarIcon === null) {
          session.user.avatarIcon = token.avatarIcon
        }
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
