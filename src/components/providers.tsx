"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"
import { SessionProvider } from "next-auth/react"
import { Toaster } from "react-hot-toast"
import { ThemeProvider } from "@/components/theme-provider"
import { ColorThemeProvider } from "@/context/ThemeContext"

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <ColorThemeProvider>
            {children}
            <Toaster 
              position="bottom-right"
              toastOptions={{
                className: 'bg-card text-card-foreground shadow-lg rounded-lg',
                duration: 3000,
              }}
            />
          </ColorThemeProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </SessionProvider>
  )
}
