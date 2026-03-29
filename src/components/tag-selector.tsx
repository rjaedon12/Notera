"use client"

import { useState } from "react"
import { ChevronsUpDown, Tag as TagIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { PREDEFINED_TAGS, getTagDef } from "@/data/tags"

interface TagSelectorProps {
  selectedTags: string[]
  onTagsChange: (tags: string[]) => void
  maxTags?: number
  placeholder?: string
  disabled?: boolean
}

export function TagSelector({
  selectedTags,
  onTagsChange,
  maxTags = 5,
  placeholder = "Add tags...",
  disabled = false,
}: TagSelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const filteredTags = PREDEFINED_TAGS.filter(
    (tag) =>
      (tag.label.toLowerCase().includes(search.toLowerCase()) ||
        tag.description.toLowerCase().includes(search.toLowerCase())) &&
      !selectedTags.includes(tag.slug)
  )

  const addTag = (slug: string) => {
    const normalized = slug.toLowerCase()
    if (normalized && !selectedTags.includes(normalized) && selectedTags.length < maxTags) {
      onTagsChange([...selectedTags, normalized])
      setSearch("")
    }
  }

  const removeTag = (slug: string) => {
    onTagsChange(selectedTags.filter((t) => t !== slug))
  }

  return (
    <div className="space-y-2">
      {/* Selected tags */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedTags.map((slug) => {
            const def = getTagDef(slug)
            return (
              <SelectedTag
                key={slug}
                label={def.label}
                color={def.color}
                onRemove={() => removeTag(slug)}
              />
            )
          })}
        </div>
      )}

      {/* Tag selector popover */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled || selectedTags.length >= maxTags}
            className="w-full justify-between text-left font-normal"
          >
            <span className="flex items-center gap-2 text-muted-foreground">
              <TagIcon className="h-4 w-4" />
              {selectedTags.length >= maxTags
                ? `Max ${maxTags} tags`
                : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0" align="start">
          <div className="p-2">
            <input
              type="text"
              placeholder="Search tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input text-input-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="max-h-60 overflow-auto p-1">
            {filteredTags.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                {search ? "No matching tags" : "No more tags available"}
              </p>
            ) : (
              filteredTags.map((tag) => (
                <button
                  key={tag.slug}
                  onClick={() => addTag(tag.slug)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm",
                    "hover:bg-muted text-foreground"
                  )}
                >
                  <TagDot color={tag.color} />
                  <div className="flex-1 text-left">
                    <span className="font-medium">{tag.label}</span>
                    {tag.description && (
                      <span className="ml-1.5 text-xs text-muted-foreground">{tag.description}</span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

/* ── helpers ── */

const DOT_COLORS: Record<string, string> = {
  blue:   "bg-blue-500",
  green:  "bg-green-500",
  purple: "bg-purple-500",
  orange: "bg-orange-500",
  pink:   "bg-pink-500",
  yellow: "bg-yellow-500",
  red:    "bg-red-500",
}

function TagDot({ color }: { color: string }) {
  return <span className={cn("h-2.5 w-2.5 rounded-full flex-shrink-0", DOT_COLORS[color] ?? "bg-gray-400")} />
}

const CHIP_COLORS: Record<string, string> = {
  blue:   "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  green:  "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  purple: "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  orange: "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  pink:   "bg-pink-50 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  yellow: "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  red:    "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400",
}

function SelectedTag({ label, color, onRemove }: { label: string; color: string; onRemove: () => void }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        CHIP_COLORS[color] ?? "bg-muted text-muted-foreground"
      )}
    >
      {label}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onRemove() }}
        className="ml-0.5 hover:opacity-70"
      >
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </span>
  )
}
