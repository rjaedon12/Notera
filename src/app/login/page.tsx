"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Loader2 } from "lucide-react"
import toast from "react-hot-toast"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        toast.error("Invalid email or password")
      } else {
        toast.success("Welcome back!")
        router.push("/")
        router.refresh()
      }
    } catch {
      toast.error("Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — warm cream with brand */}
      <div
        className="hidden lg:flex lg:w-[45%] flex-col justify-between p-12"
        style={{ background: "#F5F3EE" }}
      >
        <div>
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-7 w-7 flex-shrink-0 overflow-hidden rounded-[22%]" aria-hidden="true">
              <Image src="/notera-logo.png" alt="" width={28} height={28} className="h-7 w-7" />
            </div>
            <span className="font-heading font-bold text-[1.1rem]" style={{ color: "#1A1A1A", letterSpacing: "-0.03em" }}>
              Notera
            </span>
          </Link>
        </div>

        <div>
          <h1
            className="font-heading font-bold leading-[1.1] mb-4"
            style={{ color: "#1A1A1A", fontSize: "2.25rem", letterSpacing: "-0.035em" }}
          >
            Master anything,
            <br />
            one card at a time.
          </h1>
          <p className="text-[0.938rem] leading-relaxed max-w-sm" style={{ color: "#6B6B6B" }}>
            Flashcards, adaptive study modes, and progress tracking.
            Built for how you actually learn.
          </p>
        </div>

        <p className="text-xs" style={{ color: "#8A8A8A" }}>
          &copy; {new Date().getFullYear()} Notera
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12" style={{ background: "#FAF9F6" }}>
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden mb-10">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="h-7 w-7 flex-shrink-0 overflow-hidden rounded-[22%]" aria-hidden="true">
                <Image src="/notera-logo.png" alt="" width={28} height={28} className="h-7 w-7" />
              </div>
              <span className="font-heading font-bold text-[1.1rem]" style={{ color: "#1A1A1A", letterSpacing: "-0.03em" }}>
                Notera
              </span>
            </Link>
          </div>

          <h2
            className="font-heading font-bold text-2xl mb-2"
            style={{ color: "#1A1A1A", letterSpacing: "-0.03em" }}
          >
            Welcome back
          </h2>
          <p className="text-sm mb-8" style={{ color: "#6B6B6B" }}>
            Sign in to continue studying
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase mb-2" style={{ color: "#8A8A8A", letterSpacing: "0.08em" }}>
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-4 py-3 text-sm rounded-lg outline-none transition-all"
                style={{
                  background: "#FFFFFF",
                  border: "1px solid rgba(0,0,0,0.08)",
                  color: "#1A1A1A",
                }}
                onFocus={(e) => { e.target.style.borderColor = "rgba(0,0,0,0.2)" }}
                onBlur={(e) => { e.target.style.borderColor = "rgba(0,0,0,0.08)" }}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold uppercase mb-2" style={{ color: "#8A8A8A", letterSpacing: "0.08em" }}>
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-4 py-3 text-sm rounded-lg outline-none transition-all"
                style={{
                  background: "#FFFFFF",
                  border: "1px solid rgba(0,0,0,0.08)",
                  color: "#1A1A1A",
                }}
                onFocus={(e) => { e.target.style.borderColor = "rgba(0,0,0,0.2)" }}
                onBlur={(e) => { e.target.style.borderColor = "rgba(0,0,0,0.08)" }}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="landing-btn-primary w-full justify-center"
              style={{ marginTop: "1.5rem" }}
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Sign in
            </button>
          </form>

          <p className="text-sm text-center mt-8" style={{ color: "#6B6B6B" }}>
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-medium" style={{ color: "#1A1A1A" }}>
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
