"use client"

import { WBAuthProvider } from "@/components/whiteboard/WBAuthProvider"

export default function WhiteboardLayout({ children }: { children: React.ReactNode }) {
  return <WBAuthProvider>{children}</WBAuthProvider>
}
