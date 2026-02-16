"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Check, ChevronsUpDown, Tag as TagIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { TagChip } from "@/components/tag-chip"

interface Tag {
  id: string
  name: string
  slug: string
  color?: string
  category: string | null
}

interface TagSelectorProps {
  selectedTags: Tag[]
  onTagsChange: (tags: Tag[]) => void
  maxTags?: number
  placeholder?: string
  disabled?: boolean
}

export function TagSelector({
  selectedTags,
  onTagsChange,
  maxTags = 5,
  placeholder = "Add tags...",
  disabled = false
}: TagSelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  // Fetch available tags
  const { data: availableTags = [] } = useQuery<Tag[]>({
    queryKey: ["tags"],
    queryFn: async () => {
      const res = await fetch("/api/tags")
      if (!res.ok) throw new Error("Failed to fetch tags")
      return res.json()
    }
  })

  const filteredTags = availableTags.filter(
    (tag) =>
      tag.name.toLowerCase().includes(search.toLowerCase()) &&
      !selectedTags.some((t) => t.id === tag.id)
  )

  const toggleTag = (tag: Tag) => {
    const isSelected = selectedTags.some((t) => t.id === tag.id)
    if (isSelected) {
      onTagsChange(selectedTags.filter((t) => t.id !== tag.id))
    } else if (selectedTags.length < maxTags) {
      onTagsChange([...selectedTags, tag])
    }
  }

  const removeTag = (tagId: string) => {
    onTagsChange(selectedTags.filter((t) => t.id !== tagId))
  }

  return (
    <div className="space-y-2">
      {/* Selected tags */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedTags.map((tag) => (
            <TagChip
              key={tag.id}
              name={tag.name}
              slug={tag.slug}
              color={tag.color || "blue"}
              size="sm"
              removable
              onRemove={() => removeTag(tag.id)}
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
        <PopoverContent className="w-64 p-0" align="start">
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
                No tags found
              </p>
            ) : (
              filteredTags.map((tag) => {
                const isSelected = selectedTags.some((t) => t.id === tag.id)
                return (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm",
                      "hover:bg-muted text-foreground",
                      isSelected && "bg-primary/10"
                    )}
                  >
                    <div className={cn(
                      "h-4 w-4 rounded border flex items-center justify-center",
                      isSelected
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-border"
                    )}>
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>
                    <span className="flex-1 text-left">
                      {tag.name}
                    </span>
                    {tag.category && (
                      <span className="text-xs text-muted-foreground">
                        {tag.category}
                      </span>
                    )}
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
