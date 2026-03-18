import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Whiteboard — Koda",
  description: "Collaborative whiteboard for visual learning",
}

export default function WhiteboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
