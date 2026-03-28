import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Study Guides",
}

export default function StudyGuidesLayout({ children }: { children: React.ReactNode }) {
  return children
}
