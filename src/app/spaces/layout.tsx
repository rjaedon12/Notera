import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Spaces",
}

export default function SpacesLayout({ children }: { children: React.ReactNode }) {
  return children
}
