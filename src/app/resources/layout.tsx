import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Resources",
}

export default function ResourcesLayout({ children }: { children: React.ReactNode }) {
  return children
}
