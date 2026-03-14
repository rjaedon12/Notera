import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

// Build providers list dynamically
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const providers: any[] = [
  Credentials({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      try {
        const email = credentials?.email as string | undefined
        const password = credentials?.password as string | undefined

        if (!email || !password) return null

        const user = await prisma.user.findUnique({ where: { email } })
        if (!user || !user.password) return null

        // Check if user is banned
        if (user.isBanned) return null

        const valid = await bcrypt.compare(password, user.password)
        if (!valid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        }
      } catch (error) {
        console.error("Credentials authorize error:", error)
        return null
      }
    },
  }),
]

// Optional OAuth providers — enabled only when env vars are present
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  )
}

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  providers.push(
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    })
  )
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers,
  // Required for Vercel / reverse-proxy deployments
  trustHost: true,
  // JWT strategy is required when using the Credentials provider.
  // The PrismaAdapter still manages User / Account rows for OAuth sign-ins.
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        // Fetch role from DB on first sign-in
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id as string },
            select: { role: true, isBanned: true },
          })
          token.role = dbUser?.role ?? "USER"
          token.isBanned = dbUser?.isBanned ?? false
        } catch (error) {
          console.error("JWT callback: failed to fetch user role", error)
          token.role = "USER"
          token.isBanned = false
        }
      }
      // Periodically re-check ban status (every token refresh)
      if (token.id && !user) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { isBanned: true },
          })
          token.isBanned = dbUser?.isBanned ?? false
        } catch {
          // Keep existing ban status on DB error
        }
      }
      return token
    },
    async session({ session, token }) {
      // Block banned users from getting a valid session
      if (token.isBanned) {
        return { ...session, user: undefined } as typeof session
      }
      if (session.user && token.id) {
        session.user.id = token.id as string
        session.user.role = (token.role as string) ?? "USER"
      }
      return session
    },
    async redirect({ baseUrl }) {
      return `${baseUrl}/`
    },
  },
})
