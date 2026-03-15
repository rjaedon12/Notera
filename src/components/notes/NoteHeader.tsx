"use client"

import { useState, useRef, useCallback, useEffect, KeyboardEvent } from "react"
import { ImageIcon, Smile, Maximize2, Minimize2 } from "lucide-react"
import { IconPicker } from "./IconPicker"
import { CoverImagePicker } from "./CoverImagePicker"
import type { SaveStatus } from "@/hooks/useAutoSave"

interface NoteHeaderProps {
  title: string
  icon: string | null
  coverImage: string | null
  isFullWidth: boolean
  updatedAt: string | null
  saveStatus: SaveStatus
  onTitleChange: (title: string) => void
  onIconChange: (icon: string | null) => void
  onCoverChange: (cover: string | null) => void
  onFullWidthChange: (isFullWidth: boolean) => void
  onTitleEnter: () => void
  onRetrySave: () => void
}

export function NoteHeader({
  title,
  icon,
  coverImage,
  isFullWidth,
  updatedAt,
  saveStatus,
  onTitleChange,
  onIconChange,
  onCoverChange,
  onFullWidthChange,
  onTitleEnter,
  onRetrySave,
}: NoteHeaderProps) {
  const [showIconPicker, setShowIconPicker] = useState(false)
  const [showCoverPicker, setShowCoverPicker] = useState(false)
  const [isHeaderHovered, setIsHeaderHovered] = useState(false)
  const titleRef = useRef<HTMLHeadingElement>(null)

  // Sync title with contentEditable
  const handleTitleInput = useCallback(() => {
    if (titleRef.current) {
      const text = titleRef.current.textContent || ""
      onTitleChange(text)
    }
  }, [onTitleChange])

  const handleTitleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLHeadingElement>) => {
      if (e.key === "Enter") {
        e.preventDefault()
        onTitleEnter()
      }
    },
    [onTitleEnter]
  )

  // Set title text on mount or when it changes externally
  useEffect(() => {
    if (titleRef.current && titleRef.current.textContent !== title) {
      titleRef.current.textContent = title === "Untitled" ? "" : title
    }
  }, [title])

  const isCoverGradient = coverImage?.startsWith("linear-gradient")

  const saveStatusLabel =
    saveStatus === "saving"
      ? "Saving…"
      : saveStatus === "saved"
        ? "Saved"
        : saveStatus === "error"
          ? "Failed to save"
          : null

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHeaderHovered(true)}
      onMouseLeave={() => setIsHeaderHovered(false)}
    >
      {/* Cover image */}
      {coverImage && (
        <div className="relative w-full h-[180px] group">
          {isCoverGradient ? (
            <div className="w-full h-full" style={{ background: coverImage }} />
          ) : (
            <div
              className="w-full h-full bg-cover bg-center"
              style={{ backgroundImage: `url(${coverImage})` }}
            />
          )}
          <div className="absolute inset-0 flex items-end justify-end gap-2 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setShowCoverPicker(true)}
              className="text-xs px-3 py-1.5 rounded bg-white/80 dark:bg-black/60 text-black dark:text-white backdrop-blur-sm transition-colors hover:bg-white dark:hover:bg-black/80"
            >
              Change cover
            </button>
            <button
              onClick={() => onCoverChange(null)}
              className="text-xs px-3 py-1.5 rounded bg-white/80 dark:bg-black/60 text-black dark:text-white backdrop-blur-sm transition-colors hover:bg-white dark:hover:bg-black/80"
            >
              Remove
            </button>
          </div>
          <div className="relative">
            <CoverImagePicker
              isOpen={showCoverPicker}
              onClose={() => setShowCoverPicker(false)}
              onSelect={onCoverChange}
              currentCover={coverImage}
            />
          </div>
        </div>
      )}

      {/* Icon + Title area */}
      <div className={`${isFullWidth ? "" : "max-w-[708px]"} mx-auto px-6`}>
        {/* Icon */}
        <div className="relative mt-6 mb-2">
          {icon ? (
            <button
              onClick={() => setShowIconPicker(true)}
              className="text-6xl leading-none hover:opacity-80 transition-opacity cursor-pointer"
              title="Change icon"
            >
              {icon}
            </button>
          ) : (
            isHeaderHovered && (
              <button
                onClick={() => setShowIconPicker(true)}
                className="flex items-center gap-1 text-sm py-1 px-2 rounded transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                style={{ color: "var(--muted-foreground)" }}
              >
                <Smile className="h-4 w-4" />
                Add icon
              </button>
            )
          )}
          <IconPicker
            isOpen={showIconPicker}
            onClose={() => setShowIconPicker(false)}
            onSelect={onIconChange}
            currentIcon={icon}
          />
        </div>

        {/* Control bar (appears on hover) */}
        {isHeaderHovered && (
          <div className="flex items-center gap-2 mb-2">
            {!icon && (
              <button
                onClick={() => setShowIconPicker(true)}
                className="hidden"
              />
            )}
            {!coverImage && (
              <button
                onClick={() => setShowCoverPicker(true)}
                className="flex items-center gap-1 text-sm py-1 px-2 rounded transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                style={{ color: "var(--muted-foreground)" }}
              >
                <ImageIcon className="h-4 w-4" />
                Add cover
              </button>
            )}
            <div className="relative">
              <CoverImagePicker
                isOpen={showCoverPicker && !coverImage}
                onClose={() => setShowCoverPicker(false)}
                onSelect={onCoverChange}
                currentCover={coverImage}
              />
            </div>
          </div>
        )}

        {/* Title */}
        <h1
          ref={titleRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleTitleInput}
          onKeyDown={handleTitleKeyDown}
          data-placeholder="Untitled"
          className="note-title outline-none w-full empty:before:content-[attr(data-placeholder)] empty:before:text-[#9b9a97] empty:before:pointer-events-none"
          style={{
            fontSize: "2.5rem",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            lineHeight: 1.2,
            fontFamily:
              'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
            color: "var(--foreground)",
          }}
        />

        {/* Status bar */}
        <div className="flex items-center gap-3 mt-2 mb-4 text-xs" style={{ color: "var(--muted-foreground)" }}>
          {saveStatusLabel && (
            <span
              className={saveStatus === "error" ? "cursor-pointer underline" : ""}
              onClick={saveStatus === "error" ? onRetrySave : undefined}
              style={saveStatus === "error" ? { color: "var(--destructive)" } : {}}
            >
              {saveStatusLabel}
            </span>
          )}
          {updatedAt && (
            <span>
              Edited {new Date(updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </span>
          )}
          <button
            onClick={() => onFullWidthChange(!isFullWidth)}
            className="flex items-center gap-1 ml-auto py-0.5 px-1.5 rounded transition-colors hover:bg-black/5 dark:hover:bg-white/5"
          >
            {isFullWidth ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
            {isFullWidth ? "Default width" : "Full width"}
          </button>
        </div>
      </div>
    </div>
  )
}
