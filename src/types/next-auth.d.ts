import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
    } & DefaultSession["user"]
  }
  interface User {
    role?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: string
  }
}

// next-auth/react imports Session from @auth/core/types directly,
// so we must augment it there too.
declare module "@auth/core/types" {
  interface User {
    role?: string
  }
  interface Session {
    user: {
      id: string
      role: string
    } & DefaultSession["user"]
  }
}
