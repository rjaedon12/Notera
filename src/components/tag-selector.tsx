"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Check, ChevronsUpDown, Tag as TagIcon, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { TagChip } from "@/components/tag-chip"

interface AggregatedTag {
  name: string
  slug: string
  count: number
}

interface TagSelectorProps {
  selectedTags: string[]
  onTagsChange: (tags: string[]) => void
  maxTags?: number
  placeholder?: string
  disabled?: boolean
}

// Cycle through colors based on tag name
function colorForTag(name: string) {
  const colors = ["blue", "green", "purple", "orange", "pink", "yellow", "red"]
  const hash = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return colors[hash % colors.length]
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

  // Fetch aggregated tags from public sets
  const { data: availableTags = [] } = useQuery<AggregatedTag[]>({
    queryKey: ["tags"],
    queryFn: async () => {
      const res = await fetch("/api/tags")
      if (!res.ok) return []
      return res.json()
    },
  })

  const filteredTags = availableTags.filter(
    (tag) =>
      tag.name.toLowerCase().includes(search.toLowerCase()) &&
      !selectedTags.includes(tag.name)
  )

  const canAddCustom =
    search.trim().length > 0 &&
    !selectedTags.includes(search.trim().toLowerCase()) &&
    !availableTags.some((t) => t.name === search.trim().toLowerCase()) &&
    selectedTags.length < maxTags

  const addTag = (tagName: string) => {
    const normalized = tagName.trim().toLowerCase()
    if (normalized && !selectedTags.includes(normalized) && selectedTags.length < maxTags) {
      onTagsChange([...selectedTags, normalized])
      setSearch("")
    }
  }

  const removeTag = (tagName: string) => {
    onTagsChange(selectedTags.filter((t) => t !== tagName))
  }

  return (
    <div className="space-y-2">
      {/* Selected tags */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedTags.map((tag) => (
            <TagChip
              key={tag}
              name={tag}
              color={colorForTag(tag)}
              size="sm"
              removable
              onRemove={() => removeTag(tag)}
            />
          ))}
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
              placeholder="Search or create tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canAddCustom) {
                  e.preventDefault()
                  addTag(search)
                }
              }}
              className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input text-input-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="max-h-60 overflow-auto p-1">
            {/* Custom tag option */}
            {canAddCustom && (
              <button
                onClick={() => addTag(search)}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted text-foreground"
              >
                <Plus className="h-4 w-4 text-primary" />
                <span>
                  Create &quot;<span className="font-medium">{search.trim().toLowerCase()}</span>&quot;
                </span>
              </button>
            )}

            {filteredTags.length === 0 && !canAddCustom ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                {search ? "No matching tags" : "No tags available"}
              </p>
            ) : (
              filteredTags.map((tag) => {
                const isSelected = selectedTags.includes(tag.name)
                return (
                  <button
                    key={tag.slug}
                    onClick={() => addTag(tag.name)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm",
                      "hover:bg-muted text-foreground",
                      isSelected && "bg-primary/10"
                    )}
                  >
                    <div
                      className={cn(
                        "h-4 w-4 rounded border flex items-center justify-center",
                        isSelected
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-border"
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>
                    <span className="flex-1 text-left">{tag.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {tag.count} {tag.count === 1 ? "set" : "sets"}
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
