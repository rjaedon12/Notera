import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Quizzes",
}

export default function QuizzesLayout({ children }: { children: React.ReactNode }) {
  return children
}
