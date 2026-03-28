import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Study Sets",
}

export default function SetsLayout({ children }: { children: React.ReactNode }) {
  return children
}
