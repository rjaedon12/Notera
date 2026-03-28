import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "DBQ Practice",
}

export default function DBQLayout({ children }: { children: React.ReactNode }) {
  return children
}
