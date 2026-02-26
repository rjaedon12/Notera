"use client"

import { useRef, useState } from "react"
import { Upload, X, ImageIcon } from "lucide-react"
import toast from "react-hot-toast"
import { cn } from "@/lib/utils"

interface ImageUploaderProps {
  value: string
  onChange: (url: string) => void
}

export function ImageUploader({ value, onChange }: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)

  const handleFile = async (file: File) => {
    if (file.size > 3 * 1024 * 1024) {
      toast.error("Image must be under 3 MB")
      return
    }
    setUploading(true)
    try {
      const form = new FormData()
      form.append("file", file)
      const res = await fetch("/api/upload/image", { method: "POST", body: form })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Upload failed")
        return
      }
      onChange(data.url)
    } catch {
      toast.error("Upload failed")
    } finally {
      setUploading(false)
    }
  }

  if (value) {
    return (
      <div className="relative inline-block mt-1">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={value}
          alt="Uploaded"
          className="max-h-48 max-w-full rounded-lg border shadow-sm"
        />
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute top-1 right-1 p-1 rounded-full bg-background/90 hover:bg-destructive/10 border shadow transition-colors"
          title="Remove image"
        >
          <X className="h-3.5 w-3.5 text-destructive" />
        </button>
      </div>
    )
  }

  return (
    <>
      <div
        onClick={() => !uploading && fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          const file = e.dataTransfer.files[0]
          if (file) handleFile(file)
        }}
        className={cn(
          "mt-1 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
          dragging
            ? "border-purple-400 bg-purple-50 dark:bg-purple-900/20"
            : "border-border hover:border-purple-400"
        )}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="h-6 w-6 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
            <p className="text-sm text-muted-foreground">Uploading…</p>
          </div>
        ) : (
          <>
            <ImageIcon className="h-7 w-7 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Click to upload</span> or drag & drop
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              JPEG, PNG, GIF, WebP · max 3 MB
            </p>
          </>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          // reset so same file can be re-selected
          e.target.value = ""
        }}
      />
    </>
  )
}
