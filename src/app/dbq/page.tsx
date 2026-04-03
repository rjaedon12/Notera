import { redirect } from "next/navigation"

export default function DBQPage() {
  redirect("/quizzes?tab=dbq")
}
