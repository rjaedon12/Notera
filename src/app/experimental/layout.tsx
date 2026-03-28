import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Experimental",
}

export default function ExperimentalLayout({ children }: { children: React.ReactNode }) {
  return children
}
