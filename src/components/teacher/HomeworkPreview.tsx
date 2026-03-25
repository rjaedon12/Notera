"use client"

import { X, FileText } from "lucide-react"
import { motion } from "framer-motion"
import { HomeworkSheetContent } from "./HomeworkSheetContent"
import type { HomeworkConfig, GeneratedQuestion } from "@/types/homework"

/* Print stylesheet — imported once so browser Print→PDF works too */
import "./homework-print.css"

interface HomeworkPreviewProps {
  config: HomeworkConfig
  questions: GeneratedQuestion[]
  onClose: () => void
}

export function HomeworkPreview({ config, questions, onClose }: HomeworkPreviewProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-600" />
            <h2 className="text-sm font-bold text-gray-900">Preview</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        {/* Preview content — uses the same component as the PDF pipeline */}
        <div className="flex-1 overflow-y-auto">
          <HomeworkSheetContent config={config} questions={questions} />
        </div>
      </motion.div>
    </motion.div>
  )
}
