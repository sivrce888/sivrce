import { PrismaAdapter } from "@auth/prisma-adapter"
import NextAuth, { type NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"

import { db } from "@/lib/db"

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

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  providers,
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
  // Database sessions via the Prisma adapter (Session model in schema).
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
})
