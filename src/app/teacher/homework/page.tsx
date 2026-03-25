"use client"

import { FileText } from "lucide-react"
import { HomeworkBuilder } from "@/components/teacher/HomeworkBuilder"

export default function TeacherHomeworkPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3 font-heading">
          <FileText className="h-8 w-8" style={{ color: "var(--primary)" }} />
          Homework Creator
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--muted-foreground)" }}>
          Create printable PDF worksheets from your flashcard study sets.
          Select sets, choose question formats, and download a ready-to-print homework.
        </p>
      </div>

      {/* Builder */}
      <HomeworkBuilder />
    </div>
  )
}
