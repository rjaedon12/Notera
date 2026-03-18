"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Copy, Check, Link as LinkIcon, Globe, Lock } from "lucide-react"
import toast from "react-hot-toast"

interface ShareDialogProps {
  isOpen: boolean
  onClose: () => void
  onCreateLink: (permission: "EDITOR" | "VIEWER") => Promise<string>
  boardTitle: string
}

export function ShareDialog({ isOpen, onClose, onCreateLink, boardTitle }: ShareDialogProps) {
  const [permission, setPermission] = useState<"EDITOR" | "VIEWER">("VIEWER")
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [creating, setCreating] = useState(false)

  const handleCreate = async () => {
    setCreating(true)
    try {
      const token = await onCreateLink(permission)
      const url = `${window.location.origin}/whiteboard/join?token=${token}`
      setShareUrl(url)
    } catch {
      toast.error("Failed to create share link")
    } finally {
      setCreating(false)
    }
  }

  const handleCopy = () => {
    if (!shareUrl) return
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    toast.success("Link copied!")
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
          >
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-2xl p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">
                  Share &ldquo;{boardTitle}&rdquo;
                </h3>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Permission toggle */}
              <div className="mb-4">
                <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2 block">
                  Permission level
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPermission("VIEWER")}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      permission === "VIEWER"
                        ? "bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 ring-1 ring-blue-200 dark:ring-blue-500/30"
                        : "bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                    }`}
                  >
                    <Lock size={14} />
                    View only
                  </button>
                  <button
                    onClick={() => setPermission("EDITOR")}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      permission === "EDITOR"
                        ? "bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 ring-1 ring-blue-200 dark:ring-blue-500/30"
                        : "bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                    }`}
                  >
                    <Globe size={14} />
                    Can edit
                  </button>
                </div>
              </div>

              {/* Share link */}
              {shareUrl ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-600 dark:text-zinc-300 truncate border border-zinc-200 dark:border-zinc-700">
                    {shareUrl}
                  </div>
                  <button
                    onClick={handleCopy}
                    className="p-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
                >
                  <LinkIcon size={14} />
                  {creating ? "Creating link..." : "Create share link"}
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
